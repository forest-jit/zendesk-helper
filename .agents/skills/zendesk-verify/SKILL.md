---
name: zendesk-verify
description: Verify Zendesk Helper extension changes with focused local checks and live Chrome evidence. Use for ticket UI, composer, status, scrolling, title, or conversation behavior changes; not documentation-only edits.
---

Define the observable acceptance condition for the changed behavior. Inspect existing tests and add a regression only when it covers a meaningful failure; do not rebuild fixtures for every visual tweak.

## Local checks
Read `package.json` when commands may have changed. Available checks:
- `npm run check:syntax`: JavaScript syntax.
- `npm run test:manifest`: extension manifest contract.
- `npm run test:workflow`: workflow guards and serialization.
- `npm test`: synthetic Playwright browser suite.
- `npm run check`: syntax, lint, resources and local behavior checks; the synthetic browser suite runs separately.

Run the relevant checks during iteration. For a delivered behavior change, run the aggregate once after the final code change when the environment supports it. If unavailable, report the exact unrun part. Do not rerun an unchanged passing suite without a reason.

## Live acceptance
Use supported browser/computer tools for the actual Chrome session running the unpacked extension. Verify the loaded version and source path when accessible; refresh the Zendesk tab after extension reload. A version in the repository does not prove Chrome loaded it.

Verify the changed interaction on a designated test ticket. Use a compact state observation to locate controls; use targeted observations afterward. Take and inspect a screenshot for visual changes. Do not substitute fixture success, DOM existence, or geometry for visual acceptance.

Check consequences relevant to the change: duplicate controls, clipping, reachable actions, scroll reachability, selected mode/status, navigation cleanup, or restoration when disabled. Test a narrow viewport or zoom when layout changes could affect it. Choose checks based on the failure, not a universal screenshot matrix.

For Send/Save tests, use only a specifically authorized test ticket and action. Prior transcripts are context, not blanket permission. Retain authorization established in the current session; do not ask again unnecessarily. Observe the persisted result before calling a submission successful.

If browser access is unavailable, complete useful local work and mark live acceptance pending. After a failed attempt, inspect the cause before retrying; do not repeat blind clicks or patch loops.

Report the loaded version, relevant test outcome, live observed result, and any unverified behavior. Stop after acceptance passes; further audits require a new reason.
