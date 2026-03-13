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

export const MODEL_KINDS = ["llm", "embedding", "reranker", "vision", "audio"];
export const MODEL_PROVIDER_TYPES = ["local", "cloud"];
export const MODEL_ROUTE_ERROR_CODES = ["MODEL_NOT_FOUND", "MODEL_UNAVAILABLE", "MODEL_DISALLOWED", "NO_ROUTE"];

export function validateModelDescriptor(descriptor) {
  assertObject(descriptor, "model.descriptor");
  assertNonEmptyString(descriptor.id, "model.descriptor.id");
  assertNonEmptyString(descriptor.kind, "model.descriptor.kind");
  assertNonEmptyString(descriptor.providerType, "model.descriptor.providerType");

  if (!MODEL_KINDS.includes(descriptor.kind)) {
    throw new Error(`model.descriptor.kind must be one of: ${MODEL_KINDS.join(", ")}`);
  }

  if (!MODEL_PROVIDER_TYPES.includes(descriptor.providerType)) {
    throw new Error(`model.descriptor.providerType must be one of: ${MODEL_PROVIDER_TYPES.join(", ")}`);
  }

  if (typeof descriptor.localFirst !== "boolean") {
    throw new Error("model.descriptor.localFirst must be a boolean");
  }

  assertObject(descriptor.status ?? {}, "model.descriptor.status");
  if (typeof descriptor.status.available !== "boolean") {
    throw new Error("model.descriptor.status.available must be a boolean");
  }

  if (!Array.isArray(descriptor.trustTags)) {
    throw new Error("model.descriptor.trustTags must be an array");
  }

  if (descriptor.capabilities != null && !Array.isArray(descriptor.capabilities)) {
    throw new Error("model.descriptor.capabilities must be an array when provided");
  }

  if (descriptor.policy != null) {
    assertObject(descriptor.policy, "model.descriptor.policy");
  }

  return clone({
    id: descriptor.id,
    kind: descriptor.kind,
    providerType: descriptor.providerType,
    localFirst: descriptor.localFirst,
    status: {
      available: descriptor.status.available,
      reason: descriptor.status.reason ?? null,
      updatedAt: descriptor.status.updatedAt ?? null,
    },
    trustTags: descriptor.trustTags,
    capabilities: descriptor.capabilities ?? [],
    policy: {
      approvalRequired: Boolean(descriptor.policy?.approvalRequired),
      policyScope: descriptor.policy?.policyScope ?? null,
      externalProviderRestricted: Boolean(descriptor.policy?.externalProviderRestricted),
    },
    metadata: descriptor.metadata ?? {},
  });
}

export function createModelRegistry(definitions = []) {
  const models = new Map();

  for (const definition of definitions) {
    const model = validateModelDescriptor(definition);
    if (models.has(model.id)) {
      throw new Error(`model already registered: ${model.id}`);
    }

    models.set(model.id, model);
  }

  return {
    register(definition) {
      const model = validateModelDescriptor(definition);
      if (models.has(model.id)) {
        throw new Error(`model already registered: ${model.id}`);
      }

      models.set(model.id, model);
      return clone(model);
    },
    get(modelId) {
      assertNonEmptyString(modelId, "modelId");
      const model = models.get(modelId);
      return model ? clone(model) : null;
    },
    list() {
      return Array.from(models.values()).map(clone);
    },
  };
}

export function validateModelRouteRequest(request) {
  assertObject(request, "model.route.request");
  assertObject(request.target ?? {}, "model.route.request.target");
  assertNonEmptyString(request.target.kind, "model.route.request.target.kind");

  if (!MODEL_KINDS.includes(request.target.kind)) {
    throw new Error(`model.route.request.target.kind must be one of: ${MODEL_KINDS.join(", ")}`);
  }

  if (request.target.modelId != null && (typeof request.target.modelId !== "string" || request.target.modelId.trim() === "")) {
    throw new Error("model.route.request.target.modelId must be a non-empty string when provided");
  }

  if (request.target.providerType != null && !MODEL_PROVIDER_TYPES.includes(request.target.providerType)) {
    throw new Error(`model.route.request.target.providerType must be one of: ${MODEL_PROVIDER_TYPES.join(", ")}`);
  }

  if (request.policy != null) {
    assertObject(request.policy, "model.route.request.policy");
  }

  if (request.context != null) {
    assertObject(request.context, "model.route.request.context");
  }

  return clone({
    target: {
      kind: request.target.kind,
      modelId: request.target.modelId ?? null,
      providerType: request.target.providerType ?? null,
      capability: request.target.capability ?? null,
    },
    policy: {
      allowExternalProviders: Boolean(request.policy?.allowExternalProviders),
      disallowedModelIds: request.policy?.disallowedModelIds ?? [],
      decisionId: request.policy?.decisionId ?? null,
    },
    context: {
      runId: request.context?.runId ?? null,
      workflowId: request.context?.workflowId ?? null,
      caseId: request.context?.caseId ?? null,
      actorId: request.context?.actorId ?? null,
      correlationId: request.context?.correlationId ?? null,
    },
  });
}

