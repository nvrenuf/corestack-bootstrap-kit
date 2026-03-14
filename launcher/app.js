import {
  getRoute,
  normalizeRoute,
  renderModuleHook,
  renderPrimaryNav,
  renderRouteContent,
} from "./corestack-shell.mjs";
import {
  createCaseStore,
} from "./corestack-cases.mjs";
import {
  createBrowserStorage,
  createRunStore,
  createWorkflowRegistry,
} from "./corestack-runtime.mjs";
import {
  createApprovalStore,
} from "./corestack-approvals.mjs";
import {
  createEvidenceStore,
} from "./corestack-evidence.mjs";
import {
  createModelExecutionHooks,
} from "./corestack-model-execution.mjs";
import {
  createModelRegistry,
  createModelRouter,
} from "./corestack-model-routing.mjs";
import {
  createAlertTriageWorkflowService,
} from "./corestack-security-osint-alert-triage.mjs";
import {
  createAuditEventStore,
} from "./corestack-audit.mjs";
import {
  createModuleRegistry,
  createSecurityOsintModule1Definition,
} from "./corestack-modules.mjs";

const navRoot = document.querySelector("[data-primary-nav]");
const contentRoot = document.querySelector("[data-route-content]");
const titleRoot = document.querySelector("[data-route-title]");
const moduleHookRoot = document.querySelector("[data-module-nav-hook]");

const moduleRegistry = createModuleRegistry([
  createSecurityOsintModule1Definition(),
]);

const workflowRegistry = createWorkflowRegistry([
  {
    id: "security-osint.alert-triage",
    moduleId: "security-osint-module-1",
    name: "Alert triage and investigation",
    version: "0.1.0",
    steps: [
      { id: "intake", title: "Intake and normalize alert", kind: "ingest" },
      { id: "review", title: "Analyst review checkpoint", kind: "review" },
    ],
  },
]);

const storage = createBrowserStorage();
const auditStore = createAuditEventStore({ storage });
const runStore = createRunStore({
  storage,
  emitEvent: ({ event_type, timestamp, correlation, payload }) =>
    auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
});
const caseStore = createCaseStore({ storage });
const approvalStore = createApprovalStore({
  storage,
  emitEvent: ({ event_type, timestamp, correlation, payload }) =>
    auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
});
const evidenceStore = createEvidenceStore({
  storage,
  runStore,
  caseStore,
  emitEvent: ({ event_type, timestamp, correlation, payload }) =>
    auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
});

const modelRegistry = createModelRegistry([
  {
    id: "local.mistral-small",
    kind: "llm",
    providerType: "local",
    localFirst: true,
    status: { available: true },
    trustTags: ["self_hosted", "no_egress"],
    capabilities: ["summarize", "extract.entities"],
  },
]);
const modelRouter = createModelRouter({ registry: modelRegistry });
const modelExecutionHooks = createModelExecutionHooks({
  emitEvent: ({ event_type, timestamp, correlation, payload }) =>
    auditStore.recordEvent({ eventType: event_type, timestamp, correlation, payload }),
});

const alertTriageWorkflowService = createAlertTriageWorkflowService({
  workflowRegistry,
  runStore,
  caseStore,
  approvalStore,
  evidenceStore,
  modelRouter,
  modelExecutionHooks,
  auditStore,
});

function getSelectedApprovalIdFromHash() {
  const hash = window.location.hash ?? "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get("approvalId");
}

function getSelectedEntityIdFromHash(param) {
  const hash = window.location.hash ?? "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get(param);
}

function renderNav(activeRouteId) {
  navRoot.innerHTML = renderPrimaryNav(activeRouteId);
}

