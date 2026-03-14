export const TOP_LEVEL_ROUTES = [
  { id: "home", label: "Home", scope: "core" },
  { id: "launcher", label: "Launcher", scope: "core" },
  { id: "runs", label: "Runs", scope: "core" },
  { id: "approvals", label: "Approvals", scope: "core" },
  { id: "cases-evidence", label: "Cases / Evidence", scope: "core" },
  { id: "investigation-workspace", label: "Investigation Workspace", scope: "core" },
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

export function renderPrimaryNav(activeRouteId) {
  return TOP_LEVEL_ROUTES.map((route) => `
    <a
      class="nav-link ${route.id === activeRouteId ? "active" : ""}"
      href="#/${route.id}"
      data-route-link="${route.id}"
    >
      <span>${route.label}</span>
    </a>
  `).join("");
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

function renderCapabilityStatus({
  ownership,
  implemented = [],
  planned = [],
  moduleNotes = [],
}) {
  return `
    <article class="shell-panel">
      <span class="surface-meta">Surface ownership</span>
      <h3>${ownership}</h3>
      <h4>Implemented now</h4>
      <ul class="placeholder-list">
        ${implemented.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <h4>Planned / deferred</h4>
      <ul class="placeholder-list">
        ${planned.map((item) => `<li>${item}</li>`).join("")}
      </ul>
      <h4>Module relationship</h4>
      <ul class="placeholder-list">
        ${moduleNotes.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </article>
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

function renderModulesSurface(context = {}) {
  const modules = context.modules ?? [];
  const surfaceRelationships = context.surfaceRelationships ?? [];
  const moduleWorkflowLinks = context.moduleWorkflowLinks ?? [];
  const module1Capability = context.module1Capability ?? null;
  const statusFraming = context.statusFraming ?? {
    implementedNow: [],
    partiallyImplemented: [],
    plannedDeferred: [],
  };

  return `
    <section class="surface-grid" data-surface-id="modules">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned module architecture workspace</span>
        <h3>Modules</h3>
        <p>Operator-facing view of domain capability packages registered in Corestack, their current contribution path, and what remains intentionally deferred.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">What a module means here</span>
        <h3>Module model in the current MVP</h3>
        <ul class="placeholder-list">
          <li>A module is a domain capability package that contributes workflows, data relationships, and extension behavior into the shared control plane.</li>
          <li>A nav item is not a module; Modules is a core-owned architecture and posture surface.</li>
          <li>This page is read-oriented and intentionally avoids fake install/update or marketplace controls.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Implemented now</span>
        <h3>Registered module inventory</h3>
        ${modules.length
          ? `<ul class="placeholder-list">${modules.map((module) => `<li><strong>${module.name}</strong><span> · ${module.id}</span><span> · ${module.status}</span><span> · ${module.capabilities?.length ?? 0} capability(ies)</span></li>`).join("")}</ul>`
          : "<p>No modules are currently registered in this environment.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Core surface participation</span>
        <h3>How modules relate to core-owned surfaces</h3>
        ${surfaceRelationships.length
          ? `<ul class="placeholder-list">${surfaceRelationships.map((item) => `<li><strong>${item.surface}</strong><span> · ${item.state}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No module-to-surface relationships are currently mapped.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Module 1 capability map</span>
        <h3>Security / OSINT Module 1 contribution</h3>
        ${module1Capability
          ? `<ul class="placeholder-list">
              <li><strong>Workflow:</strong> ${module1Capability.workflowName} (${module1Capability.workflowId})</li>
              <li><strong>Runs observed:</strong> ${module1Capability.runCount}</li>
              <li><strong>Linked cases:</strong> ${module1Capability.caseCount}</li>
              <li><strong>Evidence objects:</strong> ${module1Capability.evidenceCount} evidence, ${module1Capability.artifactCount} artifacts, ${module1Capability.findingCount} findings</li>
              <li><strong>Governance/audit signals:</strong> ${module1Capability.approvalCount} approvals, ${module1Capability.auditEventCount} correlated events</li>
            </ul>`
          : "<p>Security / OSINT Module 1 has not produced runtime data yet; registration and workflow linkage remain visible.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Workflow linkage</span>
        <h3>Registered workflow contribution</h3>
        ${moduleWorkflowLinks.length
          ? `<ul class="placeholder-list">${moduleWorkflowLinks.map((item) => `<li><strong>${item.workflowName}</strong><span> · ${item.workflowId}</span><span> · module ${item.moduleId}</span></li>`).join("")}</ul>`
          : "<p>No module workflow links are currently registered.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Scope framing</span>
        <h3>Implemented vs partial vs planned/deferred</h3>
        <h4>Implemented now</h4>
        <ul class="placeholder-list">
          ${statusFraming.implementedNow.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <h4>Partially implemented</h4>
        <ul class="placeholder-list">
          ${statusFraming.partiallyImplemented.map((item) => `<li>${item}</li>`).join("")}
        </ul>
        <h4>Planned / deferred</h4>
        <ul class="placeholder-list">
          ${statusFraming.plannedDeferred.map((item) => `<li>${item}</li>`).join("")}
        </ul>
      </article>
    </section>
  `;
}

function renderRunSummary(run) {
  return `
    <li>
      <strong>${run.workflowName}</strong>
      <span> · ${renderToneBadge(run.status)}</span>
      <span> · ${run.currentStepTitle}</span>
      ${run.caseId ? `<span> · Case ${run.caseId}</span>` : ""}
    </li>
  `;
}

function renderCaseSummary(caseItem) {
  return `
    <li>
      <strong>${caseItem.title}</strong>
      <span> · ${renderToneBadge(caseItem.status)}</span>
      <span> · ${caseItem.runIds.length} linked run(s)</span>
    </li>
  `;
}

function renderToneBadge(rawValue = "") {
  const value = String(rawValue);
  const normalized = value.toLowerCase();
  if (["critical", "high", "failed", "error", "denied", "blocked"].includes(normalized)) {
    return `<span class="tone-badge tone-danger">${value}</span>`;
  }
  if (["approved", "healthy", "success", "completed", "low", "ok"].includes(normalized)) {
    return `<span class="tone-badge tone-success">${value}</span>`;
  }
  if (["medium", "pending", "review", "open", "in_review"].includes(normalized)) {
    return `<span class="tone-badge tone-warning">${value}</span>`;
  }
  return `<span class="tone-badge tone-neutral">${value}</span>`;
}

function renderPlatformUtilitiesPanel() {
  const platformUtilities = [
    { id: "n8n", label: "n8n", href: "http://localhost:5678/home/workflows" },
    { id: "ollama", label: "Ollama API", href: "http://localhost:8080" },
    { id: "db-admin", label: "DB Admin / Adminer", href: "http://localhost:8081/" },
  ];

  return `
    <article class="shell-panel">
      <span class="surface-meta">Operator convenience</span>
      <h3>Platform utilities</h3>
      <p>Quick links to existing platform utilities. These shortcuts are secondary to core workflow and case surfaces.</p>
      <ul class="placeholder-list">
        ${platformUtilities.map((utility) => `<li><a href="${utility.href}" target="_blank" rel="noopener noreferrer">${utility.label}</a></li>`).join("")}
      </ul>
    </article>
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
      ${renderPlatformUtilitiesPanel()}
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
      ${renderPlatformUtilitiesPanel()}
    </section>
  `;
}

function renderRunReviewSurface(context = {}) {
  const runs = context.runs ?? [];
  const selectedRunId = context.selectedRunId ?? null;
  const selectedRun = context.selectedRun ?? null;
  const approvals = context.selectedRunApprovals ?? [];
  const evidenceItems = context.selectedRunEvidence ?? [];
  const artifacts = context.selectedRunArtifacts ?? [];
  const findings = context.selectedRunFindings ?? [];
  const auditEvents = context.selectedRunAuditEvents ?? [];

  const runList = runs.length
    ? `<ul class="placeholder-list">${runs.map((run) => `
      <li>
        <a href="#/runs?runId=${run.runId}">${run.workflowName}</a>
        <span> · ${run.status}</span>
      </li>
    `).join("")}</ul>`
    : "<p>No runs recorded yet.</p>";

  const detail = selectedRun
    ? `
      <ul class="placeholder-list">
        <li><strong>Run ID:</strong> ${selectedRun.runId}</li>
        <li><strong>Status:</strong> ${selectedRun.status}</li>
        <li><strong>Workflow:</strong> ${selectedRun.workflowName} (${selectedRun.workflowId})</li>
        <li><strong>Module:</strong> ${selectedRun.moduleId}</li>
        <li><strong>Case linkage:</strong> ${selectedRun.caseId ?? "Not linked"}</li>
      </ul>
      <h4>Policy and approvals</h4>
      <ul class="placeholder-list">
        <li>Policy decisions on run: ${selectedRun.policyDecisions?.length ?? 0}</li>
        <li>Pending approval checkpoint: ${selectedRun.pendingApproval?.approvalId ?? "none"}</li>
        <li>Linked approvals: ${approvals.length}</li>
      </ul>
      <h4>Evidence footprint</h4>
      <ul class="placeholder-list">
        <li>Evidence items: ${evidenceItems.length}</li>
        <li>Artifacts: ${artifacts.length}</li>
        <li>Findings: ${findings.length}</li>
      </ul>
      <h4>Recent audit events</h4>
      ${auditEvents.length
        ? `<ul class="placeholder-list">${auditEvents.map((event) => `<li>${event.event_type} · ${event.timestamp}</li>`).join("")}</ul>`
        : "<p>No audit events found for this run.</p>"}
    `
    : "<p>Select a run to view details.</p>";

  return `
    <section class="surface-grid" data-surface-id="runs">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core review surface</span>
        <h3>Run detail</h3>
        <p>Thin run-level review of workflow execution, linkage, policy gates, and generated objects.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Run selector</span>
        <h3>Recent runs</h3>
        ${runList}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Run detail</span>
        <h3>${selectedRunId ?? "No run selected"}</h3>
        ${detail}
      </article>
    </section>
  `;
}

function renderInvestigationWorkspaceSurface(context = {}) {
  const cases = context.cases ?? [];
  const selectedCaseId = context.selectedCaseId ?? null;
  const selectedCase = context.selectedCase ?? null;
  const linkedRuns = context.linkedRuns ?? [];
  const primaryRun = context.primaryRun ?? null;
  const approvals = context.selectedCaseApprovals ?? [];
  const evidenceItems = context.selectedCaseEvidence ?? [];
  const artifacts = context.selectedCaseArtifacts ?? [];
  const findings = context.selectedCaseFindings ?? [];
  const auditEvents = context.selectedCaseAuditEvents ?? [];
  const openFindings = findings.filter((item) => item.lifecycleState !== "resolved" && item.lifecycleState !== "dismissed").length;
  const pendingApprovals = approvals.filter((item) => item.status === "pending").length;

  return `
    <section class="surface-grid" data-surface-id="investigation-workspace">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Unified operator view</span>
        <h3>Investigation workspace</h3>
        <p>Review one investigation in a single core-owned surface using existing case/run/evidence/audit/approval contracts.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Investigation selector</span>
        <h3>Cases</h3>
        ${cases.length
          ? `<ul class="placeholder-list">${cases.map((caseItem) => `<li><a href="#/investigation-workspace?caseId=${caseItem.caseId}">${caseItem.title}</a><span> · ${renderToneBadge(caseItem.status)}</span></li>`).join("")}</ul>`
          : "<p>No cases available yet. Start from Launcher to create the first investigation context.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Case summary</span>
        <h3>${selectedCaseId ?? "No case selected"}</h3>
        ${selectedCase
          ? `<ul class="placeholder-list">
              <li><strong>Title:</strong> ${selectedCase.title ?? "n/a"}</li>
              <li><strong>Status:</strong> ${renderToneBadge(selectedCase.status)}</li>
              <li><strong>Module:</strong> ${selectedCase.moduleId ?? "n/a"}</li>
              <li><strong>Linked runs:</strong> ${linkedRuns.length}</li>
            </ul>`
          : "<p>Select a case to open a unified investigation workspace.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Run summary</span>
        <h3>${primaryRun?.runId ?? "No linked run"}</h3>
        ${primaryRun
          ? `<ul class="placeholder-list">
              <li><strong>Workflow:</strong> ${primaryRun.workflowName}</li>
              <li><strong>Status:</strong> ${renderToneBadge(primaryRun.status)}</li>
              <li><strong>Current step:</strong> ${primaryRun.currentStepTitle ?? "n/a"}</li>
              <li><strong>Policy decisions:</strong> ${primaryRun.policyDecisions?.length ?? 0}</li>
            </ul>`
          : "<p>No run is currently linked to this investigation.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Findings rollup</span>
        <h3>Findings</h3>
        <ul class="placeholder-list">
          <li>Total findings: ${findings.length}</li>
          <li>Open or in review: ${openFindings}</li>
          <li>Resolved or dismissed: ${findings.length - openFindings}</li>
        </ul>
        ${findings.length
          ? `<ul class="placeholder-list">${findings.slice(0, 3).map((item) => `<li>${renderToneBadge(item.severity)} · <a href="#/files-artifacts?findingId=${item.findingId}">${item.summary}</a>${item.evidenceIds?.[0] ? ` · <a href="#/files-artifacts?evidenceId=${item.evidenceIds[0]}">evidence</a>` : ""}${item.artifactIds?.[0] ? ` · <a href="#/files-artifacts?artifactId=${item.artifactIds[0]}">artifact</a>` : ""}${item.findingId ? ` · <a href="#/logs-audit?findingId=${item.findingId}">audit</a>` : ""}</li>`).join("")}</ul>`
          : "<p>No findings generated yet for this investigation.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Artifacts and evidence</span>
        <h3>Evidence rollup</h3>
        <ul class="placeholder-list">
          <li>Evidence items: ${evidenceItems.length}</li>
          <li>Artifacts: ${artifacts.length}</li>
        </ul>
        ${artifacts.length
          ? `<ul class="placeholder-list">${artifacts.slice(0, 3).map((item) => `<li>${item.type} · ${item.lifecycleState} · <a href="#/files-artifacts?artifactId=${item.artifactId}">${item.artifactId}</a> · <a href="#/logs-audit?artifactId=${item.artifactId}">audit</a></li>`).join("")}</ul>`
          : "<p>No artifacts linked yet.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Audit and security</span>
        <h3>Recent events</h3>
        ${renderLinkedAuditEvents(auditEvents)}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Approval and review</span>
        <h3>Review state</h3>
        <ul class="placeholder-list">
          <li>Linked approvals: ${approvals.length}</li>
          <li>Pending approvals: ${pendingApprovals}</li>
          <li>Current checkpoint: ${primaryRun?.pendingApproval?.approvalId ?? "none"}</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Drill-in pivots</span>
        <h3>Investigation navigation</h3>
        <ul class="placeholder-list">
          <li>${selectedCaseId ? `<a href="#/cases-evidence?caseId=${selectedCaseId}">Open case detail</a>` : "Case detail unavailable"}</li>
          <li>${primaryRun?.runId ? `<a href="#/runs?runId=${primaryRun.runId}">Open linked run detail</a>` : "Run detail unavailable"}</li>
          <li>${selectedCaseId ? `<a href="#/logs-audit?caseId=${selectedCaseId}">Open case audit history</a>` : "Case audit history unavailable"}</li>
          <li>${pendingApprovals ? `<a href="#/approvals">Open approvals queue</a>` : "No pending approvals"}</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Disposition</span>
        <h3>Thin status projection</h3>
        <ul class="placeholder-list">
          <li><strong>Case disposition:</strong> ${selectedCase?.status ?? "n/a"}</li>
          <li><strong>Run disposition:</strong> ${primaryRun?.status ?? "n/a"}</li>
          <li><strong>Operator guidance:</strong> ${pendingApprovals ? "Resolve pending approval to continue" : "Continue review or close case when validated"}</li>
        </ul>
      </article>
    </section>
  `;
}

function renderCaseReviewSurface(context = {}) {
  const cases = context.cases ?? [];
  const selectedCaseId = context.selectedCaseId ?? null;
  const selectedCase = context.selectedCase ?? null;
  const linkedRuns = context.linkedRuns ?? [];
  const approvals = context.selectedCaseApprovals ?? [];
  const evidenceItems = context.selectedCaseEvidence ?? [];
  const artifacts = context.selectedCaseArtifacts ?? [];
  const findings = context.selectedCaseFindings ?? [];
  const auditEvents = context.selectedCaseAuditEvents ?? [];

  const caseList = cases.length
    ? `<ul class="placeholder-list">${cases.map((caseItem) => `
      <li>
        <a href="#/cases-evidence?caseId=${caseItem.caseId}">${caseItem.title}</a>
        <span> · ${caseItem.status}</span>
      </li>
    `).join("")}</ul>`
    : "<p>No cases recorded yet.</p>";

  const detail = selectedCase
    ? `
      <ul class="placeholder-list">
        <li><strong>Case ID:</strong> ${selectedCase.caseId}</li>
        <li><strong>Status:</strong> ${selectedCase.status}</li>
        <li><strong>Module:</strong> ${selectedCase.moduleId}</li>
        <li><strong>Linked runs:</strong> ${linkedRuns.length}</li>
      </ul>
      ${linkedRuns.length
        ? `<h4>Run links</h4><ul class="placeholder-list">${linkedRuns.map((run) => `<li><a href="#/runs?runId=${run.runId}">${run.workflowName}</a> · ${run.runId} · ${run.status} · <a href="#/investigation-workspace?caseId=${selectedCase.caseId}">workspace</a></li>`).join("")}</ul>`
        : "<p>No linked run details available.</p>"}
      <h4>Evidence footprint</h4>
      <ul class="placeholder-list">
        <li>Evidence items: ${evidenceItems.length}</li>
        <li>Artifacts: ${artifacts.length}</li>
        <li>Findings: ${findings.length}</li>
      </ul>
      <h4>Approvals</h4>
      <ul class="placeholder-list">
        <li>Linked approvals: ${approvals.length}</li>
        <li>Pending approvals: ${approvals.filter((approval) => approval.status === "pending").length}</li>
      </ul>
      <h4>Recent audit events</h4>
      ${auditEvents.length
        ? `<ul class="placeholder-list">${auditEvents.map((event) => `<li>${event.event_type} · ${event.timestamp}</li>`).join("")}</ul>`
        : "<p>No audit events found for this case.</p>"}
      <p><a href="#/logs-audit?caseId=${selectedCase.caseId}">Open full case audit history</a></p>
    `
    : "<p>Select a case to view details.</p>";

  return `
    <section class="surface-grid" data-surface-id="cases-evidence">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core review surface</span>
        <h3>Case detail</h3>
        <p>Thin case-level review of linked runs, generated evidence, approvals, and recent audit activity.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Case selector</span>
        <h3>Recent cases</h3>
        ${caseList}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Case detail</span>
        <h3>${selectedCaseId ?? "No case selected"}</h3>
        ${detail}
      </article>
    </section>
  `;
}

function renderLinkedAuditEvents(auditEvents = []) {
  return auditEvents.length
    ? `<ul class="placeholder-list">${auditEvents.map((event) => `<li>${event.event_type} · ${event.timestamp}${event.correlation?.run_id ? ` · <a href="#/runs?runId=${event.correlation.run_id}">run</a>` : ""}${event.correlation?.case_id ? ` · <a href="#/cases-evidence?caseId=${event.correlation.case_id}">case</a>` : ""}</li>`).join("")}</ul>`
    : "<p>No linked audit events found.</p>";
}

function renderArtifactDetail(context = {}) {
  const selectedArtifact = context.selectedArtifact ?? null;
  const selectedArtifactId = context.selectedArtifactId ?? null;
  const evidenceItems = context.evidenceItems ?? [];
  const findings = context.findings ?? [];
  const linkedEvidence = selectedArtifact
    ? evidenceItems.filter((item) => item.artifactIds?.includes(selectedArtifact.artifactId))
    : [];
  const linkedFindings = selectedArtifact
    ? findings.filter((finding) => finding.artifactIds?.includes(selectedArtifact.artifactId))
    : [];
  const auditEvents = context.selectedArtifactAuditEvents ?? [];

  if (!selectedArtifact) {
    return `
      <article class="shell-panel">
        <span class="surface-meta">Artifact detail</span>
        <h3>${selectedArtifactId ?? "No artifact selected"}</h3>
        <p>Select an artifact to inspect linkage, storage metadata, and related audit history.</p>
      </article>
    `;
  }

  return `
    <article class="shell-panel">
      <span class="surface-meta">Artifact detail</span>
      <h3>${selectedArtifact.artifactId}</h3>
      <ul class="placeholder-list">
        <li><strong>Type:</strong> ${selectedArtifact.type}</li>
        <li><strong>Status:</strong> ${selectedArtifact.lifecycleState} / ${selectedArtifact.storageState}</li>
        <li><strong>Run linkage:</strong> ${selectedArtifact.runId ?? "n/a"}</li>
        <li><strong>Case linkage:</strong> ${selectedArtifact.caseId ?? "n/a"}</li>
      </ul>
      <h4>Storage and provenance</h4>
      <ul class="placeholder-list">
        <li><strong>URI:</strong> ${selectedArtifact.storageRef?.uri ?? "n/a"}</li>
        <li><strong>Media type:</strong> ${selectedArtifact.storageRef?.mediaType ?? "n/a"}</li>
        <li><strong>Byte size:</strong> ${selectedArtifact.storageRef?.byteSize ?? "n/a"}</li>
        <li><strong>Integrity:</strong> ${selectedArtifact.integrity ? `${selectedArtifact.integrity.algorithm}:${selectedArtifact.integrity.value}` : "n/a"}</li>
        <li><strong>Collected:</strong> ${selectedArtifact.provenance?.collectedAt ?? "n/a"}</li>
        <li><strong>Collector type:</strong> ${selectedArtifact.provenance?.collectorType ?? "n/a"}</li>
      </ul>
      <h4>Linked objects</h4>
      <ul class="placeholder-list">
        <li>Linked evidence items: ${linkedEvidence.length}</li>
        <li>Linked findings: ${linkedFindings.length}</li>
      </ul>
      <h4>Recent linked audit events</h4>
      ${renderLinkedAuditEvents(auditEvents)}
      <p><a href="#/logs-audit?artifactId=${selectedArtifact.artifactId}">Open artifact audit history</a></p>
    </article>
  `;
}

function renderEvidenceDetail(context = {}) {
  const selectedEvidence = context.selectedEvidence ?? null;
  const selectedEvidenceId = context.selectedEvidenceId ?? null;
  const artifacts = context.artifacts ?? [];
  const findings = context.findings ?? [];
  const linkedArtifacts = selectedEvidence
    ? artifacts.filter((artifact) => selectedEvidence.artifactIds?.includes(artifact.artifactId))
    : [];
  const linkedFindings = selectedEvidence
    ? findings.filter((finding) => finding.evidenceIds?.includes(selectedEvidence.evidenceId))
    : [];
  const auditEvents = context.selectedEvidenceAuditEvents ?? [];

  if (!selectedEvidence) {
    return `
      <article class="shell-panel">
        <span class="surface-meta">Evidence detail</span>
        <h3>${selectedEvidenceId ?? "No evidence selected"}</h3>
        <p>Select an evidence item to inspect provenance, linked outputs, and audit history.</p>
      </article>
    `;
  }

  return `
    <article class="shell-panel">
      <span class="surface-meta">Evidence detail</span>
      <h3>${selectedEvidence.evidenceId}</h3>
      <ul class="placeholder-list">
        <li><strong>Type:</strong> ${selectedEvidence.type}</li>
        <li><strong>Status:</strong> ${selectedEvidence.lifecycleState}</li>
        <li><strong>Summary:</strong> ${selectedEvidence.summary}</li>
        <li><strong>Run linkage:</strong> ${selectedEvidence.runId ?? "n/a"}</li>
        <li><strong>Case linkage:</strong> ${selectedEvidence.caseId ?? "n/a"}</li>
      </ul>
      <h4>Provenance</h4>
      <ul class="placeholder-list">
        <li><strong>Collected:</strong> ${selectedEvidence.provenance?.collectedAt ?? "n/a"}</li>
        <li><strong>Collector type:</strong> ${selectedEvidence.provenance?.collectorType ?? "n/a"}</li>
        <li><strong>Source kind:</strong> ${selectedEvidence.source?.kind ?? "n/a"}</li>
      </ul>
      <h4>Linked objects</h4>
      <ul class="placeholder-list">
        <li>Linked artifacts: ${linkedArtifacts.length}</li>
        <li>Linked findings: ${linkedFindings.length}</li>
      </ul>
      <h4>Recent linked audit events</h4>
      ${renderLinkedAuditEvents(auditEvents)}
      <p><a href="#/logs-audit?evidenceId=${selectedEvidence.evidenceId}">Open evidence audit history</a></p>
    </article>
  `;
}

function renderFindingDetail(context = {}) {
  const selectedFinding = context.selectedFinding ?? null;
  const selectedFindingId = context.selectedFindingId ?? null;
  const auditEvents = context.selectedFindingAuditEvents ?? [];

  if (!selectedFinding) {
    return `
      <article class="shell-panel">
        <span class="surface-meta">Finding detail</span>
        <h3>${selectedFindingId ?? "No finding selected"}</h3>
        <p>Select a finding to inspect a thin severity/summary projection and linked audit events.</p>
      </article>
    `;
  }

  return `
    <article class="shell-panel">
      <span class="surface-meta">Finding detail</span>
      <h3>${selectedFinding.findingId}</h3>
      <ul class="placeholder-list">
        <li><strong>Type:</strong> ${selectedFinding.type}</li>
        <li><strong>Severity:</strong> ${renderToneBadge(selectedFinding.severity)}</li>
        <li><strong>Status:</strong> ${renderToneBadge(selectedFinding.lifecycleState)}</li>
        <li><strong>Summary:</strong> ${selectedFinding.summary}</li>
        <li><strong>Linked evidence:</strong> ${selectedFinding.evidenceIds?.length ?? 0}</li>
        <li><strong>Linked artifacts:</strong> ${selectedFinding.artifactIds?.length ?? 0}</li>
      </ul>
      <h4>Recent linked audit events</h4>
      ${renderLinkedAuditEvents(auditEvents)}
      <p><a href="#/logs-audit?findingId=${selectedFinding.findingId}">Open finding audit history</a></p>
    </article>
  `;
}

function renderAuditSurface(context = {}) {
  const auditEvents = context.auditEvents ?? [];
  const selectedFilters = context.selectedFilters ?? [];
  const filterSummary = selectedFilters.length
    ? selectedFilters.map((item) => `${item.label}: ${item.value}`).join(" · ")
    : "none";

  return `
    <section class="surface-grid" data-surface-id="logs-audit">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core audit surface</span>
        <h3>Logs / Audit</h3>
        <p>Inspect linked audit and security history using existing run/case/finding/artifact/evidence correlation IDs.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Filter context</span>
        <h3>Active drill-in filters</h3>
        <ul class="placeholder-list">
          <li><strong>Filters:</strong> ${filterSummary}</li>
          <li><a href="#/logs-audit">Clear filters</a></li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Events</span>
        <h3>Recent correlated events</h3>
        ${renderLinkedAuditEvents(auditEvents)}
      </article>
    </section>
  `;
}

function renderArtifactEvidenceSurface(context = {}) {
  const artifacts = context.artifacts ?? [];
  const evidenceItems = context.evidenceItems ?? [];
  const findings = context.findings ?? [];

  return `
    <section class="surface-grid" data-surface-id="files-artifacts">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core review surface</span>
        <h3>Files / Artifacts</h3>
        <p>Inspect evidence-bearing outputs with thin linkage and audit visibility for trustworthy review.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Selectors</span>
        <h3>Evidence-bearing objects</h3>
        <ul class="placeholder-list">
          <li>Artifacts: ${artifacts.length}</li>
          <li>Evidence items: ${evidenceItems.length}</li>
          <li>Findings: ${findings.length}</li>
        </ul>
        ${artifacts.length ? `<h4>Artifact links</h4><ul class="placeholder-list">${artifacts.slice(0, 5).map((artifact) => `<li><a href="#/files-artifacts?artifactId=${artifact.artifactId}">${artifact.artifactId}</a> · ${artifact.type} · ${artifact.lifecycleState}</li>`).join("")}</ul>` : "<p>No artifacts recorded yet.</p>"}
        ${evidenceItems.length ? `<h4>Evidence links</h4><ul class="placeholder-list">${evidenceItems.slice(0, 5).map((item) => `<li><a href="#/files-artifacts?evidenceId=${item.evidenceId}">${item.evidenceId}</a> · ${item.type} · ${item.lifecycleState}</li>`).join("")}</ul>` : "<p>No evidence items recorded yet.</p>"}
      </article>
      ${renderArtifactDetail(context)}
      ${renderEvidenceDetail(context)}
      ${renderFindingDetail(context)}
    </section>
  `;
}

function renderAgentsSurface(context = {}) {
  const workflowCount = context.workflowCount ?? 0;
  const runCount = context.runCount ?? 0;
  const activeRunCount = context.activeRunCount ?? 0;
  const moduleCount = context.moduleCount ?? 0;
  const modelCount = context.modelCount ?? 0;
  const toolGatewayEventCount = context.toolGatewayEventCount ?? 0;
  const policyDecisionCount = context.policyDecisionCount ?? 0;
  const pendingApprovalCount = context.pendingApprovalCount ?? 0;
  const modelGovernanceEventCount = context.modelGovernanceEventCount ?? 0;
  const agentInventory = context.agentInventory ?? [];
  const moduleWorkflowLinks = context.moduleWorkflowLinks ?? [];

  return `
    <section class="surface-grid" data-surface-id="agents">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned orchestration and readiness workspace</span>
        <h3>Agents</h3>
        <p>Help operators understand what currently counts as an agent-like execution role in Corestack MVP: workflow orchestration roles, AI-assisted workflow stages, and governed human review checkpoints.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Readiness signals (implemented contracts)</span>
        <h3>Current orchestration posture</h3>
        <ul class="placeholder-list">
          <li>Registered workflows: ${workflowCount}</li>
          <li>Total runs recorded: ${runCount} (active or gated: ${activeRunCount})</li>
          <li>Registered modules contributing behavior: ${moduleCount}</li>
          <li>Registered models available to execution roles: ${modelCount}</li>
          <li>Tool-gateway governance events observed: ${toolGatewayEventCount}</li>
          <li>Policy decisions attached to runs: ${policyDecisionCount}</li>
          <li>Pending approval checkpoints: ${pendingApprovalCount}</li>
          <li>Model governance audit events (route/restrict/result): ${modelGovernanceEventCount}</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Execution-role inventory</span>
        <h3>Implemented now vs partial vs planned/deferred</h3>
        ${agentInventory.length
    ? `<ul class="placeholder-list">${agentInventory.map((item) => `<li><strong>${item.role}</strong><span> · ${item.status}</span><br /><span>${item.responsibility}</span></li>`).join("")}</ul>`
    : "<p>No execution-role inventory is available yet.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Workflow and module relationship</span>
        <h3>Where agent-like behavior is currently applied</h3>
        ${moduleWorkflowLinks.length
    ? `<ul class="placeholder-list">${moduleWorkflowLinks.map((link) => `<li><strong>${link.workflowName}</strong><span> · ${link.workflowId}</span><span> · module: ${link.moduleId}</span></li>`).join("")}</ul>`
    : "<p>No workflow-to-module links are registered yet.</p>"}
        <ul class="placeholder-list">
          <li><a href="#/runs">Runs</a> provides execution-level drill-in for workflow stages and state.</li>
          <li><a href="#/models">Models</a> shows routing/restriction behavior used by AI-assisted roles.</li>
          <li><a href="#/connectors">Connectors</a> shows governed tool boundaries available to workflows.</li>
          <li><a href="#/policies">Policies</a> and <a href="#/approvals">Approvals</a> show governance checkpoints and review gates.</li>
          <li><a href="#/logs-audit">Logs / Audit</a> preserves correlated execution/governance event history.</li>
        </ul>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned with module extension points",
        implemented: [
          "Agent-like execution visibility is projected from existing run/workflow, model routing/execution, tool gateway, policy, approval, and audit contracts.",
          "Security / OSINT Module 1 workflow roles are visible as current MVP execution actors inside the core control plane.",
          "This workspace is truthful and read-oriented; no fake orchestration configuration controls are introduced.",
        ],
        planned: [
          "Fleet-scale multi-agent assignment, scheduling, and autonomous planning remain deferred.",
          "Full agent lifecycle administration and deployment controls remain deferred.",
        ],
        moduleNotes: [
          "Agents is a core-owned surface; modules contribute behavior through workflows and contracts.",
          "Security / OSINT Module 1 contributes workflow behavior, not a separate agent shell.",
        ],
      })}
    </section>
  `;
}

function renderPoliciesSurface(context = {}) {
  const policyDecisionCount = context.policyDecisionCount ?? 0;
  const policyOutcomeCounts = context.policyOutcomeCounts ?? { allow: 0, deny: 0, require_approval: 0 };
  const governedActionSummary = context.governedActionSummary ?? {};
  const pendingApprovals = context.pendingApprovals ?? 0;
  const totalApprovals = context.totalApprovals ?? 0;
  const runCountWithPolicyDecisions = context.runCountWithPolicyDecisions ?? 0;
  const workflowCheckpointCount = context.workflowCheckpointCount ?? 0;
  const modelGovernanceEventCount = context.modelGovernanceEventCount ?? 0;
  const governedActionItems = Object.entries(governedActionSummary)
    .map(([type, count]) => `<li><strong>${type}</strong><span> · ${count} approval-linked action(s)</span></li>`)
    .join("");

  return `
    <section class="surface-grid" data-surface-id="policies">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned governance workspace</span>
        <h3>Policies</h3>
        <p>Make policy-governed behavior legible across tools, models, workflows, and approvals without introducing unsupported authoring controls.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Policy inventory (implemented now)</span>
        <h3>Decision and checkpoint coverage</h3>
        <ul class="placeholder-list">
          <li>Total policy decisions captured on runs: ${policyDecisionCount}</li>
          <li>Runs with at least one policy decision: ${runCountWithPolicyDecisions}</li>
          <li>Decision outcomes — allow: ${policyOutcomeCounts.allow}, require approval: ${policyOutcomeCounts.require_approval}, deny: ${policyOutcomeCounts.deny}</li>
          <li>Pending approval checkpoints: ${pendingApprovals} (of ${totalApprovals} recorded approvals)</li>
          <li>Workflow-step governed checkpoints: ${workflowCheckpointCount}</li>
          <li>Model governance audit signals (route/restriction): ${modelGovernanceEventCount}</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Where policies apply</span>
        <h3>Governed action relationship</h3>
        ${governedActionItems ? `<ul class="placeholder-list">${governedActionItems}</ul>` : "<p>No governed actions have produced approval records yet.</p>"}
        <ul class="placeholder-list">
          <li><a href="#/runs">Runs</a> show policy decisions and pending checkpoints at run detail level.</li>
          <li><a href="#/approvals">Approvals</a> is the operator action surface for require-approval outcomes.</li>
          <li><a href="#/models">Models</a> surfaces routing and restriction events that are policy-relevant.</li>
          <li><a href="#/logs-audit">Logs / Audit</a> preserves correlation for policy and approval event traces.</li>
        </ul>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned, module-aware",
        implemented: [
          "Policy decision contract is active and attached to run records.",
          "Require-approval outcomes link directly into the core approval checkpoint flow.",
          "Governance visibility spans run review, approval queue, model restriction hooks, and audit correlation.",
        ],
        planned: [
          "Policy authoring/versioning UI remains deferred for this MVP thin slice.",
          "Policy simulation/testing, tenant lifecycle administration, and compliance mapping remain deferred.",
        ],
        moduleNotes: [
          "Security / OSINT Module 1 is policy-subject and contributes run context, but Policies remains a core-owned surface.",
          "Future modules can expose policy-relevant context through core contracts without creating module-owned policy pages.",
        ],
      })}
    </section>
  `;
}

function renderModelsSurface(context = {}) {
  const models = context.models ?? [];
  const recentModelEvents = context.recentModelEvents ?? [];
  const modelUsage = context.modelUsage ?? [];
  const routingPosture = context.routingPosture ?? {
    localCount: 0,
    externalCount: 0,
    localFirstDefaultCount: 0,
    externalRestrictedCount: 0,
  };
  const modelGovernance = context.modelGovernance ?? {
    policyDecisionCount: 0,
    runCountWithPolicyDecisions: 0,
    pendingApprovals: 0,
    totalApprovals: 0,
    restrictionBlockedCount: 0,
    selectedRouteCount: 0,
    resultEventCount: 0,
  };

  const availableModels = models.filter((model) => model.status?.available !== false).length;
  const unavailableModels = models.length - availableModels;
  const usageItems = modelUsage.length
    ? modelUsage.map((usage) => `<li><strong>${usage.workflowName}</strong><span> · ${usage.moduleName}</span><span> · ${usage.modelKinds}</span><span> · ${usage.notes}</span></li>`).join("")
    : "";

  return `
    <section class="surface-grid" data-surface-id="models">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned, module-aware surface</span>
        <h3>Models</h3>
        <p>Operator workspace for governed model execution posture: what routes exist, where models are used, and how policy/approval/audit controls apply in the current MVP.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Implemented now: model inventory</span>
        <h3>Registered execution paths</h3>
        <ul class="placeholder-list">
          <li>Registered models: ${models.length}</li>
          <li>Available now: ${availableModels}</li>
          <li>Unavailable now: ${unavailableModels}</li>
        </ul>
        ${models.length
          ? `<ul class="placeholder-list">${models.map((model) => `<li><strong>${model.id}</strong><span> · ${model.kind}</span><span> · ${model.providerType}</span><span> · local-first: ${model.localFirst ? "yes" : "no"}</span><span> · ${model.status?.available === false ? "unavailable" : "available"}</span></li>`).join("")}</ul>`
          : "<p>No models registered.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Routing and provider boundary posture</span>
        <h3>Local-first and external boundary visibility</h3>
        <ul class="placeholder-list">
          <li>Local provider routes in registry: ${routingPosture.localCount}</li>
          <li>External provider routes in registry: ${routingPosture.externalCount}</li>
          <li>Models marked local-first: ${routingPosture.localFirstDefaultCount}</li>
          <li>Models with external-provider restrictions flagged: ${routingPosture.externalRestrictedCount}</li>
        </ul>
        <p>This surface is read-oriented: it exposes current routing/restriction posture and does not introduce fake provider or lifecycle editors.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Where model execution applies in MVP</span>
        <h3>Workflow and module usage visibility</h3>
        ${usageItems ? `<ul class="placeholder-list">${usageItems}</ul>` : "<p>No workflow model usage links are registered yet.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Governance and approval posture</span>
        <h3>Policy, approval, and restriction signals</h3>
        <ul class="placeholder-list">
          <li>Runs with policy decisions: ${modelGovernance.runCountWithPolicyDecisions}</li>
          <li>Total policy decisions captured on runs: ${modelGovernance.policyDecisionCount}</li>
          <li>Pending approvals linked to model-relevant governed actions: ${modelGovernance.pendingApprovals} (of ${modelGovernance.totalApprovals})</li>
          <li>Model route selections observed in audit events: ${modelGovernance.selectedRouteCount}</li>
          <li>Model restriction blocks observed in audit events: ${modelGovernance.restrictionBlockedCount}</li>
          <li>Model execution result events observed: ${modelGovernance.resultEventCount}</li>
        </ul>
        <h4>Recent model security events</h4>
        ${renderLinkedAuditEvents(recentModelEvents)}
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned, module-aware",
        implemented: [
          "Model registry, local-first router, and execution hooks are active and reused by current workflow execution paths.",
          "Provider boundary and restriction posture are visible through existing model descriptors plus route/restriction/result audit signals.",
          "Model usage relationship to Security / OSINT Module 1 workflow is visible without creating module-owned model pages.",
        ],
        planned: [
          "Full model lifecycle administration (provider onboarding, deployment orchestration, benchmarking, and fine-tuning lifecycle UX) remains deferred.",
          "Advanced failover/routing optimization and tenant-level model governance administration remain deferred.",
        ],
        moduleNotes: [
          "Models is a core-owned governance/execution posture surface; modules consume it through core contracts.",
          "Security / OSINT Module 1 routes alert-triage model execution through this core layer.",
        ],
      })}
    </section>
  `;
}

function renderConnectorsSurface(context = {}) {
  const connectorInventory = context.connectorInventory ?? [];
  const connectorEventSummary = context.connectorEventSummary ?? {
    requested: 0,
    decisioned: 0,
    result: 0,
    invalidRequest: 0,
  };
  const gatewayPolicySummary = context.gatewayPolicySummary ?? {
    allow: 0,
    deny: 0,
    requireApproval: 0,
  };
  const moduleConnectorUsage = context.moduleConnectorUsage ?? [];
  const localModelCount = context.localModelCount ?? 0;
  const externalModelCount = context.externalModelCount ?? 0;

  return `
    <section class="surface-grid" data-surface-id="connectors">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned surface with module extension points</span>
        <h3>Connectors</h3>
        <p>Operator workspace for controlled integration boundaries: what paths exist now, what governance is active, and what remains deferred.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Implemented connector inventory</span>
        <h3>Controlled integration paths available now</h3>
        ${connectorInventory.length
          ? `<ul class="placeholder-list">${connectorInventory.map((item) => `<li><strong>${item.id}</strong><span> · ${item.boundary}</span><span> · status: ${item.status}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No connector inventory entries are currently registered.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Readiness and governance posture</span>
        <h3>Current MVP trust boundary</h3>
        <ul class="placeholder-list">
          <li>Tool-gateway events observed — requested: ${connectorEventSummary.requested}, decisioned: ${connectorEventSummary.decisioned}, result: ${connectorEventSummary.result}, invalid request: ${connectorEventSummary.invalidRequest}.</li>
          <li>Policy outcomes touching connector/tool execution — allow: ${gatewayPolicySummary.allow}, require approval: ${gatewayPolicySummary.requireApproval}, deny: ${gatewayPolicySummary.deny}.</li>
          <li>Model boundary context relevant to connectors — local models: ${localModelCount}, external models: ${externalModelCount}.</li>
          <li>Operator assumption: connector use remains policy-subject, audit-correlated, and local-first by default in this MVP slice.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Module applicability</span>
        <h3>Where connectors apply today</h3>
        ${moduleConnectorUsage.length
          ? `<ul class="placeholder-list">${moduleConnectorUsage.map((item) => `<li><strong>${item.moduleName}</strong><span> · ${item.workflowName}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No module connector usage is currently mapped.</p>"}
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned with module extension points",
        implemented: [
          "web.fetch and web.search tool contracts/schemas are active through the governed tool gateway path.",
          "Connector-facing access is policy-subject and emits correlated audit/security events for review surfaces.",
          "This page provides operator-visible connector readiness/governance framing without introducing fake configuration controls.",
        ],
        planned: [
          "Connector onboarding UX, credential vaulting, and provisioning automation remain deferred.",
          "Live connector health probes and per-tenant connector lifecycle administration remain deferred.",
        ],
        moduleNotes: [
          "Security / OSINT Module 1 consumes connector-backed tool paths through core workflows; Connectors remains core-owned.",
          "Future modules can declare connector dependencies through core contracts without creating module-owned connector admin pages.",
        ],
      })}
    </section>
  `;
}

function renderSettingsSurface(context = {}) {
  const {
    runtimeDefaults = {},
    readinessSignals = {},
    coreDependencyPosture = [],
    docsEntryPoints = [],
  } = context;

  return `
    <section class="surface-grid" data-surface-id="settings">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned platform surface</span>
        <h3>Settings</h3>
        <p>Configuration/readiness workspace for understanding the current platform runtime posture, governance defaults, and where operators should look before making environment-level changes.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Runtime posture visible now</span>
        <h3>Current MVP configuration assumptions</h3>
        <ul class="placeholder-list">
          <li>Local-first model routes in registry: ${runtimeDefaults.localModelCount ?? 0}.</li>
          <li>External model routes in registry: ${runtimeDefaults.externalModelCount ?? 0}.</li>
          <li>Registered modules consuming core runtime contracts: ${runtimeDefaults.moduleCount ?? 0}.</li>
          <li>Registered workflows using shared run/case/evidence/policy/audit contracts: ${runtimeDefaults.workflowCount ?? 0}.</li>
          <li>Governed connector paths declared in this MVP: ${runtimeDefaults.connectorPathCount ?? 0}.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Operational readiness signals</span>
        <h3>What operators can verify in-product now</h3>
        <ul class="placeholder-list">
          <li>Runs tracked: ${readinessSignals.runCount ?? 0}; cases tracked: ${readinessSignals.caseCount ?? 0}; pending approvals: ${readinessSignals.pendingApprovalCount ?? 0}.</li>
          <li>Observed policy decisions across runs: ${readinessSignals.policyDecisionCount ?? 0}.</li>
          <li>Correlated model and tool governance events in audit history: ${readinessSignals.governanceEventCount ?? 0}.</li>
          <li>This page is status/visibility-first and intentionally does not expose fake persistent settings editors.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Core relationships</span>
        <h3>Settings boundaries across platform capabilities</h3>
        ${coreDependencyPosture.length
          ? `<ul class="placeholder-list">${coreDependencyPosture.map((item) => `<li><strong>${item.area}</strong><span> · ${item.state}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No core dependency posture entries are currently mapped.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Runbooks and source-of-truth docs</span>
        <h3>Where the current operational contract is documented</h3>
        ${docsEntryPoints.length
          ? `<ul class="placeholder-list">${docsEntryPoints.map((item) => `<li><strong>${item.label}</strong><span> · ${item.path}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No documentation entry points are currently listed.</p>"}
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned",
        implemented: [
          "Current settings posture is projected from existing runtime contracts (models/workflows/modules/connectors), audit events, and governance outcomes.",
          "Operators can verify current local-first assumptions and environment readiness without pretending there is a full configuration-management backend.",
          "Runbook and source-of-truth documentation entry points are surfaced as the current mechanism for applying platform-level configuration changes.",
        ],
        planned: [
          "In-product settings editors and persistent mutation APIs remain deferred.",
          "Secret-management/credential rotation UX and advanced day-2 automation remain deferred.",
          "Tenant-specific settings lifecycle controls remain deferred until broader admin/tenancy foundations land.",
        ],
        moduleNotes: [
          "Settings remains core-owned; modules consume shared runtime/configuration contracts and should not ship module-owned settings control planes.",
        ],
      })}
      <article class="shell-panel">
        <span class="surface-meta">Partially implemented scope</span>
        <h3>What is intentionally thin in this slice</h3>
        <ul class="placeholder-list">
          <li>Configuration visibility is strong for current MVP routes, but change workflows remain runbook-driven and outside this UI.</li>
          <li>Readiness indicators are derived from current in-memory/local stores and currently supported module/workflow paths.</li>
          <li>Enterprise-grade configuration governance (change windows, drift detection, approvals for config mutation) is not implemented in this slice.</li>
        </ul>
      </article>
    </section>
  `;
}

function renderAdminTenancySurface(context = {}) {
  const {
    adminBaseline = {},
    tenancyBoundaries = [],
    deferredControls = [],
  } = context;

  return `
    <section class="surface-grid" data-surface-id="admin-tenancy">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned platform surface</span>
        <h3>Admin / Tenancy</h3>
        <p>Administration and tenancy-readiness workspace describing current control-plane boundaries, what isolation posture is present now, and what enterprise controls remain intentionally deferred.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Current admin baseline</span>
        <h3>Operator posture in this MVP</h3>
        <ul class="placeholder-list">
          <li>Current baseline mode: ${adminBaseline.mode ?? "single-operator local baseline"}.</li>
          <li>Runs observed: ${adminBaseline.runCount ?? 0}; cases observed: ${adminBaseline.caseCount ?? 0}; approvals observed: ${adminBaseline.approvalCount ?? 0} (${adminBaseline.pendingApprovalCount ?? 0} pending).</li>
          <li>Governance events available for admin review: ${adminBaseline.governanceEventCount ?? 0}.</li>
          <li>This surface is read-oriented and does not claim live tenant provisioning or role management workflows.</li>
        </ul>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Tenancy and isolation framing</span>
        <h3>Boundaries visible in current contracts</h3>
        ${tenancyBoundaries.length
          ? `<ul class="placeholder-list">${tenancyBoundaries.map((item) => `<li><strong>${item.area}</strong><span> · ${item.state}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No tenancy boundary entries are currently mapped.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Deferred enterprise scope</span>
        <h3>Controls intentionally not implemented yet</h3>
        ${deferredControls.length
          ? `<ul class="placeholder-list">${deferredControls.map((item) => `<li><strong>${item.control}</strong><span> · ${item.status}</span><br /><small>${item.notes}</small></li>`).join("")}</ul>`
          : "<p>No deferred control entries are currently listed.</p>"}
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned",
        implemented: [
          "Current MVP keeps a single-operator local-first administration baseline while preserving tenancy terminology in contracts and documentation.",
          "Audit, policy, run, and evidence contracts already carry actor/correlation context that future authorization/isolation layers can build on.",
          "This page makes admin/tenancy scope legible without introducing fake enterprise control-plane workflows.",
        ],
        planned: [
          "Tenant lifecycle management, RBAC/SSO administration, and scoped identity governance remain deferred.",
          "Delegated admin operations and per-tenant operational policy controls remain deferred.",
          "Full multi-tenant SaaS control-plane operations UX remains deferred beyond this MVP thin slice.",
        ],
        moduleNotes: [
          "Admin/Tenancy remains core-owned; modules inherit tenancy boundaries through core run/case/evidence/policy contracts rather than defining tenant models.",
        ],
      })}
      <article class="shell-panel">
        <span class="surface-meta">Partially implemented scope</span>
        <h3>Current depth and next boundary</h3>
        <ul class="placeholder-list">
          <li>Tenancy posture is contract- and terminology-level today, not a full enforced multi-tenant runtime with operator tooling.</li>
          <li>Admin readiness focuses on observability and governance correlation across existing surfaces, not mutable administration workflows.</li>
          <li>Future authorization/isolation work should extend these core boundaries rather than creating module-owned admin panels.</li>
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

  if (route.id === "runs") {
    return renderRunReviewSurface(context);
  }

  if (route.id === "cases-evidence") {
    return renderCaseReviewSurface(context);
  }

  if (route.id === "investigation-workspace") {
    return renderInvestigationWorkspaceSurface(context);
  }

  if (route.id === "files-artifacts") {
    return renderArtifactEvidenceSurface(context);
  }

  if (route.id === "logs-audit") {
    return renderAuditSurface(context);
  }

  if (route.id === "modules") {
    return renderModulesSurface(context);
  }

  if (route.id === "agents") {
    return renderAgentsSurface(context);
  }

  if (route.id === "policies") {
    return renderPoliciesSurface(context);
  }

  if (route.id === "models") {
    return renderModelsSurface(context);
  }

  if (route.id === "connectors") {
    return renderConnectorsSurface(context);
  }

  if (route.id === "settings") {
    return renderSettingsSurface(context);
  }

  if (route.id === "admin-tenancy") {
    return renderAdminTenancySurface(context);
  }

  return renderSurfacePlaceholder(route);
}
