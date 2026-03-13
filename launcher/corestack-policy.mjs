export const POLICY_DECISION_OUTCOMES = ["allow", "deny", "require_approval"];

export const POLICY_AUDIT_EVENT_TYPE = "policy.decision";

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

function validateActor(actor) {
  assertObject(actor, "actor");
  assertNonEmptyString(actor.actor_id, "actor.actor_id");
  assertNonEmptyString(actor.actor_type, "actor.actor_type");
}

function validateReasons(reasons) {
  if (!Array.isArray(reasons) || reasons.length === 0) {
    throw new Error("reasons must contain at least one reason");
  }

  for (const reason of reasons) {
    assertObject(reason, "reason");
    assertNonEmptyString(reason.code, "reason.code");
    assertNonEmptyString(reason.message, "reason.message");
  }
}

export function validateGovernedActionRequest(request) {
  assertObject(request, "request");
  assertNonEmptyString(request.request_id, "request.request_id");
  assertNonEmptyString(request.action, "request.action");
  assertNonEmptyString(request.purpose, "request.purpose");

  assertObject(request.subject, "request.subject");
  assertNonEmptyString(request.subject.kind, "request.subject.kind");

  assertObject(request.resource, "request.resource");
  assertNonEmptyString(request.resource.kind, "request.resource.kind");

  assertObject(request.context, "request.context");
  validateActor(request.context.actor);
  assertNonEmptyString(request.context.correlation_id, "request.context.correlation_id");

  assertObject(request.audit, "request.audit");
  assertNonEmptyString(request.audit.event_type, "request.audit.event_type");
  assertNonEmptyString(request.audit.correlation_id, "request.audit.correlation_id");

  return clone(request);
}

export function validatePolicyDecision(decision) {
  assertObject(decision, "decision");
  assertNonEmptyString(decision.decision_id, "decision.decision_id");
  assertNonEmptyString(decision.request_id, "decision.request_id");
  assertNonEmptyString(decision.decided_at, "decision.decided_at");

  if (!POLICY_DECISION_OUTCOMES.includes(decision.outcome)) {
    throw new Error(`decision.outcome must be one of: ${POLICY_DECISION_OUTCOMES.join(", ")}`);
  }

  validateReasons(decision.reasons);

  if (decision.outcome === "require_approval") {
    assertObject(decision.approval, "decision.approval");
    if (decision.approval.required !== true) {
      throw new Error("decision.approval.required must be true when outcome=require_approval");
    }
    assertNonEmptyString(decision.approval.subject_ref, "decision.approval.subject_ref");
  }

  assertObject(decision.audit, "decision.audit");
  assertNonEmptyString(decision.audit.event_type, "decision.audit.event_type");
  assertNonEmptyString(decision.audit.correlation_id, "decision.audit.correlation_id");

  return clone(decision);
}

export function createGovernedActionRequest({
  requestId,
  action,
  purpose,
  subject,
  resource,
  context,
  audit,
}) {
  return validateGovernedActionRequest({
    request_id: requestId,
    action,
    purpose,
    subject,
    resource,
    context,
    audit: {
      event_type: audit?.event_type ?? POLICY_AUDIT_EVENT_TYPE,
      correlation_id: audit?.correlation_id ?? context?.correlation_id,
      requested_at: audit?.requested_at ?? new Date().toISOString(),
      ...audit,
    },
  });
}

export function createPolicyDecision({
  decisionId,
  requestId,
  outcome,
  reasons,
  obligations = [],
  approval = null,
  policyRef = null,
  expiresAt = null,
  audit,
}) {
  return validatePolicyDecision({
    decision_id: decisionId,
    request_id: requestId,
    outcome,
    reasons,
    obligations,
    approval,
    policy_ref: policyRef,
    expires_at: expiresAt,
    decided_at: audit?.decided_at ?? new Date().toISOString(),
    audit: {
      event_type: audit?.event_type ?? POLICY_AUDIT_EVENT_TYPE,
      correlation_id: audit?.correlation_id,
      decision_trace_id: audit?.decision_trace_id ?? decisionId,
      ...audit,
    },
  });
}

export function buildPolicyContext({ workflow, actor, run = null, caseRecord = null, deployment = {} }) {
  if (!workflow?.id || !workflow?.moduleId) {
    throw new Error("workflow must include id and moduleId");
  }

  const correlationId = [workflow.id, run?.runId ?? "pending", caseRecord?.caseId ?? "no-case"].join(":");

  return {
    module_id: workflow.moduleId,
    workflow_id: workflow.id,
    run_id: run?.runId ?? null,
    case_id: caseRecord?.caseId ?? null,
    actor: {
      actor_id: actor?.actorId ?? "unknown-actor",
      actor_type: actor?.actorType ?? "unknown",
    },
    deployment,
    correlation_id: correlationId,
  };
}

export function buildRunPolicyReference({ workflow, actor, caseRecord = null }) {
  const context = buildPolicyContext({ workflow, actor, caseRecord });
  return {
    policyContext: context,
    policyDecisions: [],
    governedActionTypes: ["tool", "model", "workflow", "export", "evidence"],
  };
}