function getRouteContext(routeId) {
  const runs = runStore.listRuns();
  const cases = caseStore.listCases();
  const modules = moduleRegistry.list();
  const primaryModule = modules[0] ?? null;

  if (routeId === "home") {
    return {
      activeRuns: runs.filter((run) => run.status === "running" || run.status === "blocked" || run.status === "pending_approval").slice(0, 3),
      recentRuns: runs.slice(0, 3),
      recentCases: cases.slice(0, 3),
    };
  }

  if (routeId === "launcher") {
    return {
      startPathLabel: primaryModule?.controlPlane?.launcherEntries?.[0]?.label ?? "Launch alert triage run",
      attachableCase: cases[0] ?? null,
      primaryModule,
    };
  }


  if (routeId === "agents") {
    return {};
  }

  if (routeId === "policies") {
    return {
      policyDecisionCount: runs.reduce((total, run) => total + (run.policyDecisions?.length ?? 0), 0),
      pendingApprovals: approvalStore.listPending().length,
    };
  }

  if (routeId === "models") {
    return {
      models: modelRegistry.list(),
      recentModelEvents: auditStore.listEvents().filter((event) =>
        event.event_type === "model.route.selected" || event.event_type === "model.execution.completed" || event.event_type === "model.execution.restricted").slice(0, 8),
    };
  }

  if (routeId === "connectors" || routeId === "settings" || routeId === "admin-tenancy") {
    return {};
  }

  if (routeId === "modules") {
    return {
      modules,
    };
  }

  if (routeId === "approvals") {
    const queue = approvalStore.projectQueueItems();
    const selectedApprovalId = getSelectedApprovalIdFromHash() ?? queue[0]?.approvalId ?? null;
    return {
      approvalQueue: queue,
      selectedApprovalId,
      approvalDetail: selectedApprovalId ? approvalStore.projectApprovalDetail(selectedApprovalId) : null,
    };
  }

  if (routeId === "runs") {
    const evidenceItems = evidenceStore.listEvidenceItems();
    const artifacts = evidenceStore.listArtifacts();
    const findings = evidenceStore.listFindings();
    const approvals = approvalStore.listApprovals();
    const selectedRunId = getSelectedEntityIdFromHash("runId") ?? runs[0]?.runId ?? null;
    const selectedRun = selectedRunId ? runStore.getRun(selectedRunId) : null;

    return {
      runs,
      selectedRunId,
      selectedRun,
      selectedRunApprovals: selectedRunId
        ? approvals.filter((approval) => approval.links.runId === selectedRunId)
        : [],
      selectedRunEvidence: selectedRunId
        ? evidenceItems.filter((item) => item.runId === selectedRunId)
        : [],
      selectedRunArtifacts: selectedRunId
        ? artifacts.filter((item) => item.runId === selectedRunId)
        : [],
      selectedRunFindings: selectedRunId
        ? findings.filter((item) => item.runId === selectedRunId)
        : [],
      selectedRunAuditEvents: selectedRunId
        ? auditStore.listEvents({ runId: selectedRunId }).slice(0, 5)
        : [],
    };
  }

  if (routeId === "cases-evidence") {
    const evidenceItems = evidenceStore.listEvidenceItems();
    const artifacts = evidenceStore.listArtifacts();
    const findings = evidenceStore.listFindings();
    const approvals = approvalStore.listApprovals();
    const selectedCaseId = getSelectedEntityIdFromHash("caseId") ?? cases[0]?.caseId ?? null;
    const selectedCase = selectedCaseId ? caseStore.getCase(selectedCaseId) : null;
    const linkedRuns = selectedCase
      ? selectedCase.runIds
          .map((runId) => runStore.getRun(runId))
          .filter(Boolean)
      : [];

    return {
      cases,
      selectedCaseId,
      selectedCase,
      linkedRuns,
      selectedCaseApprovals: selectedCaseId
        ? approvals.filter((approval) => approval.links.caseId === selectedCaseId)
        : [],
      selectedCaseEvidence: selectedCaseId
        ? evidenceItems.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseArtifacts: selectedCaseId
        ? artifacts.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseFindings: selectedCaseId
        ? findings.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseAuditEvents: selectedCaseId
        ? auditStore.listEvents({ caseId: selectedCaseId }).slice(0, 5)
        : [],
    };
  }

  if (routeId === "investigation-workspace") {
    const evidenceItems = evidenceStore.listEvidenceItems();
    const artifacts = evidenceStore.listArtifacts();
    const findings = evidenceStore.listFindings();
    const approvals = approvalStore.listApprovals();
    const selectedCaseId = getSelectedEntityIdFromHash("caseId") ?? cases[0]?.caseId ?? null;
    const selectedCase = selectedCaseId ? caseStore.getCase(selectedCaseId) : null;
    const linkedRuns = selectedCase
      ? selectedCase.runIds
          .map((runId) => runStore.getRun(runId))
          .filter(Boolean)
      : [];
    const primaryRun = linkedRuns[0] ?? null;

    return {
      cases,
      selectedCaseId,
      selectedCase,
      linkedRuns,
      primaryRun,
      selectedCaseApprovals: selectedCaseId
        ? approvals.filter((approval) => approval.links.caseId === selectedCaseId)
        : [],
      selectedCaseEvidence: selectedCaseId
        ? evidenceItems.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseArtifacts: selectedCaseId
        ? artifacts.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseFindings: selectedCaseId
        ? findings.filter((item) => item.caseId === selectedCaseId)
        : [],
      selectedCaseAuditEvents: selectedCaseId
        ? auditStore.listEvents({ caseId: selectedCaseId }).slice(0, 5)
        : [],
    };
  }

  if (routeId === "logs-audit") {
    const selectedRunId = getSelectedEntityIdFromHash("runId");
    const selectedCaseId = getSelectedEntityIdFromHash("caseId");
    const selectedArtifactId = getSelectedEntityIdFromHash("artifactId");
    const selectedEvidenceId = getSelectedEntityIdFromHash("evidenceId");
    const selectedFindingId = getSelectedEntityIdFromHash("findingId");
    const selectedFilters = [
      selectedRunId ? { label: "Run", value: selectedRunId } : null,
      selectedCaseId ? { label: "Case", value: selectedCaseId } : null,
      selectedArtifactId ? { label: "Artifact", value: selectedArtifactId } : null,
      selectedEvidenceId ? { label: "Evidence", value: selectedEvidenceId } : null,
      selectedFindingId ? { label: "Finding", value: selectedFindingId } : null,
    ].filter(Boolean);

    return {
      selectedFilters,
      auditEvents: auditStore.listEvents({
        runId: selectedRunId,
        caseId: selectedCaseId,
        artifactId: selectedArtifactId,
        evidenceId: selectedEvidenceId,
        findingId: selectedFindingId,
      }).slice(0, 15),
    };
  }

  if (routeId === "files-artifacts") {
    const evidenceItems = evidenceStore.listEvidenceItems();
    const artifacts = evidenceStore.listArtifacts();
    const findings = evidenceStore.listFindings();
    const selectedArtifactId = getSelectedEntityIdFromHash("artifactId") ?? artifacts[0]?.artifactId ?? null;
    const selectedEvidenceId = getSelectedEntityIdFromHash("evidenceId") ?? evidenceItems[0]?.evidenceId ?? null;
    const selectedFindingId = getSelectedEntityIdFromHash("findingId") ?? findings[0]?.findingId ?? null;
    const selectedArtifact = selectedArtifactId
      ? artifacts.find((artifact) => artifact.artifactId === selectedArtifactId) ?? null
      : null;
    const selectedEvidence = selectedEvidenceId
      ? evidenceItems.find((item) => item.evidenceId === selectedEvidenceId) ?? null
      : null;
    const selectedFinding = selectedFindingId
      ? findings.find((finding) => finding.findingId === selectedFindingId) ?? null
      : null;

    return {
      artifacts,
      evidenceItems,
      findings,
      selectedArtifactId,
      selectedEvidenceId,
      selectedFindingId,
      selectedArtifact,
      selectedEvidence,
      selectedFinding,
      selectedArtifactAuditEvents: selectedArtifactId
        ? auditStore.listEvents({ artifactId: selectedArtifactId }).slice(0, 5)
        : [],
      selectedEvidenceAuditEvents: selectedEvidenceId
        ? auditStore.listEvents({ evidenceId: selectedEvidenceId }).slice(0, 5)
        : [],
      selectedFindingAuditEvents: selectedFindingId
        ? auditStore.listEvents({ findingId: selectedFindingId }).slice(0, 5)
        : [],
    };
  }

  return {};
}

