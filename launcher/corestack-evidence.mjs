const EVIDENCE_LIFECYCLE_STATES = ["collected", "reviewed", "archived"];
const ARTIFACT_LIFECYCLE_STATES = ["available", "deleted"];
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

export function createEvidenceStore({
  storage,
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
      auditRef = null,
      metadata = {},
    }) {
      assertNonEmptyString(type, "artifact.type");
      assertNonEmptyString(classification, "artifact.classification");
      assertNonEmptyString(storageRef, "artifact.storageRef");
      validateSource(source);
      validateProvenance(provenance);
      assertLifecycleState(lifecycleState, ARTIFACT_LIFECYCLE_STATES, "artifact.lifecycleState");

      const timestamp = now();
      const state = readState();
      const artifact = {
        artifactId: createArtifactId(),
        type,
        classification,
        storageRef,
        runId,
        caseId,
        source,
        provenance,
        lifecycleState,
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

      const timestamp = now();
      const state = readState();
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

      const timestamp = now();
      const state = readState();
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
