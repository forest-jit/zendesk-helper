# Zendesk Live Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Zendesk Helper load automatically on the approved Jones IT agent origin, preserve Zendesk-native control styling, add an explicit title-suggestion action, and validate the result on five real test tickets.

**Architecture:** Manifest V3 declarative content scripts load CSS and JavaScript at `document_idle`. `chrome.storage.local` holds only enabled/layout/context preferences, while popup-to-content-script messages apply changes immediately. The overlay owns pane and table layout only; Zendesk owns native control and focus states.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/CSS, Node assertions, Playwright, live Zendesk through the connected browser.

**Spec:** `docs/superpowers/specs/2026-11-08-zendesk-live-overlay-design.md`

## Global Constraints

- Match only `https://itjones.zendesk.com/agent/*`.
- Persist only `enabled`, `layout`, and `context` preferences.
- Default to `enabled: true`, `layout: true`, `context: false` after installation.
- Preserve Zendesk-native controls, focus rings, save actions, public/private state, and DOM order.
- Never silently rewrite, save, submit, reply to, or change status on a ticket.
- Live mutations stay within the five Forest Welch / Jones IT test tickets.
- Browser confirmation is required immediately before the five ticket-creation submissions.

## Review Focus

- A disabled preference must survive navigation and extension popup reopen without the content script re-enabling itself.
- Repeated content-script execution or SPA navigation must not duplicate listeners, warnings, or layout attributes.
- Missing `chrome.storage` in local tests must fall back safely without changing production semantics.
- Zendesk cached/hidden workspaces must remain unstyled while the visible workspace changes.
- Applying a title suggestion must dispatch the same observable input/change events as a user edit while never saving the ticket.

---

### Task 1: Automatic content scripts and persisted preferences

**Files:**
- Create: `tests/manifest.cjs`
- Modify: `manifest.json`
- Modify: `content.js`
- Modify: `popup.js`
- Modify: `popup.html`
- Modify: `package.json`

**Interfaces:**
- Produces: stored preferences `{ enabled: boolean, layout: boolean, context: boolean }`.
- Produces: content-script messages `zdh-configure`, `zdh-set-enabled`, and `zdh-manual-select`.
- Consumed by: Tasks 2–4 and the live browser workflow.

- [ ] **Step 1: Write the failing manifest contract test**

Add `tests/manifest.cjs` asserting literal host scope, automatic CSS/JS order, `document_idle`, `storage`, and the absence of `activeTab`/`scripting`.

- [ ] **Step 2: Run the manifest test and verify RED**

Run: `node tests/manifest.cjs`

Expected: FAIL because `content_scripts`, `host_permissions`, and `storage` are absent.

- [ ] **Step 3: Implement the minimal manifest change**

Add the exact declarative injection configuration and bump the extension/package version to `0.5.0`.

- [ ] **Step 4: Run the manifest test and verify GREEN**

Run: `node tests/manifest.cjs`

Expected: PASS.

- [ ] **Step 5: Extend the browser test with a fake Chrome storage/runtime boundary**

Add assertions that automatic startup uses the default preferences, a stored disabled preference leaves the layout untouched, and runtime messages reconfigure or disable the helper.

- [ ] **Step 6: Run the browser test and verify RED**

Run: `npm test`

Expected: FAIL because startup storage and message handling do not exist.

- [ ] **Step 7: Implement startup and popup preference behavior**

In `content.js`, add one initialization path and one runtime message listener. In `popup.js`, replace execute/insert CSS calls with storage writes and `tabs.sendMessage`; initialize the form from storage. Update popup copy to describe automatic loading.

- [ ] **Step 8: Run the whole task suite and commit**

Run: `npm run check`

Expected: syntax, manifest, and browser tests PASS.

Commit: `feat: apply Zendesk overlay automatically`

### Task 2: Preserve Zendesk-native control and focus styling

**Files:**
- Modify: `content.css`
- Modify: `tests/fixtures/zendesk-ticket.html`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes: automatic `content.css` injection from Task 1.
- Produces: pane/table-only styling with no generic native-control state overrides.

- [ ] **Step 1: Add a failing native-focus preservation test**

Give the fixture requester input a representative Zendesk-native dashed focus treatment and assert keyboard focus retains that computed style after `content.css` loads.

- [ ] **Step 2: Run the browser test and verify RED**

Run: `npm test`

Expected: FAIL because the current extension forces a solid focus outline.

- [ ] **Step 3: Remove broad control overrides**

