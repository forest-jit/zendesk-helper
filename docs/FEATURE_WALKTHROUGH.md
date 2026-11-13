# What the helper does—and how it works

This describes **v0.7.11**, prepared for release. The Store still has v0.7.8 until the update is approved. [Feature guide](../src/guide/guide.html) has the click-by-click instructions; [code tour](CODE_TOUR.md) maps the files.

## Five things to show first

1. **Read and write in one column.** History and the reply box share a scrollbar; ticket fields and Harvest have their own sidebar.
2. **Save fields without sending your draft.** Change a property, save, and keep writing the same reply.
3. **Switch Public reply / Internal note in one click.** The selected side is clear; sharing the draft is optional.
4. **Make long tickets manageable.** Optional latest-five history, quoted-email controls and compact image previews reduce the amount on screen.
5. **Choose the workspace colors.** Built-in or custom five-color themes, including optional Harvest styling.

Use the authorized test ticket for edits and saves. Keep customer examples read-only and check that the audience is allowed to see them before presenting. Private demo links and measured results stay outside this public repository.

## How an extension changes Zendesk

The helper uses **plain JavaScript, HTML and CSS**. It does not add React or jQuery. Zendesk has its own application and CKEditor instance underneath.

A *content script* runs on Jones IT agent pages. It finds known native elements with `querySelector`, adds small controls with `createElement`, and applies owned attributes/styles. A `MutationObserver` notices when Zendesk replaces parts of the page; reconciliation runs through `requestAnimationFrame` rather than rebuilding the interface on every event.

For ticket actions, the helper clicks Zendesk’s real controls and waits for their state to change. It does not have its own ticket backend or write through private Zendesk application stores. This is a DOM integration: changes to Zendesk’s markup can break a feature, so real-browser checks matter alongside automated tests.

## Reading and layout

| Feature | What you see | How it works |
| --- | --- | --- |
| Two-column workspace | Conversation on the left; Harvest and ticket properties on the right | [`sync`](../src/content/index.js), [`syncHarvest`](../src/content/index.js) and [layout CSS](../src/content/layout.css) mark existing native regions. CSS changes their layout; it does not clone the Harvest iframe or move ticket data into a new application. Desktop layout gives way to native layout below its supported width. |
| One conversation scrollbar | Scroll through history and continue down to the composer; the sidebar scrolls separately | [`syncConversationScroll`](../src/content/index.js) identifies the native history/composer flow and adjusts its containers. Native See oldest/See newest controls are suppressed while this flow is active. Off restores native behavior. |
| Main fields first | Requester, Assignee, Followers, Tags, Ticket Code, Priority and Status; the rest under Additional fields | [`syncAdditionalFields`](../src/content/index.js) marks less-used field wrappers for hiding. Expanding reveals the original inputs, with their values intact. |
| Optional recent-message summary | Latest five, with View full conversation / Collapse earlier messages at the top of the scrolling history | [`syncConversation`](../src/content/index.js) marks older loaded articles as collapsed. The button toggles those marks. Settings can show all loaded messages instead; this does not fetch history Zendesk has not loaded. |
| Compact images | Contained thumbnails, hover previews and click-to-open full images; Escape closes | [`syncImages`](../src/content/index.js) scans received-message images, skips excluded small/signature/UI images and reconciles event bindings after replacements. CSS bounds the preview without cropping the image. The lightbox displays the original source, not a generated summary. |

## Received email

These are **two different features**. Neither edits the saved message.

| Feature | What you see | How it works |
| --- | --- | --- |
| Quoted-email disclosure | Hide/Show quoted email history inside a received message | [`email-threads.js → parts / sync`](../src/conversations/email-threads.js) recognizes explicit Gmail/Yahoo/cite wrappers or supported ordered forward headers. It inserts a button before the original quote nodes and hides/shows those nodes with attributes. Explicit quotes may start closed if new content exists outside them. Ambiguous forwards start open; quote-only and unknown structures stay visible. Inline answers can live inside a quote, so expand it when needed. |
| Simplify / Restore email formatting | Optional removal of bulky email widths, table spacing and fills | [`message-display.js → formatControl`](../src/conversations/message-display.js) offers the button on qualifying received emails. It toggles `data-zdh-simple-email`; [theme CSS](../src/themes/native.css) adjusts presentation. It does not remove quotes or rewrite HTML. A message can become shorter, taller or nearly unchanged, depending on wrapping. Restore removes the attribute. |
| Unreadable-color repair | Text remains readable when an email’s own colors clash with the selected theme | [`message-display.js → readableInk / sync`](../src/conversations/message-display.js) measures text against its effective solid background. Only failing text gets a contrasting display ink. Readable authored colors and image pixels stay intact; complex image backgrounds are outside this repair. |

