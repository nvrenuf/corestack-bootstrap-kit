import test from "node:test";
import assert from "node:assert/strict";

import {
  TOP_LEVEL_ROUTES,
  getRoute,
  normalizeRoute,
  renderModuleHook,
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
  assert.match(rendered, /href="http:\/\/localhost:11434\/api\/tags"/);
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
  assert.match(rendered, /href="http:\/\/localhost:11434\/api\/tags"/);
  assert.match(rendered, /Ollama API/);
  assert.match(rendered, /DB Admin \/ Adminer/);
  assert.match(rendered, /href="http:\/\/localhost:8081\/"/);
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
