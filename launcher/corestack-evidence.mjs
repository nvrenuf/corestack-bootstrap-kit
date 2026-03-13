const EVIDENCE_LIFECYCLE_STATES = ["collected", "reviewed", "archived"];
const ARTIFACT_LIFECYCLE_STATES = ["available", "deleted"];
const ARTIFACT_STORAGE_STATES = ["active", "tombstoned"];
const FINDING_LIFECYCLE_STATES = ["open", "in_review", "resolved", "dismissed"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertLifecycleState(value, states, label) {
  if (!states.includes(value)) {
    throw new Error(`${label} must be one of: ${states.join(", ")}`);
  }
}

function validateProvenance(provenance) {
  assertObject(provenance, "provenance");
  assertNonEmptyString(provenance.collectedAt, "provenance.collectedAt");
  assertNonEmptyString(provenance.collectorType, "provenance.collectorType");
}

function validateSource(source) {
  assertObject(source, "source");
  assertNonEmptyString(source.kind, "source.kind");
}

function normalizeStorageRef(storageRef) {
  if (typeof storageRef === "string") {
    assertNonEmptyString(storageRef, "artifact.storageRef");
    return { uri: storageRef };
  }

  assertObject(storageRef, "artifact.storageRef");
  assertNonEmptyString(storageRef.uri, "artifact.storageRef.uri");
  return clone(storageRef);
}

function validateIntegrity(value) {
  if (value == null) {
    return null;
  }

  assertObject(value, "artifact.integrity");
  assertNonEmptyString(value.algorithm, "artifact.integrity.algorithm");
  assertNonEmptyString(value.value, "artifact.integrity.value");
  return clone(value);
}

export function createEvidenceStore({
  storage,
  runStore = null,
  caseStore = null,
  key = "corestack.evidence.v1",
  now = () => new Date().toISOString(),
  createEvidenceId = () => crypto.randomUUID(),
  createArtifactId = () => crypto.randomUUID(),
  createFindingId = () => crypto.randomUUID(),
} = {}) {
  if (!storage) {
    throw new Error("evidence store requires storage");
  }

  function readState() {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : { evidenceItems: [], artifacts: [], findings: [] };
  }

  function writeState(state) {
    storage.setItem(key, JSON.stringify(state));
  }

  function assertRunExists(runId, label = "runId") {
    if (!runId) {
      return null;
    }

    assertNonEmptyString(runId, label);
    if (!runStore) {
      return null;
    }

    const run = runStore.getRun(runId);
    if (!run) {
      throw new Error(`run not found: ${runId}`);
    }
    return run;
  }

  function assertCaseExists(caseId, label = "caseId") {
    if (!caseId) {
      return null;
    }

    assertNonEmptyString(caseId, label);
    if (!caseStore) {
      return null;
    }

    const caseRecord = caseStore.getCase(caseId);
    if (!caseRecord) {
      throw new Error(`case not found: ${caseId}`);
    }
    return caseRecord;
  }

  function assertRunCaseLinkage(runId, caseId, run, caseRecord, label = "object") {
    if (!runId || !caseId || !runStore || !caseStore) {
      return;
    }

    const runLinkedCaseId = run?.caseId ?? null;
    const caseHasRun = Array.isArray(caseRecord?.runIds) && caseRecord.runIds.includes(runId);
    if (runLinkedCaseId !== caseId && !caseHasRun) {
      throw new Error(`${label} run/case linkage mismatch`);
    }
  }

  function assertArtifactReferencesExist(artifactIds = [], state, label) {
    for (const artifactId of artifactIds) {
      assertNonEmptyString(artifactId, `${label}.artifactIds[]`);
      if (!state.artifacts.some((artifact) => artifact.artifactId === artifactId)) {
        throw new Error(`${label} references unknown artifact: ${artifactId}`);
      }
    }
  }

  function assertEvidenceReferencesExist(evidenceIds = [], state, label) {
    for (const evidenceId of evidenceIds) {
      assertNonEmptyString(evidenceId, `${label}.evidenceIds[]`);
      if (!state.evidenceItems.some((evidenceItem) => evidenceItem.evidenceId === evidenceId)) {
        throw new Error(`${label} references unknown evidence: ${evidenceId}`);
      }
    }
  }

  return {
    listEvidenceItems() {
      return readState().evidenceItems.map(clone);
    },
    listArtifacts() {
      return readState().artifacts.map(clone);
    },
    listFindings() {
      return readState().findings.map(clone);
    },
    createArtifact({
      type,
      classification,
      storageRef,
      runId = null,
      caseId = null,
      source,
      provenance,
      lifecycleState = "available",
      storageState = "active",
      integrity = null,
      auditRef = null,
      metadata = {},
    }) {
      assertNonEmptyString(type, "artifact.type");
      assertNonEmptyString(classification, "artifact.classification");
      const normalizedStorageRef = normalizeStorageRef(storageRef);
      validateSource(source);
      validateProvenance(provenance);
      assertLifecycleState(lifecycleState, ARTIFACT_LIFECYCLE_STATES, "artifact.lifecycleState");
      assertLifecycleState(storageState, ARTIFACT_STORAGE_STATES, "artifact.storageState");
      const normalizedIntegrity = validateIntegrity(integrity);
      const run = assertRunExists(runId, "artifact.runId");
      const caseRecord = assertCaseExists(caseId, "artifact.caseId");
      if (!runId && !caseId) {
        throw new Error("artifact requires at least one linkage: runId or caseId");
      }
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "artifact");

      const timestamp = now();
      const state = readState();
      const artifact = {
        artifactId: createArtifactId(),
        type,
        classification,
        storageRef: normalizedStorageRef,
        runId,
        caseId,
        source,
        provenance,
        lifecycleState,
        storageState,
        integrity: normalizedIntegrity,
        auditRef,
        metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.artifacts.unshift(artifact);
      writeState(state);
      return clone(artifact);
    },
    createEvidenceItem({
      type,
      classification,
      summary,
      runId,
      caseId = null,
      source,
      provenance,
      artifactIds = [],
      lifecycleState = "collected",
      auditRef = null,
      metadata = {},
    }) {
      assertNonEmptyString(type, "evidence.type");
      assertNonEmptyString(classification, "evidence.classification");
      assertNonEmptyString(summary, "evidence.summary");
      assertNonEmptyString(runId, "evidence.runId");
      validateSource(source);
      validateProvenance(provenance);
      assertLifecycleState(lifecycleState, EVIDENCE_LIFECYCLE_STATES, "evidence.lifecycleState");

      const run = assertRunExists(runId, "evidence.runId");
      const caseRecord = assertCaseExists(caseId, "evidence.caseId");
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "evidence");

      const timestamp = now();
      const state = readState();
      assertArtifactReferencesExist(artifactIds, state, "evidence");
      const evidenceItem = {
        evidenceId: createEvidenceId(),
        type,
        classification,
        summary,
        runId,
        caseId,
        source,
        provenance,
        artifactIds,
        lifecycleState,
        auditRef,
        metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.evidenceItems.unshift(evidenceItem);
      writeState(state);
      return clone(evidenceItem);
    },
    createFinding({
      type,
      severity,
      summary,
      runId,
      caseId = null,
      evidenceIds = [],
      artifactIds = [],
      provenance,
      lifecycleState = "open",
      auditRef = null,
      metadata = {},
    }) {
      assertNonEmptyString(type, "finding.type");
      assertNonEmptyString(severity, "finding.severity");
      assertNonEmptyString(summary, "finding.summary");
      assertNonEmptyString(runId, "finding.runId");
      validateProvenance(provenance);
      assertLifecycleState(lifecycleState, FINDING_LIFECYCLE_STATES, "finding.lifecycleState");
      const run = assertRunExists(runId, "finding.runId");
      const caseRecord = assertCaseExists(caseId, "finding.caseId");
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "finding");

      const timestamp = now();
      const state = readState();
      assertEvidenceReferencesExist(evidenceIds, state, "finding");
      assertArtifactReferencesExist(artifactIds, state, "finding");
      const finding = {
        findingId: createFindingId(),
        type,
        severity,
        summary,
        runId,
        caseId,
        evidenceIds,
        artifactIds,
        provenance,
        lifecycleState,
        auditRef,
        metadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.findings.unshift(finding);
      writeState(state);
      return clone(finding);
    },
  };
}
