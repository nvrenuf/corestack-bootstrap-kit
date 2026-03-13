import test from "node:test";
import assert from "node:assert/strict";

import {
  createMemoryStorage,
  createRunStore,
  createWorkflowRegistry,
  launchWorkflowRun,
} from "../../launcher/corestack-runtime.mjs";

function createRegistry() {
  return createWorkflowRegistry([
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
}

function createStore() {
  let counter = 0;
  return createRunStore({
    storage: createMemoryStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createId: () => `run-${++counter}`,
  });
}

test("a registered workflow can launch and persist a run with step records", () => {
  const runStore = createStore();
  const run = launchWorkflowRun({
    registry: createRegistry(),
    runStore,
    workflowId: "security-osint.alert-triage",
    input: { source: "launcher" },
  });

  assert.equal(run.status, "running");
  assert.equal(run.workflowId, "security-osint.alert-triage");
  assert.equal(run.stepRecords.length, 2);
  assert.equal(run.stepRecords[0].status, "running");
  assert.equal(runStore.getRun(run.runId).status, "running");
});

test("runs can carry policy context references without evaluating a policy engine", () => {
  const runStore = createStore();
  const run = launchWorkflowRun({
    registry: createRegistry(),
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

  assert.equal(run.policyContext.workflow_id, "security-osint.alert-triage");
  assert.deepEqual(run.policyDecisions, []);
});

test("blocked runs can be resumed after an external state change token is supplied", () => {
  const runStore = createStore();
  const run = launchWorkflowRun({
    registry: createRegistry(),
    runStore,
    workflowId: "security-osint.alert-triage",
  });

  const blocked = runStore.blockRun(run.runId, {
    stepId: "review",
    reason: "awaiting-human-review",
    resumeToken: "resume-1",
  });
  const resumed = runStore.resumeRun(run.runId, {
    stepId: "review",
    resumeToken: "resume-1",
  });

  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.isResumable, true);
  assert.equal(resumed.status, "running");
  assert.equal(resumed.isResumable, false);
  assert.equal(resumed.stepRecords[1].status, "running");
});

test("terminal transitions persist explicit failed and completed states", () => {
  const completedStore = createStore();
  const completedRun = launchWorkflowRun({
    registry: createRegistry(),
    runStore: completedStore,
    workflowId: "security-osint.alert-triage",
  });

  const completed = completedStore.completeRun(completedRun.runId, {
    stepId: "review",
    output: { disposition: "done" },
  });
  assert.equal(completed.status, "completed");
  assert.deepEqual(completed.output, { disposition: "done" });

  const failedStore = createStore();
  const failedRun = launchWorkflowRun({
    registry: createRegistry(),
    runStore: failedStore,
    workflowId: "security-osint.alert-triage",
  });
  const failed = failedStore.failRun(failedRun.runId, {
    stepId: "review",
    error: { code: "review-timeout" },
  });

  assert.equal(failed.status, "failed");
  assert.deepEqual(failed.error, { code: "review-timeout" });
});
