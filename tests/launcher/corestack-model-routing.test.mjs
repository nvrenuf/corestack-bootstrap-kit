import test from "node:test";
import assert from "node:assert/strict";

import {
  MODEL_KINDS,
  MODEL_PROVIDER_TYPES,
  createModelRegistry,
  createModelRouter,
  validateModelDescriptor,
} from "../../launcher/corestack-model-routing.mjs";

test("model registry validates minimal descriptor contract", () => {
  const descriptor = validateModelDescriptor({
    id: "local.mistral-small",
    kind: "llm",
    providerType: "local",
    localFirst: true,
    status: { available: true },
    trustTags: ["self_hosted", "no_egress"],
    capabilities: ["summarize", "extract.entities"],
    policy: { approvalRequired: false, externalProviderRestricted: false },
  });

  assert.equal(descriptor.id, "local.mistral-small");
  assert.equal(descriptor.status.available, true);
  assert.deepEqual(MODEL_KINDS.includes(descriptor.kind), true);
  assert.deepEqual(MODEL_PROVIDER_TYPES.includes(descriptor.providerType), true);
});

test("model registry rejects invalid inputs and duplicate registration", () => {
  const registry = createModelRegistry();

  assert.throws(
    () =>
      registry.register({
        id: "",
        kind: "llm",
        providerType: "local",
        localFirst: true,
        status: { available: true },
        trustTags: [],
      }),
    /model\.descriptor\.id must be a non-empty string/,
  );

  registry.register({
    id: "local.embed-small",
    kind: "embedding",
    providerType: "local",
    localFirst: true,
    status: { available: true },
    trustTags: ["self_hosted"],
  });

  assert.throws(
    () =>
      registry.register({
        id: "local.embed-small",
        kind: "embedding",
        providerType: "local",
        localFirst: true,
        status: { available: true },
        trustTags: ["self_hosted"],
      }),
    /model already registered/,
  );
});

function createDefaultRouter() {
  const registry = createModelRegistry([
    {
      id: "local.mistral-small",
      kind: "llm",
      providerType: "local",
      localFirst: true,
      status: { available: true },
      trustTags: ["self_hosted", "restricted_data"],
      capabilities: ["summarize", "extract.entities"],
      policy: { approvalRequired: false, externalProviderRestricted: false },
    },
    {
      id: "cloud.gpt-fast",
      kind: "llm",
      providerType: "cloud",
      localFirst: false,
      status: { available: true },
      trustTags: ["external_provider"],
      capabilities: ["summarize"],
      policy: { approvalRequired: true, externalProviderRestricted: true },
    },
    {
      id: "local.llm-offline",
      kind: "llm",
      providerType: "local",
      localFirst: true,
      status: { available: false, reason: "maintenance" },
      trustTags: ["self_hosted"],
      capabilities: ["summarize"],
    },
  ]);

  return createModelRouter({ registry });
}

test("router applies local-first default behavior with workflow/run context", () => {
  const router = createDefaultRouter();
  const result = router.route({
    target: { kind: "llm", capability: "summarize" },
    context: {
      runId: "run-1",
      workflowId: "security-osint.alert-triage",
      caseId: "case-1",
      actorId: "analyst-1",
      correlationId: "corr-1",
    },
  });

  assert.equal(result.ok, true);
  assert.equal(result.route.modelId, "local.mistral-small");
  assert.equal(result.route.reason, "local_first_default");
  assert.equal(result.audit.event_type, "model.routing.decision");
  assert.equal(result.audit.correlation.run_id, "run-1");
});

test("router handles unavailable and disallowed model requests with thin structured errors", () => {
  const router = createDefaultRouter();

  const unavailable = router.route({
    target: { kind: "llm", modelId: "local.llm-offline" },
    policy: { allowExternalProviders: false },
  });
  assert.equal(unavailable.ok, false);
  assert.equal(unavailable.error.code, "MODEL_UNAVAILABLE");

  const disallowed = router.route({
    target: { kind: "llm", modelId: "local.mistral-small" },
    policy: { allowExternalProviders: true, disallowedModelIds: ["local.mistral-small"] },
  });
  assert.equal(disallowed.ok, false);
  assert.equal(disallowed.error.code, "MODEL_DISALLOWED");
});

test("router supports policy-compatible external provider restrictions", () => {
  const registry = createModelRegistry([
    {
      id: "cloud.only-llm",
      kind: "llm",
      providerType: "cloud",
      localFirst: false,
      status: { available: true },
      trustTags: ["external_provider"],
      capabilities: ["summarize"],
    },
  ]);
  const router = createModelRouter({ registry });

  const blocked = router.route({
    target: { kind: "llm", capability: "summarize" },
    policy: { allowExternalProviders: false },
  });

  assert.equal(blocked.ok, false);
  assert.equal(blocked.error.code, "NO_ROUTE");
  assert.deepEqual(blocked.error.candidateIds, ["cloud.only-llm"]);
});

