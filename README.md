# Zendesk Helper · 0.4.0

## Update from 0.3

Version 0.4 extends the restrained CSS treatment to Zendesk ticket-list tables and adds a conservative warning for titles that appear to contain two company/requester prefixes. The helper shows a suggestion but never edits the subject automatically. Development fixtures now include six fictional list tickets and a representative single-ticket workspace; screenshots are written to `test-results/` by `npm run check`.

The complete implementation and testing backlog is in [`FEATURES.md`](FEATURES.md).

## Update from 0.2

Version 0.3 extracts the ticket layout into `content.css` and gives the properties rail a restrained local token system, clearer separation, comfortable native fields, and visible keyboard focus. It also limits layout changes to the visible ticket workspace and preserves a manually selected title field across Zendesk DOM updates.

The extension still does not change save, status, reply visibility, or ticket contents.

### Reload and test locally

1. Open `chrome://extensions`.
2. Find **Zendesk Helper — Prototype** and click **Reload**.
3. Refresh the Zendesk tab so previously injected code and CSS are removed.
4. Open the extension and click **Apply to this tab**.
5. Use a fictional or designated test ticket only. Confirm conversation is left, properties are right, focus rings appear when tabbing, the context option is reversible, and **Turn off** restores the native layout.
6. Do not save or send a ticket while checking this visual change.

For automated checks, run `npm install` once and then `npm run check`. The browser suite uses only `tests/fixtures/zendesk-ticket.html`; it does not open Zendesk or submit anything.

## Update from 0.1
Replace the files in the existing extension folder with this version, click Reload on chrome://extensions, then refresh the Zendesk ticket. A page refresh is required to remove the old injected script. Open the extension and click Apply to this tab.

## New in 0.2
- Automatic title detection based on the supplied saved Zendesk page.
- Reversible CSS grid layout: conversation left, ticket fields right.
- Customer context/apps hidden by default; opt in using the popup.
- Layout changes only on windows at least 1000px wide. Below that, Zendesk's existing layout is retained.
- Turn off restores the original layout. Refresh also clears all changes. No persistent settings.
- Activation is limited in code to https://itjones.zendesk.com/agent/.
- Uses existing DOM nodes and native inputs without moving nodes or replacing native controls.
- Does not alter status or Save behavior. No custom save keyboard shortcut yet.

The layout and selectors were checked against a saved HTML snapshot, not a running Zendesk session. The snapshot contains no live React state. Live layout, responsiveness, navigation and menu behavior require manual testing. No customer snapshot or its assets are included in this package.

## Manual test
1. Apply to a fictional ticket. Confirm the conversation is left and fields are right.
2. Try an invalid title, leave the field, and confirm the nonblocking warning.
3. Use `Beluga Sales Inc. - Taylor Baxter - FaceID error` and leave the field; the warning should disappear.
4. Enable context, apply again, and check that customer context/apps return.
5. Turn off and verify the original layout returns. Do not save or send to test the layout.

## Known limitations
Visual order differs from DOM/tab order; keyboard focus follows Zendesk's native DOM order. Pane resizing controls are still Zendesk's controls, but CSS overrides their column widths while the layout is active. If controls overlap or resize incorrectly, Turn off. Unknown layouts are left unchanged. This is a personal prototype pending testing and organizational review.

## Original prototype background

An experimental Chrome Manifest V3 extension. No build step, dependencies, API keys, network requests, AI, telemetry, or persistent ticket storage.

## Install on your computer
1. Unzip this folder.
2. Open chrome://extensions and turn on Developer mode.
3. Click Load unpacked and select the folder containing manifest.json.
4. Open a Zendesk agent ticket. Click this extension, then Apply to this tab.
5. Leave the title input to see its format warning.

Your organization may restrict unpacked extensions. This is a test build, not an approved organizational deployment.

## Behavior
- Checks on blur (focus leaving the selected input).
- Expected structure: Company - Requester - Issue, with spaces around separators.
- Additional ` - ` segments in the issue are permitted. Empty segments are rejected.
- No edits, automatic correction, sending, blocked saves, status changes, exports, or private-note protection yet.
- Valid format removes the warning. Invalid format displays a dismissible message immediately after the input.
- Uses the observed omni-header-subject input; manual selection is available as a fallback.
- Follows detected subject inputs and layout grids in SPA navigation; refresh or Turn off clears changes. Manual field selection may need repeating.
- Native form submit also checks the field without blocking; Zendesk's custom save actions are not yet integrated.
- Company and requester names are NOT verified. Missing or ambiguous data must never be invented. Future mapping should use authoritative ticket fields.
- An extension only checks the tab where it is active. It cannot enforce titles for tickets arriving from email or other agents.

## Security boundaries
Only activeTab and scripting permissions. The popup restricts activation to HTTPS itjones.zendesk.com/agent/ URLs. Custom Zendesk domains are not supported yet. Chrome grants temporary access to the active origin when you invoke the extension. Ticket strings are never inserted as HTML. Content-script code runs in Chrome's default isolated world. The extension does not call Zendesk APIs or touch authentication, notes, status, or save controls. Warning styles are isolated in a shadow root.

This is not a security audit or a guarantee of safety. Page modifications can conflict with Zendesk rendering; test with a fictional ticket first. A hostile page could tamper with page-visible warnings. Never treat this helper as an authorization control or guaranteed prevention of public replies. Before team rollout: verify actual Zendesk markup/accessibility, review permissions and dependencies, use managed distribution, and test navigation and concurrent ticket editing.

## Next increments
1. Confirm the real title field and automate its detection without broad page scraping.
2. Resolve company/requester from authoritative ticket fields and show a suggested title.
3. Add private/public note safeguards and separate status review only after verifying Zendesk behavior.
4. Explicit local ticket export, then local AI and approved Notion integration.

## Development
Run `node tests/browser.cjs` with Playwright available via NODE_PATH. Browser tests use synthetic markup, not live Zendesk. No live Zendesk access has been tested.
