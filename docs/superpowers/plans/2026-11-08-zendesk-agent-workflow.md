# Zendesk Agent Workflow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add guarded reply/save workflows, scoped keyboard save, local ticket exports, and personal themes to Zendesk Helper.

**Architecture:** Extend the content script with a small native-control adapter and an extension-owned workflow bar mounted only in the visible ticket workspace. Keep export serialization in a separate pure module and store only preferences in Chrome storage.

**Tech Stack:** Chrome Manifest V3, vanilla JavaScript/CSS, Node assertions, Playwright, live Zendesk through connected Chrome.

**Spec:** `docs/superpowers/specs/2026-11-08-zendesk-agent-workflow-design.md`

## Global Constraints

- No new host permissions or ticket-body storage.
- Never automatically submit, reply, note, or change status.
- Helper save delegates once to verified native Zendesk controls.
- Themes never restyle generic native controls.
- Real mutation testing requires separate action-time confirmation; local tests cover submit paths.

## Review Focus

- Ambiguous or missing reply/status controls must disable helper save safely.
- Public confirmation must clear on mode or content change.
- Repeated Command-Enter and rapid clicks must produce at most one native submit click.
- Cached workspaces must never receive active workflow state or keyboard actions.
- Export must remain literal/sanitized and make incomplete visible-DOM scope explicit.

---

### Task 1: Fixture and pure workflow/export modules

**Files:**
- Create: `workflow.js`
- Create: `exporter.js`
- Create: `tests/workflow.cjs`
- Modify: `tests/fixtures/zendesk-ticket.html`
- Modify: `package.json`

**Interfaces:**
- Produces `globalThis.zdhWorkflow` helpers for mode/status/save gating.
- Produces `globalThis.zdhExporter.collect(document, location)` and `.serialize(ticket, format)`.

- [ ] Write failing pure tests for public confirmation, status mappings, save locks, export schema, Markdown escaping, and filename sanitization.
- [ ] Run the tests and verify RED.
- [ ] Implement the minimal pure modules and representative native fixture controls.
- [ ] Run the tests and verify GREEN.
- [ ] Commit `feat: add guarded workflow and export models`.

### Task 2: Workflow bar, reply safeguards, status, and save

**Files:**
- Modify: `manifest.json`
- Modify: `content.js`
- Modify: `content.css`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes `zdhWorkflow` and Zendesk native controls.
- Produces one `[data-zdh-workflow]` bar per active workspace and `zdTitleHelper.saveActive()`.

- [ ] Add failing browser tests for safe Internal note default on empty drafts, no switch on nonempty drafts, public-review gating, draft-only status selection, verified native status mapping, single-click save, cleanup, and ambiguous-state disabling.
- [ ] Run browser tests and verify RED.
- [ ] Implement the native-control adapter and workflow bar without changing native controls' styling.
- [ ] Run the full suite and verify GREEN.
- [ ] Commit `feat: add guarded Zendesk save workflow`.

### Task 3: Scoped Command-Enter

**Files:**
- Modify: `content.js`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes `zdTitleHelper.saveActive()`.

- [ ] Add failing tests for active-workspace scope, Meta+Enter only, repeat/composition rejection, and save-lock deduplication.
- [ ] Run browser tests and verify RED.
- [ ] Implement the capturing key handler through the existing guarded save path.
- [ ] Run the full suite and verify GREEN.
- [ ] Commit `feat: add scoped command enter save`.

### Task 4: Explicit JSON and Markdown export

**Files:**
- Modify: `manifest.json`
- Modify: `content.js`
- Modify: `tests/browser.cjs`
- Modify: `README.md`

**Interfaces:**
- Consumes `zdhExporter`.
- Produces explicit local download actions in the workflow bar.

- [ ] Add failing browser tests that capture object URLs/download filenames and assert no network or storage writes.
- [ ] Run tests and verify RED.
- [ ] Implement JSON and Markdown buttons with local Blob downloads and visible-scope disclosure.
- [ ] Run the full suite and verify GREEN.
- [ ] Commit `feat: export visible ticket evidence locally`.

### Task 5: Personal themes and popup settings

**Files:**
- Modify: `popup.html`
- Modify: `popup.js`
- Modify: `popup.css`
- Modify: `content.js`
- Modify: `content.css`
- Modify: `tests/browser.cjs`
- Modify: `FEATURES.md`
- Modify: `README.md`

**Interfaces:**
- Extends stored preferences with `theme: 'system'|'calm'|'contrast'`.
- Applies `data-zdh-theme` only to extension-owned/overlay roots.

- [ ] Add failing storage/message/theme tests for defaults, persistence, active workspace, list view, and turn-off cleanup.
- [ ] Run tests and verify RED.
- [ ] Implement theme UI/tokens and update documentation/checklist.
- [ ] Run Impeccable context/craft-floor, full checks, detector, screenshots, and live read-only Chrome verification.
- [ ] Commit `feat: add personal Zendesk Helper themes`.

### Task 6: Final review

**Files:**
- Modify only for verified Critical/Important findings.

- [ ] Run `npm run check`, Hallmark sloplint, Impeccable audit/detect, and `git diff --check`.
- [ ] Review permissions, native-control ownership, save deduplication, export privacy, accessibility, and rollback.
- [ ] Fix verified Critical/Important findings through RED-GREEN.
- [ ] Record live limitations and final implemented behavior.