Delete extension rules that restyle generic inputs, selects, textareas, buttons, labels, focus, active, and disabled states. Keep layout, pane surfaces, table spacing, overflow, and stable typography only.

- [ ] **Step 4: Run CSS gates and browser tests and verify GREEN**

Run: `node /Users/chicken/.codex/skills/hallmark/scripts/sloplint.mjs content.css --scope app && npm test`

Expected: Hallmark clean; native-focus preservation and existing layout tests PASS.

- [ ] **Step 5: Commit**

Commit: `fix: preserve Zendesk native control states`

### Task 3: User-triggered title suggestion

**Files:**
- Modify: `content.js`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes: `zdTitleReview(value, identity)` from `validator.js`.
- Produces: accessible **Use suggestion** action for `duplicate-identity` findings.

- [ ] **Step 1: Add a failing suggestion-action test**

Assert that a duplicate-prefix warning exposes **Use suggestion**, clicking it changes only the subject value to the literal suggestion, dispatches one `input` and one `change` event, clears the warning, and causes no form submit.

- [ ] **Step 2: Run the browser test and verify RED**

Run: `npm test`

Expected: FAIL because the warning has no suggestion action.

- [ ] **Step 3: Implement the minimal explicit action**

Use an open shadow root for inspectable/accessibility-friendly warning controls. Add **Use suggestion** only for duplicate-prefix warnings; set the active subject, dispatch bubbling `input` and `change`, clear the warning, and return focus. Do not call form submission or Zendesk actions.

- [ ] **Step 4: Run the whole task suite and verify GREEN**

Run: `npm run check`

Expected: all tests PASS with zero submit events.

- [ ] **Step 5: Commit**

Commit: `feat: add explicit title suggestion action`

### Task 4: Live Zendesk verification and five-ticket test set

**Files:**
- Modify: `FEATURES.md`
- Modify: `README.md`

**Interfaces:**
- Consumes: Task 1 automatic injection, Task 2 native-control CSS, Task 3 title action.
- Produces: five live Zendesk test ticket IDs and workflow evidence.

- [ ] **Step 1: Reload the unpacked extension and refresh Zendesk**

Verify the manifest version is `0.5.0`, the overlay appears without opening the popup, and **Turn off** persists across navigation.

- [ ] **Step 2: Validate read-only workflows on the current ticket and Views**

Check the active workspace only, ticket-list table, native focus/highlight, 1000px/1280px/wide layout, 125%/150%/200% zoom, context toggle, and restoration. Record failures before mutation testing.

- [ ] **Step 3: Prepare five ticket forms**

Use requester Forest Welch, organization Jones IT, the five exact subjects in the spec, and bodies stating they are fictional extension tests. Do not submit yet.

- [ ] **Step 4: Request action-time confirmation**

State that the next browser actions will create five real Zendesk tickets and may trigger normal Zendesk automation/notifications. Wait for confirmation.

- [ ] **Step 5: Create and verify the tickets**

Submit each once, record the resulting IDs, confirm requester/organization/subject, and do not add public replies or status changes beyond creation defaults.

- [ ] **Step 6: Exercise the approved live workflows**

Use only those five tickets to test title warnings/suggestions, navigation, composer mode visibility, status menu layout, and reversible overlay preferences. Do not save comments or change statuses unless a later step explicitly requires it.

- [ ] **Step 7: Update documentation and commit**

Record ticket IDs, viewports, results, and limitations in `FEATURES.md`; update reload/permission instructions in `README.md`.

Commit: `docs: record live Zendesk overlay verification`

### Task 5: Final verification and review

**Files:**
- Modify only if a verified Critical/Important review finding requires a TDD fix.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: verified release candidate and review record.

- [ ] **Step 1: Run all local checks**

Run: `npm run check && node /Users/chicken/.codex/skills/hallmark/scripts/sloplint.mjs content.css --scope app`

Expected: all tests PASS and Hallmark reports zero open findings.

- [ ] **Step 2: Run Impeccable detector once**

Run: `IMPECCABLE_HOME=/tmp/zdh-impeccable-cache .agents/skills/impeccable/scripts/impeccable detect --json content.css popup.css popup.html`

Expected: no Priority findings; fix any real issue through RED→GREEN.

- [ ] **Step 3: Review the complete diff against the spec**

Check host scope, preference persistence, native control ownership, no silent title mutation, no save/send code, and live-ticket boundary.

- [ ] **Step 4: Commit any final verified fixes and hand off**

Report exact verification evidence, ticket IDs, live limitations, and deferred minor findings.
