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
    storageRef: "artifact://local/run-1/fetch-response.json",
    runId: run.runId,
    caseId: caseRecord.caseId,
    source: { kind: "tool", ref: "web.fetch" },
    provenance: createProvenance({ correlationId: "corr-1" }),
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
  assert.equal(evidence.runId, run.runId);
  assert.equal(finding.evidenceIds[0], evidence.evidenceId);
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
  const { evidenceStore } = createHarness();

  assert.throws(
    () =>
      evidenceStore.createArtifact({
        type: "web.fetch.response",
        classification: "osint.raw",
        storageRef: "artifact://local/run-1/fetch-response.json",
        lifecycleState: "pending",
        source: { kind: "tool" },
        provenance: createProvenance(),
      }),
    /artifact\.lifecycleState must be one of/,
  );
});
