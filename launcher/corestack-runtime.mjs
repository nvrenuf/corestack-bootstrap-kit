export const RUN_STATES = ["created", "running", "pending_approval", "blocked", "failed", "completed"];

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createMemoryStorage() {
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

export function createBrowserStorage() {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }

  return createMemoryStorage();
}

export function createWorkflowRegistry(definitions = []) {
  const workflows = new Map();

  for (const definition of definitions) {
    if (!definition?.id || !definition?.moduleId || !Array.isArray(definition?.steps) || definition.steps.length === 0) {
      throw new Error("workflow definitions require id, moduleId, and at least one step");
    }

    if (workflows.has(definition.id)) {
      throw new Error(`workflow already registered: ${definition.id}`);
    }

    workflows.set(definition.id, clone(definition));
  }

  return {
    get(workflowId) {
      return workflows.get(workflowId);
    },
    list() {
      return Array.from(workflows.values()).map(clone);
    },
  };
}

export function createRunStore({
  storage = createMemoryStorage(),
  key = "corestack.runs.v1",
  now = () => new Date().toISOString(),
  createId = () => crypto.randomUUID(),
  emitEvent = () => {},
} = {}) {
  function readRuns() {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function writeRuns(runs) {
    storage.setItem(key, JSON.stringify(runs));
  }

  function updateRun(runId, updater) {
    const runs = readRuns();
    const index = runs.findIndex((run) => run.runId === runId);
    if (index === -1) {
      throw new Error(`run not found: ${runId}`);
    }

    const updatedRun = updater(clone(runs[index]));
    updatedRun.updatedAt = now();
    runs[index] = updatedRun;
    writeRuns(runs);
    return clone(updatedRun);
  }

  return {
    listRuns() {
      return readRuns().map(clone);
    },
    getRun(runId) {
      const run = readRuns().find((item) => item.runId === runId);
      return run ? clone(run) : null;
    },
    createRun({ workflow, input = {}, actor = {}, trigger = "manual", caseId = null, policyContext = null }) {
      const timestamp = now();
      const firstStep = workflow.steps[0];
      const run = {
        runId: createId(),
        workflowId: workflow.id,
        workflowName: workflow.name,
        workflowVersion: workflow.version,
        moduleId: workflow.moduleId,
        trigger,
        input,
        actor,
        caseId,
        policyContext,
        policyDecisions: [],
        status: "created",
        createdAt: timestamp,
        updatedAt: timestamp,
        currentStepId: firstStep.id,
        currentStepTitle: firstStep.title,
        isResumable: false,
        resumeToken: null,
        stepRecords: workflow.steps.map((step, index) => ({
          stepId: step.id,
          title: step.title,
          kind: step.kind,
          order: index,
          status: index === 0 ? "created" : "pending",
          startedAt: null,
          endedAt: null,
          metadata: {},
        })),
      };

      const runs = readRuns();
      runs.unshift(run);
      writeRuns(runs);
      emitEvent({
        event_type: "run.lifecycle.created",
        timestamp,
        correlation: {
          run_id: run.runId,
          workflow_id: run.workflowId,
          case_id: run.caseId,
          actor_id: run.actor?.actorId ?? null,
        },
        payload: {
          status: run.status,
          trigger: run.trigger,
        },
      });
      return clone(run);
    },
    markRunning(runId, { stepId, metadata = {} } = {}) {
      const updated = updateRun(runId, (run) => {
        run.status = "running";
        run.isResumable = false;
        run.resumeToken = null;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? { ...step, status: "running", startedAt: step.startedAt ?? now(), metadata: { ...step.metadata, ...metadata } }
            : step,
        );
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
        },
      });
      return updated;
    },
    blockRun(runId, { stepId, reason, resumeToken } = {}) {
      const updated = updateRun(runId, (run) => {
        if (!resumeToken) {
          throw new Error("blocked runs require a resumeToken");
        }

        run.status = "blocked";
        run.isResumable = true;
        run.resumeToken = resumeToken;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? { ...step, status: "blocked", metadata: { ...step.metadata, reason } }
            : step,
        );
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          reason,
          resume_token_present: Boolean(resumeToken),
        },
      });
      return updated;
    },
    resumeRun(runId, { stepId, resumeToken } = {}) {
      const updated = updateRun(runId, (run) => {
        if (run.status !== "blocked" || run.resumeToken !== resumeToken) {
          throw new Error("run is not resumable with the provided token");
        }

        run.status = "running";
        run.isResumable = false;
        run.resumeToken = null;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? { ...step, status: "running", metadata: { ...step.metadata, resumed: true } }
            : step,
        );
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          resumed: true,
        },
      });
      return updated;
    },
    completeRun(runId, { stepId, output = {} } = {}) {
      const updated = updateRun(runId, (run) => {
        run.status = "completed";
        run.isResumable = false;
        run.resumeToken = null;
        run.output = output;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? { ...step, status: "completed", endedAt: now(), metadata: { ...step.metadata, output } }
            : step,
        );
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          output,
        },
      });
      return updated;
    },
    appendPolicyDecision(runId, decision) {
      if (!decision || typeof decision !== "object") {
        throw new Error("policy decision must be an object");
      }

      return updateRun(runId, (run) => {
        run.policyDecisions = [...run.policyDecisions, decision];
        return run;
      });
    },
    markPendingApproval(runId, { stepId, approvalId, reason = "policy-requires-approval" } = {}) {
      if (!approvalId) {
        throw new Error("approvalId is required to mark pending approval");
      }

      const updated = updateRun(runId, (run) => {
        run.status = "pending_approval";
        run.isResumable = false;
        run.resumeToken = null;
        run.pendingApproval = {
          approvalId,
          reason,
          requestedAt: now(),
        };
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? {
                ...step,
                status: "blocked",
                metadata: { ...step.metadata, approvalId, reason, pendingApproval: true },
              }
            : step,
        );
        return run;
      });

      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
          approval_id: approvalId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          reason,
          approval_id: approvalId,
        },
      });
      return updated;
    },
    resolveApprovalCheckpoint(runId, { stepId, approvalId, outcome } = {}) {
      if (!["approved", "denied"].includes(outcome)) {
        throw new Error("approval resolution outcome must be approved or denied");
      }

      const updated = updateRun(runId, (run) => {
        if (run.status !== "pending_approval") {
          throw new Error("run is not pending approval");
        }

        if (run.pendingApproval?.approvalId !== approvalId) {
          throw new Error("approvalId does not match run pending approval checkpoint");
        }

        run.pendingApproval = null;
        run.status = outcome === "approved" ? "running" : "failed";
        run.error = outcome === "denied" ? { code: "approval.denied" } : null;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? {
                ...step,
                status: outcome === "approved" ? "running" : "failed",
                endedAt: outcome === "denied" ? now() : step.endedAt,
                metadata: { ...step.metadata, approvalResolution: outcome },
              }
            : step,
        );
        return run;
      });

      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
          approval_id: approvalId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          approval_outcome: outcome,
          approval_id: approvalId,
        },
      });
      return updated;
    },
    failRun(runId, { stepId, error } = {}) {
      const updated = updateRun(runId, (run) => {
        run.status = "failed";
        run.isResumable = false;
        run.resumeToken = null;
        run.error = error ?? null;
        run.stepRecords = run.stepRecords.map((step) =>
          step.stepId === (stepId ?? run.currentStepId)
            ? { ...step, status: "failed", endedAt: now(), metadata: { ...step.metadata, error } }
            : step,
        );
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.state_changed",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          status: updated.status,
          step_id: stepId ?? updated.currentStepId,
          error: error ?? null,
        },
      });
      return updated;
    },
    linkCase(runId, caseId) {
      const updated = updateRun(runId, (run) => {
        run.caseId = caseId;
        return run;
      });
      emitEvent({
        event_type: "run.lifecycle.case_linked",
        timestamp: now(),
        correlation: {
          run_id: updated.runId,
          workflow_id: updated.workflowId,
          case_id: updated.caseId,
        },
        payload: {
          linked_case_id: caseId,
        },
      });
      return updated;
    },
  };
}

export function launchWorkflowRun({ registry, runStore, workflowId, input = {}, actor = {}, trigger = "manual", caseId = null }) {
  const workflow = registry.get(workflowId);
  if (!workflow) {
    throw new Error(`workflow not registered: ${workflowId}`);
  }

  const run = runStore.createRun({
    workflow,
    input,
    actor,
    trigger,
    caseId,
    policyContext: input.policyContext ?? null,
  });
  return runStore.markRunning(run.runId, { stepId: workflow.steps[0].id, metadata: { launchSource: "launcher" } });
}
