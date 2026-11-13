# Jones IT Zendesk Helper

A Chrome extension with tools and improvements for the Jones IT Zendesk interface. It loads automatically on `https://itjones.zendesk.com/agent/*`.

**[Feature guide](src/guide/guide.html)** explains what the extension offers and how to use it. The same guide is available through **Settings → Feature guide**.

[Team guide in Notion](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899) covers installation, daily use, themes, Harvest and optional exports. Jones IT workspace access is required.

**Want the feature list and a plain-English walkthrough? Read [how the features work](docs/FEATURE_WALKTHROUGH.md).** For module navigation, use [the code tour](docs/CODE_TOUR.md). Each runtime file has a short reading path; `npm run format` keeps it readable.

Store fields: [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).

Release preparation and updates: [docs/release/START_HERE.md](docs/release/START_HERE.md). The extension is published in the Chrome Web Store.

## Install

**Published v0.7.8:** set your Zendesk profile picture → **Appearance → Light mode** for consistent colors. The next build supports both native appearances; its Light/Dark checks passed in Chrome. The instructions below describe local v0.7.12. Deployment is on hold; Store users do not have this interface yet.

1. [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf).
2. Open a Jones IT Zendesk agent page.
3. Open the popup and use the **On / Off** switch. Settings save immediately.

For development, load this repository root unpacked through `chrome://extensions` → Developer mode → Load unpacked. After source changes, reload that extension and refresh Zendesk after protecting drafts. Do not run Store and unpacked copies together. The manifest identifies the source version; confirm Chrome’s loaded version separately.

### Match Harvest to your theme

**Harvest styling is off by default.** Choosing a theme does not turn it on.

1. Open Jones IT Zendesk Helper from your browser’s toolbar.
2. Open **Settings → Harvest**, then click **Match Harvest to theme**.
3. Allow access to **platform.harvestapp.com** when your browser asks.
4. Check that the button says **Harvest theme on**. If approval was interrupted, reopen Settings; if it still says **Match Harvest to theme**, click it again.
5. Reload the **Harvest panel** using its reload icon. You can also refresh Zendesk after protecting your drafts.

Harvest should now match your selected helper theme. It changes colors only; it does not start a timer or change time entries. Set this up separately in each browser/profile and when switching between Store and unpacked installations; their settings and permissions do not automatically carry over. If Harvest stays white, check both **Harvest theme on** and the browser’s allowed site access before reporting a theme bug.

## Where things go

- **[Change, test and release](docs/WORKFLOW.md):** how implementation, browser checks, documentation and Store releases fit together.
- **[TASKS.md](TASKS.md):** add requests here; this is the only task queue.
- **[Current state](docs/CURRENT_STATE.md):** latest evidence, limitations, and next step.
- **[AGENTS.md](AGENTS.md):** instructions for working in this repository.

Development: use Node 24+ (or 22.13+) and run `npm ci --ignore-scripts --omit=optional`, then `npm run check`. That checks syntax, ESLint, runtime resources and behavior regressions. `npm run format` / `npm run format:check` maintain layout. [Development guide](docs/DEVELOPMENT.md) explains the standards, CI and live Chrome checks.

Historical docs are in [docs/archive/](docs/archive/). They may describe superseded behavior and are not current instructions or proof of completion. Design-skill provenance remains in [docs/design-skills.md](docs/design-skills.md).

While typing in Public reply or Internal note, press **⌘Enter** to use Send. Empty drafts and repeated keydown events are guarded.

## Local documentation export

Choose **Solved** to reveal **Close ticket** and **Close and export**. Both save Zendesk's Solved status (not Closed). Text drafts are protected and restored during property-only saves; queued attachments must be sent or removed first. Close and export prepares the snapshot before saving and downloads it after the save is acknowledged. To export without saving, open the toolbar popup on the ticket and click **Export ticket**. The popup names the current ticket. It is disabled on other pages; closing the popup does not cancel an export already requested.

Exports are raw local JSON files, containing all rendered comments (including collapsed history), timestamps, visibility, and image references/bytes when accessible. Per-message quoted history remains in the export when its display is collapsed. Unloaded history is explicitly outside the snapshot. Some authenticated or cross-origin images may need a local copy.

For a summary, open **Start Local Review.command** in the project folder. Choose the exported JSON, then **Create summary**. The local app shows the problem, a conclusion, recorded actions and verification, and reusable notes with message references. Download the Notion draft after checking it against the ticket.

Ollama must be running locally with `mistral:latest` and `qwen2.5vl:3b`. Both models are already installed on the maintainer’s Mac. The separate local app is not installed by the Chrome Web Store extension. [Local review instructions](docs/DOCUMENTATION_HANDOFF.md) cover setup, the optional command-line flow and missing images.

