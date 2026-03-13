export const TOP_LEVEL_ROUTES = [
  { id: "home", label: "Home", scope: "core" },
  { id: "launcher", label: "Launcher", scope: "core" },
  { id: "runs", label: "Runs", scope: "core" },
  { id: "approvals", label: "Approvals", scope: "core" },
  { id: "cases-evidence", label: "Cases / Evidence", scope: "core" },
  { id: "files-artifacts", label: "Files / Artifacts", scope: "core" },
  { id: "logs-audit", label: "Logs / Audit", scope: "core" },
  { id: "agents", label: "Agents", scope: "core" },
  { id: "policies", label: "Policies", scope: "core" },
  { id: "models", label: "Models", scope: "core" },
  { id: "connectors", label: "Connectors", scope: "core" },
  { id: "modules", label: "Modules", scope: "core" },
  { id: "settings", label: "Settings", scope: "core" },
  { id: "admin-tenancy", label: "Admin / Tenancy", scope: "core" },
];

const ROUTE_IDS = new Set(TOP_LEVEL_ROUTES.map((route) => route.id));

export function normalizeRoute(hash = "") {
  const routeId = hash.replace(/^#\/?/, "").split("?")[0].trim();
  return ROUTE_IDS.has(routeId) ? routeId : "home";
}

export function getRoute(routeId) {
  return TOP_LEVEL_ROUTES.find((route) => route.id === routeId) ?? TOP_LEVEL_ROUTES[0];
}

export function renderSurfacePlaceholder(route) {
  return `
    <section class="surface-placeholder" data-surface-id="${route.id}">
      <span class="surface-meta">${route.scope}-owned surface</span>
      <h3>${route.label}</h3>
      <p>This route is intentionally scaffolded inside the persistent Corestack shell.</p>
      <ul class="placeholder-list">
        <li>Shared control-plane route is active for ${route.label}.</li>
        <li>Module-specific content remains constrained to future slices.</li>
        <li>No separate product shell or module-owned navigation is introduced.</li>
      </ul>
    </section>
  `;
}

export function renderModuleHook(modules = []) {
  const moduleItems = modules.length
    ? modules
      .map((module) => `<li><strong>${module.name}</strong><span> · ${module.status}</span></li>`)
      .join("")
    : "<li>No modules registered yet.</li>";

  return `
    <ul class="hook-list">
      <li>Module surfaces register content inside the shared shell.</li>
      <li>Security/OSINT remains a module, not a separate desktop.</li>
      ${moduleItems}
    </ul>
  `;
}

function renderRunSummary(run) {
  return `
    <li>
      <strong>${run.workflowName}</strong>
      <span> · ${run.status}</span>
      <span> · ${run.currentStepTitle}</span>
      ${run.caseId ? `<span> · Case ${run.caseId}</span>` : ""}
    </li>
  `;
}

function renderCaseSummary(caseItem) {
  return `
    <li>
      <strong>${caseItem.title}</strong>
      <span> · ${caseItem.status}</span>
      <span> · ${caseItem.runIds.length} linked run(s)</span>
    </li>
  `;
}

function renderHomeSurface(context = {}) {
  const activeRuns = context.activeRuns ?? [];
  const recentRuns = context.recentRuns ?? [];
  const recentCases = context.recentCases ?? [];

  return `
    <section class="surface-grid" data-surface-id="home">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core landing surface</span>
        <h3>Home</h3>
        <p>Resume active investigations and watch for blocked work without leaving the control plane.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Active work</span>
        <h3>Runs in progress</h3>
        ${
          activeRuns.length
            ? `<ul class="placeholder-list">${activeRuns.map(renderRunSummary).join("")}</ul>`
            : `
              <ul class="placeholder-list">
                <li>Security/OSINT alert triage run path will appear here once launched.</li>
                <li>Blocked and resumable work stays visible in this core-owned widget.</li>
              </ul>
            `
        }
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Approvals</span>
        <h3>Pending review queue</h3>
        <ul class="placeholder-list">
          <li>Approval-gated actions will surface here in a later slice.</li>
          <li>Home remains the stable place to return to pending review work.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Recent work</span>
        <h3>Recent cases and runs</h3>
        <div class="stacked-lists">
          ${
            recentCases.length
              ? `<ul class="placeholder-list">${recentCases.map(renderCaseSummary).join("")}</ul>`
              : `
                <ul class="placeholder-list">
                  <li>Recent Security/OSINT work will be linked here after the run contract lands.</li>
                  <li>Core owns the surface while modules contribute context.</li>
                </ul>
              `
          }
          ${
            recentRuns.length
              ? `<ul class="placeholder-list">${recentRuns.map(renderRunSummary).join("")}</ul>`
              : ""
          }
        </div>
      </article>
    </section>
  `;
}


function renderApprovalQueueItem(item, isSelected = false) {
  return `
    <li class="approval-item ${isSelected ? "selected" : ""}">
      <a href="#/approvals?approvalId=${item.approvalId}">
        <strong>${item.summary}</strong>
        <span> · ${item.status}</span>
        ${item.runId ? `<span> · Run ${item.runId}</span>` : ""}
        ${item.caseId ? `<span> · Case ${item.caseId}</span>` : ""}
      </a>
    </li>
  `;
}

function renderApprovalDetail(detail) {
  if (!detail) {
    return `
      <article class="shell-panel">
        <span class="surface-meta">Approval detail</span>
        <h3>Select an approval</h3>
        <p>Choose an item from the queue to inspect policy rationale and governed action context.</p>
      </article>
    `;
  }

  const reasons = detail.policyDecision?.reasons ?? [];
  return `
    <article class="shell-panel">
      <span class="surface-meta">Approval detail</span>
      <h3>${detail.subject.summary}</h3>
      <p>Status: <strong>${detail.status}</strong></p>
      <ul class="placeholder-list">
        <li>Governed action: ${detail.governedAction.type} (${detail.governedAction.id})</li>
        <li>Workflow: ${detail.links.workflowId ?? "n/a"}</li>
        <li>Run: ${detail.links.runId ?? "n/a"}</li>
        <li>Case: ${detail.links.caseId ?? "n/a"}</li>
        <li>Policy decision: ${detail.links.policyDecisionId ?? "n/a"}</li>
      </ul>
      <h4>Policy rationale</h4>
      ${reasons.length ? `<ul class="placeholder-list">${reasons.map((reason) => `<li>${reason.code}: ${reason.message}</li>`).join("")}</ul>` : "<p>No policy reasons provided.</p>"}
      <h4>Conceptual effect</h4>
      <ul class="placeholder-list">
        <li>Approve: run continues beyond the governed checkpoint.</li>
        <li>Deny: run transitions to failed with approval denial context.</li>
      </ul>
      ${detail.status === "pending" ? `
        <div class="action-row">
          <button class="action-button" type="button" data-approval-action="approve" data-approval-id="${detail.approvalId}">Approve</button>
          <button class="action-button secondary" type="button" data-approval-action="deny" data-approval-id="${detail.approvalId}">Deny</button>
        </div>
      ` : ""}
    </article>
  `;
}

function renderApprovalsSurface(context = {}) {
  const queue = context.approvalQueue ?? [];
  const selectedApprovalId = context.selectedApprovalId ?? null;
  const detail = context.approvalDetail ?? null;

  return `
    <section class="surface-grid" data-surface-id="approvals">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core approvals surface</span>
        <h3>Approval queue</h3>
        <p>Review governed actions awaiting explicit human decision.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Queue</span>
        <h3>Pending approvals</h3>
        ${queue.length ? `<ul class="placeholder-list approval-list">${queue.map((item) => renderApprovalQueueItem(item, item.approvalId === selectedApprovalId)).join("")}</ul>` : "<p>No pending approvals.</p>"}
      </article>
      ${renderApprovalDetail(detail)}
    </section>
  `;
}

function renderLauncherSurface(context = {}) {
  const module = context.primaryModule ?? null;
  const launcherEntry = module?.controlPlane?.launcherEntries?.[0] ?? null;
  const startPath = context.startPathLabel ?? launcherEntry?.label ?? "Alert triage and investigation";
  const attachTarget = context.attachableCase;
  const moduleName = module?.name ?? "Security / OSINT Module 1";
  const workflowId = launcherEntry?.workflowId ?? "security-osint.alert-triage";
  const startRoute = launcherEntry?.route ?? "#/launcher?start=security-osint-alert-triage";

  return `
    <section class="surface-grid" data-surface-id="launcher">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned launcher</span>
        <h3>Launcher</h3>
        <p>Start module workflows and return to recent launch paths from one shared shell.</p>
      </article>
      <article class="shell-panel module-card">
        <span class="surface-meta">Module</span>
        <h3>${moduleName}</h3>
        <p>The first domain module contributes workflow start paths without owning a separate desktop.</p>
        <div class="action-row">
          <a class="action-link" href="${startRoute}">Open workflow start path</a>
          <button class="action-button" type="button" data-start-workflow="${workflowId}" data-case-mode="new">${startPath}</button>
          ${
            attachTarget
              ? `<button class="action-button secondary" type="button" data-start-workflow="${workflowId}" data-case-mode="attach" data-case-id="${attachTarget.caseId}">Attach run to ${attachTarget.title}</button>`
              : `<span class="action-note">Create a case first to unlock attach-to-case launching.</span>`
          }
        </div>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Workflow entry point</span>
        <h3>Alert triage and investigation</h3>
        <ul class="placeholder-list">
          <li>Trigger type: alert or manual intake.</li>
          <li>Launch creates a persisted run on the shared core contract.</li>
          <li>Cases and evidence stay linked to core contracts.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Recent launch paths</span>
        <h3>Saved context</h3>
        <ul class="placeholder-list">
          <li>Recent and saved module-aware launch paths will live here.</li>
          <li>The launcher stays module-aware without becoming an app catalog.</li>
        </ul>
      </article>
    </section>
  `;
}

export function renderRouteContent(route, context = {}) {
  if (route.id === "home") {
    return renderHomeSurface(context);
  }

  if (route.id === "launcher") {
    return renderLauncherSurface(context);
  }

  if (route.id === "approvals") {
    return renderApprovalsSurface(context);
  }

  if (route.id === "modules") {
    const modules = context.modules ?? [];
    return `
      <section class="surface-grid" data-surface-id="modules">
        <article class="shell-panel feature-panel">
          <span class="surface-meta">Core-owned module registry visibility</span>
          <h3>Modules</h3>
          <p>Registered domain capabilities are visible here without introducing marketplace behavior.</p>
        </article>
        <article class="shell-panel">
          <span class="surface-meta">Registered modules</span>
          <h3>Available capabilities</h3>
          ${modules.length
            ? `<ul class="placeholder-list">${modules.map((module) => `<li><strong>${module.name}</strong><span> · ${module.status}</span><span> · ${module.capabilities.length} capability(ies)</span></li>`).join("")}</ul>`
            : "<p>No modules registered.</p>"}
        </article>
      </section>
    `;
  }

  return renderSurfacePlaceholder(route);
}
