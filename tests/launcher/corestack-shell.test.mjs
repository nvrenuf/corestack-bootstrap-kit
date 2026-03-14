import test from "node:test";
import assert from "node:assert/strict";

import {
  TOP_LEVEL_ROUTES,
  getRoute,
  normalizeRoute,
  renderModuleHook,
  renderPrimaryNav,
  renderRouteContent,
  renderSurfacePlaceholder,
} from "../../launcher/corestack-shell.mjs";

test("top-level routes match the documented control-plane navigation order", () => {
  assert.deepEqual(
    TOP_LEVEL_ROUTES.map((route) => route.label),
    [
      "Home",
      "Launcher",
      "Runs",
      "Approvals",
      "Cases / Evidence",
      "Investigation Workspace",
      "Files / Artifacts",
      "Logs / Audit",
      "Agents",
      "Policies",
      "Models",
      "Connectors",
      "Modules",
      "Settings",
      "Admin / Tenancy",
    ],
  );
});

test("unknown routes normalize back to Home inside the same shell", () => {
  assert.equal(normalizeRoute("#/missing-surface"), "home");
  assert.equal(getRoute(normalizeRoute("#/missing-surface")).label, "Home");
  assert.equal(normalizeRoute("#/launcher?start=security-osint-alert-triage"), "launcher");
});

test("primary navigation renders product-style labels without numeric launcher prefixes", () => {
  const rendered = renderPrimaryNav("home");

  assert.match(rendered, /data-route-link="home"/);
  assert.doesNotMatch(rendered, /nav-index/);
  assert.doesNotMatch(rendered, />\d{2}</);
});

test("placeholder rendering stays core-owned and does not imply a separate module shell", () => {
  const route = getRoute("modules");
  const rendered = renderSurfacePlaceholder(route);

  assert.match(rendered, /core-owned surface/);
  assert.match(rendered, /No separate product shell or module-owned navigation is introduced/);
});

test("home renders the core entry widgets for active work, approvals, and recent work", () => {
  const rendered = renderRouteContent(getRoute("home"));

  assert.match(rendered, /Active work/);
  assert.match(rendered, /Approvals/);
  assert.match(rendered, /Recent work/);
  assert.match(rendered, /Platform utilities/);
  assert.match(rendered, /href="http:\/\/localhost:5678\/home\/workflows"/);
  assert.match(rendered, /href="http:\/\/localhost:8080"/);
  assert.match(rendered, /href="http:\/\/localhost:8081\/"/);
});

test("launcher exposes a Security\/OSINT workflow start path inside the shared shell", () => {
  const rendered = renderRouteContent(getRoute("launcher"), {
    attachableCase: { caseId: "case-1", title: "Security / OSINT alert triage" },
  });

  assert.match(rendered, /Security \/ OSINT Module 1/);
  assert.match(rendered, /Alert triage and investigation/);
  assert.match(rendered, /Attach run to Security \/ OSINT alert triage/);
  assert.match(rendered, /Platform utilities/);
  assert.match(rendered, /href="http:\/\/localhost:5678\/home\/workflows"/);
  assert.match(rendered, /href="http:\/\/localhost:8080"/);
  assert.match(rendered, /Ollama API/);
  assert.match(rendered, /DB Admin \/ Adminer/);
  assert.match(rendered, /href="http:\/\/localhost:8081\/"/);
});


test("logs-audit route renders filtered correlated events for investigation drill-ins", () => {
  const rendered = renderRouteContent(getRoute("logs-audit"), {
    selectedFilters: [{ label: "Finding", value: "finding-1" }],
    auditEvents: [
      {
        event_type: "evidence.object.mutated",
        timestamp: "2026-01-01T00:00:00.000Z",
        correlation: { run_id: "run-1", case_id: "case-1" },
      },
    ],
  });

  assert.match(rendered, /Logs \/ Audit/);
  assert.match(rendered, /Finding: finding-1/);
  assert.match(rendered, /evidence\.object\.mutated/);
  assert.match(rendered, /runs\?runId=run-1/);
  assert.match(rendered, /cases-evidence\?caseId=case-1/);
});

