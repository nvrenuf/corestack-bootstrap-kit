function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function assertObject(value, label) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
}

function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} must be a non-empty string`);
  }
}

export function validateModelExecutionRequest(request) {
  assertObject(request, "model.execution.request");
  assertObject(request.routeResult ?? {}, "model.execution.request.routeResult");

  if (request.routeResult.ok !== true) {
    throw new Error("model.execution.request.routeResult.ok must be true");
  }

  assertObject(request.routeResult.route ?? {}, "model.execution.request.routeResult.route");
  assertNonEmptyString(request.routeResult.route.modelId, "model.execution.request.routeResult.route.modelId");
  assertNonEmptyString(request.routeResult.route.kind, "model.execution.request.routeResult.route.kind");
  assertNonEmptyString(request.routeResult.route.providerType, "model.execution.request.routeResult.route.providerType");

  if (request.context != null) {
    assertObject(request.context, "model.execution.request.context");
  }

  if (request.restrictions != null) {
    assertObject(request.restrictions, "model.execution.request.restrictions");
  }

  return clone({
    routeResult: request.routeResult,
    context: {
      runId: request.context?.runId ?? null,
      workflowId: request.context?.workflowId ?? null,
      caseId: request.context?.caseId ?? null,
      actorId: request.context?.actorId ?? null,
      correlationId: request.context?.correlationId ?? null,
      requestId: request.context?.requestId ?? null,
      decisionId: request.context?.decisionId ?? request.routeResult.audit?.correlation?.decision_id ?? null,
    },
    restrictions: {
      localOnly: Boolean(request.restrictions?.localOnly),
      externalDisallowed: Boolean(request.restrictions?.externalDisallowed),
      reason: request.restrictions?.reason ?? null,
    },
    invocation: {
      operation: request.invocation?.operation ?? null,
      inputShape: request.invocation?.inputShape ?? {},
    },
  });
}

export function buildModelExecutionAuditEvent({ eventType, request, payload = {}, timestamp }) {
  return {
    event_type: eventType,
    timestamp,
    correlation: {
      correlation_id: request.context.correlationId,
      run_id: request.context.runId,
      workflow_id: request.context.workflowId,
      case_id: request.context.caseId,
      actor_id: request.context.actorId,
      request_id: request.context.requestId,
      decision_id: request.context.decisionId,
      model_id: request.routeResult.route.modelId,
    },
    payload: {
      model_kind: request.routeResult.route.kind,
      provider_type: request.routeResult.route.providerType,
      route_reason: request.routeResult.route.reason ?? null,
      route_event_type: request.routeResult.audit?.event_type ?? null,
      route_ok: request.routeResult.ok,
      local_only: request.restrictions.localOnly,
      external_disallowed: request.restrictions.externalDisallowed,
      restriction_reason: request.restrictions.reason,
      ...payload,
    },
  };
}

export function evaluateModelExecutionRestriction(request) {
  const providerType = request.routeResult.route.providerType;
  const externalBlocked = request.restrictions.localOnly || request.restrictions.externalDisallowed;

  if (externalBlocked && providerType !== "local") {
    return {
      ok: false,
      error: {
        code: "EXTERNAL_PROVIDER_DISALLOWED",
        message: `model execution blocked: provider \"${providerType}\" is disallowed by restriction hook`,
      },
    };
  }

  return { ok: true, error: null };
}

export function createModelExecutionHooks({ emitEvent, now = () => new Date().toISOString() } = {}) {
  if (typeof emitEvent !== "function") {
    throw new Error("model execution hooks require emitEvent");
  }

  return {
    async beforeExecute(rawRequest) {
      const request = validateModelExecutionRequest(rawRequest);
      const requested = buildModelExecutionAuditEvent({
        eventType: "model.execution.requested",
        request,
        timestamp: now(),
        payload: {
          operation: request.invocation.operation,
          input_shape: request.invocation.inputShape,
        },
      });
      emitEvent(requested);

      const restriction = evaluateModelExecutionRestriction(request);
      if (!restriction.ok) {
        const blocked = buildModelExecutionAuditEvent({
          eventType: "model.execution.restriction_blocked",
          request,
          timestamp: now(),
          payload: {
            outcome: "blocked",
            error_code: restriction.error.code,
            error_message: restriction.error.message,
          },
        });
        emitEvent(blocked);
        return { ok: false, status: "blocked", error: restriction.error, request };
      }

      const decisioned = buildModelExecutionAuditEvent({
        eventType: "model.execution.decisioned",
        request,
        timestamp: now(),
        payload: {
          outcome: "allowed",
        },
      });
      emitEvent(decisioned);
      return { ok: true, status: "allowed", error: null, request };
    },
    async afterExecute(rawRequest, result = {}) {
      const request = validateModelExecutionRequest(rawRequest);
      const resultEvent = buildModelExecutionAuditEvent({
        eventType: "model.execution.result",
        request,
        timestamp: now(),
        payload: {
          outcome: result.ok === false ? "error" : "success",
          response_shape: result.responseShape ?? null,
          error_code: result.error?.code ?? null,
        },
      });
      emitEvent(resultEvent);
      return clone(resultEvent);
    },
  };
}
