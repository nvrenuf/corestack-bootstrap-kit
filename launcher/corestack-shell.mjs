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
          ? `<ul class="placeholder-list">${cases.map((caseItem) => `<li><a href="#/investigation-workspace?caseId=${caseItem.caseId}">${caseItem.title}</a><span> · ${caseItem.status}</span></li>`).join("")}</ul>`
          : "<p>No cases available yet. Start from Launcher to create the first investigation context.</p>"}
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Case summary</span>
        <h3>${selectedCaseId ?? "No case selected"}</h3>
        ${selectedCase
          ? `<ul class="placeholder-list">
              <li><strong>Title:</strong> ${selectedCase.title ?? "n/a"}</li>
              <li><strong>Status:</strong> ${selectedCase.status}</li>
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
              <li><strong>Status:</strong> ${primaryRun.status}</li>
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
          ? `<ul class="placeholder-list">${findings.slice(0, 3).map((item) => `<li>${item.severity} · <a href="#/files-artifacts?findingId=${item.findingId}">${item.summary}</a>${item.evidenceIds?.[0] ? ` · <a href="#/files-artifacts?evidenceId=${item.evidenceIds[0]}">evidence</a>` : ""}${item.artifactIds?.[0] ? ` · <a href="#/files-artifacts?artifactId=${item.artifactIds[0]}">artifact</a>` : ""}${item.findingId ? ` · <a href="#/logs-audit?findingId=${item.findingId}">audit</a>` : ""}</li>`).join("")}</ul>`
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
        <li><strong>Severity:</strong> ${selectedFinding.severity}</li>
        <li><strong>Status:</strong> ${selectedFinding.lifecycleState}</li>
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

function renderAgentsSurface() {
  return `
    <section class="surface-grid" data-surface-id="agents">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned surface with module extension points</span>
        <h3>Agents</h3>
        <p>Define where agent execution policy and runtime constraints are surfaced across workflows without introducing fake orchestration controls.</p>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned with module extension points",
        implemented: [
          "Alert triage workflow executes through the existing run/workflow contract.",
          "Model routing and model execution hooks are enforced before response generation.",
          "Audit events capture model route and execution correlation IDs.",
        ],
        planned: [
          "Agent catalog and assignment controls remain deferred.",
          "Multi-agent plans and toolchain orchestration remain deferred.",
        ],
        moduleNotes: [
          "Security / OSINT Module 1 contributes workflow behavior, not a separate agent shell.",
          "Future modules will register extension metadata here via the core module contract.",
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

  return `
    <section class="surface-grid" data-surface-id="models">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned, module-aware surface</span>
        <h3>Models</h3>
        <p>Track model registry, local-first routing, and model execution observability used by every module workflow.</p>
      </article>
      <article class="shell-panel">
        <span class="surface-meta">Registry visibility</span>
        <h3>Registered models</h3>
        ${models.length
          ? `<ul class="placeholder-list">${models.map((model) => `<li><strong>${model.id}</strong><span> · ${model.providerType}</span><span> · local-first: ${model.localFirst ? "yes" : "no"}</span></li>`).join("")}</ul>`
          : "<p>No models registered.</p>"}
        <h4>Recent model security events</h4>
        ${renderLinkedAuditEvents(recentModelEvents)}
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned, module-aware",
        implemented: [
          "Model registry and routing contract are active.",
          "Execution hook logging and restriction points are active.",
        ],
        planned: [
          "Advanced provider failover and per-tenant model governance remain deferred.",
        ],
        moduleNotes: [
          "Security / OSINT Module 1 routes triage execution through this core model layer.",
        ],
      })}
    </section>
  `;
}

function renderConnectorsSurface() {
  return `
    <section class="surface-grid" data-surface-id="connectors">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned surface with module extension points</span>
        <h3>Connectors</h3>
        <p>Define connector governance and capability registration boundaries without exposing fake integration setup flows.</p>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned with module extension points",
        implemented: [
          "web.fetch and web.search tool contracts/schemas are active through the tool gateway path.",
          "Tool gateway enforcement and audit hardening thin-slices are active.",
        ],
        planned: [
          "Connector onboarding UX and credential management remain deferred.",
          "Connector health dashboards remain deferred.",
        ],
        moduleNotes: [
          "Security / OSINT Module 1 consumes connector outputs via tool workflows.",
        ],
      })}
    </section>
  `;
}

function renderSettingsSurface() {
  return `
    <section class="surface-grid" data-surface-id="settings">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned platform surface</span>
        <h3>Settings</h3>
        <p>Central place for platform-level configuration status and runbook entry points in a local-first MVP environment.</p>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned",
        implemented: [
          "Configuration templates and runbooks define the current operational contract.",
          "Threat model, schema references, and hardening docs are linked from the docs/runbook set.",
        ],
        planned: [
          "In-product settings editors remain deferred.",
          "Tenant-level settings controls remain deferred.",
        ],
        moduleNotes: [
          "Modules consume settings from core configuration contracts rather than owning separate settings UIs.",
        ],
      })}
    </section>
  `;
}

function renderAdminTenancySurface() {
  return `
    <section class="surface-grid" data-surface-id="admin-tenancy">
      <article class="shell-panel feature-panel">
        <span class="surface-meta">Core-owned platform surface</span>
        <h3>Admin / Tenancy</h3>
        <p>Tracks tenancy and admin boundaries for the control plane without introducing pretend admin automation.</p>
      </article>
      ${renderCapabilityStatus({
        ownership: "Core-owned",
        implemented: [
          "Current MVP uses a single-operator local baseline while preserving tenancy terminology in contracts and docs.",
          "Audit and policy contracts already include actor/correlation metadata needed for future tenancy controls.",
        ],
        planned: [
          "Tenant lifecycle and role management UI remain deferred.",
          "Admin approval delegation and scoped access controls remain deferred.",
        ],
        moduleNotes: [
          "Modules remain tenant-scoped through core case/run/evidence contracts rather than module-owned tenancy models.",
        ],
      })}
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

  if (route.id === "agents") {
    return renderAgentsSurface();
  }

  if (route.id === "policies") {
    return renderPoliciesSurface(context);
  }

  if (route.id === "models") {
    return renderModelsSurface(context);
  }

  if (route.id === "connectors") {
    return renderConnectorsSurface();
  }

  if (route.id === "settings") {
    return renderSettingsSurface();
  }

  if (route.id === "admin-tenancy") {
    return renderAdminTenancySurface();
  }

  return renderSurfacePlaceholder(route);
}
