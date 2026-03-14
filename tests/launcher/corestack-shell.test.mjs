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

test("modules route renders architecture/capability visibility with truthful scope framing", () => {
  const modules = [{
    id: "security-osint-module-1",
    name: "Security / OSINT Module 1",
    status: "active",
    capabilities: [{ id: "investigation.alert-triage", label: "Alert triage and investigation" }],
  }];

  const hook = renderModuleHook(modules);
  const modulesSurface = renderRouteContent(getRoute("modules"), {
    modules,
    moduleWorkflowLinks: [{
      workflowId: "security-osint.alert-triage",
      workflowName: "Alert triage and investigation",
      moduleId: "security-osint-module-1",
    }],
    surfaceRelationships: [{
      surface: "Launcher",
      state: "implemented now",
      notes: "Module-contributed workflow start paths are launched through the shared core launcher.",
    }],
    module1Capability: {
      workflowId: "security-osint.alert-triage",
      workflowName: "Alert triage and investigation",
      runCount: 2,
      caseCount: 1,
      evidenceCount: 3,
      artifactCount: 2,
      findingCount: 1,
      approvalCount: 1,
      auditEventCount: 8,
    },
    statusFraming: {
      implementedNow: ["Module registration inventory is visible with current module/capability posture."],
      partiallyImplemented: ["Participation across policies/models/connectors/agents is visibility-first."],
      plannedDeferred: ["Module packaging and marketplace behavior remain out of scope."],
    },
  });

  assert.match(hook, /Security \/ OSINT Module 1/);
  assert.match(modulesSurface, /Core-owned module architecture workspace/);
  assert.match(modulesSurface, /A module is a domain capability package/);
  assert.match(modulesSurface, /1 capability\(ies\)/);
  assert.match(modulesSurface, /Runs observed:<\/strong> 2/);
  assert.match(modulesSurface, /Module packaging and marketplace behavior remain out of scope/);
});

test("modules route handles sparse context without implying fake module management controls", () => {
  const modulesSurface = renderRouteContent(getRoute("modules"), {
    modules: [],
    moduleWorkflowLinks: [],
    surfaceRelationships: [],
    module1Capability: null,
    statusFraming: {
      implementedNow: ["Module registration inventory is visible with current module/capability posture."],
      partiallyImplemented: ["Participation across policies/models/connectors/agents is visibility-first."],
      plannedDeferred: ["No marketplace, packaging/distribution, entitlement, or install/update manager."],
    },
  });

  assert.match(modulesSurface, /No modules are currently registered in this environment/);
  assert.match(modulesSurface, /No module-to-surface relationships are currently mapped/);
  assert.match(modulesSurface, /No module workflow links are currently registered/);
  assert.match(modulesSurface, /read-oriented and intentionally avoids fake install\/update or marketplace controls/i);
});

test("agents surface renders orchestration/readiness visibility with truthful status framing", () => {
  const rendered = renderRouteContent(getRoute("agents"), {
    workflowCount: 1,
    runCount: 2,
    activeRunCount: 1,
    moduleCount: 1,
    modelCount: 1,
    toolGatewayEventCount: 5,
    policyDecisionCount: 2,
    pendingApprovalCount: 1,
    modelGovernanceEventCount: 3,
    agentInventory: [
      {
        role: "Workflow run orchestrator",
        status: "implemented now",
        responsibility: "Launches workflow runs and tracks step state.",
      },
    ],
    moduleWorkflowLinks: [
      {
        workflowId: "security-osint.alert-triage",
        workflowName: "Alert triage and investigation",
        moduleId: "security-osint-module-1",
      },
    ],
  });

  assert.match(rendered, /Core-owned orchestration and readiness workspace/);
  assert.match(rendered, /Registered workflows: 1/);
  assert.match(rendered, /Workflow run orchestrator/);
  assert.match(rendered, /Alert triage and investigation/);
  assert.match(rendered, /fleet-scale multi-agent assignment, scheduling, and autonomous planning remain deferred/i);
});


test("agents surface handles sparse context without implying unsupported controls", () => {
  const rendered = renderRouteContent(getRoute("agents"), {
    agentInventory: [],
    moduleWorkflowLinks: [],
  });

  assert.match(rendered, /No execution-role inventory is available yet/);
  assert.match(rendered, /No workflow-to-module links are registered yet/);
  assert.match(rendered, /read-oriented; no fake orchestration configuration controls are introduced/i);
});

test("policies surface renders thin governance workspace with implemented and deferred framing", () => {
  const rendered = renderRouteContent(getRoute("policies"), {
    policyDecisionCount: 3,
    policyOutcomeCounts: { allow: 1, deny: 0, require_approval: 2 },
    pendingApprovals: 1,
    totalApprovals: 2,
    runCountWithPolicyDecisions: 2,
    workflowCheckpointCount: 1,
    modelGovernanceEventCount: 4,
    governedActionSummary: { workflow_step: 2 },
  });

  assert.match(rendered, /Core-owned governance workspace/);
  assert.match(rendered, /Total policy decisions captured on runs: 3/);
  assert.match(rendered, /Decision outcomes — allow: 1, require approval: 2, deny: 0/);
  assert.match(rendered, /Pending approval checkpoints: 1 \(of 2 recorded approvals\)/);
  assert.match(rendered, /workflow_step/);
  assert.match(rendered, /Policy authoring\/versioning UI remains deferred/);
});

