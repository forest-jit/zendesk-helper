# Moving to another computer

The project should be recoverable without this Mac. A verified remote copy is required before deleting the only local copy. This checklist covers Zendesk Helper and the work associated with this chat only. Other projects and the rest of the Mac are outside scope.

## Where each thing belongs

| Material | Destination | Current boundary |
| --- | --- | --- |
| Extension source, local AI scripts, tests, maintained docs and presentation runbook | GitHub repository | Commit and push all intended changes; verify the remote commit contains them. |
| Team instructions, presentation notes and resume context | Existing Notion project pages | Preserve the deployment hold and distinguish source from published Store builds. |
| Customer screenshots, raw exports, rich-draft backups, private audits and AI outputs | Not retained at the owner’s request | Owner said the testing artifacts are not needed. Do not upload them to public GitHub or shared Notion pages. Cleanup is separate from backup verification. |
| Browser preferences, custom themes and unsent drafts | Explicit export or approved private backup | A Git clone does not restore these. Save current drafts before wiping or signing out. Each installation needs Harvest setup again. |
| Downloadable tools, dependencies, models and build caches | Reinstall on the replacement computer | They do not need archival copies when their source/setup is documented. |

## Restore the project

```sh
git clone https://github.com/forest-jit/zendesk-helper.git
cd zendesk-helper
```

The repository contains Start Local Review.command, scripts/local_review.py, scripts/process_ticket.py and the local-review UI. The Chrome Web Store package does not install that separate app.

Use the approved Store build for normal installation. For the current unreleased demo, load the repository root unpacked in Chrome. Use one helper installation at a time. Settings and optional Harvest access do not transfer automatically between profiles or extension IDs.

Follow [the installation guide](DISTRIBUTION.md) and [local AI setup](DOCUMENTATION_HANDOFF.md). Python 3 and Ollama with downloaded mistral:latest and qwen2.5vl:3b are needed for local AI. The model cache can be downloaded again; do not upload it to GitHub.

## Verify before erasing

1. Confirm GitHub contains the latest source, presentation runbook, current state and task queue.
2. Open the Notion presentation/handoff notes from another device or a signed-in browser.
3. Confirm that only the explicitly unwanted test artifacts are being discarded. Private screenshots, audit outputs and generated AI drafts are not included in the remote handoff.
4. Save any current unsent drafts and export custom themes you want to retain. Historical test backups do not prove every current browser draft is backed up.
5. Test access from the replacement computer, then use the company’s normal device-return/erase procedure. This document does not authorize wiping unrelated files, credentials or browser profiles.

Deployment remains on hold. Moving source or backing up files does not publish a Store update.

## Writing rules and skills

Project copies of humanizer and i-have-adhd are preserved under .agents/skills/, including the available reference and license files. AGENTS.md points to these repository copies, so the working instructions no longer depend on Forest’s old home-directory paths. The existing project design and Zendesk verification skills are already tracked. Chrome guidance provenance is recorded in DEVELOPMENT.md.

## Removing local files

Removing the project folder stops the unpacked extension and local reviewer on this Mac. Confirm the presentation/demo is finished here before cleanup. Moving files to Trash is recoverable and does not securely erase the device; the company’s normal device-return process remains necessary. No browser profile, password store or unrelated project should be removed as part of this project cleanup.
