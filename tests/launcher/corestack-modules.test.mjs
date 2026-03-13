import test from "node:test";
import assert from "node:assert/strict";

import {
  MODULE_STATUSES,
  createModuleRegistry,
  createSecurityOsintModule1Definition,
} from "../../launcher/corestack-modules.mjs";

test("module contract exposes expected status values", () => {
  assert.deepEqual(MODULE_STATUSES, ["active", "preview", "disabled"]);
});

test("security osint module 1 is valid and registerable", () => {
  const registry = createModuleRegistry([createSecurityOsintModule1Definition()]);
  const module = registry.get("security-osint-module-1");

  assert.equal(module.name, "Security / OSINT Module 1");
  assert.equal(module.status, "active");
  assert.equal(module.controlPlane.launcherEntries[0].workflowId, "security-osint.alert-triage");
});

test("registry rejects invalid and duplicate registrations", () => {
  assert.throws(
    () => createModuleRegistry([{ id: "module-1", name: "Module 1", status: "unknown" }]),
    /module status must be one of/,
  );

  const registry = createModuleRegistry([createSecurityOsintModule1Definition()]);
  assert.throws(
    () => registry.register(createSecurityOsintModule1Definition()),
    /module already registered/,
  );
});

test("list hides disabled modules by default", () => {
  const registry = createModuleRegistry([
    createSecurityOsintModule1Definition(),
    {
      id: "security-osint-module-disabled",
      name: "Security / OSINT Module Disabled",
      status: "disabled",
      capabilities: [{ id: "noop", label: "No-op" }],
      controlPlane: { launcherEntries: [] },
      metadata: {},
      associations: {},
    },
  ]);

  assert.equal(registry.list().length, 1);
  assert.equal(registry.list({ includeDisabled: true }).length, 2);
});