function renderRoute() {
  const routeId = normalizeRoute(window.location.hash);
  const route = getRoute(routeId);
  titleRoot.textContent = route.label;
  renderNav(route.id);
  moduleHookRoot.innerHTML = renderModuleHook(moduleRegistry.list());
  contentRoot.innerHTML = renderRouteContent(route, getRouteContext(route.id));
}

contentRoot.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-start-workflow]");
  if (trigger) {
    const workflowId = trigger.getAttribute("data-start-workflow");
    const caseMode = trigger.getAttribute("data-case-mode") ?? "new";
    const requestedCaseId = trigger.getAttribute("data-case-id");
    const actor = { actorId: "local-operator", actorType: "user" };

    const result = alertTriageWorkflowService.startAlertTriage({
      workflowId,
      actor,
      caseMode,
      requestedCaseId: caseMode === "attach" ? requestedCaseId : null,
      input: {
        alert: {
          alertId: `alert-${Date.now()}`,
          title: "Unusual login behavior",
          severity: "medium",
          source: "launcher-demo",
          description: "Launcher-started alert triage run",
        },
      },
    });

    if (result.status === "pending_approval") {
      window.location.hash = `#/approvals?approvalId=${result.approval.approvalId}`;
    } else {
      window.location.hash = "#/home";
    }
    renderRoute();
    return;
  }

  const approvalAction = event.target.closest("[data-approval-action]");
  if (!approvalAction) {
    return;
  }

  const action = approvalAction.getAttribute("data-approval-action");
  const approvalId = approvalAction.getAttribute("data-approval-id");
  const actor = { actorId: "local-reviewer", actorType: "user" };
  if (action === "approve") {
    alertTriageWorkflowService.resolveAlertTriageApproval({ approvalId, action: "approve", actor });
  }

  if (action === "deny") {
    alertTriageWorkflowService.resolveAlertTriageApproval({ approvalId, action: "deny", actor });
  }

  window.location.hash = "#/approvals";
  renderRoute();
});

window.addEventListener("hashchange", renderRoute);
renderRoute();