test("module hook and modules route render registered module visibility", () => {
  const modules = [{
    id: "security-osint-module-1",
    name: "Security / OSINT Module 1",
    status: "active",
    capabilities: [{ id: "investigation.alert-triage", label: "Alert triage and investigation" }],
  }];

  const hook = renderModuleHook(modules);
  const modulesSurface = renderRouteContent(getRoute("modules"), { modules });

  assert.match(hook, /Security \/ OSINT Module 1/);
  assert.match(modulesSurface, /Registered domain capabilities are visible here/);
  assert.match(modulesSurface, /1 capability\(ies\)/);
});

test("agents surface documents core ownership, implemented hooks, and deferred orchestration", () => {
  const rendered = renderRouteContent(getRoute("agents"));

  assert.match(rendered, /Core-owned surface with module extension points/);
  assert.match(rendered, /Model routing and model execution hooks are enforced/);
  assert.match(rendered, /Agent catalog and assignment controls remain deferred/);
  assert.match(rendered, /Security \/ OSINT Module 1 contributes workflow behavior/);
});

test("policies surface renders truthful thin status with policy decision and approval counts", () => {
  const rendered = renderRouteContent(getRoute("policies"), {
    policyDecisionCount: 3,
    pendingApprovals: 1,
  });

  assert.match(rendered, /Core-owned, module-aware surface/);
  assert.match(rendered, /Policy decisions observed in run history: 3/);
  assert.match(rendered, /Pending approval checkpoints: 1/);
  assert.match(rendered, /Policy editor UX is intentionally deferred/);
});

test("models surface renders registry visibility and model event links", () => {
  const rendered = renderRouteContent(getRoute("models"), {
    models: [
      { id: "local.mistral-small", providerType: "local", localFirst: true },
    ],
    recentModelEvents: [
      {
        event_type: "model.route.selected",
        timestamp: "2026-01-01T00:00:00.000Z",
        correlation: { run_id: "run-1", case_id: "case-1" },
      },
    ],
  });

  assert.match(rendered, /Core-owned, module-aware surface/);
  assert.match(rendered, /local\.mistral-small/);
  assert.match(rendered, /local-first: yes/);
  assert.match(rendered, /model\.route\.selected/);
});

test("connectors, settings, and admin tenancy surfaces resolve to intentional product pages", () => {
  const connectors = renderRouteContent(getRoute("connectors"));
  const settings = renderRouteContent(getRoute("settings"));
  const admin = renderRouteContent(getRoute("admin-tenancy"));

  assert.match(connectors, /web\.fetch and web\.search tool contracts\/schemas are active/);
  assert.match(connectors, /Connector onboarding UX and credential management remain deferred/);
  assert.match(settings, /Configuration templates and runbooks define the current operational contract/);
  assert.match(settings, /In-product settings editors remain deferred/);
  assert.match(admin, /single-operator local baseline/);
  assert.match(admin, /Tenant lifecycle and role management UI remain deferred/);
});

test("runs route renders thin run detail review with linkage summaries", () => {
  const rendered = renderRouteContent(getRoute("runs"), {
    runs: [
      {
        runId: "run-1",
        workflowName: "Alert triage and investigation",
        workflowId: "security-osint.alert-triage",
        moduleId: "security-osint-module-1",
        status: "pending_approval",
        caseId: "case-1",
        policyDecisions: [{ decisionId: "pd-1" }],
        pendingApproval: { approvalId: "approval-1" },
      },
    ],
    selectedRunId: "run-1",
    selectedRun: {
      runId: "run-1",
      workflowName: "Alert triage and investigation",
      workflowId: "security-osint.alert-triage",
      moduleId: "security-osint-module-1",
      status: "pending_approval",
      caseId: "case-1",
      policyDecisions: [{ decisionId: "pd-1" }],
      pendingApproval: { approvalId: "approval-1" },
    },
    selectedRunApprovals: [{ approvalId: "approval-1", status: "pending" }],
    selectedRunEvidence: [{ evidenceId: "e-1" }],
    selectedRunArtifacts: [{ artifactId: "a-1" }],
    selectedRunFindings: [{ findingId: "f-1" }],
    selectedRunAuditEvents: [{ event_type: "run.lifecycle.created", timestamp: "2026-01-01T00:00:00.000Z" }],
  });

  assert.match(rendered, /Run detail/);
  assert.match(rendered, /Case linkage:\s*<\/strong> case-1/);
  assert.match(rendered, /Linked approvals: 1/);
  assert.match(rendered, /Evidence items: 1/);
  assert.match(rendered, /Artifacts: 1/);
  assert.match(rendered, /Findings: 1/);
  assert.match(rendered, /run\.lifecycle\.created/);
});