function createRouteFailure(request, { code, message, candidateIds = [] }) {
  return {
    ok: false,
    route: null,
    error: {
      code,
      message,
      candidateIds,
    },
    audit: buildModelRouteAuditRecord({ request, routeResult: { ok: false, error: { code } } }),
  };
}

export function buildModelRouteAuditRecord({ request, routeResult }) {
  return {
    event_type: "model.routing.decision",
    correlation: {
      run_id: request.context.runId,
      workflow_id: request.context.workflowId,
      case_id: request.context.caseId,
      actor_id: request.context.actorId,
      correlation_id: request.context.correlationId,
      decision_id: request.policy.decisionId,
    },
    payload: {
      requested_kind: request.target.kind,
      requested_capability: request.target.capability,
      requested_model_id: request.target.modelId,
      requested_provider_type: request.target.providerType,
      ok: routeResult.ok,
      selected_model_id: routeResult.route?.modelId ?? null,
      selected_provider_type: routeResult.route?.providerType ?? null,
      local_first: routeResult.route?.localFirst ?? null,
      route_reason: routeResult.route?.reason ?? null,
      error_code: routeResult.error?.code ?? null,
    },
  };
}

export function createModelRouter({ registry }) {
  if (!registry || typeof registry.list !== "function") {
    throw new Error("model router requires a registry");
  }

  return {
    route(rawRequest) {
      const request = validateModelRouteRequest(rawRequest);
      const models = registry.list();

      const scoped = models.filter((model) => model.kind === request.target.kind);
      if (scoped.length === 0) {
        return createRouteFailure(request, {
          code: "NO_ROUTE",
          message: `no registered models support kind: ${request.target.kind}`,
        });
      }

      let candidates = scoped.filter((model) => model.status.available);
      if (request.target.capability) {
        candidates = candidates.filter((model) => model.capabilities.includes(request.target.capability));
      }

      if (request.target.providerType) {
        candidates = candidates.filter((model) => model.providerType === request.target.providerType);
      }

      if (request.target.modelId) {
        candidates = candidates.filter((model) => model.id === request.target.modelId);
      }

      if (request.policy.disallowedModelIds.length > 0) {
        candidates = candidates.filter((model) => !request.policy.disallowedModelIds.includes(model.id));
      }

      const externalBlocked = !request.policy.allowExternalProviders;
      if (externalBlocked) {
        candidates = candidates.filter((model) => model.providerType === "local");
      }

      if (candidates.length === 0) {
        const specificModel = request.target.modelId ? registry.get(request.target.modelId) : null;
        if (specificModel && !specificModel.status.available) {
          return createRouteFailure(request, {
            code: "MODEL_UNAVAILABLE",
            message: `requested model is unavailable: ${specificModel.id}`,
            candidateIds: scoped.map((model) => model.id),
          });
        }

        if (specificModel && request.policy.disallowedModelIds.includes(specificModel.id)) {
          return createRouteFailure(request, {
            code: "MODEL_DISALLOWED",
            message: `requested model is disallowed by policy: ${specificModel.id}`,
            candidateIds: scoped.map((model) => model.id),
          });
        }

        return createRouteFailure(request, {
          code: "NO_ROUTE",
          message: "no allowed and available route matched the request",
          candidateIds: scoped.map((model) => model.id),
        });
      }

      const sorted = candidates.sort((left, right) => {
        if (left.providerType === right.providerType) {
          return 0;
        }

        if (left.providerType === "local") {
          return -1;
        }

        return 1;
      });

      const selected = sorted[0];
      const routeResult = {
        ok: true,
        route: {
          modelId: selected.id,
          kind: selected.kind,
          providerType: selected.providerType,
          localFirst: selected.localFirst,
          reason: selected.providerType === "local" ? "local_first_default" : "explicit_or_only_available",
          policy: selected.policy,
          trustTags: selected.trustTags,
        },
        error: null,
      };

      return {
        ...routeResult,
        audit: buildModelRouteAuditRecord({ request, routeResult }),
      };
    },
  };
}
