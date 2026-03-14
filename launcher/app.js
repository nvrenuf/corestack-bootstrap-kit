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
    const workflows = workflowRegistry.list();
    const approvals = approvalStore.listApprovals();
    const policyDecisions = runs.flatMap((run) => run.policyDecisions ?? []);
    const modelEvents = auditStore.listEvents().filter((event) =>
      event.event_type === "model.route.selected"
      || event.event_type === "model.execution.completed"
      || event.event_type === "model.execution.restricted");
    const toolEvents = auditStore.listEvents().filter((event) =>
      event.event_type === "tool.execution.requested"
      || event.event_type === "tool.execution.decisioned"
      || event.event_type === "tool.execution.result"
      || event.event_type === "tool.execution.failure");

    return {
      workflowCount: workflows.length,
      runCount: runs.length,
      activeRunCount: runs.filter((run) => run.status === "running" || run.status === "blocked" || run.status === "pending_approval").length,
      moduleCount: modules.length,
      modelCount: modelRegistry.list().length,
      toolGatewayEventCount: toolEvents.length,
      policyDecisionCount: policyDecisions.length,
      pendingApprovalCount: approvals.filter((approval) => approval.status === "pending").length,
      modelGovernanceEventCount: modelEvents.length,
      agentInventory: [
        {
          id: "workflow-run-orchestrator",
          role: "Workflow run orchestrator",
          status: "implemented now",
          responsibility: "Launches workflow runs, tracks step state, and keeps run↔case linkage in the core control plane.",
        },
        {
          id: "triage-model-execution-role",
          role: "AI-assisted triage execution role",
          status: "implemented now",
          responsibility: "Executes model-assisted workflow stages through local-first routing and execution restriction hooks.",
        },
        {
          id: "human-review-checkpoint-role",
          role: "Operator review checkpoint role",
          status: "partially implemented",
          responsibility: "Enforces require-approval gates before governed workflow steps continue.",
        },
        {
          id: "multi-agent-planning-role",
          role: "Autonomous multi-agent planning/assignment",
          status: "planned / deferred",
          responsibility: "Fleet-style assignment, scheduling, and autonomous collaboration are intentionally out of MVP scope.",
        },
      ],
      moduleWorkflowLinks: workflows.slice(0, 6).map((workflow) => ({
        workflowId: workflow.id,
        workflowName: workflow.name,
        moduleId: workflow.moduleId,
      })),
    };
  }

  if (routeId === "policies") {
    const approvals = approvalStore.listApprovals();
    const policyDecisions = runs.flatMap((run) => run.policyDecisions ?? []);
    const policyOutcomeCounts = policyDecisions.reduce((counts, decision) => {
      counts[decision.outcome] = (counts[decision.outcome] ?? 0) + 1;
      return counts;
    }, { allow: 0, deny: 0, require_approval: 0 });
    const pendingApprovalLinks = approvals.filter((approval) => approval.status === "pending");
    const governedActionSummary = approvals.reduce((summary, approval) => {
      const key = approval.governedAction?.type ?? "unknown";
      summary[key] = (summary[key] ?? 0) + 1;
      return summary;
    }, {});
    const modelGovernanceEvents = auditStore.listEvents().filter((event) =>
      event.event_type === "model.execution.restricted" || event.event_type === "model.route.selected");

    return {
      policyDecisionCount: policyDecisions.length,
      policyOutcomeCounts,
      governedActionSummary,
      pendingApprovals: pendingApprovalLinks.length,
      totalApprovals: approvals.length,
      runCountWithPolicyDecisions: runs.filter((run) => (run.policyDecisions?.length ?? 0) > 0).length,
      workflowCheckpointCount: pendingApprovalLinks.filter((approval) => approval.governedAction?.type === "workflow_step").length,
      modelGovernanceEventCount: modelGovernanceEvents.length,
    };
  }

  if (routeId === "models") {
    const models = modelRegistry.list();
    const approvals = approvalStore.listApprovals();
    const policyDecisions = runs.flatMap((run) => run.policyDecisions ?? []);
    const modelEvents = auditStore.listEvents().filter((event) =>
      event.event_type === "model.routing.decision"
      || event.event_type === "model.route.selected"
      || event.event_type === "model.execution.requested"
      || event.event_type === "model.execution.decisioned"
      || event.event_type === "model.execution.result"
      || event.event_type === "model.execution.restriction_blocked");

    return {
      models,
      recentModelEvents: modelEvents.slice(0, 8),
      routingPosture: {
        localCount: models.filter((model) => model.providerType === "local").length,
        externalCount: models.filter((model) => model.providerType !== "local").length,
        localFirstDefaultCount: models.filter((model) => model.localFirst).length,
        externalRestrictedCount: models.filter((model) => model.policy?.externalProviderRestricted).length,
      },
      modelUsage: [
        {
          moduleName: "Security / OSINT Module 1",
          workflowName: "Alert triage and investigation",
          modelKinds: "llm (summarize, extract.entities)",
          notes: "Workflow model execution uses core model router plus execution restriction hooks and links to run/case/audit records.",
        },
      ],
      modelGovernance: {
        policyDecisionCount: policyDecisions.length,
        runCountWithPolicyDecisions: runs.filter((run) => (run.policyDecisions?.length ?? 0) > 0).length,
        pendingApprovals: approvals.filter((approval) => approval.status === "pending").length,
        totalApprovals: approvals.length,
        restrictionBlockedCount: modelEvents.filter((event) => event.event_type === "model.execution.restriction_blocked").length,
        selectedRouteCount: modelEvents.filter((event) => event.event_type === "model.route.selected" || event.event_type === "model.routing.decision").length,
        resultEventCount: modelEvents.filter((event) => event.event_type === "model.execution.result").length,
      },
    };
  }

  if (routeId === "connectors") {
    const toolEvents = auditStore.listEvents().filter((event) =>
      event.event_type === "tool.execution.requested"
      || event.event_type === "tool.execution.decisioned"
      || event.event_type === "tool.execution.result"
      || event.event_type === "tool.execution.invalid_request");
    const connectorEventSummary = toolEvents.reduce((summary, event) => {
      if (event.event_type === "tool.execution.requested") {
        summary.requested += 1;
      } else if (event.event_type === "tool.execution.decisioned") {
        summary.decisioned += 1;
      } else if (event.event_type === "tool.execution.result") {
        summary.result += 1;
      } else if (event.event_type === "tool.execution.invalid_request") {
        summary.invalidRequest += 1;
      }
      return summary;
    }, { requested: 0, decisioned: 0, result: 0, invalidRequest: 0 });

    const gatewayPolicySummary = toolEvents.reduce((summary, event) => {
      if (event.event_type !== "tool.execution.decisioned") {
        return summary;
      }

      const outcome = event.payload?.outcome;
      if (outcome === "allow") {
        summary.allow += 1;
      } else if (outcome === "require_approval") {
        summary.requireApproval += 1;
      } else if (outcome === "deny") {
        summary.deny += 1;
      }
      return summary;
    }, { allow: 0, deny: 0, requireApproval: 0 });

    const models = modelRegistry.list();

    return {
      connectorInventory: [
        {
          id: "web.fetch",
          boundary: "external HTTP/HTTPS retrieval via tool gateway",
          status: "implemented",
          notes: "Schema-validated request shape, allowlist and policy checks, fail-closed behavior, and audit/security event correlation are active.",
        },
        {
          id: "web.search",
          boundary: "external search provider path via tool gateway",
          status: "implemented",
          notes: "Governed execution and normalized result/error contracts are active on the MVP-supported gateway path.",
        },
        {
          id: "connector lifecycle administration",
          boundary: "provisioning, credentials, and per-tenant connector management",
          status: "planned/deferred",
          notes: "No in-product connector configuration UI is implemented in this slice.",
        },
      ],
      connectorEventSummary,
      gatewayPolicySummary,
      moduleConnectorUsage: [
        {
          moduleName: "Security / OSINT Module 1",
          workflowName: "Alert triage and investigation",
          notes: "Workflow depends on governed external collection paths (web.fetch/web.search contracts) and reviews outcomes through Runs/Cases/Audit surfaces.",
        },
      ],
      localModelCount: models.filter((model) => model.providerType === "local").length,
      externalModelCount: models.filter((model) => model.providerType !== "local").length,
    };
  }

  if (routeId === "settings") {
    const approvals = approvalStore.listApprovals();
    const models = modelRegistry.list();
    const policyDecisionCount = runs.reduce((count, run) => count + (run.policyDecisions?.length ?? 0), 0);
    const governanceEventCount = auditStore
      .listEvents()
      .filter((event) =>
        event.event_type === "model.route.selected"
        || event.event_type === "model.execution.completed"
        || event.event_type === "model.execution.restricted"
        || event.event_type === "tool.execution.decisioned"
        || event.event_type === "tool.execution.result").length;

    return {
      runtimeDefaults: {
        localModelCount: models.filter((model) => model.providerType === "local").length,
        externalModelCount: models.filter((model) => model.providerType !== "local").length,
        moduleCount: modules.length,
        workflowCount: workflowRegistry.list().length,
        connectorPathCount: 2,
      },
      readinessSignals: {
        runCount: runs.length,
        caseCount: cases.length,
        pendingApprovalCount: approvals.filter((approval) => approval.status === "pending").length,
        policyDecisionCount,
        governanceEventCount,
      },
      coreDependencyPosture: [
        {
          area: "Policies",
          state: "implemented now",
          notes: "Run policy decisions and approval checkpoints define the active governance boundary for runtime behavior.",
        },
        {
          area: "Models",
          state: "implemented now",
          notes: "Model routing remains local-first by contract, with explicit restriction hooks and audit visibility.",
        },
        {
          area: "Connectors",
          state: "partially implemented",
          notes: "Governed web.fetch/web.search paths are active; connector onboarding and credential lifecycle tooling are deferred.",
        },
        {
          area: "Admin / Tenancy",
          state: "planned/deferred",
          notes: "Settings posture references tenancy/admin boundaries but does not implement RBAC, SSO, or tenant lifecycle controls.",
        },
      ],
      docsEntryPoints: [
        {
          label: "Tool-system runbook",
          path: "docs/tool-system/RUNBOOK.md",
          notes: "Defines current supported runtime/config operation path and validation expectations.",
        },
        {
          label: "Threat model",
          path: "docs/tool-system/THREAT_MODEL.md",
          notes: "Documents trust boundaries, fail-closed assumptions, and local-first constraints.",
        },
        {
          label: "Configuration defaults",
          path: "config/global.defaults.yaml",
          notes: "Captures baseline defaults consumed by MVP runtime paths.",
        },
      ],
    };
  }

  if (routeId === "admin-tenancy") {
    const approvals = approvalStore.listApprovals();
    const governanceEventCount = auditStore
      .listEvents()
      .filter((event) =>
        event.event_type === "run.lifecycle.created"
        || event.event_type === "approval.lifecycle.requested"
        || event.event_type === "tool.execution.decisioned"
        || event.event_type === "model.execution.restricted").length;

    return {
      adminBaseline: {
        mode: "single-operator local baseline",
        runCount: runs.length,
        caseCount: cases.length,
        approvalCount: approvals.length,
        pendingApprovalCount: approvals.filter((approval) => approval.status === "pending").length,
        governanceEventCount,
      },
      tenancyBoundaries: [
        {
          area: "Case/run/evidence linkage",
          state: "implemented now",
          notes: "Workflow outputs remain correlated through core contracts so future tenant isolation can be applied consistently.",
        },
        {
          area: "Policy and audit correlation",
          state: "implemented now",
          notes: "Actor/correlation metadata is retained on governed actions and review events for future scoped access layers.",
        },
        {
          area: "Runtime isolation controls",
          state: "partially implemented",
          notes: "Current MVP is local-first and single-operator, without a full runtime-enforced tenant segmentation plane.",
        },
      ],
      deferredControls: [
        {
          control: "Tenant lifecycle management",
          status: "planned/deferred",
          notes: "No create/suspend/delete tenant workflows are implemented in this slice.",
        },
        {
          control: "Role-based authorization",
          status: "planned/deferred",
          notes: "No RBAC/SSO control surface or policy-bound identity administration is implemented.",
        },
        {
          control: "Delegated admin operations",
          status: "planned/deferred",
          notes: "No multi-admin delegation, scoped approval routing, or enterprise IAM integration is available.",
        },
      ],
    };
  }

  if (routeId === "modules") {
    const workflows = workflowRegistry.list();
    const approvals = approvalStore.listApprovals();
    const evidenceItems = evidenceStore.listEvidenceItems();
    const artifacts = evidenceStore.listArtifacts();
    const findings = evidenceStore.listFindings();
    const moduleWorkflowLinks = workflows
      .filter((workflow) => workflow.moduleId)
      .map((workflow) => ({
        workflowId: workflow.id,
        workflowName: workflow.name,
        moduleId: workflow.moduleId,
      }));

    const module1Runs = runs.filter((run) => run.moduleId === "security-osint-module-1");
    const module1RunIds = new Set(module1Runs.map((run) => run.runId));
    const module1CaseIds = new Set(module1Runs.map((run) => run.caseId).filter(Boolean));
    const module1AuditEvents = auditStore
      .listEvents()
      .filter((event) => module1RunIds.has(event.correlation?.run_id));

    return {
      modules,
      moduleWorkflowLinks,
      surfaceRelationships: [
        {
          surface: "Launcher",
          state: "implemented now",
          notes: "Module-contributed workflow start paths are launched through the shared core launcher.",
        },
        {
          surface: "Runs / Cases / Evidence",
          state: "implemented now",
          notes: "Module workflow execution writes to core run, case, evidence, artifact, and finding contracts.",
        },
        {
          surface: "Investigation Workspace / Logs / Audit",
          state: "implemented now",
          notes: "Module-linked investigations are reviewed through shared workspace and correlated audit/event surfaces.",
        },
        {
          surface: "Policies / Models / Connectors / Agents",
          state: "partially implemented",
          notes: "Current module participation is visible through existing policy, model-routing, tool-gateway, and execution-role posture.",
        },
        {
          surface: "Module platform lifecycle",
          state: "planned / deferred",
          notes: "No marketplace, packaging/distribution, entitlement, or install/update manager is implemented in this MVP slice.",
        },
      ],
      module1Capability: {
        workflowId: "security-osint.alert-triage",
        workflowName: "Alert triage and investigation",
        runCount: module1Runs.length,
        caseCount: module1CaseIds.size,
        evidenceCount: evidenceItems.filter((item) => module1RunIds.has(item.runId)).length,
        artifactCount: artifacts.filter((item) => module1RunIds.has(item.runId)).length,
        findingCount: findings.filter((item) => module1RunIds.has(item.runId)).length,
        approvalCount: approvals.filter((approval) => module1RunIds.has(approval.links?.runId)).length,
        auditEventCount: module1AuditEvents.length,
      },
      statusFraming: {
        implementedNow: [
          "Module registration inventory is visible with current module/capability posture.",
          "Security / OSINT Module 1 contribution to workflow execution and investigation data paths is explicitly mapped.",
          "Core-owned surface relationship framing shows how module capability is consumed across existing control-plane surfaces.",
        ],
        partiallyImplemented: [
          "Participation across policies/models/connectors/agents is visibility-first and bounded to the current workflow path.",
        ],
        plannedDeferred: [
          "Module packaging, marketplace/catalog, licensing/entitlements, and lifecycle management UX remain intentionally out of scope.",
        ],
      },
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
