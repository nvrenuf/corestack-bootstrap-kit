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
  const normalized = { uri: storageRef.uri.trim() };

  if (storageRef.mediaType != null) {
    assertNonEmptyString(storageRef.mediaType, "artifact.storageRef.mediaType");
    normalized.mediaType = storageRef.mediaType.trim();
  }

  if (storageRef.byteSize != null) {
    if (!Number.isInteger(storageRef.byteSize) || storageRef.byteSize < 0) {
      throw new Error("artifact.storageRef.byteSize must be a non-negative integer");
    }
    normalized.byteSize = storageRef.byteSize;
  }

  if (storageRef.versionId != null) {
    assertNonEmptyString(storageRef.versionId, "artifact.storageRef.versionId");
    normalized.versionId = storageRef.versionId.trim();
  }

  if (storageRef.etag != null) {
    assertNonEmptyString(storageRef.etag, "artifact.storageRef.etag");
    normalized.etag = storageRef.etag.trim();
  }

  return normalized;
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

function normalizeMetadata(value, label) {
  if (value == null) {
    return {};
  }

  assertObject(value, label);
  return clone(value);
}

function assertArtifactStatusConsistency(lifecycleState, storageState) {
  if (lifecycleState === "deleted" && storageState !== "tombstoned") {
    throw new Error("artifact.status consistency violation: deleted artifacts must be tombstoned");
  }

  if (storageState === "tombstoned" && lifecycleState !== "deleted") {
    throw new Error("artifact.status consistency violation: tombstoned artifacts must be deleted");
  }
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
  emitEvent = () => {},
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

  function assertArtifactLinkageCompatibility(artifactIds = [], state, { runId, caseId, label }) {
    for (const artifactId of artifactIds) {
      const artifact = state.artifacts.find((entry) => entry.artifactId === artifactId);
      if (!artifact) {
        continue;
      }

      if (artifact.runId !== runId) {
        throw new Error(`${label} references artifact outside run boundary: ${artifactId}`);
      }

      if (caseId != null && artifact.caseId !== caseId) {
        throw new Error(`${label} references artifact outside case boundary: ${artifactId}`);
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

  function assertEvidenceLinkageCompatibility(evidenceIds = [], state, { runId, caseId, label }) {
    for (const evidenceId of evidenceIds) {
      const evidence = state.evidenceItems.find((entry) => entry.evidenceId === evidenceId);
      if (!evidence) {
        continue;
      }

      if (evidence.runId !== runId) {
        throw new Error(`${label} references evidence outside run boundary: ${evidenceId}`);
      }

      if (caseId != null && evidence.caseId !== caseId) {
        throw new Error(`${label} references evidence outside case boundary: ${evidenceId}`);
      }
    }
  }



  function emitMutationEvent({ objectType, action, objectId, runId = null, caseId = null, payload = {} }) {
    emitEvent({
      event_type: "evidence.object.mutated",
      timestamp: now(),
      correlation: {
        run_id: runId,
        case_id: caseId,
        artifact_id: objectType === "artifact" ? objectId : null,
        evidence_id: objectType === "evidence" ? objectId : null,
        finding_id: objectType === "finding" ? objectId : null,
      },
      payload: {
        object_type: objectType,
        action,
        object_id: objectId,
        ...payload,
      },
    });
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
      const normalizedMetadata = normalizeMetadata(metadata, "artifact.metadata");
      const run = assertRunExists(runId, "artifact.runId");
      const caseRecord = assertCaseExists(caseId, "artifact.caseId");
      if (!runId && !caseId) {
        throw new Error("artifact requires at least one linkage: runId or caseId");
      }
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "artifact");
      assertArtifactStatusConsistency(lifecycleState, storageState);

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
        metadata: normalizedMetadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.artifacts.unshift(artifact);
      writeState(state);
      emitMutationEvent({
        objectType: "artifact",
        action: "created",
        objectId: artifact.artifactId,
        runId: artifact.runId,
        caseId: artifact.caseId,
        payload: {
          classification: artifact.classification,
          lifecycle_state: artifact.lifecycleState,
          storage_state: artifact.storageState,
        },
      });
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
      const normalizedMetadata = normalizeMetadata(metadata, "evidence.metadata");

      const run = assertRunExists(runId, "evidence.runId");
      const caseRecord = assertCaseExists(caseId, "evidence.caseId");
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "evidence");

      const timestamp = now();
      const state = readState();
      assertArtifactReferencesExist(artifactIds, state, "evidence");
      assertArtifactLinkageCompatibility(artifactIds, state, { runId, caseId, label: "evidence" });
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
        metadata: normalizedMetadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.evidenceItems.unshift(evidenceItem);
      writeState(state);
      emitMutationEvent({
        objectType: "evidence",
        action: "created",
        objectId: evidenceItem.evidenceId,
        runId: evidenceItem.runId,
        caseId: evidenceItem.caseId,
        payload: {
          classification: evidenceItem.classification,
          lifecycle_state: evidenceItem.lifecycleState,
          artifact_ids: evidenceItem.artifactIds,
          artifact_count: evidenceItem.artifactIds.length,
        },
      });
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
      const normalizedMetadata = normalizeMetadata(metadata, "finding.metadata");
      const run = assertRunExists(runId, "finding.runId");
      const caseRecord = assertCaseExists(caseId, "finding.caseId");
      assertRunCaseLinkage(runId, caseId, run, caseRecord, "finding");

      const timestamp = now();
      const state = readState();
      assertEvidenceReferencesExist(evidenceIds, state, "finding");
      assertEvidenceLinkageCompatibility(evidenceIds, state, { runId, caseId, label: "finding" });
      assertArtifactReferencesExist(artifactIds, state, "finding");
      assertArtifactLinkageCompatibility(artifactIds, state, { runId, caseId, label: "finding" });
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
        metadata: normalizedMetadata,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      state.findings.unshift(finding);
      writeState(state);
      emitMutationEvent({
        objectType: "finding",
        action: "created",
        objectId: finding.findingId,
        runId: finding.runId,
        caseId: finding.caseId,
        payload: {
          severity: finding.severity,
          lifecycle_state: finding.lifecycleState,
          evidence_ids: finding.evidenceIds,
          artifact_ids: finding.artifactIds,
          evidence_count: finding.evidenceIds.length,
          artifact_count: finding.artifactIds.length,
        },
      });
      return clone(finding);
    },
  };
}
