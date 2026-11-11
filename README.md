# Zendesk Helper

A local Chrome extension that adjusts the Jones IT Zendesk interface. It loads automatically on `https://itjones.zendesk.com/agent/*`.

**[Feature guide](guide.html)** explains what the extension offers and how to use it. The same guide is available through **Help & feature guide** in the popup.

**Reading the source? Start with [the code tour](docs/CODE_TOUR.md).** Each runtime file has a short reading path; `npm run format` keeps it readable.

Private release preparation: [docs/release/START_HERE.md](docs/release/START_HERE.md). These materials are local drafts, not a published store listing.

## Install or reload
1. Open `chrome://extensions`, enable Developer mode, and load this folder unpacked.
2. After code changes, reload the extension and refresh the Zendesk tab.
3. Use the extension popup’s single **On / Off** switch. Settings save immediately.

The version in `manifest.json` identifies the local build. Confirm Chrome's loaded version separately.

## Where things go
- **[TASKS.md](TASKS.md):** add requests here; this is the only task queue.
- **[Current state](docs/CURRENT_STATE.md):** latest evidence, limitations, and next step.
- **[AGENTS.md](AGENTS.md):** instructions for working in this repository.

Run `npm ci` when dependencies need installing, then `npm run check` for local checks. `npm run test:fixtures` is an optional synthetic regression suite. It does not prove the live Zendesk UI works; follow the project's verification skill for extension changes.

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

Choose a built-in theme or **System light / dark** in the extension popup. Hover/focus previews the popup; selecting applies the theme. Create a custom theme with five color controls, preview it temporarily on the ticket/Harvest, then Save and apply. Preview ends when the popup closes; unsaved palette edits remain available for the current Chrome session. Themes apply immediately and persist across refresh; turning the overlay off restores native colors. Use **Enable Harvest theme** once to grant optional access to platform.harvestapp.com, then refresh Zendesk. Harvest follows the selected theme; other embedded apps keep their own colors. Turning Harvest styling off restores its native colors; Chrome site access can be managed in the extension details. Coverage and verification: [docs/THEMING.md](docs/THEMING.md).


## Ticket tools

- **Internal note / Public reply** beside the native selector switches in one click. Optional **Carry this draft** preserves text/formatting across modes; a distinct destination draft is never silently overwritten. Queued attachments block carrying. Native separate drafts remain the default.
- **Update company and requester in ticket titles** uses the selected native identity and preserves the issue suffix. Changes stay in the ticket draft until Save or Send; Undo also turns off automatic title updates.
- **Copy ticket** opens on hover and closes when the pointer leaves. Enter/Space and touch tap also work; Escape closes. Choose number, link, title/link or Markdown.
- The reply activity line mirrors Zendesk’s native collision reporting. Unknown activity is explicitly labeled; it is not a guarantee the ticket is free.
- Views refresh every 15 seconds by default (10/15/30/60 seconds or Off). Refresh pauses for typing, selection, menus, hidden/offline tabs and recent interaction. It uses Zendesk’s native refresh action, not page reloads.

[Team installation](docs/DISTRIBUTION.md) · [Reviewed documentation handoff](docs/DOCUMENTATION_HANDOFF.md)

## Reading email threads

Use **Hide quoted email history** inside a received message and **Show quoted email history** to restore it. Clearly marked quotes with a separate new response can start collapsed; plain forward headers start open. Unrecognized or quote-only messages remain visible. Expand older email content when checking for inline answers. The five-message ticket disclosure remains separate.

For bulky formatted emails, choose **Simplify email formatting**. **Restore email formatting** returns the authored layout. It removes fixed widths, table padding and background fills; plain paragraphs can look unchanged. It does not collapse threads. The original message and raw export remain available.

Theme adaptation repairs measured unreadable text on solid message backgrounds and preserves readable authored colors. Image previews contain the full image. Off restores native content display. Closed tickets show a disabled **Closed** status; the helper never substitutes Open when native status controls are missing.

Desktop sidebar widths follow the helper layout. Native column handles return when that layout is off. Long Harvest notes and reference text scroll within their own areas; project/task and timer controls remain open. The guide has the full feature instructions.

Routine copy, draft-carry, settings/theme and export success notices are silent. Errors, conflicts, recovery instructions, progress and title Undo remain visible. Closed tickets hide helper Send/Save actions. The guide includes coworker testing steps. Documentation changes follow the ADHD and humanizer skills under AGENTS.md.