**Demo finding:** supported forwarded chains and formatting cleanup were rechecked on real, read-only tickets in Chrome. Text comparisons passed after collapse, Simplify and Restore. That does not establish detection for every email client.

## Replying and saving

### One-click Public reply / Internal note

[`tools.js → syncMode`](../src/tickets/tools.js) inserts a two-button radio group beside Zendesk’s mode trigger and hides that original trigger while the helper is active. The active radio follows Zendesk’s reported mode; there is no second reply-mode database.

When you click Internal note, [`switchMode`](../src/tickets/tools.js) programmatically opens the real native selector, finds the real Internal note menu item and clicks it. It then waits for Zendesk’s mode and editor to settle. Public reply follows the same path. You make one click; the helper performs the native menu steps for you. Left/Right and Home/End work too. Switching never sends. Off restores the original selector.

### Optional shared draft

**Settings → Replies & reading → Use the same draft when switching reply modes** controls this. Separate native drafts remain the default.

`switchMode` reads the source rich text, waits for the destination, and calls [`model.js → transferDecision`](../src/tickets/model.js). Empty or still-matching destinations can receive the text. A different destination stays intact and gets a conflict explanation. Pending attachments block carrying. The [page-world bridge](../src/page/draft-bridge.js) uses CKEditor’s documented data API with an expected-content check; it does not assign `innerHTML` to the live editor.

### Separate Send and field Save

| Feature | What you do | How it works |
| --- | --- | --- |
| Send | Click Send, or Command–Enter inside the reply box | [`sendActive`](../src/content/index.js) rechecks the active ticket, mode, draft, recovery state and native readiness, then clicks native Submit. It guards empty/repeated/busy actions. Ctrl–Enter is used on other platforms. |
| Save fields with a draft present | Change a sidebar field; click Save changes or Command–Enter in the sidebar | [`savePropertiesActive`](../src/content/index.js) backs up the rich draft, temporarily locks and empties the editor through CKEditor, selects native status, then clicks native Submit. It waits for observed save completion before restoring the draft. The empty-editor recheck prevents a field save from accidentally submitting text. |
| Dirty-state Save | Save is disabled until properties differ | [`propertySnapshot / propertyDirty`](../src/content/index.js) compare native field values with the settled baseline. New user edits during a save are not silently rebased away. |
| Native-like Status | A themed dropdown beside Priority; Closed is disabled | [`mountStatusMenu / refreshWorkflow`](../src/content/index.js) use an owned shadow-root control and top-layer listbox. Selection updates the helper’s pending value; Save applies it through native controls. Native Closed signals take precedence. Missing state becomes Unavailable, never guessed Open. |
| Close ticket / Close and export | Choose Solved to see completion actions | The same property-save path records **Solved**, not Zendesk’s later Closed state. Close and export prepares the snapshot first and downloads only after the save is acknowledged. Queued attachments block field-only saves. |

### Interrupted-save recovery

The helper stores a per-ticket/mode transaction backup in `chrome.storage.local` **before** parking or transferring text. [`recoverDraft`](../src/content/index.js) restores only when the ticket, mode, editor and expected content are safe. It will not replace newer text or restore into a busy submission. Uncertain/conflicting copies remain available through **Save recovery copy**, which downloads them for review.

This is protection around helper operations, **not continuous backup of everything typed in Zendesk**. Native refresh/navigation can have its own draft behavior. Protect drafts before reloading an extension or ticket. Failure, timeout, navigation and refresh races have regression coverage in [draft recovery tests](../tests/draft-recovery.cjs).

## Small ticket tools

| Feature | What you see | How it works |
| --- | --- | --- |
| Identity-based titles | Company - Requester - Issue, with Undo | [`tools.js → identity / syncTitle`](../src/tickets/tools.js) reads selected native identities and uses a pure title rule to preserve the issue suffix. It updates the native title draft, not a background save. Missing identities leave it alone. Undo restores the prior title and turns automatic updates off. Settings can disable it. |
| One-click Copy ticket | A linked ticket number | [`model.js → ticketLink`](../src/tickets/model.js) validates the numeric ID and builds the URL. [`syncCopy`](../src/tickets/tools.js) writes HTML plus plain-text Markdown to the clipboard, falling back to text if necessary. It does not copy the conversation or modify the ticket. |
| Idle queue refresh | Views refresh at 10/15/30/60 seconds, or Off | [`tools.js → syncQueue`](../src/tickets/tools.js) clicks the existing view Refresh action. It pauses around typing, selections, menus, recent interaction, offline state and hidden tabs. It never reloads a ticket page. Default: 15 seconds. |
| Quiet feedback | Success does not add a toast | Visible results—changed mode, restored draft, clipboard paste or download—carry the confirmation. Errors, conflicts, recovery instructions, progress and title Undo remain visible. |

