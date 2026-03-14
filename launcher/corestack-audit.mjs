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

export const AUDIT_EVENT_TYPES = {
  RUN_CREATED: "run.lifecycle.created",
  RUN_STATE_CHANGED: "run.lifecycle.state_changed",
  RUN_CASE_LINKED: "run.lifecycle.case_linked",
  TOOL_REQUESTED: "tool.execution.requested",
  TOOL_DECISIONED: "tool.execution.decisioned",
  TOOL_RESULT: "tool.execution.result",
  TOOL_INVALID_REQUEST: "tool.execution.invalid_request",
  MODEL_REQUESTED: "model.execution.requested",
  MODEL_DECISIONED: "model.execution.decisioned",
  MODEL_RESULT: "model.execution.result",
  MODEL_RESTRICTION_BLOCKED: "model.execution.restriction_blocked",
  EVIDENCE_MUTATED: "evidence.object.mutated",
  APPROVAL_PLACEHOLDER: "approval.lifecycle.placeholder",
  APPROVAL_CREATED: "approval.lifecycle.created",
  APPROVAL_STATE_CHANGED: "approval.lifecycle.state_changed",
};

export function validateAuditEvent(event) {
  assertObject(event, "audit.event");
  assertNonEmptyString(event.event_id, "audit.event.event_id");
  assertNonEmptyString(event.event_type, "audit.event.event_type");
  assertNonEmptyString(event.timestamp, "audit.event.timestamp");
  assertObject(event.correlation, "audit.event.correlation");

  const supportedRefs = [
    "correlation_id",
    "run_id",
    "case_id",
    "workflow_id",
    "actor_id",
    "artifact_id",
    "evidence_id",
    "finding_id",
    "tool_name",
    "request_id",
    "decision_id",
    "approval_id",
    "policy_decision_id",
    "model_id",
  ];

  if (!supportedRefs.some((key) => event.correlation[key] != null)) {
    throw new Error("audit.event.correlation must include at least one supported reference");
  }

  assertObject(event.payload ?? {}, "audit.event.payload");
  return clone({ ...event, payload: event.payload ?? {} });
}

export function createAuditEvent({
  eventId,
  eventType,
  timestamp,
  correlation,
  payload = {},
}) {
  return validateAuditEvent({
    event_id: eventId,
    event_type: eventType,
    timestamp,
    correlation,
    payload,
  });
}

export function createAuditEventStore({
  storage,
  key = "corestack.audit.v1",
  now = () => new Date().toISOString(),
  createEventId = () => crypto.randomUUID(),
} = {}) {
  if (!storage) {
    throw new Error("audit event store requires storage");
  }

  function readEvents() {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function writeEvents(events) {
    storage.setItem(key, JSON.stringify(events));
  }

  return {
    listEvents({
      eventType = null,
      runId = null,
      caseId = null,
      correlationId = null,
      artifactId = null,
      evidenceId = null,
      findingId = null,
    } = {}) {
      return readEvents()
        .filter((event) => (eventType ? event.event_type === eventType : true))
        .filter((event) => (runId ? event.correlation.run_id === runId : true))
        .filter((event) => (caseId ? event.correlation.case_id === caseId : true))
        .filter((event) => (correlationId ? event.correlation.correlation_id === correlationId : true))
        .filter((event) => (artifactId ? event.correlation.artifact_id === artifactId : true))
        .filter((event) => (evidenceId ? event.correlation.evidence_id === evidenceId : true))
        .filter((event) => (findingId ? event.correlation.finding_id === findingId : true))
        .map(clone);
    },
    recordEvent({ eventType, correlation = {}, payload = {}, timestamp = now(), eventId = createEventId() }) {
      const event = createAuditEvent({
        eventId,
        eventType,
        timestamp,
        correlation,
        payload,
      });

      const events = readEvents();
      events.unshift(event);
      writeEvents(events);
      return clone(event);
    },
    emitApprovalPlaceholder({ correlation = {}, payload = {} }) {
      return this.recordEvent({
        eventType: AUDIT_EVENT_TYPES.APPROVAL_PLACEHOLDER,
        correlation,
        payload,
      });
    },
  };
}

export function createPolicyDecisionAuditCorrelation({ request = null, decision = null, context = {} } = {}) {
  return {
    correlation_id: decision?.audit?.correlation_id ?? request?.audit?.correlation_id ?? context.correlation_id ?? null,
    run_id: context.run_id ?? null,
    case_id: context.case_id ?? null,
    workflow_id: context.workflow_id ?? null,
    actor_id: context.actor?.actor_id ?? null,
    request_id: decision?.request_id ?? request?.request_id ?? null,
    decision_id: decision?.decision_id ?? null,
    policy_decision_id: decision?.decision_id ?? null,
  };
}
