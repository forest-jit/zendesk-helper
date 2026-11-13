# Turn an export into reviewed notes

**Open Start Local Review.command**, choose a ticket JSON file, then click **Create summary**. The local app produces a summary, conclusion and notes for review. It does not publish to Notion.

This describes local v0.7.12. The Chrome Web Store extension does not install the separate local reviewer or Ollama. Deployment is on hold.

## 1. Export the ticket

1. Open the ticket in Zendesk.
2. Open the helper from the toolbar. Check **Current ticket: #…**.
3. Click **Export ticket**. Chrome downloads raw ticket JSON. The helper requests a `ticket-….raw.json` name; some browser profiles may rename it to `download.json` or a numbered copy. Use the newest download from that action.

Export does not save fields or send a draft. Once requested, it can finish after the popup closes. On a page that is not a ticket, the button is disabled. The Settings tab chooser is only for temporary theme previews and the manual title tool.

**Solved → Close and export** remains available when resolving a ticket. It records Zendesk’s **Solved** status, then downloads after the save is acknowledged; it does not set irreversible Closed.

Exports contain original ticket information, all rendered comments including hidden history/quotes, and accessible image data. They do not fetch history Zendesk has not loaded. Missing media is reported.

## 2. Open the local reviewer

1. In the project folder, double-click **Start Local Review.command**. Keep its terminal window open.
2. The review page opens in your usual browser. Check that it says **Local models ready**.
3. Choose the raw JSON file. Leave **Read included images too** checked when images matter.
4. Click **Create summary**. Progress shows the current stage.

Closing the browser tab does not cancel processing. Refreshing the same tab reconnects to its job during that browser session. Restarting the local server loses its in-memory job list; completed files remain on disk.

The reviewer listens on `127.0.0.1` only and talks to downloaded Ollama models. It keeps the chosen raw input in memory rather than saving a second raw copy. Results are saved under:

```text
~/Library/Application Support/Jones IT Zendesk Helper/Reviews/
```

Each review has its own folder containing `notion-draft.md` and `processed.json`. Downloads create another copy where your browser normally saves files. Stop the local server with Control–C when finished.

## 3. Check the result

The review separates:

- **Summary and conclusion:** what the ticket reports and what remains uncertain.
- **Actions and reported verification:** recorded work and the requester’s follow-up.
- **Notes worth documenting:** reusable facts or procedures supported by the messages.
- **Image observations:** interpretations that still need checking against the originals.

References such as **C3** mean the third exported message. Each action, verification and documentation candidate includes a supporting excerpt. The processor checks that excerpt against the redacted original; it corrects a shifted number only when the excerpt has one unique match, and rejects an unmatched quote. Open **Check cited messages** in the app to compare the originals. An exact quote still does not prove the model’s interpretation follows from it. Statements about pending work are left out of reported verification and flagged under **Check during review**. A documented resolution means the record contains an action and a reported result, not independent proof or a permanent guarantee.

Check the conclusion against the ticket. Remove unsupported claims and remaining personal information. Confirm image interpretations, especially status labels and small text. The tested vision model has previously confused Pending with Active. Raw image pixels reach the local model before text redaction; they are not automatically anonymized.

Known identities and common contact patterns are scrubbed before and after text inference. This can miss names, identifiers and context clues. Neither the app nor its output is an anonymization guarantee.

## 4. Add only the reviewed draft to Notion

Choose **Download Notion draft** or **Copy Markdown**. Check for an existing article, then paste/import into the intended page. Nothing is uploaded automatically.

A useful request for Notion AI after review:

> Compare this reviewed draft with our existing documentation. Suggest an existing article to update, identify duplicates, and propose the changes. Keep uncertainty and do not invent missing steps. Show the proposal before changing pages.

Review screenshots separately before sharing them. Keep raw exports and unreviewed images out of hosted AI tools and public repositories.

## First-time model setup on another Mac

Install [Ollama](https://ollama.com/download) from its official site, start it, then download these local models:

```sh
ollama pull mistral
ollama pull qwen2.5vl:3b
python3 scripts/process_ticket.py --check
```

Both models are already installed on the maintainer’s M4 Pro Mac. The processor checks for local downloaded models and refuses cloud models. It unloads the vision model before text synthesis to reduce shared-memory pressure. Large tickets are read in chunks, then combined into one structured review.

Ollama must listen on `127.0.0.1:11434`; the reviewer does not expose it to your network. API behavior: [structured outputs](https://docs.ollama.com/capabilities/structured-outputs) and [local generation](https://docs.ollama.com/api/generate).

## Command-line options

For a specific output folder:

```sh
python3 scripts/process_ticket.py "/absolute/path/to/ticket.raw.json" \
  --output "/absolute/path/to/review-folder"
```

Use `--text-only` to skip images. For inaccessible images, place local copies named `image-001.png`, etc. in a folder and pass `--media-dir "/absolute/path/to/images"`. `--fetch-public-media` explicitly opts into public HTTPS downloads without browser cookies; private authenticated attachments may remain unavailable.

If review finds another identifying term, rerun with `--redact-term "Term to remove"`; repeat as needed. Raw inputs stay unchanged. Review the new output again before sharing.
