export const RUN_STATES = ["created", "running", "blocked", "failed", "completed"];

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
      return clone(run);
    },
    markRunning(runId, { stepId, metadata = {} } = {}) {
      return updateRun(runId, (run) => {
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
    },
    blockRun(runId, { stepId, reason, resumeToken } = {}) {
      return updateRun(runId, (run) => {
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
    },
    resumeRun(runId, { stepId, resumeToken } = {}) {
      return updateRun(runId, (run) => {
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
    },
    completeRun(runId, { stepId, output = {} } = {}) {
      return updateRun(runId, (run) => {
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
    },
    failRun(runId, { stepId, error } = {}) {
      return updateRun(runId, (run) => {
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
    },
    linkCase(runId, caseId) {
      return updateRun(runId, (run) => {
        run.caseId = caseId;
        return run;
      });
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
