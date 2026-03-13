import { createGovernedActionRequest, validatePolicyDecision } from "./corestack-policy.mjs";

const SUPPORTED_TOOLS = ["web.fetch", "web.search"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validationError(tool, message, field) {
  return {
    ok: false,
    status: "invalid_request",
    tool,
    error: {
      code: "BAD_REQUEST",
      message,
      details: {
        field,
      },
    },
  };
}

function validateCommonRequestShape(tool, request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    return validationError(tool, "request must be an object", "request");
  }

  if (!isNonEmptyString(request.agent_id)) {
    return validationError(tool, "agent_id must be a non-empty string", "agent_id");
  }

  if (!isNonEmptyString(request.purpose)) {
    return validationError(tool, "purpose must be a non-empty string", "purpose");
  }

  if (!request.context || typeof request.context !== "object" || Array.isArray(request.context)) {
    return validationError(tool, "context must be an object", "context");
  }

  if (!isNonEmptyString(request.context.correlation_id)) {
    return validationError(tool, "context.correlation_id must be a non-empty string", "context.correlation_id");
  }

  if (!request.inputs || typeof request.inputs !== "object" || Array.isArray(request.inputs)) {
    return validationError(tool, "inputs must be an object", "inputs");
  }

  return null;
}

function validateToolRequest(tool, request) {
  const commonError = validateCommonRequestShape(tool, request);
  if (commonError) {
    return commonError;
  }

  if (tool === "web.fetch") {
    if (!isNonEmptyString(request.inputs.url)) {
      return validationError(tool, "inputs.url must be a non-empty string", "inputs.url");
    }
  } else if (tool === "web.search") {
    if (!isNonEmptyString(request.inputs.query)) {
      return validationError(tool, "inputs.query must be a non-empty string", "inputs.query");
    }

    if (request.inputs.max_results !== undefined) {
      const value = request.inputs.max_results;
      if (!Number.isInteger(value) || value < 1 || value > 10) {
        return validationError(tool, "inputs.max_results must be an integer between 1 and 10", "inputs.max_results");
      }
    }
  }

  return null;
}

function buildGovernedResource(tool, request) {
  if (tool === "web.fetch") {
    return {
      kind: "external_resource",
      locator: request.inputs.url,
      classification: "osint",
    };
  }

  return {
    kind: "external_resource",
    locator: `query:${request.inputs.query}`,
    classification: "osint",
  };
}

function buildAuditEvent({ eventType, tool, request, decision, actor, now }) {
  return {
    event_type: eventType,
    timestamp: now(),
    tool_name: tool,
    outcome: decision.outcome,
    decision_id: decision.decision_id,
    request_id: decision.request_id,
    reason_codes: decision.reasons.map((reason) => reason.code),
    agent_id: request.agent_id,
    actor_id: actor?.actor_id ?? null,
    correlation_id: request.context.correlation_id,
    module_id: request.context.module_id ?? null,
    workflow_id: request.context.workflow_id ?? null,
    run_id: request.context.run_id ?? null,
    case_id: request.context.case_id ?? null,
  };
}

export function createToolGateway({
  policyCheck,
  executeTool,
  emitEvent = () => {},
  now = () => new Date().toISOString(),
  createDecisionId = () => `policy-${Date.now()}`,
} = {}) {
  if (typeof policyCheck !== "function") {
    throw new Error("policyCheck must be provided");
  }

  if (typeof executeTool !== "function") {
    throw new Error("executeTool must be provided");
  }

  return {
    async execute({ tool, request, actor = { actor_id: "system", actor_type: "service" } }) {
      if (!SUPPORTED_TOOLS.includes(tool)) {
        return validationError(tool, "unsupported tool", "tool");
      }

      const invalid = validateToolRequest(tool, request);
      if (invalid) {
        emitEvent({
          event_type: "tool.gateway.validation_failed",
          timestamp: now(),
          tool_name: tool,
          request_id: request?.request_id ?? null,
          correlation_id: request?.context?.correlation_id ?? null,
          error: invalid.error,
        });
        return invalid;
      }

      const governedRequest = createGovernedActionRequest({
        requestId: request.request_id ?? request.context.correlation_id,
        action: "tool.execute",
        purpose: request.purpose,
        subject: {
          kind: "tool",
          id: tool,
          capability: tool,
        },
        resource: buildGovernedResource(tool, request),
        context: {
          actor,
          module_id: request.context.module_id ?? null,
          workflow_id: request.context.workflow_id ?? null,
          run_id: request.context.run_id ?? null,
          case_id: request.context.case_id ?? null,
          deployment: {},
          correlation_id: request.context.correlation_id,
        },
        audit: {
          event_type: "policy.decision",
          correlation_id: request.context.correlation_id,
        },
      });

      const rawDecision = await policyCheck(clone(governedRequest));
      const decision = validatePolicyDecision({
        decision_id: rawDecision?.decision_id ?? createDecisionId(),
        request_id: rawDecision?.request_id ?? governedRequest.request_id,
        outcome: rawDecision?.outcome,
        reasons: rawDecision?.reasons,
        obligations: rawDecision?.obligations ?? [],
        approval: rawDecision?.approval ?? null,
        policy_ref: rawDecision?.policy_ref ?? null,
        expires_at: rawDecision?.expires_at ?? null,
        decided_at: rawDecision?.decided_at ?? now(),
        audit: {
          event_type: rawDecision?.audit?.event_type ?? "policy.decision",
          correlation_id: rawDecision?.audit?.correlation_id ?? request.context.correlation_id,
          decision_trace_id: rawDecision?.audit?.decision_trace_id ?? null,
          decided_at: rawDecision?.audit?.decided_at ?? null,
          requested_at: rawDecision?.audit?.requested_at ?? null,
        },
      });

      emitEvent(buildAuditEvent({
        eventType: "tool.gateway.decision",
        tool,
        request,
        decision,
        actor,
        now,
      }));

      if (decision.outcome === "deny" || decision.outcome === "require_approval") {
        return {
          ok: false,
          status: "policy_blocked",
          tool,
          policy: decision,
          result: null,
        };
      }

      const result = await executeTool({ tool, request: clone(request), decision: clone(decision) });
      emitEvent({
        event_type: "tool.gateway.executed",
        timestamp: now(),
        tool_name: tool,
        request_id: decision.request_id,
        decision_id: decision.decision_id,
        correlation_id: request.context.correlation_id,
      });

      return {
        ok: true,
        status: "executed",
        tool,
        policy: decision,
        result,
      };
    },
  };
}
