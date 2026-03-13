function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

export const MODULE_STATUSES = ["active", "preview", "disabled"];

function assertNonEmptyString(value, fieldName) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`module ${fieldName} must be a non-empty string`);
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function validateModuleDefinition(definition) {
  assertNonEmptyString(definition?.id, "id");
  assertNonEmptyString(definition?.name, "name");

  if (!MODULE_STATUSES.includes(definition?.status)) {
    throw new Error(`module status must be one of: ${MODULE_STATUSES.join(", ")}`);
  }

  const capabilities = normalizeArray(definition.capabilities);
  for (const capability of capabilities) {
    assertNonEmptyString(capability?.id, "capability id");
    assertNonEmptyString(capability?.label, "capability label");
  }

  const launcherEntries = normalizeArray(definition?.controlPlane?.launcherEntries);
  for (const entry of launcherEntries) {
    assertNonEmptyString(entry?.workflowId, "launcher workflowId");
    assertNonEmptyString(entry?.label, "launcher label");
  }
}

export function createModuleRegistry(definitions = []) {
  const modules = new Map();

  for (const definition of definitions) {
    validateModuleDefinition(definition);
    if (modules.has(definition.id)) {
      throw new Error(`module already registered: ${definition.id}`);
    }

    modules.set(definition.id, clone(definition));
  }

  return {
    get(moduleId) {
      const module = modules.get(moduleId);
      return module ? clone(module) : null;
    },
    list({ includeDisabled = false } = {}) {
      return Array.from(modules.values())
        .filter((module) => includeDisabled || module.status !== "disabled")
        .map(clone);
    },
    register(definition) {
      validateModuleDefinition(definition);
      if (modules.has(definition.id)) {
        throw new Error(`module already registered: ${definition.id}`);
      }

      modules.set(definition.id, clone(definition));
      return this.get(definition.id);
    },
  };
}

export function createSecurityOsintModule1Definition() {
  return {
    id: "security-osint-module-1",
    name: "Security / OSINT Module 1",
    status: "active",
    capabilities: [
      {
        id: "investigation.alert-triage",
        label: "Alert triage and investigation",
        surfaces: ["launcher", "runs", "cases-evidence", "approvals"],
      },
    ],
    controlPlane: {
      launcherEntries: [
        {
          workflowId: "security-osint.alert-triage",
          label: "Launch alert triage run",
          route: "#/launcher?start=security-osint-alert-triage",
        },
      ],
      navBadges: ["Module"],
    },
    metadata: {
      domain: "security-osint",
      description: "Core-owned Security/OSINT capability slice registered through module contract.",
    },
    associations: {
      workflowIds: ["security-osint.alert-triage"],
      policyProfileIds: [],
      modelProfileIds: [],
    },
  };
}
