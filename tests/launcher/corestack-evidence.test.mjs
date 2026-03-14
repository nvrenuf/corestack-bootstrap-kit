import test from "node:test";
import assert from "node:assert/strict";

import { createCaseStore } from "../../launcher/corestack-cases.mjs";
import { createEvidenceStore } from "../../launcher/corestack-evidence.mjs";
import { createMemoryStorage, createRunStore, createWorkflowRegistry, launchWorkflowRun } from "../../launcher/corestack-runtime.mjs";

function createHarness() {
  let runCounter = 0;
  let caseCounter = 0;
  let evidenceCounter = 0;
  let artifactCounter = 0;
  let findingCounter = 0;
  const storage = createMemoryStorage();
  const registry = createWorkflowRegistry([
    {
      id: "security-osint.alert-triage",
      moduleId: "security-osint-module-1",
      name: "Alert triage and investigation",
      version: "0.1.0",
      steps: [
        { id: "intake", title: "Intake and normalize alert", kind: "ingest" },
        { id: "review", title: "Analyst review checkpoint", kind: "review" },
      ],
    },
  ]);

  const runStore = createRunStore({
    storage,
    now: () => "2026-03-13T00:00:00.000Z",
    createId: () => `run-${++runCounter}`,
  });
  const caseStore = createCaseStore({
    storage,
    now: () => "2026-03-13T00:00:00.000Z",
    createId: () => `case-${++caseCounter}`,
  });
  const evidenceStore = createEvidenceStore({
    storage,
    runStore,
    caseStore,
    now: () => "2026-03-13T00:00:00.000Z",
    createEvidenceId: () => `evidence-${++evidenceCounter}`,
    createArtifactId: () => `artifact-${++artifactCounter}`,
    createFindingId: () => `finding-${++findingCounter}`,
  });

  return { registry, runStore, caseStore, evidenceStore };
}

function createProvenance(overrides = {}) {
  return {
    collectedAt: "2026-03-13T00:00:00.000Z",
    collectorType: "workflow_step",
    ...overrides,
  };
}

test("evidence, artifact, and finding objects can be created with run/case linkage", () => {
  const { registry, runStore, caseStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const caseRecord = caseStore.createCaseFromRun({ run });
  runStore.linkCase(run.runId, caseRecord.caseId);

  const artifact = evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: {
      uri: "artifact://local/run-1/fetch-response.json",
      mediaType: "application/json",
    },
    runId: run.runId,
    caseId: caseRecord.caseId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance({ correlationId: "corr-1" }),
    integrity: { algorithm: "sha256", value: "abc123" },
  });

  const evidence = evidenceStore.createEvidenceItem({
    type: "source_snapshot",
    classification: "osint.supporting",
    summary: "Captured fetched source snapshot",
    runId: run.runId,
    caseId: caseRecord.caseId,
    source: { kind: "artifact", ref: artifact.artifactId },
    provenance: createProvenance({ correlationId: "corr-1" }),
    artifactIds: [artifact.artifactId],
  });

  const finding = evidenceStore.createFinding({
    type: "threat_signal",
    severity: "medium",
    summary: "Observed coordinated account language pattern",
    runId: run.runId,
    caseId: caseRecord.caseId,
    evidenceIds: [evidence.evidenceId],
    artifactIds: [artifact.artifactId],
    provenance: createProvenance({ correlationId: "corr-1" }),
  });

  assert.equal(artifact.caseId, caseRecord.caseId);
  assert.equal(artifact.storageRef.uri, "artifact://local/run-1/fetch-response.json");
  assert.equal(artifact.storageState, "active");
  assert.equal(evidence.runId, run.runId);
  assert.equal(finding.evidenceIds[0], evidence.evidenceId);
});

test("artifact metadata and storageRef persist across reads", () => {
  const { registry, runStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: {
      uri: "artifact://local/run-8/source.html",
      mediaType: "text/html",
      byteSize: 128,
    },
    runId: run.runId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance(),
    metadata: { extractor: "fetch-normalizer" },
  });

  const [stored] = evidenceStore.listArtifacts();
  assert.equal(stored.storageRef.mediaType, "text/html");
  assert.equal(stored.storageRef.byteSize, 128);
  assert.equal(stored.metadata.extractor, "fetch-normalizer");
});

test("artifact storage metadata is normalized and invalid fields are rejected", () => {
  const { registry, runStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });

  const artifact = evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: {
      uri: " artifact://local/run-8/source.html ",
      mediaType: " text/html ",
      byteSize: 0,
      versionId: " v1 ",
      etag: " etag-1 ",
      ignoredField: "should-not-persist",
    },
    runId: run.runId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance(),
  });

  assert.deepEqual(artifact.storageRef, {
    uri: "artifact://local/run-8/source.html",
    mediaType: "text/html",
    byteSize: 0,
    versionId: "v1",
    etag: "etag-1",
  });

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: {
          uri: "artifact://local/run-8/source-2.html",
          byteSize: -1,
        },
        runId: run.runId,
        source: { kind: "tool", ref: "web.fetch" },
        provenance: createProvenance(),
      }),
    /artifact\.storageRef\.byteSize must be a non-negative integer/,
  );
});