test("cases-evidence route renders thin case detail review with linked runs", () => {
  const rendered = renderRouteContent(getRoute("cases-evidence"), {
    cases: [{ caseId: "case-1", title: "Suspicious auth chain", status: "open" }],
    selectedCaseId: "case-1",
    selectedCase: { caseId: "case-1", status: "open", moduleId: "security-osint-module-1" },
    linkedRuns: [{ runId: "run-1", workflowName: "Alert triage and investigation", status: "completed" }],
    selectedCaseApprovals: [{ approvalId: "approval-1", status: "approved" }],
    selectedCaseEvidence: [{ evidenceId: "e-1" }],
    selectedCaseArtifacts: [{ artifactId: "a-1" }],
    selectedCaseFindings: [{ findingId: "f-1" }],
    selectedCaseAuditEvents: [{ event_type: "evidence.object.mutated", timestamp: "2026-01-01T00:00:00.000Z" }],
  });

  assert.match(rendered, /Case detail/);
  assert.match(rendered, /Linked runs:\s*<\/strong> 1/);
  assert.match(rendered, /Linked approvals: 1/);
  assert.match(rendered, /Pending approvals: 0/);
  assert.match(rendered, /Evidence items: 1/);
  assert.match(rendered, /evidence\.object\.mutated/);
});

test("run and case detail surfaces handle sparse contexts gracefully", () => {
  const runSurface = renderRouteContent(getRoute("runs"), {
    runs: [],
    selectedRunId: null,
    selectedRun: null,
  });
  const caseSurface = renderRouteContent(getRoute("cases-evidence"), {
    cases: [],
    selectedCaseId: null,
    selectedCase: null,
  });

  assert.match(runSurface, /No runs recorded yet/);
  assert.match(runSurface, /Select a run to view details/);
  assert.match(caseSurface, /No cases recorded yet/);
  assert.match(caseSurface, /Select a case to view details/);
});

test("files-artifacts route renders thin artifact and evidence detail with linked audit history", () => {
  const rendered = renderRouteContent(getRoute("files-artifacts"), {
    artifacts: [{
      artifactId: "artifact-1",
      type: "web.fetch.response",
      lifecycleState: "available",
      storageState: "active",
      runId: "run-1",
      caseId: "case-1",
      storageRef: { uri: "artifact://local/run-1/file.json", mediaType: "application/json", byteSize: 64 },
      provenance: { collectedAt: "2026-01-01T00:00:00.000Z", collectorType: "workflow_step" },
      integrity: { algorithm: "sha256", value: "abc" },
    }],
    evidenceItems: [{
      evidenceId: "evidence-1",
      type: "source_snapshot",
      lifecycleState: "collected",
      summary: "Snapshot",
      runId: "run-1",
      caseId: "case-1",
      artifactIds: ["artifact-1"],
      source: { kind: "artifact" },
      provenance: { collectedAt: "2026-01-01T00:00:00.000Z", collectorType: "workflow_step" },
    }],
    findings: [{
      findingId: "finding-1",
      type: "threat_signal",
      severity: "medium",
      lifecycleState: "open",
      summary: "Signal",
      evidenceIds: ["evidence-1"],
      artifactIds: ["artifact-1"],
    }],
    selectedArtifactId: "artifact-1",
    selectedEvidenceId: "evidence-1",
    selectedFindingId: "finding-1",
    selectedArtifact: {
      artifactId: "artifact-1",
      type: "web.fetch.response",
      lifecycleState: "available",
      storageState: "active",
      runId: "run-1",
      caseId: "case-1",
      storageRef: { uri: "artifact://local/run-1/file.json", mediaType: "application/json", byteSize: 64 },
      provenance: { collectedAt: "2026-01-01T00:00:00.000Z", collectorType: "workflow_step" },
      integrity: { algorithm: "sha256", value: "abc" },
    },
    selectedEvidence: {
      evidenceId: "evidence-1",
      type: "source_snapshot",
      lifecycleState: "collected",
      summary: "Snapshot",
      runId: "run-1",
      caseId: "case-1",
      artifactIds: ["artifact-1"],
      source: { kind: "artifact" },
      provenance: { collectedAt: "2026-01-01T00:00:00.000Z", collectorType: "workflow_step" },
    },
    selectedFinding: {
      findingId: "finding-1",
      type: "threat_signal",
      severity: "medium",
      lifecycleState: "open",
      summary: "Signal",
      evidenceIds: ["evidence-1"],
      artifactIds: ["artifact-1"],
    },
    selectedArtifactAuditEvents: [{ event_type: "evidence.object.mutated", timestamp: "2026-01-01T00:00:00.000Z" }],
    selectedEvidenceAuditEvents: [{ event_type: "evidence.object.mutated", timestamp: "2026-01-01T00:00:00.000Z" }],
    selectedFindingAuditEvents: [{ event_type: "evidence.object.mutated", timestamp: "2026-01-01T00:00:00.000Z" }],
  });

  assert.match(rendered, /Files \/ Artifacts/);
  assert.match(rendered, /artifact:\/\/local\/run-1\/file\.json/);
  assert.match(rendered, /Linked evidence items: 1/);
  assert.match(rendered, /Linked artifacts: 1/);
  assert.match(rendered, /Severity:\s*<\/strong> medium/);
  assert.match(rendered, /evidence\.object\.mutated/);
});

