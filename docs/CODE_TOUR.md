# Read the code without holding it all in your head

Start with one behavior. You do not need to read every file first.

## Source folders

Runtime code is under `src/`, grouped by responsibility. [src/README.md](../src/README.md) is the short feature map. `scripts/` holds development/release commands, `tests/` holds behavior checks, and `docs/` holds guides. `manifest.json` stays at the root so Chrome loads this same folder.

## First five files

| Read | What you learn | Look for |
| --- | --- | --- |
| `manifest.json` | What Chrome loads and where it may run | content_scripts, permissions, optional_host_permissions |
| `src/tickets/workspace.js` | How we recognize the active native ticket | findActiveGrid, readState |
| `src/tickets/workflow.js` | When Send or field Save is allowed | canSend, canSaveProperties |
| `src/content/index.js` | How the page connects those decisions to controls | mountWorkflow, refreshWorkflow |
| `tests/workflow.cjs` | Examples of allowed and blocked actions | assertions and their descriptions |

The source files now use normal indentation and one visible block per decision. File headers give a reading path; comments explain the reason for guards. Use your editor's symbol search to jump to the names below.

## Follow a field save

1. `src/content/index.js → savePropertiesActive` takes a local copy of the active rich draft.
2. `src/page/draft-bridge.js` uses CKEditor's data API to park that draft and lock editing temporarily. It checks the expected content before changing it.
3. The content script selects native status and clicks native Submit only after the editor is empty.
4. It waits for Zendesk's saving/acknowledgement state before treating the action as successful.
5. It restores the same draft, or keeps a recovery copy if the ticket/mode changed or something newer exists.

The tricky part is timing: Zendesk can replace a ticket grid or load a draft late. Rechecks protect against submitting draft text as part of a field-only save. Do not remove them just because an earlier check appears similar. `tests/draft-recovery.cjs` exercises failure, timeout, navigation and reload races.

For the complete feature list and short explanations, read [how the features work](FEATURE_WALKTHROUGH.md).

## Follow a reply-mode switch

`src/tickets/tools.js → switchMode` asks the native selector to switch. `settledEditor` waits for the destination draft to finish loading. `src/tickets/model.js → transferDecision` chooses whether it is safe to carry text. A different destination draft is preserved. The segmented radio buttons pass the requested mode to that native action; there is no second mode store. Carry is optional in Settings; switching never sends.

## Follow a theme

`src/popup/popup.js` saves a theme ID; `src/settings/settings.js` manages custom five-role palettes and workflow settings. `src/shared/theme-controls.js` supplies the shared picker and local preview. `src/shared/theme-files.js` validates portable theme files. `src/shared/themes.js` derives readable component colors. `src/themes/native.js` applies one owned variable stylesheet at the document and nested native theme boundaries; `src/themes/native.css` covers observed native exceptions, including literal control color schemes and field-row borders. Zendesk’s saved appearance is never changed by this adapter. Harvest uses the same palette in its own frame through `src/integrations/harvest/theme.js`. Its controller starts optional access from the popup or Settings click message and finishes saving/registering in the background, so closing the popup during approval does not interrupt setup.

Five base colors do not mean five rendered colors. Borders, washes, focus and label inks are derived. Native authored content has its own colors; `src/conversations/message-display.js` repairs measured unreadable text without editing the composer.

## Follow an export

`src/export/exporter.js` collects rendered comments, including hidden history, and tries to capture accessible images. `src/background/service-worker.js` validates the requesting extension/site and waits for Chrome to finish the local download. Unloaded messages and inaccessible images are not silently invented.

The separate Python command in `scripts/process_ticket.py` reads that file. It scrubs known text identifiers, asks local Ollama models for a draft, and writes review files. Image pixels are not automatically anonymized. Local model output still needs privacy and factual review. The browser extension does not run Python or publish documentation.

## Other modules, grouped by job

| Job | Files |
| --- | --- |
| Reading | `src/conversations/email-threads.js`: quote detection/disclosures; `src/conversations/message-display.js`: contrast and Simplify; image previews/shared scrolling in `src/content/index.js` |
| Small ticket tools | `src/tickets/model.js`: pure decisions; `src/tickets/tools.js`: title/copy/mode/queue DOM adapters |
| Native editor bridge | `src/page/draft-bridge.js`: checked read/park/restore/replace operations in the page world |
| Optional Harvest | `src/integrations/harvest/policy.js`: allowed context; `src/integrations/harvest/controller.js`: permission/registration; `src/integrations/harvest/theme.js` + CSS: styling only |
| Extension surfaces | `src/popup/popup.html/js/css`: quick controls; `src/settings/`: full options page; `src/guide/guide.html/js/css`: feature guide; `src/background/service-worker.js`: downloads and registration |

## Small glossary

- **State:** a fresh description of the currently visible native controls.
- **Gate:** a pure decision that allows or blocks an action, with a reason.
- **Adapter:** code connecting our decisions to Zendesk's DOM.
- **Reconcile / sync:** compare current native UI with our UI and update only what we own.
- **Held draft:** a locally stored rich-text backup during a save or mode transfer. **Acknowledgement** means observed native save completion, not just a click.

## Boundaries worth remembering

- Only the active ticket should establish native state; cached hidden workspaces are common.
- The helper does not have its own ticket backend or presence service. Native Zendesk viewing/editing indicators are left alone; duplicate helper badges were removed.
- Off removes owned UI/styles. It does not delete downloaded files or intentionally erase recovery backups.
- Generic quote detection must fail open. A wrong collapsed boundary can hide an inline answer even when the source remains intact.
- Permissions limit Chrome access; runtime context guards narrow it further. Keep both.

## Make one change

1. Find the feature's pure rule or native adapter above.
2. Change one observable behavior; keep unrelated safety checks.
3. Run `npm run check`. Use `npm run format` for consistent layout.
4. For UI behavior, verify in actual Chrome. Only #209867 is authorized for edits/saves/sends in this project workflow.
5. Update the guide, TASKS.md and current state with what actually passed.

`tests/visual.spec.cjs` loads the actual Store ZIP with real extension storage in a disposable browser profile. Start with its small observed Appearance case, then the theme loop and restart check. `playwright.config.cjs` fixes the runner and snapshot locations; [the development guide](DEVELOPMENT.md#packaged-browser-and-screenshot-checks) explains how to run and review them.

`npm run test:fixtures` is optional synthetic browser coverage. It cannot establish that live Zendesk works. Some focused tests execute sections of the actual content script; if you move a function, update those boundaries and keep the scenario assertions.

## Review scope for v0.7.3

All18 runtime JavaScript modules received readable formatting and file-level navigation comments; key draft/export/native-state flows have explanatory comments. CSS/HTML and tests were formatted too. Parsed JavaScript before/after is equivalent after ignoring comments and source-location metadata. Python received focused pipeline documentation. This is a readability and release-preparation pass, not a rewrite of the save architecture or a claim of a comprehensive security audit.

In v0.7.7, the coordinator remains in src/content/index.js while its shadow-control stylesheet moved to src/content/control-styles.js as readable CSS. Rules, UI pages and native adapters now have feature folders. Moving the draft state machine itself remains a separate behavior-tested change. See [development checks and applied Chrome guidance](DEVELOPMENT.md).
