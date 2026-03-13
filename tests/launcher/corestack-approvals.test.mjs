import test from "node:test";
import assert from "node:assert/strict";

import { createMemoryStorage, createRunStore, createWorkflowRegistry, launchWorkflowRun } from "../../launcher/corestack-runtime.mjs";
import { createApprovalStore } from "../../launcher/corestack-approvals.mjs";
import { createAuditEventStore } from "../../launcher/corestack-audit.mjs";

function createHarness() {
  const storage = createMemoryStorage();
  let id = 0;
  const now = () => "2026-03-13T00:00:00.000Z";
  const auditStore = createAuditEventStore({
    storage,
    now,
    createEventId: () => `evt-${++id}`,
  });

  const runStore = createRunStore({
    storage,
    now,
    createId: () => `run-${++id}`,
    emitEvent: ({ event_type, timestamp, correlation, payload }) =>
      auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
  });

  const approvalStore = createApprovalStore({
    storage,
    now,
    createApprovalId: () => `approval-${++id}`,
    emitEvent: ({ event_type, timestamp, correlation, payload }) =>
      auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
  });

  const registry = createWorkflowRegistry([
    {
      id: "security-osint.alert-triage",
      moduleId: "security-osint-module-1",
      name: "Alert triage and investigation",
      version: "0.1.0",
      steps: [
        { id: "intake", title: "Intake", kind: "ingest" },
        { id: "review", title: "Review", kind: "review" },
      ],
    },
  ]);

  return { auditStore, runStore, approvalStore, registry };
}

test("approval objects validate required shape and can be listed in queue projections", () => {
  const { approvalStore } = createHarness();

  const approval = approvalStore.createApproval({
    governedAction: { type: "workflow_step", id: "run-1:review", summary: "Proceed", correlationId: "corr-1" },
    links: { runId: "run-1", workflowId: "wf-1", caseId: "case-1", policyDecisionId: "dec-1" },
    policyDecision: { decision_id: "dec-1", reasons: [{ code: "X", message: "Needs review" }], audit: { correlation_id: "corr-1" } },
    subject: { summary: "Alert review", targetType: "workflow_step", targetId: "review" },
    reasonContext: { rationale: "Needs approval" },
    requestedBy: { actorId: "actor-1", actorType: "user" },
  });

  const queue = approvalStore.projectQueueItems();
  assert.equal(approval.status, "pending");
  assert.equal(queue.length, 1);
  assert.equal(queue[0].approvalId, approval.approvalId);
});

test("approval transitions allow pending to approved/denied and reject invalid transitions", () => {
  const { approvalStore } = createHarness();
  const approval = approvalStore.createApproval({
    governedAction: { type: "workflow_step", id: "run-1:review", summary: "Proceed", correlationId: "corr-1" },
    links: { runId: "run-1" },
    subject: { summary: "Alert review", targetType: "workflow_step", targetId: "review" },
    reasonContext: { rationale: "Needs approval" },
    requestedBy: { actorId: "actor-1", actorType: "user" },
  });

  const approved = approvalStore.approveApproval(approval.approvalId, { actor: { actorId: "reviewer-1", actorType: "user" } });
  assert.equal(approved.status, "approved");
  assert.throws(() => approvalStore.denyApproval(approval.approvalId, { actor: { actorId: "reviewer-2", actorType: "user" } }), /cannot transition/);
});

test("run checkpoints can enter and exit pending approval state", () => {
  const { runStore, approvalStore, registry } = createHarness();
  const run = launchWorkflowRun({ registry, runStore, workflowId: "security-osint.alert-triage" });
  const approval = approvalStore.createApproval({
    governedAction: { type: "workflow_step", id: `${run.runId}:review`, summary: "Proceed", correlationId: "corr-1" },
    links: { runId: run.runId, workflowId: run.workflowId },
    subject: { summary: "Alert review", targetType: "workflow_step", targetId: "review" },
    reasonContext: { rationale: "Needs approval" },
    requestedBy: { actorId: "actor-1", actorType: "user" },
  });

  const pending = runStore.markPendingApproval(run.runId, { stepId: "review", approvalId: approval.approvalId });
  assert.equal(pending.status, "pending_approval");

  const resumed = runStore.resolveApprovalCheckpoint(run.runId, {
    stepId: "review",
    approvalId: approval.approvalId,
    outcome: "approved",
  });
  assert.equal(resumed.status, "running");
});

test("approval lifecycle emits audit-compatible created and state events", () => {
  const { approvalStore, auditStore } = createHarness();
  const approval = approvalStore.createApproval({
    governedAction: { type: "workflow_step", id: "run-1:review", summary: "Proceed", correlationId: "corr-1" },
    links: { runId: "run-1", caseId: "case-1", workflowId: "wf-1" },
    subject: { summary: "Alert review", targetType: "workflow_step", targetId: "review" },
    reasonContext: { rationale: "Needs approval" },
    requestedBy: { actorId: "actor-1", actorType: "user" },
  });
  approvalStore.denyApproval(approval.approvalId, { actor: { actorId: "reviewer-1", actorType: "user" } });

  const events = auditStore.listEvents({ runId: "run-1" });
  assert.deepEqual(events.map((event) => event.event_type), ["approval.lifecycle.state_changed", "approval.lifecycle.created"]);
  assert.equal(events[0].correlation.approval_id, approval.approvalId);
});

test("approval detail projection returns queue/detail shape", () => {
  const { approvalStore } = createHarness();
  const approval = approvalStore.createApproval({
    governedAction: { type: "workflow_step", id: "run-1:review", summary: "Proceed", correlationId: "corr-1" },
    links: { runId: "run-1", policyDecisionId: "dec-1" },
    policyDecision: { decision_id: "dec-1", reasons: [{ code: "X", message: "Needs review" }] },
    subject: { summary: "Alert review", targetType: "workflow_step", targetId: "review" },
    reasonContext: { rationale: "Needs approval" },
    requestedBy: { actorId: "actor-1", actorType: "user" },
  });

  const detail = approvalStore.projectApprovalDetail(approval.approvalId);
  assert.equal(detail.approvalId, approval.approvalId);
  assert.equal(detail.links.policyDecisionId, "dec-1");
});
