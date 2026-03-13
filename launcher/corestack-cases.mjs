function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function createCaseStore({
  storage,
  key = "corestack.cases.v1",
  now = () => new Date().toISOString(),
  createId = () => crypto.randomUUID(),
} = {}) {
  if (!storage) {
    throw new Error("case store requires storage");
  }

  function readCases() {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  }

  function writeCases(cases) {
    storage.setItem(key, JSON.stringify(cases));
  }

  function updateCase(caseId, updater) {
    const cases = readCases();
    const index = cases.findIndex((item) => item.caseId === caseId);
    if (index === -1) {
      throw new Error(`case not found: ${caseId}`);
    }

    const updatedCase = updater(clone(cases[index]));
    updatedCase.updatedAt = now();
    cases[index] = updatedCase;
    writeCases(cases);
    return clone(updatedCase);
  }

  return {
    listCases() {
      return readCases().map(clone);
    },
    getCase(caseId) {
      const item = readCases().find((entry) => entry.caseId === caseId);
      return item ? clone(item) : null;
    },
    createCaseFromRun({
      run,
      title = run.workflowName,
      owner = { actorId: "unassigned", actorType: "queue" },
      status = "open",
    }) {
      const timestamp = now();
      const newCase = {
        caseId: createId(),
        moduleId: run.moduleId,
        title,
        status,
        owner,
        policyContext: run.policyContext,
        policyRefs: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        runIds: [run.runId],
        latestRunId: run.runId,
        timeline: [
          {
            eventId: `${run.runId}:case-created`,
            type: "case.created",
            createdAt: timestamp,
            runId: run.runId,
            summary: "Case created from workflow run",
          },
        ],
      };

      const cases = readCases();
      cases.unshift(newCase);
      writeCases(cases);
      return clone(newCase);
    },
    attachRun(caseId, run, summary = "Run attached to case") {
      return updateCase(caseId, (existingCase) => {
        if (!existingCase.runIds.includes(run.runId)) {
          existingCase.runIds.push(run.runId);
        }
        existingCase.latestRunId = run.runId;
        existingCase.policyContext = existingCase.policyContext ?? run.policyContext ?? null;
        existingCase.timeline.push({
          eventId: `${run.runId}:attached`,
          type: "run.attached",
          createdAt: now(),
          runId: run.runId,
          summary,
        });
        return existingCase;
      });
    },
    updateCaseStatus(caseId, status) {
      return updateCase(caseId, (existingCase) => {
        existingCase.status = status;
        existingCase.timeline.push({
          eventId: `${caseId}:status:${status}`,
          type: "case.status.updated",
          createdAt: now(),
          runId: existingCase.latestRunId,
          summary: `Case status set to ${status}`,
        });
        return existingCase;
      });
    },
  };
}
