import test from "node:test";
import assert from "node:assert/strict";

import { createRunStore, createWorkflowRegistry } from "../../launcher/corestack-runtime.mjs";
import { createToolGateway } from "../../launcher/corestack-tool-gateway.mjs";
import { createEvidenceStore } from "../../launcher/corestack-evidence.mjs";
import {
  AUDIT_EVENT_TYPES,
  createAuditEvent,
  createAuditEventStore,
  createPolicyDecisionAuditCorrelation,
  validateAuditEvent,
} from "../../launcher/corestack-audit.mjs";

// createMemoryStorage re-export fallback for this test context
function makeStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("audit events validate required structure and references", () => {
  const event = createAuditEvent({
    eventId: "evt-1",
    eventType: "run.lifecycle.created",
    timestamp: "2026-03-13T00:00:00.000Z",
    correlation: { run_id: "run-1" },
    payload: { status: "created" },
  });

  assert.equal(event.event_id, "evt-1");
  assert.throws(
    () => validateAuditEvent({ event_id: "evt-2", event_type: "x", timestamp: "now", correlation: {}, payload: {} }),
    /must include at least one supported reference/,
  );
});

test("run lifecycle transitions emit reconstructable audit events", () => {
  const storage = makeStorage();
  let n = 0;
  const auditStore = createAuditEventStore({
    storage,
    now: () => "2026-03-13T00:00:00.000Z",
    createEventId: () => `evt-${++n}`,
  });

  const registry = createWorkflowRegistry([
    {
      id: "security-osint.alert-triage",
      moduleId: "security-osint-module-1",
      name: "Alert triage",
      version: "0.1.0",
      steps: [{ id: "intake", title: "Intake", kind: "ingest" }],
    },
  ]);

  let runCounter = 0;
  const runStore = createRunStore({
    storage: makeStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createId: () => `run-${++runCounter}`,
    emitEvent: ({ event_type, timestamp, correlation, payload }) =>
      auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
  });

  const run = runStore.createRun({ workflow: registry.get("security-osint.alert-triage") });
  runStore.markRunning(run.runId);
  runStore.linkCase(run.runId, "case-1");

  const events = auditStore.listEvents({ runId: run.runId });
  assert.equal(events.length, 3);
  assert.deepEqual(
    events.map((event) => event.event_type),
    ["run.lifecycle.case_linked", "run.lifecycle.state_changed", "run.lifecycle.created"],
  );
});

test("tool decisions and results emit events correlated to run/case and policy decision", async () => {
  const storage = makeStorage();
  let n = 0;
  const auditStore = createAuditEventStore({
    storage,
    now: () => "2026-03-13T00:00:00.000Z",
    createEventId: () => `evt-${++n}`,
  });

  const gateway = createToolGateway({
    policyCheck: async () => ({
      decision_id: "dec-1",
      request_id: "req-1",
      outcome: "allow",
      reasons: [{ code: "OK", message: "Allowed" }],
      audit: { event_type: "policy.decision", correlation_id: "corr-1" },
    }),
    executeTool: async () => ({ ok: true }),
    now: () => "2026-03-13T00:00:00.000Z",
    emitEvent: ({ event_type, timestamp, correlation, payload }) =>
      auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
  });

  await gateway.execute({
    tool: "web.fetch",
    request: {
      agent_id: "agent-1",
      request_id: "req-1",
      purpose: "collect",
      inputs: { url: "https://example.com" },
      context: {
        correlation_id: "corr-1",
        module_id: "security-osint-module-1",
        workflow_id: "security-osint.alert-triage",
        run_id: "run-1",
        case_id: "case-1",
      },
    },
  });

  const events = auditStore.listEvents({ correlationId: "corr-1" });
  assert.deepEqual(
    events.map((event) => event.event_type),
    ["tool.execution.result", "tool.execution.decisioned", "tool.execution.requested"],
  );
  assert.equal(events[1].correlation.policy_decision_id, "dec-1");
});