test("files-artifacts route handles sparse contexts gracefully", () => {
  const rendered = renderRouteContent(getRoute("files-artifacts"), {
    artifacts: [],
    evidenceItems: [],
    findings: [],
    selectedArtifactId: null,
    selectedEvidenceId: null,
    selectedFindingId: null,
    selectedArtifact: null,
    selectedEvidence: null,
    selectedFinding: null,
  });

  assert.match(rendered, /No artifacts recorded yet/);
  assert.match(rendered, /No evidence items recorded yet/);
  assert.match(rendered, /Select an artifact to inspect linkage/);
  assert.match(rendered, /Select an evidence item to inspect provenance/);
  assert.match(rendered, /Select a finding to inspect a thin severity\/summary projection/);
});


test("investigation workspace renders unified case/run/findings/evidence/audit/approval projection", () => {
  const rendered = renderRouteContent(getRoute("investigation-workspace"), {
    cases: [{ caseId: "case-1", title: "Suspicious auth chain", status: "open" }],
    selectedCaseId: "case-1",
    selectedCase: { caseId: "case-1", title: "Suspicious auth chain", status: "open", moduleId: "security-osint-module-1" },
    linkedRuns: [{ runId: "run-1" }],
    primaryRun: {
      runId: "run-1",
      workflowName: "Alert triage and investigation",
      status: "pending_approval",
      currentStepTitle: "Analyst review checkpoint",
      policyDecisions: [{ decisionId: "pd-1" }],
      pendingApproval: { approvalId: "approval-1" },
    },
    selectedCaseApprovals: [{ approvalId: "approval-1", status: "pending" }],
    selectedCaseEvidence: [{ evidenceId: "e-1" }],
    selectedCaseArtifacts: [{ artifactId: "a-1", type: "snapshot", lifecycleState: "available" }],
    selectedCaseFindings: [{ findingId: "f-1", severity: "high", summary: "Credential exposure", lifecycleState: "open" }],
    selectedCaseAuditEvents: [{ event_type: "approval.lifecycle.created", timestamp: "2026-01-01T00:00:00.000Z" }],
  });

  assert.match(rendered, /Investigation workspace/);
  assert.match(rendered, /Case summary/);
  assert.match(rendered, /Run summary/);
  assert.match(rendered, /Findings rollup/);
  assert.match(rendered, /Evidence rollup/);
  assert.match(rendered, /Review state/);
  assert.match(rendered, /Open linked run detail/);
  assert.match(rendered, /files-artifacts\?findingId=f-1/);
  assert.match(rendered, /logs-audit\?findingId=f-1/);
  assert.match(rendered, /approval\.lifecycle\.created/);
  assert.match(rendered, /Current checkpoint: approval-1/);
});

test("investigation workspace handles sparse investigation data without crashing", () => {
  const rendered = renderRouteContent(getRoute("investigation-workspace"), {
    cases: [],
    selectedCaseId: null,
    selectedCase: null,
    linkedRuns: [],
    primaryRun: null,
    selectedCaseApprovals: [],
    selectedCaseEvidence: [],
    selectedCaseArtifacts: [],
    selectedCaseFindings: [],
    selectedCaseAuditEvents: [],
  });

  assert.match(rendered, /No cases available yet/);
  assert.match(rendered, /No case selected/);
  assert.match(rendered, /No linked run/);
  assert.match(rendered, /No findings generated yet/);
    assert.match(rendered, /No linked audit events found/);
});
