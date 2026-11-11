# Read the code without holding it all in your head

Start with one behavior. You do not need to read every file first.

## First five files

| Read | What you learn | Look for |
| --- | --- | --- |
| `manifest.json` | What Chrome loads and where it may run | content_scripts, permissions, optional_host_permissions |
| `workspace.js` | How we recognize the active native ticket | findActiveGrid, readState |
| `workflow.js` | When Send or field Save is allowed | canSend, canSaveProperties |
| `content.js` | How the page connects those decisions to controls | mountWorkflow, refreshWorkflow |
| `tests/workflow.cjs` | Examples of allowed and blocked actions | assertions and their descriptions |

The source files now use normal indentation and one visible block per decision. File headers give a reading path; comments explain the reason for guards. Use your editor's symbol search to jump to the names below.

## Follow a field save

1. `content.js → savePropertiesActive` takes a local copy of the active rich draft.
2. `draft-bridge.js` uses CKEditor's data API to park that draft and lock editing temporarily. It checks the expected content before changing it.
3. The content script selects native status and clicks native Submit only after the editor is empty.
4. It waits for Zendesk's saving/acknowledgement state before treating the action as successful.
5. It restores the same draft, or keeps a recovery copy if the ticket/mode changed or something newer exists.

The tricky part is timing: Zendesk can replace a ticket grid or load a draft late. Rechecks protect against submitting draft text as part of a field-only save. Do not remove them just because an earlier check appears similar. `tests/draft-recovery.cjs` exercises failure, timeout, navigation and reload races.

## Follow a reply-mode switch

`ticket-tools.js → switchMode` asks the native selector to switch. `settledEditor` waits for the destination draft to finish loading. `ticket-model.js → transferDecision` chooses whether it is safe to carry text. A different destination draft is preserved. Carry is optional; switching never sends.

## Follow a theme

`popup.js` saves a theme ID or custom five-role palette. `themes.js` derives readable component colors. `theme-page.js` applies owned variables; `theme.css` covers observed native exceptions. Harvest uses the same palette in its own frame through `harvest-theme.js`.

Five base colors do not mean five rendered colors. Borders, washes, focus and label inks are derived. Native authored content has its own colors; `message-display.js` repairs measured unreadable text without editing the composer.

## Follow an export

`exporter.js` collects rendered comments, including hidden history, and tries to capture accessible images. `background.js` validates the requesting extension/site and waits for Chrome to finish the local download. Unloaded messages and inaccessible images are not silently invented.

The separate Python command in `scripts/process_ticket.py` reads that file. It scrubs known text identifiers, asks local Ollama models for a draft, and writes review files. Image pixels are not automatically anonymized. Local model output still needs privacy and factual review. The browser extension does not run Python or publish documentation.

## Other modules, grouped by job

| Job | Files |
| --- | --- |
| Reading | `email-threads.js`: quote detection/disclosures; `message-display.js`: contrast and Simplify; image previews/shared scrolling in `content.js` |
| Small ticket tools | `ticket-model.js`: pure decisions; `ticket-tools.js`: title/copy/mode/presence/queue DOM adapters |
| Native editor bridge | `draft-bridge.js`: checked read/park/restore/replace operations in the page world |
| Optional Harvest | `harvest-policy.js`: allowed context; `harvest-controller.js`: permission/registration; `harvest-theme.js` + CSS: styling only |
| Extension surfaces | `popup.html/js/css`: settings; `guide.html/js/css`: feature guide; `background.js`: downloads and registration |

## Small glossary

- **State:** a fresh description of the currently visible native controls.
- **Gate:** a pure decision that allows or blocks an action, with a reason.
- **Adapter:** code connecting our decisions to Zendesk's DOM.
- **Reconcile / sync:** compare current native UI with our UI and update only what we own.
- **Held draft:** a locally stored rich-text backup during a save or mode transfer. **Acknowledgement** means observed native save completion, not just a click.

## Boundaries worth remembering

- Only the active ticket should establish native state; cached hidden workspaces are common.
- The helper does not have its own ticket backend or presence service. The activity adapter reads rendered native signals and still needs a real coworker test.
- Off removes owned UI/styles. It does not delete downloaded files or intentionally erase recovery backups.
- Generic quote detection must fail open. A wrong collapsed boundary can hide an inline answer even when the source remains intact.
- Permissions limit Chrome access; runtime context guards narrow it further. Keep both.

## Make one change

1. Find the feature's pure rule or native adapter above.
2. Change one observable behavior; keep unrelated safety checks.
3. Run `npm run check`. Use `npm run format` for consistent layout.
4. For UI behavior, verify in actual Chrome. Only #209867 is authorized for edits/saves/sends in this project workflow.
5. Update the guide, TASKS.md and current state with what actually passed.

`npm run test:fixtures` is optional synthetic browser coverage. It cannot establish that live Zendesk works. Some focused tests execute sections of the actual content script; if you move a function, update those boundaries and keep the scenario assertions.

## Review scope for v0.7.3

All18 runtime JavaScript modules received readable formatting and file-level navigation comments; key draft/export/native-state flows have explanatory comments. CSS/HTML and tests were formatted too. Parsed JavaScript before/after is equivalent after ignoring comments and source-location metadata. Python received focused pipeline documentation. This is a readability and release-preparation pass, not a rewrite of the save architecture or a claim of a comprehensive security audit.

The large coordinator and embedded shadow-control CSS remain places for a later carefully tested extraction. Keeping their working boundaries intact was preferable during this private-release pass. No unrelated behavior refactor was necessary for readability.
