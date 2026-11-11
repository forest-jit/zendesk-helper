# From a ticket to reviewed documentation

The existing local processor produces a draft; it does not publish to Notion or ClickDoc.

## Local preparation

Export the active ticket using **Export ticket for local AI**, or choose **Solved → Close and export** after resolving it. The label closes the working task; Zendesk records **Solved**, not the irreversible **Closed** status.

Run:

```sh
python3 scripts/process_ticket.py "/absolute/path/to/ticket.raw.json" --output "/absolute/path/to/review-folder"
```

Ollama must be running at `127.0.0.1:11434` with `mistral:latest` and `qwen2.5vl:3b`. The processor uses local models. Known identities and contact patterns are scrubbed before and after inference; this does not detect every possible identifier. Missing or inaccessible images are reported; they are not silently treated as analyzed. To provide missing screenshots, put copies named `image-001.png`, etc. in a local folder and add `--media-dir "/absolute/path/to/images"`.

If review finds another identifying name or company term, rerun with `--redact-term "Term to remove"`. Repeat the option for multiple terms. Input files and screenshots remain local and unredacted; processed drafts still require review.

Review `notion-draft.md` together with `processed.json`:

- Remove names, email/phone/address/account details, ticket/customer links, and identifying details in quoted error messages.
- Check whether image interpretations are accurate. Keep the distinction between observed ticket facts and unverified AI interpretations.
- Retain the technical trigger, diagnosis, resolution, verification and limitations. Omit unsupported conclusions.
- Open the raw export locally only when needed to verify the draft. Never paste raw exports or unreviewed screenshots into shared AI tools.

## Notion

Choose the destination page or database, check for an existing article, then paste/import only the reviewed Markdown. Suggested fields are **Title**, **Product**, **Problem**, **Resolution**, **Verification**, **Last reviewed**, **Owner**, and **Source reviewed locally**. Add screenshots only after separately reviewing/redacting them.

A useful Notion AI request after review:

> Compare this reviewed technical draft with the existing documentation in this workspace. Identify duplicates, suggest the appropriate existing article, and propose a concise update. Preserve uncertainty and do not invent steps. Show the proposed changes for review before editing existing pages.

## ClickDoc or another documentation service

Use the same reviewed Markdown and article structure. Choose an explicit destination; append to an existing matching article when appropriate. Keep each screenshot caption factual: what is visible, why it matters, and whether interpretation remains uncertain. Authentication, destination selection, and publication belong to that service's normal workflow; no credentials or automatic external publication are bundled here.

## Representative acceptance

A real read-only support ticket was exported with15 comments and six images. Processing completed with no missing media. Review exposed author labels containing timestamps, missed name/domain references and an image interpretation that confused Pending membership with Active. The author parser and deterministic scrubber were strengthened; a separate reviewed handoff corrects the unsupported claims. This establishes a working pipeline, not reliable automatic de-identification of every future ticket. Review remains part of each import.
