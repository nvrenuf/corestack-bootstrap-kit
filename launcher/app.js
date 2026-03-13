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
} from "./corestack-policy.mjs";
import {
  createBrowserStorage,
  createRunStore,
  createWorkflowRegistry,
  launchWorkflowRun,
} from "./corestack-runtime.mjs";

const navRoot = document.querySelector("[data-primary-nav]");
const contentRoot = document.querySelector("[data-route-content]");
const titleRoot = document.querySelector("[data-route-title]");
const moduleHookRoot = document.querySelector("[data-module-nav-hook]");

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
const runStore = createRunStore({ storage });
const caseStore = createCaseStore({ storage });

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

  if (routeId === "home") {
    return {
      activeRuns: runs.filter((run) => run.status === "running" || run.status === "blocked").slice(0, 3),
      recentRuns: runs.slice(0, 3),
      recentCases: cases.slice(0, 3),
    };
  }

  if (routeId === "launcher") {
    return {
      startPathLabel: "Launch alert triage run",
      attachableCase: cases[0] ?? null,
    };
  }

  return {};
}

function renderRoute() {
  const routeId = normalizeRoute(window.location.hash);
  const route = getRoute(routeId);
  titleRoot.textContent = route.label;
  renderNav(route.id);
  moduleHookRoot.innerHTML = renderModuleHook();
  contentRoot.innerHTML = renderRouteContent(route, getRouteContext(route.id));
}

contentRoot.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-start-workflow]");
  if (!trigger) {
    return;
  }

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

  if (caseMode === "attach" && requestedCaseId) {
    caseStore.attachRun(requestedCaseId, run);
    runStore.linkCase(run.runId, requestedCaseId);
  } else {
    const linkedCase = caseStore.createCaseFromRun({
      run,
      title: "Security / OSINT alert triage",
      owner: { actorId: "local-operator", actorType: "user" },
    });
    runStore.linkCase(run.runId, linkedCase.caseId);
  }

  window.location.hash = "#/home";
  renderRoute();
});

window.addEventListener("hashchange", renderRoute);
renderRoute();
