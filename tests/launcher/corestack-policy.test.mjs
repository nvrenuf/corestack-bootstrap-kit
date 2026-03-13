import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  POLICY_DECISION_OUTCOMES,
  buildPolicyContext,
  buildRunPolicyReference,
  createGovernedActionRequest,
  createPolicyDecision,
  validatePolicyDecision,
} from "../../launcher/corestack-policy.mjs";

test("policy contract supports the expected minimal decision outcomes", () => {
  assert.deepEqual(POLICY_DECISION_OUTCOMES, ["allow", "deny", "require_approval"]);
});

test("governed action requests capture reusable subject, resource, context, and audit framing", () => {
  const request = createGovernedActionRequest({
    requestId: "policy-request-1",
    action: "execute",
    purpose: "launch governed tool call",
    subject: {
      kind: "tool",
      id: "web.fetch",
      capability: "web.fetch",
    },
    resource: {
      kind: "external_resource",
      locator: "https://example.com",
      classification: "osint",
    },
    context: {
      actor: { actor_id: "analyst-1", actor_type: "user" },
      module_id: "security-osint-module-1",
      workflow_id: "security-osint.alert-triage",
      run_id: "run-1",
      case_id: "case-1",
      correlation_id: "corr-1",
    },
  });

  assert.equal(request.subject.kind, "tool");
  assert.equal(request.resource.kind, "external_resource");
  assert.equal(request.audit.event_type, "policy.decision");
  assert.equal(request.context.correlation_id, "corr-1");
});

test("require_approval decisions carry future approval-compatible fields", () => {
  const decision = createPolicyDecision({
    decisionId: "policy-decision-1",
    requestId: "policy-request-1",
    outcome: "require_approval",
    reasons: [
      { code: "EXTERNAL_SCOPE_REVIEW", message: "Requested scope requires review." },
    ],
    approval: {
      required: true,
      subject_ref: "approval-subject-1",
      approver_role: "ir-lead",
    },
    audit: {
      correlation_id: "corr-1",
    },
  });

  assert.equal(decision.outcome, "require_approval");
  assert.equal(decision.approval.required, true);
  assert.equal(decision.audit.correlation_id, "corr-1");
});

test("invalid approval-required decisions are rejected without building approval execution flow", () => {
  assert.throws(
    () =>
      validatePolicyDecision({
        decision_id: "policy-decision-2",
        request_id: "policy-request-1",
        outcome: "require_approval",
        reasons: [{ code: "REVIEW", message: "Review required." }],
        approval: null,
        decided_at: "2026-03-13T00:00:00.000Z",
        audit: {
          event_type: "policy.decision",
          correlation_id: "corr-1",
        },
      }),
    /decision\.approval must be an object/,
  );
});

test("run and case scaffolding can derive policy-ready context without enforcing a policy engine", () => {
  const workflow = {
    id: "security-osint.alert-triage",
    moduleId: "security-osint-module-1",
  };
  const actor = { actorId: "local-operator", actorType: "user" };
  const caseRecord = { caseId: "case-1" };

  const context = buildPolicyContext({ workflow, actor, caseRecord });
  const reference = buildRunPolicyReference({ workflow, actor, caseRecord });

  assert.equal(context.workflow_id, workflow.id);
  assert.equal(context.case_id, "case-1");
  assert.match(reference.governedActionTypes.join(","), /tool/);
  assert.equal(reference.policyDecisions.length, 0);
});

test("policy decision schema preserves the minimal canonical outcome enum", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const schemaPath = path.resolve(here, "../../schemas/policy/decision.schema.json");
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));

  assert.equal(schema.$id, "https://corestack.dev/schemas/policy/decision.schema.json");
  assert.deepEqual(schema.$defs.policy_decision.properties.outcome.enum, [
    "allow",
    "deny",
    "require_approval",
  ]);
});
