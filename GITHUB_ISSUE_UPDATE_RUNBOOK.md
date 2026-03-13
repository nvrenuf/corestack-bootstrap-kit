# GitHub Issue Update Runbook

This runbook is the fallback execution bundle for the Corestack planning refactor.

Status:
- `ISSUES_ORDER.md` is present at the repo root and already matches the Milestone 0-4 sequence.
- The authoritative issue draft source is [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md).
- GitHub CLI authentication is available, but issue writes were blocked by API connectivity during execution.
- No wording changes were needed in the planning source files.

## Recommended Order

1. Update the four existing issue bodies: `#12`, `#2`, `#10`, `#9`.
2. Create the five new Milestone 0 planning issues.
3. Create the two replacement issues for old `#8`.
4. Close old `#8` with the close note in this file.
5. Re-check [ISSUES_ORDER.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/ISSUES_ORDER.md) against the resulting GitHub issue numbers and milestone grouping.

## Update Existing Issues

Use the exact body content from the matching section in [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md).

1. Update `#2`
   Title:
   `Define and implement Corestack control plane architecture`
   Source section:
   `## Rewritten Existing Issues` -> `### #2 Define and implement Corestack control plane architecture`

2. Update `#9`
   Title:
   `Implement model management and routing layer`
   Source section:
   `## Rewritten Existing Issues` -> `### #9 Implement model management and routing layer`

3. Update `#10`
   Title:
   `Build workflow engine and orchestration layer`
   Source section:
   `## Rewritten Existing Issues` -> `### #10 Build workflow engine and orchestration layer`

4. Update `#12`
   Title:
   `Define product surface area: UI/UX, admin, and day-2 operations`
   Source section:
   `## Rewritten Existing Issues` -> `### #12 Define product surface area: UI/UX, admin, and day-2 operations`

## Create New Planning Issues

Use the exact body content from the matching section in [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md).

1. Create issue
   Title:
   `Core vs Module boundary`
   Source section:
   `## New Planning Issues` -> `### Core vs Module boundary`

2. Create issue
   Title:
   `Security/OSINT Module 1 definition`
   Source section:
   `## New Planning Issues` -> `### Security/OSINT Module 1 definition`

3. Create issue
   Title:
   `Agent sandbox / gatekeeper security model`
   Source section:
   `## New Planning Issues` -> `### Agent sandbox / gatekeeper security model`

4. Create issue
   Title:
   `Evidence and case object model`
   Source section:
   `## New Planning Issues` -> `### Evidence and case object model`

5. Create issue
   Title:
   `Approvals and human-in-the-loop decision model`
   Source section:
   `## New Planning Issues` -> `### Approvals and human-in-the-loop decision model`

## Create Replacement Issues For Old #8

Use the exact body content from the matching section in [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md).

1. Create issue
   Title:
   `Platform observability and ops telemetry`
   Source section:
   `## Split Issue Drafts for #8` -> `### Platform observability and ops telemetry`

2. Create issue
   Title:
   `Security audit, forensics, and evidence trails`
   Source section:
   `## Split Issue Drafts for #8` -> `### Security audit, forensics, and evidence trails`

## Close Note For Old #8

Close issue `#8` with this exact note after the two replacement issues exist:

`Superseded by #[observability_issue_number] (Platform observability and ops telemetry) and #[forensics_issue_number] (Security audit, forensics, and evidence trails). Closing #8 to keep operational telemetry separate from forensic audit and evidence-chain work.`

## Optional `gh` CLI Command Sequence

Replace each `[body]` placeholder by pasting the exact matching section body from [docs/roadmap/CORESTACK_ISSUE_DRAFTS.md](/Users/leecuevas/Projects/corestack-bootstrap-kit/docs/roadmap/CORESTACK_ISSUE_DRAFTS.md).

```bash
gh issue edit 12 --title "Define product surface area: UI/UX, admin, and day-2 operations" --body "[body]"
gh issue edit 2 --title "Define and implement Corestack control plane architecture" --body "[body]"
gh issue edit 10 --title "Build workflow engine and orchestration layer" --body "[body]"
gh issue edit 9 --title "Implement model management and routing layer" --body "[body]"

gh issue create --title "Core vs Module boundary" --body "[body]"
gh issue create --title "Security/OSINT Module 1 definition" --body "[body]"
gh issue create --title "Agent sandbox / gatekeeper security model" --body "[body]"
gh issue create --title "Evidence and case object model" --body "[body]"
gh issue create --title "Approvals and human-in-the-loop decision model" --body "[body]"

gh issue create --title "Platform observability and ops telemetry" --body "[body]"
gh issue create --title "Security audit, forensics, and evidence trails" --body "[body]"

gh issue close 8 --comment "Superseded by #[observability_issue_number] (Platform observability and ops telemetry) and #[forensics_issue_number] (Security audit, forensics, and evidence trails). Closing #8 to keep operational telemetry separate from forensic audit and evidence-chain work."
```