test("evidence, artifact, and finding creation emits evidence mutation events", () => {
  const auditStore = createAuditEventStore({
    storage: makeStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createEventId: (() => {
      let n = 0;
      return () => `evt-${++n}`;
    })(),
  });

  const evidenceStore = createEvidenceStore({
    storage: makeStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createArtifactId: () => "artifact-1",
    createEvidenceId: () => "evidence-1",
    createFindingId: () => "finding-1",
    emitEvent: ({ event_type, timestamp, correlation, payload }) =>
      auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
  });

  const provenance = { collectedAt: "2026-03-13T00:00:00.000Z", collectorType: "workflow_step" };
  const artifact = evidenceStore.createArtifact({
    type: "web.fetch.response",
    classification: "osint.raw",
    storageRef: "artifact://local/run-1/file.json",
    runId: "run-1",
    source: { kind: "tool" },
    provenance,
  });
  const evidence = evidenceStore.createEvidenceItem({
    type: "source_snapshot",
    classification: "osint.supporting",
    summary: "snapshot",
    runId: "run-1",
    source: { kind: "artifact", ref: artifact.artifactId },
    provenance,
    artifactIds: [artifact.artifactId],
  });
  evidenceStore.createFinding({
    type: "threat_signal",
    severity: "medium",
    summary: "signal",
    runId: "run-1",
    provenance,
    evidenceIds: [evidence.evidenceId],
    artifactIds: [artifact.artifactId],
  });

  const events = auditStore.listEvents({ eventType: "evidence.object.mutated" });
  assert.equal(events.length, 3);
  assert.deepEqual(events.map((event) => event.payload.object_type), ["finding", "evidence", "artifact"]);
});

test("approval compatibility hook can emit placeholder audit events", () => {
  const auditStore = createAuditEventStore({
    storage: makeStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createEventId: () => "evt-approval",
  });

  const event = auditStore.emitApprovalPlaceholder({
    correlation: { run_id: "run-1", approval_id: "approval-1", correlation_id: "corr-approval-1" },
    payload: { state: "pending" },
  });

  assert.equal(event.event_type, AUDIT_EVENT_TYPES.APPROVAL_PLACEHOLDER);
  assert.equal(event.correlation.approval_id, "approval-1");
});

test("policy decision correlation helper aligns with policy contract fields", () => {
  const correlation = createPolicyDecisionAuditCorrelation({
    request: { request_id: "req-1", audit: { correlation_id: "corr-1" } },
    decision: { decision_id: "dec-1", request_id: "req-1", audit: { correlation_id: "corr-1" } },
    context: {
      run_id: "run-1",
      case_id: "case-1",
      workflow_id: "wf-1",
      actor: { actor_id: "actor-1" },
    },
  });

  assert.equal(correlation.policy_decision_id, "dec-1");
  assert.equal(correlation.request_id, "req-1");
  assert.equal(correlation.correlation_id, "corr-1");
});

test("audit list lookups can filter by evidence-bearing object correlation fields", () => {
  const auditStore = createAuditEventStore({
    storage: makeStorage(),
    now: () => "2026-03-13T00:00:00.000Z",
    createEventId: (() => {
      let n = 0;
      return () => `evt-${++n}`;
    })(),
  });

  auditStore.recordEvent({
    eventType: "evidence.object.mutated",
    correlation: { artifact_id: "artifact-1", run_id: "run-1" },
    payload: { object_type: "artifact" },
  });
  auditStore.recordEvent({
    eventType: "evidence.object.mutated",
    correlation: { evidence_id: "evidence-1", run_id: "run-1" },
    payload: { object_type: "evidence" },
  });
  auditStore.recordEvent({
    eventType: "evidence.object.mutated",
    correlation: { finding_id: "finding-1", run_id: "run-1" },
    payload: { object_type: "finding" },
  });

  assert.equal(auditStore.listEvents({ artifactId: "artifact-1" }).length, 1);
  assert.equal(auditStore.listEvents({ evidenceId: "evidence-1" }).length, 1);
  assert.equal(auditStore.listEvents({ findingId: "finding-1" }).length, 1);
});
