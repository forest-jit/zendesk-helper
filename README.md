# Jones IT Zendesk Helper

A Chrome extension with tools and improvements for the Jones IT Zendesk interface. It loads automatically on `https://itjones.zendesk.com/agent/*`.

**[Feature guide](src/guide/guide.html)** explains what the extension offers and how to use it. The same guide is available through **Help & feature guide** in the popup.

[Team guide in Notion](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899) covers installation, daily use, themes, Harvest and optional exports. Jones IT workspace access is required.

**Reading the source? Start with [the code tour](docs/CODE_TOUR.md).** Each runtime file has a short reading path; `npm run format` keeps it readable.

Store fields: [CHROMEWEBSTORE.md](CHROMEWEBSTORE.md).

Release preparation and updates: [docs/release/START_HERE.md](docs/release/START_HERE.md). The extension is published in the Chrome Web Store.

## Install

**Use Zendesk Light mode:** click your Zendesk profile picture → **Appearance → Light mode**. Choose Light mode explicitly rather than Match system appearance. Native Zendesk Dark mode is not supported by the helper yet and can leave mismatched colors. You can still use the helper’s own dark themes; your Mac’s appearance can stay as it is.

1. [Install from the Chrome Web Store](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf).
2. Open a Jones IT Zendesk agent page.
3. Open the popup and use the **On / Off** switch. Settings save immediately.

For development, load this repository root unpacked through `chrome://extensions` → Developer mode → Load unpacked. After source changes, reload that extension and refresh Zendesk after protecting drafts. Do not run Store and unpacked copies together. The manifest identifies the source version; confirm Chrome’s loaded version separately.

### Match Harvest to your theme

**Harvest styling is off by default.** Choosing a theme does not turn it on.

1. Open Jones IT Zendesk Helper from your browser’s toolbar.
2. Click **Match Harvest to theme**.
3. Allow access to **platform.harvestapp.com** when your browser asks.
4. Check that the button says **Harvest theme on**. If the permission prompt closed the popup, reopen it; if it still says **Match Harvest to theme**, click it again.
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

Choose **Solved** to reveal **Close ticket** and **Close and export**. Both save Zendesk's Solved status (not Closed). Text drafts are protected and restored during property-only saves; queued attachments must be sent or removed first. Close and export prepares the snapshot before saving and downloads it after the save is acknowledged. The popup's **Export ticket for local AI** also exports without changing status.

Exports are raw local JSON files, containing all rendered comments (including collapsed history), timestamps, visibility, and image references/bytes when accessible. Per-message quoted history remains in the export when its display is collapsed. Unloaded history is explicitly outside the snapshot. Some authenticated or cross-origin images may need a local copy.

Ollama models used by the local processor:

```sh
ollama pull mistral
ollama pull qwen2.5vl:3b
python3 scripts/process_ticket.py "/path/to/ticket.raw.json"
```

Pattern matching and known-identity redaction run before and after local models. Author names are normalized separately from timestamps; known first-name references and domain names are also scrubbed. The text model drafts technical documentation. The vision model interprets embedded images. On macOS, wide/tall screenshots are padded locally with the built-in image tool so the model can see their edges. AI visual interpretations stay clearly marked as unverified, separate from the text-based draft. The output folder contains `notion-draft.md` and `processed.json`; review the draft before giving it to Notion AI. Raw screenshots and identity mappings are not included in the Markdown.

For missing images, place local copies named `image-001.png`, `image-002.jpg`, etc. in a folder and pass `--media-dir "/path/to/images"`. Alternatively, `--fetch-public-media` opts into downloading public HTTPS images; it does not use browser cookies and cannot retrieve private attachments that require them. Missing media is reported, never described as analyzed.

Ollama must be running at `127.0.0.1:11434`. Processing uses local models; this command does not write to Notion or call a hosted AI service. Privacy removal is best-effort and review remains necessary. Add `--redact-term "Additional name or organization"` for identifying terms found during review; repeat the option as needed. Review image interpretations against the actual image: the tested local vision model confused Pending membership with Active. A model summary is not proof of a resolution.

Choose a built-in theme or **System light / dark** in the extension popup. Hover/focus previews the popup; selecting applies the theme. Create a custom theme with five color controls, preview it temporarily on the ticket/Harvest, then Save and apply. Preview ends when the popup closes; unsaved palette edits remain available for the current Chrome session. Themes apply immediately and persist across refresh; turning the overlay off restores native colors. Harvest styling needs its own setup; follow **Match Harvest to your theme** above. Harvest follows the selected theme; other embedded apps keep their own colors. Turning Harvest styling off restores its native colors; Chrome site access can be managed in the extension details. Coverage and verification: [docs/THEMING.md](docs/THEMING.md).


## Ticket tools

- **Internal note / Public reply** beside the native selector switches in one click. Optional **Carry this draft** preserves text/formatting across modes; a distinct destination draft is never silently overwritten. Queued attachments block carrying. Native separate drafts remain the default.
- **Update company and requester in ticket titles** uses the selected native identity and preserves the issue suffix. Changes stay in the ticket draft until Save or Send; Undo also turns off automatic title updates.
- **Copy ticket** opens on hover and closes when the pointer leaves. Enter/Space and touch tap also work; Escape closes. Choose number, link, title/link or Markdown.
- The reply activity line mirrors Zendesk’s native collision reporting. “Agent activity · not reported” means the helper has not found a native viewing or editing signal. It does not mean nobody else has the ticket open.
- Views refresh every 15 seconds by default (10/15/30/60 seconds or Off). Refresh pauses for typing, selection, menus, hidden/offline tabs and recent interaction. It uses Zendesk’s native refresh action, not page reloads.

[Team installation](docs/DISTRIBUTION.md) · [Reviewed documentation handoff](docs/DOCUMENTATION_HANDOFF.md)

## Reading email threads

Use **Hide quoted email history** inside a received message and **Show quoted email history** to restore it. Clearly marked quotes with a separate new response can start collapsed; plain forward headers start open. Unrecognized or quote-only messages remain visible. Expand older email content when checking for inline answers. The five-message ticket disclosure remains separate.

For bulky formatted emails, choose **Simplify email formatting**. **Restore email formatting** returns the authored layout. It removes fixed widths, table padding and background fills; plain paragraphs can look unchanged. It does not collapse threads. The original message and raw export remain available.

Theme adaptation repairs measured unreadable text on solid message backgrounds and preserves readable authored colors. Image previews contain the full image. Off restores native content display. Closed tickets show a disabled **Closed** status; the helper never substitutes Open when native status controls are missing.

Desktop sidebar widths follow the helper layout. Native column handles return when that layout is off. Long Harvest notes and reference text scroll within their own areas; project/task and timer controls remain open. The guide has the full feature instructions.

Routine copy, draft-carry, settings/theme and export success notices are silent. Errors, conflicts, recovery instructions, progress and title Undo remain visible. Closed tickets hide helper Send/Save actions. The guide includes coworker testing steps. Documentation changes follow the ADHD and humanizer skills under AGENTS.md.


## Release files

Push a version tag to prepare tested ZIPs and checksums in a draft GitHub release. Follow [the tagged release steps](docs/release/TAGGED_RELEASES.md). Chrome Web Store submission remains separate.


[Install from Chrome Web Store](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf) · [What changed](CHANGELOG.md) · [Contribute a fix](CONTRIBUTING.md)
