import test from "node:test";
import assert from "node:assert/strict";

import { createToolGateway } from "../../launcher/corestack-tool-gateway.mjs";

function baseContext() {
  return {
    correlation_id: "corr-1",
    module_id: "security-osint-module-1",
    workflow_id: "security-osint.alert-triage",
    run_id: "run-1",
    case_id: "case-1",
  };
}

function fetchRequest() {
  return {
    agent_id: "agent-1",
    request_id: "req-1",
    purpose: "collect intelligence",
    inputs: { url: "https://example.com" },
    context: baseContext(),
  };
}

function searchRequest() {
  return {
    agent_id: "agent-1",
    request_id: "req-2",
    purpose: "collect intelligence",
    inputs: { query: "test query", max_results: 3 },
    context: baseContext(),
  };
}

test("valid fetch/search requests are accepted and executed when policy allows", async () => {
  const executed = [];
  const gateway = createToolGateway({
    policyCheck: async () => ({
      decision_id: "dec-allow",
      request_id: "req-1",
      outcome: "allow",
      reasons: [{ code: "OK", message: "Allowed" }],
      decided_at: "2026-01-01T00:00:00.000Z",
      audit: { event_type: "policy.decision", correlation_id: "corr-1" },
    }),
    executeTool: async ({ tool }) => {
      executed.push(tool);
      return { ok: true, tool };
    },
  });

  const fetchResult = await gateway.execute({ tool: "web.fetch", request: fetchRequest() });
  const searchResult = await gateway.execute({ tool: "web.search", request: searchRequest() });

  assert.equal(fetchResult.ok, true);
  assert.equal(searchResult.ok, true);
  assert.deepEqual(executed, ["web.fetch", "web.search"]);
});

test("invalid requests are rejected in normalized shape", async () => {
  let policyCalled = false;
  const gateway = createToolGateway({
    policyCheck: async () => {
      policyCalled = true;
      return {};
    },
    executeTool: async () => ({ ok: true }),
  });

  const result = await gateway.execute({
    tool: "web.fetch",
    request: {
      agent_id: "agent-1",
      purpose: "collect intelligence",
      inputs: {},
      context: baseContext(),
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.status, "invalid_request");
  assert.equal(result.error.code, "BAD_REQUEST");
  assert.equal(result.error.details.field, "inputs.url");
  assert.equal(policyCalled, false);
});

test("deny outcome blocks execution and returns policy decision", async () => {
  let executed = false;
  const gateway = createToolGateway({
    policyCheck: async () => ({
      decision_id: "dec-deny",
      request_id: "req-1",
      outcome: "deny",
      reasons: [{ code: "POLICY_DENIED", message: "Denied" }],
      decided_at: "2026-01-01T00:00:00.000Z",
      audit: { event_type: "policy.decision", correlation_id: "corr-1" },
    }),
    executeTool: async () => {
      executed = true;
      return {};
    },
  });

  const result = await gateway.execute({ tool: "web.fetch", request: fetchRequest() });

  assert.equal(result.ok, false);
  assert.equal(result.status, "policy_blocked");
  assert.equal(result.policy.outcome, "deny");
  assert.equal(executed, false);
});

test("require_approval outcome blocks execution in contract-aware way", async () => {
  let executed = false;
  const gateway = createToolGateway({
    policyCheck: async () => ({
      decision_id: "dec-approval",
      request_id: "req-1",
      outcome: "require_approval",
      reasons: [{ code: "REVIEW_REQUIRED", message: "Approval required" }],
      approval: { required: true, subject_ref: "approval-1", approver_role: "ir-lead" },
      decided_at: "2026-01-01T00:00:00.000Z",
      audit: { event_type: "policy.decision", correlation_id: "corr-1" },
    }),
    executeTool: async () => {
      executed = true;
      return {};
    },
  });

  const result = await gateway.execute({ tool: "web.fetch", request: fetchRequest() });

  assert.equal(result.ok, false);
  assert.equal(result.status, "policy_blocked");
  assert.equal(result.policy.outcome, "require_approval");
  assert.equal(result.policy.approval.required, true);
  assert.equal(executed, false);
});

test("audit hooks emit structured decision payloads", async () => {
  const events = [];
  const gateway = createToolGateway({
    policyCheck: async () => ({
      decision_id: "dec-allow",
      request_id: "req-1",
      outcome: "allow",
      reasons: [{ code: "OK", message: "Allowed" }],
      decided_at: "2026-01-01T00:00:00.000Z",
      audit: { event_type: "policy.decision", correlation_id: "corr-1" },
    }),
    executeTool: async () => ({ ok: true }),
    emitEvent: (event) => events.push(event),
    now: () => "2026-01-01T00:00:00.000Z",
  });

  await gateway.execute({ tool: "web.fetch", request: fetchRequest() });

  const decisionEvent = events.find((event) => event.event_type === "tool.gateway.decision");
  assert.ok(decisionEvent);
  assert.equal(decisionEvent.outcome, "allow");
  assert.equal(decisionEvent.decision_id, "dec-allow");
  assert.equal(decisionEvent.correlation_id, "corr-1");
});
