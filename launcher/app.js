import {
  TOP_LEVEL_ROUTES,
  getRoute,
  normalizeRoute,
  renderModuleHook,
  renderRouteContent,
} from "./corestack-shell.mjs";
import {
  createCaseStore,
} from "./corestack-cases.mjs";
import {
  buildRunPolicyReference,
  createPolicyDecision,
} from "./corestack-policy.mjs";
import {
  createBrowserStorage,
  createRunStore,
  createWorkflowRegistry,
  launchWorkflowRun,
} from "./corestack-runtime.mjs";
import {
  createApprovalStore,
} from "./corestack-approvals.mjs";
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

function getSelectedApprovalIdFromHash() {
  const hash = window.location.hash ?? "";
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) {
    return null;
  }

  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  return params.get("approvalId");
}

function renderNav(activeRouteId) {
  navRoot.innerHTML = TOP_LEVEL_ROUTES.map((route, index) => `
    <a
      class="nav-link ${route.id === activeRouteId ? "active" : ""}"
      href="#/${route.id}"
      data-route-link="${route.id}"
    >
      <span>${route.label}</span>
      <span class="nav-index">${String(index + 1).padStart(2, "0")}</span>
    </a>
  `).join("");
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
    const workflow = workflowRegistry.get(workflowId);
    const existingCase = requestedCaseId ? caseStore.getCase(requestedCaseId) : null;
    const actor = { actorId: "local-operator", actorType: "user" };

    const run = launchWorkflowRun({
      registry: workflowRegistry,
      runStore,
      workflowId,
      actor,
      input: {
        source: "launcher",
        ...buildRunPolicyReference({
          workflow,
          actor,
          caseRecord: existingCase,
        }),
      },
    });

    let linkedCaseId = null;
    if (caseMode === "attach" && requestedCaseId) {
      caseStore.attachRun(requestedCaseId, run);
      runStore.linkCase(run.runId, requestedCaseId);
      linkedCaseId = requestedCaseId;
    } else {
      const linkedCase = caseStore.createCaseFromRun({
        run,
        title: "Security / OSINT alert triage",
        owner: { actorId: "local-operator", actorType: "user" },
      });
      runStore.linkCase(run.runId, linkedCase.caseId);
      linkedCaseId = linkedCase.caseId;
    }

    const policyDecision = createPolicyDecision({
      decisionId: `policy-${run.runId}`,
      requestId: `request-${run.runId}`,
      outcome: "require_approval",
      reasons: [
        { code: "HUMAN_REVIEW_REQUIRED", message: "Analyst checkpoint requires explicit approval before continuation." },
      ],
      approval: {
        required: true,
        subject_ref: `run:${run.runId}:review`,
        approver_role: "analyst",
      },
      audit: {
        correlation_id: run.policyContext?.correlation_id ?? `${workflow.id}:${run.runId}`,
      },
    });

    runStore.appendPolicyDecision(run.runId, policyDecision);

    const approval = approvalStore.createApproval({
      governedAction: {
        type: "workflow_step",
        id: `${run.runId}:review`,
        summary: "Proceed from analyst review checkpoint",
        correlationId: policyDecision.audit.correlation_id,
      },
      links: {
        runId: run.runId,
        workflowId: workflow.id,
        caseId: linkedCaseId,
        policyDecisionId: policyDecision.decision_id,
      },
      policyDecision,
      subject: {
        summary: "Alert triage review checkpoint",
        targetType: "workflow_step",
        targetId: "review",
      },
      reasonContext: {
        rationale: "Require analyst confirmation before advancing governed action.",
      },
      requestedBy: actor,
    });

    runStore.markPendingApproval(run.runId, {
      stepId: "review",
      approvalId: approval.approvalId,
      reason: "policy.require_approval",
    });

    window.location.hash = `#/approvals?approvalId=${approval.approvalId}`;
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
  const approval = approvalStore.getApproval(approvalId);
  if (!approval) {
    return;
  }

  if (action === "approve") {
    approvalStore.approveApproval(approvalId, { actor, rationale: "Approved in MVP queue" });
    runStore.resolveApprovalCheckpoint(approval.links.runId, {
      stepId: "review",
      approvalId,
      outcome: "approved",
    });
  }

  if (action === "deny") {
    approvalStore.denyApproval(approvalId, { actor, rationale: "Denied in MVP queue" });
    runStore.resolveApprovalCheckpoint(approval.links.runId, {
      stepId: "review",
      approvalId,
      outcome: "denied",
    });
  }

  window.location.hash = "#/approvals";
  renderRoute();
});

window.addEventListener("hashchange", renderRoute);
renderRoute();
