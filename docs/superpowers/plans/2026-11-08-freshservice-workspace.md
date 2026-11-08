# Freshservice-Inspired Zendesk Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an adaptive, Freshservice-inspired Zendesk ticket workspace with separate Send and property Save actions, full-page scrolling, condensed conversations and images, and workspace-wide themes.

**Architecture:** Zendesk remains the source of truth. Pure workflow helpers decide whether Send or Save is allowed; `content.js` adapts verified native controls and mounts extension-owned controls near the composer and properties sidebar; scoped CSS reorganizes and themes the active workspace without replacing Zendesk state.

**Tech Stack:** Chrome Manifest V3, plain JavaScript, CSS, Node assertions, Playwright browser tests

**Spec:** `docs/superpowers/specs/2026-11-08-freshservice-workspace-design.md`

## Global Constraints

- Use only the approved `https://itjones.zendesk.com/agent/*` origin and add no network requests or API permissions.
- Native Zendesk controls perform mode, send, status, and save actions; selector mismatch fails closed.
- Send preserves current status. Save requires an empty composer and never sends a draft.
- Never invent requester, SLA, priority, status, or conversation data.
- Live verification must not click Send or Save.
- At narrow widths, retain Zendesk's native layout.
- Store preferences only; never persist ticket content.

## Review Focus

- Whitespace-only and rich-text placeholder composer content must count as empty for property Save and as empty for Send.
- Multiple mounted/hidden Zendesk workspaces must never route an action to an inactive ticket.
- SPA navigation and newly added comments must recalculate conversation collapse and image previews without duplicate controls.
- A selector mismatch or delayed Zendesk menu must disable/fail an action without clicking a similarly named unrelated control.
- Keyboard users and reduced-motion users must be able to expand conversations and open/close image previews without hover.

---

### Task 1: Pure Send and Save Workflow Model

**Files:**
- Modify: `workflow.js`
- Modify: `tests/workflow.cjs`

**Interfaces:**
- Consumes: existing `normalizeMode`, `statuses`, `submitLabel`, and action-lock behavior.
- Produces: `composerHasContent(value) -> boolean`, `canSend({mode, publicReviewed, composerContent, busy, nativeReady}) -> {allowed, reason}`, and `canSaveProperties({composerContent, status, busy, nativeReady}) -> {allowed, reason}`.

- [ ] **Step 1: Write failing model tests**

Add assertions that Send requires content, verified native controls, and public review only in Public mode; Save requires a valid status, verified native controls, and an empty composer; HTML containing only whitespace or `<br>` is empty.

- [ ] **Step 2: Run the model test and verify failure**

Run: `npm run test:workflow`
Expected: FAIL because the new interfaces do not exist.

- [ ] **Step 3: Implement the pure workflow interfaces**

Keep DOM-free normalization in `workflow.js`; strip markup, non-breaking spaces, and zero-width characters before deciding composer content.

- [ ] **Step 4: Run the model test and verify success**

