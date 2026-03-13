import test from "node:test";
import assert from "node:assert/strict";

import { createModelRegistry, createModelRouter } from "../../launcher/corestack-model-routing.mjs";
import { createModelExecutionHooks } from "../../launcher/corestack-model-execution.mjs";

function createRouteResult({ allowExternalProviders = true, modelId = null } = {}) {
  const registry = createModelRegistry([
    {
      id: "local.llm-a",
      kind: "llm",
      providerType: "local",
      localFirst: true,
      status: { available: true },
      trustTags: ["self_hosted"],
      capabilities: ["summarize"],
    },
    {
      id: "cloud.llm-a",
      kind: "llm",
      providerType: "cloud",
      localFirst: false,
      status: { available: true },
      trustTags: ["external_provider"],
      capabilities: ["summarize"],
    },
  ]);

  const router = createModelRouter({ registry });
  return router.route({
    target: { kind: "llm", capability: "summarize", modelId },
    policy: { allowExternalProviders, decisionId: "policy-dec-1" },
    context: {
      runId: "run-1",
      workflowId: "security-osint.alert-triage",
      caseId: "case-1",
      actorId: "actor-1",
      correlationId: "corr-1",
    },
  });
}

test("model execution hooks emit requested/decisioned/result with correlation and route compatibility", async () => {
  const events = [];
  const hooks = createModelExecutionHooks({ emitEvent: (event) => events.push(event), now: () => "2026-03-13T00:00:00.000Z" });
  const routeResult = createRouteResult({ allowExternalProviders: true });

  const before = await hooks.beforeExecute({
    routeResult,
    context: {
      runId: "run-1",
      workflowId: "security-osint.alert-triage",
      caseId: "case-1",
      actorId: "actor-1",
      correlationId: "corr-1",
      requestId: "model-req-1",
    },
    restrictions: { localOnly: false, externalDisallowed: false },
    invocation: { operation: "generate.summary", inputShape: { prompt: "string" } },
  });

  assert.equal(before.ok, true);
  assert.equal(events[0].event_type, "model.execution.requested");
  assert.equal(events[1].event_type, "model.execution.decisioned");
  assert.equal(events[0].correlation.run_id, "run-1");
  assert.equal(events[0].correlation.model_id, routeResult.route.modelId);
  assert.equal(events[0].payload.route_event_type, "model.routing.decision");

  await hooks.afterExecute(
    {
      routeResult,
      context: { runId: "run-1", workflowId: "security-osint.alert-triage", caseId: "case-1", actorId: "actor-1", correlationId: "corr-1" },
    },
    { ok: true, responseShape: { output_text: "string" } },
  );

  assert.equal(events[2].event_type, "model.execution.result");
  assert.equal(events[2].payload.outcome, "success");
});

test("external restriction hook blocks cloud provider routes with structured error", async () => {
  const events = [];
  const hooks = createModelExecutionHooks({ emitEvent: (event) => events.push(event), now: () => "2026-03-13T00:00:00.000Z" });
  const routeResult = createRouteResult({ allowExternalProviders: true, modelId: "cloud.llm-a" });

  const blocked = await hooks.beforeExecute({
    routeResult,
    context: { runId: "run-1", workflowId: "wf-1", caseId: "case-1", actorId: "actor-1", correlationId: "corr-2" },
    restrictions: { externalDisallowed: true, reason: "policy.local_only" },
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.status, "blocked");
  assert.equal(blocked.error.code, "EXTERNAL_PROVIDER_DISALLOWED");
  assert.deepEqual(
    events.map((event) => event.event_type),
    ["model.execution.requested", "model.execution.restriction_blocked"],
  );
  assert.equal(events[1].payload.restriction_reason, "policy.local_only");
});

test("model execution hook rejects invalid execution request shape", async () => {
  const hooks = createModelExecutionHooks({ emitEvent: () => {}, now: () => "2026-03-13T00:00:00.000Z" });

  await assert.rejects(
    () => hooks.beforeExecute({ routeResult: { ok: false } }),
    /model\.execution\.request\.routeResult\.ok must be true/,
  );
});