test("provenance basics are required for evidence-bearing objects", () => {
  const { evidenceStore } = createHarness();

  assert.throws(
    () =>
      evidenceStore.createEvidenceItem({
        type: "source_snapshot",
        classification: "osint.supporting",
        summary: "missing provenance",
        runId: "run-1",
        source: { kind: "tool" },
        provenance: { collectorType: "workflow_step" },
      }),
    /provenance\.collectedAt must be a non-empty string/,
  );

  assert.throws(
    () =>
      evidenceStore.createFinding({
        type: "threat_signal",
        severity: "medium",
        summary: "missing collector",
        runId: "run-1",
        provenance: { collectedAt: "2026-03-13T00:00:00.000Z" },
      }),
    /provenance\.collectorType must be a non-empty string/,
  );
});

test("object lifecycle states are constrained to minimal canonical enums", () => {
  const { registry, runStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/run-1/fetch-response.json",
        runId: "run-1",
        lifecycleState: "pending",
        source: { kind: "tool" },
        provenance: createProvenance(),
      }),
    /artifact\.lifecycleState must be one of/,
  );

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/run-1/fetch-response.json",
        runId: run.runId,
        lifecycleState: "available",
        storageState: "tombstoned",
        source: { kind: "tool" },
        provenance: createProvenance(),
      }),
    /artifact\.status consistency violation: tombstoned artifacts must be deleted/,
  );
});

test("artifact linkage and reference validation enforce integrity boundaries", () => {
  const { evidenceStore } = createHarness();

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/unlinked/fetch-response.json",
        source: { kind: "tool" },
        provenance: createProvenance(),
      }),
    /artifact requires at least one linkage: runId or caseId/,
  );

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/run-404/fetch-response.json",
        runId: "run-404",
        source: { kind: "tool" },
        provenance: createProvenance(),
      }),
    /run not found: run-404/,
  );
});

test("finding and evidence references must point to known artifacts/evidence", () => {
  const { registry, runStore, caseStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const caseRecord = caseStore.createCaseFromRun({ run });
  runStore.linkCase(run.runId, caseRecord.caseId);

  assert.throws(
    () =>
      evidenceStore.createEvidenceItem({
        type: "source_snapshot",
        classification: "osint.supporting",
        summary: "missing artifact ref",
        runId: run.runId,
        caseId: caseRecord.caseId,
        source: { kind: "artifact", ref: "artifact-unknown" },
        provenance: createProvenance(),
        artifactIds: ["artifact-unknown"],
      }),
    /evidence references unknown artifact: artifact-unknown/,
  );

  assert.throws(
    () =>
      evidenceStore.createFinding({
        type: "threat_signal",
        severity: "low",
        summary: "missing evidence ref",
        runId: run.runId,
        caseId: caseRecord.caseId,
        evidenceIds: ["evidence-unknown"],
        provenance: createProvenance(),
      }),
    /finding references unknown evidence: evidence-unknown/,
  );
});

test("evidence and findings enforce run/case boundary integrity for referenced objects", () => {
  const { registry, runStore, caseStore, evidenceStore } = createHarness();
  const run1 = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const run2 = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const case1 = caseStore.createCaseFromRun({ run: run1 });
  const case2 = caseStore.createCaseFromRun({ run: run2 });
  runStore.linkCase(run1.runId, case1.caseId);
  runStore.linkCase(run2.runId, case2.caseId);

  const artifact1 = evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: "artifact://local/run-1/fetch-response.json",
    runId: run1.runId,
    caseId: case1.caseId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance(),
  });

  const evidence1 = evidenceStore.createEvidenceItem({
    type: "source_snapshot",
    classification: "osint.supporting",
    summary: "captured for run1",
    runId: run1.runId,
    caseId: case1.caseId,
    source: { kind: "artifact", ref: artifact1.artifactId },
    provenance: createProvenance(),
    artifactIds: [artifact1.artifactId],
  });

  assert.throws(
    () =>
      evidenceStore.createEvidenceItem({
        type: "source_snapshot",
        classification: "osint.supporting",
        summary: "cross-run ref",
        runId: run2.runId,
        caseId: case2.caseId,
        source: { kind: "artifact", ref: artifact1.artifactId },
        provenance: createProvenance(),
        artifactIds: [artifact1.artifactId],
      }),
    /evidence references artifact outside run boundary/,
  );

  assert.throws(
    () =>
      evidenceStore.createFinding({
        type: "threat_signal",
        severity: "low",
        summary: "cross-case evidence ref",
        runId: run2.runId,
        caseId: case2.caseId,
        evidenceIds: [evidence1.evidenceId],
        provenance: createProvenance(),
      }),
    /finding references evidence outside run boundary/,
  );
});

test("metadata objects are normalized and non-object metadata is rejected", () => {
  const { registry, runStore, caseStore, evidenceStore } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const caseRecord = caseStore.createCaseFromRun({ run });
  runStore.linkCase(run.runId, caseRecord.caseId);

  const artifact = evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: "artifact://local/run-1/fetch-response.json",
    runId: run.runId,
    caseId: caseRecord.caseId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance(),
  });

  assert.deepEqual(artifact.metadata, {});

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/run-1/fetch-response-2.json",
        runId: run.runId,
        caseId: caseRecord.caseId,
        source: { kind: "tool", ref: "web.fetch" },
        provenance: createProvenance(),
        metadata: "bad",
      }),
    /artifact\.metadata must be an object/,
  );
});