test("policies surface handles sparse governance context without implying authoring", () => {
  const rendered = renderRouteContent(getRoute("policies"), {
    policyDecisionCount: 0,
    governedActionSummary: {},
  });

  assert.match(rendered, /No governed actions have produced approval records yet/);
  assert.match(rendered, /policy authoring\/versioning UI remains deferred/i);
});

test("models surface renders governed execution posture with implemented vs deferred framing", () => {
  const rendered = renderRouteContent(getRoute("models"), {
    models: [
      {
        id: "local.mistral-small",
        kind: "llm",
        providerType: "local",
        localFirst: true,
        status: { available: true },
        policy: { externalProviderRestricted: false },
      },
      {
        id: "cloud.gpt-fast",
        kind: "llm",
        providerType: "cloud",
        localFirst: false,
        status: { available: false },
        policy: { externalProviderRestricted: true },
      },
    ],
    routingPosture: {
      localCount: 1,
      externalCount: 1,
      localFirstDefaultCount: 1,
      externalRestrictedCount: 1,
    },
    modelUsage: [
      {
        workflowName: "Alert triage and investigation",
        moduleName: "Security / OSINT Module 1",
        modelKinds: "llm (summarize, extract.entities)",
        notes: "Uses core model router and restriction hooks.",
      },
    ],
    modelGovernance: {
      policyDecisionCount: 3,
      runCountWithPolicyDecisions: 2,
      pendingApprovals: 1,
      totalApprovals: 2,
      restrictionBlockedCount: 1,
      selectedRouteCount: 4,
      resultEventCount: 2,
    },
    recentModelEvents: [
      {
        event_type: "model.route.selected",
        timestamp: "2026-01-01T00:00:00.000Z",
        correlation: { run_id: "run-1", case_id: "case-1" },
      },
    ],
  });

  assert.match(rendered, /Operator workspace for governed model execution posture/);
  assert.match(rendered, /Registered models: 2/);
  assert.match(rendered, /local\.mistral-small/);
  assert.match(rendered, /cloud\.gpt-fast/);
  assert.match(rendered, /Local provider routes in registry: 1/);
  assert.match(rendered, /External provider routes in registry: 1/);
  assert.match(rendered, /Pending approvals linked to model-relevant governed actions: 1 \(of 2\)/);
  assert.match(rendered, /Alert triage and investigation/);
  assert.match(rendered, /model\.route\.selected/);
  assert.match(rendered, /Full model lifecycle administration .* remains deferred/);
});

test("models surface handles sparse data without implying fake model controls", () => {
  const rendered = renderRouteContent(getRoute("models"), {
    models: [],
    modelUsage: [],
    recentModelEvents: [],
  });

  assert.match(rendered, /No models registered/);
  assert.match(rendered, /No workflow model usage links are registered yet/);
  assert.match(rendered, /No linked audit events found/);
  assert.match(rendered, /does not introduce fake provider or lifecycle editors/i);
});

test("connectors surface renders governed readiness/workspace framing while settings and admin remain intentional pages", () => {
  const connectors = renderRouteContent(getRoute("connectors"), {
    connectorInventory: [
      {
        id: "web.fetch",
        boundary: "external HTTP/HTTPS retrieval via tool gateway",
        status: "implemented",
        notes: "Schema-validated and policy-governed.",
      },
    ],
    connectorEventSummary: {
      requested: 2,
      decisioned: 2,
      result: 2,
      invalidRequest: 0,
    },
    gatewayPolicySummary: {
      allow: 1,
      requireApproval: 1,
      deny: 0,
    },
    moduleConnectorUsage: [
      {
        moduleName: "Security / OSINT Module 1",
        workflowName: "Alert triage and investigation",
        notes: "Consumes governed external collection paths.",
      },
    ],
    localModelCount: 1,
    externalModelCount: 0,
  });
  const settings = renderRouteContent(getRoute("settings"));
  const admin = renderRouteContent(getRoute("admin-tenancy"));

  assert.match(connectors, /Operator workspace for controlled integration boundaries/);
  assert.match(connectors, /Controlled integration paths available now/);
  assert.match(connectors, /Tool-gateway events observed — requested: 2, decisioned: 2, result: 2, invalid request: 0/);
  assert.match(connectors, /Policy outcomes touching connector\/tool execution — allow: 1, require approval: 1, deny: 0/);
  assert.match(connectors, /connector lifecycle administration/);
  assert.match(connectors, /without introducing fake configuration controls/);
  assert.match(settings, /Configuration templates and runbooks define the current operational contract/);
  assert.match(settings, /In-product settings editors remain deferred/);
  assert.match(admin, /single-operator local baseline/);
  assert.match(admin, /Tenant lifecycle and role management UI remain deferred/);
});


test("connectors surface handles sparse context without implying connector management controls", () => {
  const connectors = renderRouteContent(getRoute("connectors"), {
    connectorInventory: [],
    moduleConnectorUsage: [],
  });

  assert.match(connectors, /No connector inventory entries are currently registered/);
  assert.match(connectors, /No module connector usage is currently mapped/);
  assert.match(connectors, /provisioning automation remain deferred/);
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