Redaction runs before and after the text model; it can miss information. Raw image pixels reach the local vision model, and image observations stay marked as unverified. The app writes `notion-draft.md` and `processed.json` in a private local review folder. It does not publish to Notion or use a hosted AI service. Review identifying details and factual claims before sharing.

Choose a built-in theme or **System light / dark** in the extension popup. Hover/focus previews the popup; selecting applies the theme. Open **Settings → Appearance** to create a custom theme with five color controls, preview it temporarily on the selected ticket/Harvest, then **Save and apply**. Theme files can be imported or exported without ticket data. Temporary ticket preview ends when the Settings tab closes; unsaved palette edits remain available for the current Chrome session. Themes apply immediately and persist across refresh; turning the overlay off restores native colors. Harvest styling needs its own setup; follow **Match Harvest to your theme** above. Harvest follows the selected theme; other embedded apps keep their own colors. Turning Harvest styling off restores its native colors; Chrome site access can be managed in the extension details. Coverage and verification: [docs/THEMING.md](docs/THEMING.md).


## Ticket tools

- **Public reply / Internal note** is a two-part control: click the mode you want. The selected side stays highlighted. In **Settings → Replies & reading**, enable **Use the same draft when switching reply modes** to carry text and formatting. A different destination draft is preserved; queued attachments block carrying. Separate drafts remain the default.
- **Update company and requester in ticket titles** uses the selected native identity and preserves the issue suffix. Changes stay in the ticket draft until Save or Send; Undo also turns off automatic title updates.
- **Copy ticket** copies a linked ticket number in one click. Rich-text destinations receive a link; plain text receives Markdown such as `[#209867](https://itjones.zendesk.com/agent/tickets/209867)`.
- Zendesk’s own viewing/editing indicators remain unchanged. The helper does not add a second activity badge or claim that an unreported ticket is unoccupied.
- Views refresh every 15 seconds by default (10/15/30/60 seconds or Off). Refresh pauses for typing, selection, menus, hidden/offline tabs and recent interaction. It uses Zendesk’s native refresh action, not page reloads.

[Team installation](docs/DISTRIBUTION.md) · [Reviewed documentation handoff](docs/DOCUMENTATION_HANDOFF.md)

## Reading email threads

The two reading controls affect different things:

- **View full conversation** shows older ticket messages. **Collapse earlier messages** returns to the latest five. This control sits at the top of the scrolling history; turn off **Settings → Replies & reading → Start with the latest five messages** to show all loaded messages.
- **Hide quoted email** folds earlier emails embedded *inside one received message*. They start open. A boundary explanation and a short excerpt show what you are hiding; **Show quoted email** restores it. The helper recognizes email structure, not duplicate text. The quote may contain the only copy of a request or an inline answer, so read it before hiding it. Unknown and quote-only messages stay visible.

**Simplify email formatting has been removed in the local v0.7.12 build.** It reset table widths, spacing and fills; wrapping could make a message taller without making it clearer. It did not summarize or remove repeated email text. [Reading email: what changes](docs/READING_EMAIL.md) explains the remaining controls with a simple example.

Images stay inline unless their displayed height exceeds **320 CSS pixels**. Short banners, logos and wide, short screenshots keep their normal presentation. Taller images get a contained thumbnail with hover/full-image access. The check uses displayed height, so a responsive image can qualify differently when the column width changes.

Theme adaptation repairs measured unreadable text on solid message backgrounds and preserves readable authored colors. Image previews contain the full image. Off restores native content display. Closed tickets show a disabled **Closed** status; the helper never substitutes Open when native status controls are missing.

Desktop sidebar widths follow the helper layout. Turn the helper Off to restore native column resizing. Native context/app navigation improvements remain deferred. Long Harvest notes and reference text scroll within their own areas; project/task and timer controls remain open. The guide has the full feature instructions.

Routine copy, draft-carry, settings/theme and export success notices are silent. Errors, conflicts, recovery instructions, progress and title Undo remain visible. Closed tickets hide helper Send/Save actions. The guide includes coworker testing steps. Documentation changes follow the ADHD and humanizer skills under AGENTS.md.


## Release files

Push a version tag to prepare tested ZIPs and checksums in a draft GitHub release. Follow [the tagged release steps](docs/release/TAGGED_RELEASES.md). Chrome Web Store submission remains separate.


[Install from Chrome Web Store](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf) · [What changed](CHANGELOG.md) · [Contribute a fix](CONTRIBUTING.md)
