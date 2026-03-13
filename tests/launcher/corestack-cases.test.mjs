import test from "node:test";
import assert from "node:assert/strict";

import { createCaseStore } from "../../launcher/corestack-cases.mjs";
import { createMemoryStorage, createRunStore, createWorkflowRegistry, launchWorkflowRun } from "../../launcher/corestack-runtime.mjs";

function createHarness() {
  let runCounter = 0;
  let caseCounter = 0;
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

  return { registry, runStore, caseStore };
}

test("a run can create a new case and persist run-to-case linkage", () => {
  const { registry, runStore, caseStore } = createHarness();
  const run = launchWorkflowRun({
    registry,
    runStore,
    workflowId: "security-osint.alert-triage",
    input: {
      policyContext: {
        module_id: "security-osint-module-1",
        workflow_id: "security-osint.alert-triage",
        correlation_id: "corr-1",
        actor: { actor_id: "analyst-1", actor_type: "user" },
      },
    },
  });
  const linkedCase = caseStore.createCaseFromRun({
    run,
    owner: { actorId: "analyst-1", actorType: "user" },
  });
  const linkedRun = runStore.linkCase(run.runId, linkedCase.caseId);

  assert.equal(linkedCase.caseId, "case-1");
  assert.equal(linkedCase.status, "open");
  assert.equal(linkedCase.owner.actorId, "analyst-1");
  assert.equal(linkedCase.policyContext.workflow_id, "security-osint.alert-triage");
  assert.equal(linkedRun.caseId, "case-1");
  assert.equal(caseStore.getCase("case-1").runIds[0], run.runId);
});

test("a run can attach to an existing case", () => {
  const { registry, runStore, caseStore } = createHarness();
  const firstRun = launchWorkflowRun({
    registry,
    runStore,
    workflowId: "security-osint.alert-triage",
  });
  const existingCase = caseStore.createCaseFromRun({ run: firstRun });

  const secondRun = launchWorkflowRun({
    registry,
    runStore,
    workflowId: "security-osint.alert-triage",
  });
  const attachedCase = caseStore.attachRun(existingCase.caseId, secondRun);
  const linkedRun = runStore.linkCase(secondRun.runId, existingCase.caseId);

  assert.equal(attachedCase.runIds.length, 2);
  assert.equal(attachedCase.latestRunId, secondRun.runId);
  assert.equal(linkedRun.caseId, existingCase.caseId);
});

test("basic case status updates persist and append timeline hooks", () => {
  const { registry, runStore, caseStore } = createHarness();
  const run = launchWorkflowRun({
    registry,
    runStore,
    workflowId: "security-osint.alert-triage",
  });
  const linkedCase = caseStore.createCaseFromRun({ run });
  const updated = caseStore.updateCaseStatus(linkedCase.caseId, "in-review");

  assert.equal(updated.status, "in-review");
  assert.equal(updated.timeline.at(-1).type, "case.status.updated");
  assert.match(updated.timeline.at(-1).summary, /in-review/);
});