Run: `npm run test:workflow`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add workflow.js tests/workflow.cjs
git commit -m "feat: separate Zendesk send and property save guards"
```

### Task 2: Native Adapters and Freshservice-Style Controls

**Files:**
- Create: `workspace.js`
- Modify: `manifest.json`
- Modify: `content.js`
- Modify: `tests/fixtures/zendesk-ticket.html`
- Modify: `tests/browser.cjs`
- Modify: `tests/manifest.cjs`

**Interfaces:**
- Consumes: Task 1 guards and existing native action lock.
- Produces: `zdhWorkspace.readState(grid)`, `zdhWorkspace.findActiveGrid(doc)`, and selector/label constants; composer control `[data-zdh-composer-actions]`; properties control `[data-zdh-properties-actions]`; `sendActive()` and `savePropertiesActive()` methods exposed through `zdTitleHelper` for tests.

- [ ] **Step 1: Write failing browser and manifest tests**

Assert that the active ticket gets Public reply/Internal note segmented buttons above its composer; Send is at the composer bottom; status and Save changes appear in the properties sidebar; changing status does not touch native status; Send preserves native status; Save is blocked with a non-empty composer; Public Send requires review; inactive workspaces receive no controls; manifest loads `workspace.js` before `content.js`.

- [ ] **Step 2: Run targeted tests and verify failure**

Run: `npm run test:manifest && npm run test`
Expected: FAIL for missing adapter and controls.

- [ ] **Step 3: Implement `workspace.js` adapters**

Centralize stable test IDs and accessible-label fallbacks for active grid, mode, composer, submit, status menu, priority, requester, SLA, conversation log, and properties column. Restrict menu choice lookup to the verified open menu owned by the active control.

- [ ] **Step 4: Split the existing workflow bar into two mounted control surfaces**

In `content.js`, mount composer actions and properties actions in shadow roots. Mode selection delegates to the native menu. `sendActive()` clicks native submit without selecting a new status. `savePropertiesActive()` selects the requested status and clicks native submit only when the composer is empty. Preserve duplicate-action locking and fail-closed messages.

- [ ] **Step 5: Scope Command-Enter to the properties sidebar**

Invoke `savePropertiesActive()` only when the event target is inside `[data-zdh-properties-actions]`; ignore repeat, composition, Control-Enter, and all composer events.

- [ ] **Step 6: Run targeted tests and verify success**

Run: `npm run test:manifest && npm run test:workflow && npm run test`
Expected: PASS with native send/save click counts and status assertions.

- [ ] **Step 7: Commit**

```bash
git add workspace.js manifest.json content.js tests/fixtures/zendesk-ticket.html tests/browser.cjs tests/manifest.cjs
git commit -m "feat: add separate Zendesk send and property actions"
```

### Task 3: Full-Page Scroll, Conversation Disclosure, and Image Preview

**Files:**
- Modify: `content.js`
- Modify: `content.css`
- Modify: `tests/fixtures/zendesk-ticket.html`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes: Task 2 active-grid and conversation adapters.
- Produces: grid markers `data-zdh-page-scroll`, conversation disclosure `[data-zdh-conversation-disclosure]`, image markers `data-zdh-message-image`, and one document-level `[data-zdh-image-lightbox]`.

- [ ] **Step 1: Write failing scrolling, disclosure, and preview tests**

Assert the active desktop workspace and conversation containers have viewport-independent height/overflow; properties scroll away with the document; only the latest three rendered comments remain visible by default; `+N conversations` expands/collapses; new comments update N without duplicate disclosures; message images become thumbnails; focus reveals a bounded preview; click opens a dialog; Escape closes it; avatars/icons remain unchanged; narrow layout has no page-scroll override.

- [ ] **Step 2: Run the browser test and verify failure**

Run: `npm run test`
Expected: FAIL for missing markers and interactions.

- [ ] **Step 3: Implement page-level scrolling CSS**

Within `[data-zdh-page-scroll="true"]`, remove fixed/max viewport heights and internal overflow from the verified workspace, conversation log, composer pane, and properties pane. Do not apply below the desktop breakpoint.

- [ ] **Step 4: Implement idempotent conversation disclosure**

Keep the newest three rendered conversation entries visible, use a real button with `aria-expanded`, restore entries when expanded, and resynchronize on SPA/comment additions.

- [ ] **Step 5: Implement accessible message-image condensation**

Exclude images outside verified conversation entries. Add focusable thumbnail wrappers, a hover/focus preview, click lightbox with dialog semantics, close button, Escape handling, focus restoration, and reduced-motion styling. Preserve original links and alt text on failure.

- [ ] **Step 6: Run the browser test and verify success**

Run: `npm run test`
Expected: PASS including no external request and no implicit submit assertions.

- [ ] **Step 7: Commit**

```bash
git add content.js content.css tests/fixtures/zendesk-ticket.html tests/browser.cjs
git commit -m "feat: add page scroll and condensed conversations"
```

### Task 4: Robust Workspace Themes and Visual Refinement

**Files:**
- Modify: `content.css`
- Modify: `content.js`
- Modify: `popup.html`
- Modify: `popup.css`
- Modify: `popup.js`
- Modify: `tests/browser.cjs`

**Interfaces:**
- Consumes: existing `system|calm|contrast` preference values and Task 2 control surfaces.
- Produces: complete `--zdh-*` token sets on `:root[data-zdh-theme]`, `[data-zdh-appearance]` in the properties surface, and consistent theme application across active workspace descendants.

- [ ] **Step 1: Write failing theme and visual tests**

Assert each theme changes page background, conversation surface, properties surface, composer, inputs, border, text, focus ring, and primary action tokens; the in-workspace appearance menu changes and persists theme; native inactive tickets are unaffected; focus indicators remain visible; priority colors map low/normal/high/urgent to gray/blue/amber/red.

- [ ] **Step 2: Run the browser test and verify failure**

Run: `npm run test`
Expected: FAIL because themes currently cover only limited surfaces.

- [ ] **Step 3: Implement the complete token system**

Apply modern system typography, 4/8/12/16/24 spacing, 8–10px control radii, 12px group radii, restrained borders, semantic priority colors, and theme-specific surfaces. Scope all overrides to the marked active workspace and extension shadow roots.

- [ ] **Step 4: Add the discoverable workspace appearance menu**

Keep popup selection and add a compact properties-sidebar selector backed by `chrome.storage.local`; synchronize both surfaces without storing ticket content.

- [ ] **Step 5: Run design and browser checks**

Run: `npm run test`
Expected: PASS.

Run once after UI edits: `.agents/skills/impeccable/scripts/impeccable detect --json content.css content.js popup.css popup.html`
Expected: `[]`.

Run: `node /Users/chicken/.codex/skills/hallmark/scripts/sloplint.mjs content.css --scope app`
Expected: 0 findings.

- [ ] **Step 6: Commit**

```bash
git add content.css content.js popup.html popup.css popup.js tests/browser.cjs
git commit -m "feat: expand Zendesk workspace themes"
```

### Task 5: Documentation, Full Verification, and Live Chrome Smoke Test

**Files:**
- Modify: `README.md`
- Modify: `FEATURES.md`
- Modify: `manifest.json`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: Tasks 1–4 complete implementation.
- Produces: documented release, bumped version, reloaded Chrome extension, and non-submitting live verification evidence.

- [ ] **Step 1: Update release documentation and version**

Describe separate Send/Save semantics, Command-Enter scope, full-page scrolling, conversation/image condensation, theme reach, responsive fallback, and visible-data limitations. Bump the extension/package patch version consistently.

- [ ] **Step 2: Run complete automated verification**

Run: `npm run check && git diff --check`
Expected: all syntax, manifest, model, browser, and whitespace checks pass.

- [ ] **Step 3: Reload the unpacked extension and refresh the live test ticket**

Confirm the loaded version matches the manifest. Do not click Send or Save.

- [ ] **Step 4: Perform one batched live visual/behavior inspection**

Verify active workspace layout, one page scroll, sidebar scrolling away, requester/SLA omission rules, priority/status presentation, mode reflection, conversation disclosure, image condensation when present, and all themes. Exercise only non-submitting mode/theme/disclosure/preview interactions.

- [ ] **Step 5: Run final regression verification**

Run: `npm run check && git status --short`
Expected: tests pass and only intended release/documentation files remain before commit.

- [ ] **Step 6: Commit**

```bash
git add README.md FEATURES.md manifest.json package.json package-lock.json
git commit -m "docs: release Freshservice-inspired workspace"
```
