export const APPROVAL_STATES = ["pending", "approved", "denied", "expired"];

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

export function validateApproval(approval) {
  assertObject(approval, "approval");
  assertNonEmptyString(approval.approvalId, "approval.approvalId");
  if (!APPROVAL_STATES.includes(approval.status)) {
    throw new Error(`approval.status must be one of: ${APPROVAL_STATES.join(", ")}`);
  }

  assertObject(approval.governedAction, "approval.governedAction");
  assertObject(approval.links, "approval.links");
  assertObject(approval.subject, "approval.subject");
  assertObject(approval.reasonContext, "approval.reasonContext");
  assertObject(approval.requestedBy, "approval.requestedBy");

  assertNonEmptyString(approval.createdAt, "approval.createdAt");
  assertNonEmptyString(approval.updatedAt, "approval.updatedAt");

  return clone(approval);
}

export function createApprovalStore({
  storage,
  key = "corestack.approvals.v1",
  now = () => new Date().toISOString(),
  createApprovalId = () => crypto.randomUUID(),
  emitEvent = () => {},
} = {}) {
  if (!storage) {
    throw new Error("approval store requires storage");
  }

  function readApprovals() {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function writeApprovals(approvals) {
    storage.setItem(key, JSON.stringify(approvals));
  }

  function updateApproval(approvalId, updater) {
    const approvals = readApprovals();
    const index = approvals.findIndex((item) => item.approvalId === approvalId);
    if (index === -1) {
      throw new Error(`approval not found: ${approvalId}`);
    }

    const updated = updater(clone(approvals[index]));
    updated.updatedAt = now();
    approvals[index] = validateApproval(updated);
    writeApprovals(approvals);
    return clone(approvals[index]);
  }

  function transitionApproval(approvalId, nextState, { actor = null, rationale = null } = {}) {
    return updateApproval(approvalId, (approval) => {
      if (approval.status !== "pending") {
        throw new Error(`cannot transition approval from ${approval.status} to ${nextState}`);
      }

      if (!APPROVAL_STATES.includes(nextState) || nextState === "pending") {
        throw new Error("approval transitions must end in approved, denied, or expired");
      }

      approval.status = nextState;
      approval.reviewedBy = actor;
      approval.reviewedAt = now();
      approval.resolution = {
        state: nextState,
        rationale,
      };
      return approval;
    });
  }

  return {
    listApprovals() {
      return readApprovals().map(clone);
    },
    listQueue() {
      return readApprovals().filter((approval) => approval.status === "pending").map(clone);
    },
    getApproval(approvalId) {
      const approval = readApprovals().find((item) => item.approvalId === approvalId);
      return approval ? clone(approval) : null;
    },
    createApproval({
      governedAction,
      links = {},
      policyDecision = null,
      subject,
      reasonContext = {},
      requestedBy,
      expiresAt = null,
    }) {
      const timestamp = now();
      const approval = validateApproval({
        approvalId: createApprovalId(),
        status: "pending",
        governedAction,
        links: {
          runId: links.runId ?? null,
          workflowId: links.workflowId ?? null,
          caseId: links.caseId ?? null,
          policyDecisionId: links.policyDecisionId ?? null,
        },
        policyDecision,
        subject,
        reasonContext,
        requestedBy,
        reviewedBy: null,
        reviewedAt: null,
        resolution: null,
        createdAt: timestamp,
        updatedAt: timestamp,
        expiresAt,
      });

      const approvals = readApprovals();
      approvals.unshift(approval);
      writeApprovals(approvals);
      emitEvent({
        event_type: "approval.lifecycle.created",
        timestamp,
        correlation: {
          correlation_id: policyDecision?.audit?.correlation_id ?? governedAction?.correlationId ?? null,
          run_id: approval.links.runId,
          case_id: approval.links.caseId,
          workflow_id: approval.links.workflowId,
          policy_decision_id: approval.links.policyDecisionId,
          approval_id: approval.approvalId,
          actor_id: requestedBy?.actorId ?? null,
        },
        payload: {
          state: approval.status,
          governed_action_type: governedAction?.type ?? null,
          governed_action_id: governedAction?.id ?? null,
          subject_summary: subject?.summary ?? null,
        },
      });
      return clone(approval);
    },
    approveApproval(approvalId, { actor, rationale = null } = {}) {
      const updated = transitionApproval(approvalId, "approved", { actor, rationale });
      emitEvent({
        event_type: "approval.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          correlation_id: updated.policyDecision?.audit?.correlation_id ?? updated.governedAction?.correlationId ?? null,
          run_id: updated.links.runId,
          case_id: updated.links.caseId,
          workflow_id: updated.links.workflowId,
          policy_decision_id: updated.links.policyDecisionId,
          approval_id: updated.approvalId,
          actor_id: actor?.actorId ?? null,
        },
        payload: {
          previous_state: "pending",
          state: updated.status,
          rationale,
        },
      });
      return updated;
    },
    denyApproval(approvalId, { actor, rationale = null } = {}) {
      const updated = transitionApproval(approvalId, "denied", { actor, rationale });
      emitEvent({
        event_type: "approval.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          correlation_id: updated.policyDecision?.audit?.correlation_id ?? updated.governedAction?.correlationId ?? null,
          run_id: updated.links.runId,
          case_id: updated.links.caseId,
          workflow_id: updated.links.workflowId,
          policy_decision_id: updated.links.policyDecisionId,
          approval_id: updated.approvalId,
          actor_id: actor?.actorId ?? null,
        },
        payload: {
          previous_state: "pending",
          state: updated.status,
          rationale,
        },
      });
      return updated;
    },
    expireApproval(approvalId, { actor = null, rationale = "expired" } = {}) {
      const updated = transitionApproval(approvalId, "expired", { actor, rationale });
      emitEvent({
        event_type: "approval.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          correlation_id: updated.policyDecision?.audit?.correlation_id ?? updated.governedAction?.correlationId ?? null,
          run_id: updated.links.runId,
          case_id: updated.links.caseId,
          workflow_id: updated.links.workflowId,
          policy_decision_id: updated.links.policyDecisionId,
          approval_id: updated.approvalId,
          actor_id: actor?.actorId ?? null,
        },
        payload: {
          previous_state: "pending",
          state: updated.status,
          rationale,
        },
      });
      return updated;
    },
    projectQueueItems() {
      return this.listQueue().map((approval) => ({
        approvalId: approval.approvalId,
        status: approval.status,
        summary: approval.subject.summary,
        runId: approval.links.runId,
        caseId: approval.links.caseId,
        workflowId: approval.links.workflowId,
        policyDecisionId: approval.links.policyDecisionId,
        requestedAt: approval.createdAt,
      }));
    },
    projectApprovalDetail(approvalId) {
      const approval = this.getApproval(approvalId);
      if (!approval) {
        return null;
      }

      return {
        approvalId: approval.approvalId,
        status: approval.status,
        subject: approval.subject,
        governedAction: approval.governedAction,
        links: approval.links,
        policyDecision: approval.policyDecision,
        reasonContext: approval.reasonContext,
        requestedBy: approval.requestedBy,
        reviewedBy: approval.reviewedBy,
        reviewedAt: approval.reviewedAt,
        resolution: approval.resolution,
        createdAt: approval.createdAt,
        updatedAt: approval.updatedAt,
      };
    },
  };
}