**Viewing/editing is Zendesk’s job.** The duplicate helper badges and unknown-activity text were removed. Zendesk’s own native indicators remain untouched. [Zendesk documents agent pictures in tickets and an eye in views](https://support.zendesk.com/hc/en-us/articles/9186264597146-Avoiding-agent-collision); availability depends on its plan. The helper does not independently track another person’s open tabs.

## Themes and settings

| Feature | What you see | How it works |
| --- | --- | --- |
| Built-in and System themes | Light, dark, pink, green, purple, Jones IT and editor-inspired choices | [`shared/themes.js`](../src/shared/themes.js) holds five base roles and derives readable borders, washes, focus and text shades. System chooses Daylight/Midnight from OS appearance. Five base colors do **not** mean only five rendered colors. |
| Coverage across native appearance | Ticket shell, fields, lists, visited menus/dialogs and public/internal composer use the selected palette | [`themes/native.js`](../src/themes/native.js) maps tokens at document and observed nested Zendesk/Polaris boundaries. [CSS exceptions](../src/themes/native.css) cover known fixed native colors. Native Light/Dark checks passed; unvisited or future components can still need fixes. Off/Native removes owned overrides. Forced-colors is respected. |
| Small popup and full Settings | On/Off and Theme in the popup; advanced controls in a normal tab | [`popup.js`](../src/popup/popup.js) opens the declared Chrome options page with `runtime.openOptionsPage()`. [`settings.js`](../src/settings/settings.js) manages workflow choices, Harvest, editor and tools. Both use [`theme-controls.js`](../src/shared/theme-controls.js), so hover/keyboard previews share one implementation. |
| Custom themes and temporary preview | Name, five color inputs, Preview on ticket, Save and apply | Settings validates the palette through the shared compiler. A scoped runtime connection sends temporary colors to the chosen Zendesk tab and enabled Harvest styling. Disconnecting/closing Settings restores the saved palette. Local session storage keeps unfinished editor work. No remote stylesheet is fetched. |
| Theme sharing and safe targeting | Import/Export theme; a target-ticket selector for previews and exports | [`theme-files.js`](../src/shared/theme-files.js) validates a small JSON format containing only name + five colors. Import fills the editor without applying it. Settings chooses the ticket opened from the popup, or asks when multiple tabs are ambiguous; commands revalidate the selected URL. No general browsing-history permission is added. |

**Harvest needs its own setup:** popup → **Settings → Harvest → Match Harvest to theme** → allow `platform.harvestapp.com` → check **Harvest theme on** → reload the Harvest panel. Choosing a theme alone does not enable it. Each profile and Store/development installation needs separate setup.

The [Harvest controller](../src/integrations/harvest/controller.js) handles permission and script registration; the [timer adapter](../src/integrations/harvest/theme.js) consumes the same palette inside the allowed embedded frame. It styles that frame without reading/changing project, task, notes, duration or time entries. Native/Off/revoked access removes styling. Other third-party apps keep their own interface.

## Export, help and privacy

| Feature | What happens | How it works |
| --- | --- | --- |
| Raw ticket export | Local JSON for your own processing | [`exporter.js → collect / captureMedia`](../src/export/exporter.js) reads rendered messages, including collapsed history and quotes, plus timestamps, visibility and accessible images. Unloaded history and inaccessible media are reported, not invented. The [background worker](../src/background/service-worker.js) validates the sender and waits for the requested download. Export alone does not save the ticket. |
| Optional local AI processor | A reviewed documentation draft, separate from Chrome | [`process_ticket.py`](../scripts/process_ticket.py) uses pattern/known-identity redaction and local Ollama text/vision models. It writes `notion-draft.md` and `processed.json`. Redaction can miss information; raw image pixels reach the local vision model. It does not automatically publish to Notion or call hosted AI. |
| Help and reports | Feature guide, Report a problem, How the features work in Settings | These are ordinary links to the packaged guide, existing Internal Tools reporting page and this walkthrough. Opening a report does not automatically upload ticket contents. |
| On/Off and local preferences | Restore native Zendesk while keeping your preferences | Content-script cleanup removes owned controls, attributes, handlers and styles. Preferences/custom themes remain in this browser profile; uncertain recovery copies and downloaded files are not erased by Off. Store and unpacked IDs do not share storage automatically. |

## Deliberately not included

There is no helper presence service, hosted AI, automatic Notion publication or automatic sending. Native context/knowledge/app navigation redesign is deferred. Real screen-reader acceptance, a fresh real Harvest consent check and organization rollout remain explicit queue items. Passing synthetic browser tests does not replace those checks.

For current release evidence and remaining gates, read [CURRENT_STATE.md](CURRENT_STATE.md) and [TASKS.md](../TASKS.md).
