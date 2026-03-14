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
