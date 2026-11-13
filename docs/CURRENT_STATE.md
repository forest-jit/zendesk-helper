# Current state — 2026-11-13

## Deployment is on hold

The owner paused deployment and listing changes on November 13. Do not upload, submit, replace listing images, tag or publish a new release. Existing Store/GitHub v0.7.11 drafts remain unchanged. The v0.7.12 source/docs are saved on main separately from deployment. Branch pushes run source checks; they do not publish the extension. No release tag or Store action occurred. Feature commit `98bc1bb` passed [source CI 43450758622](https://github.com/forest-jit/zendesk-helper/actions/runs/43450758622), including check and browser-regressions jobs. Later comments/evidence-only updates run the same source workflow.

**Published Store: v0.7.8**, ID `bbhdbfdfidlfihbbohohdndpppibgogf`, used in Arc. **Local source and Chrome unpacked: v0.7.12**, matching manifest/package/lock, unpacked ID `pfgmgihalnopfhgaodnopkeejgofenba`. The actual extension Reload control showed 0.7.12. Source edits do not update Store users.

The prior 0.7.11 tag/source commit is `a1331b2`; source CI 43389692281 and tagged build 43389694785 passed. The draft GitHub release has its ZIPs/checksums/notes. Google remains Draft 0.7.11 / Published 0.7.8; its old listing images were not removed. Do not silently replace that package with local 0.7.12.

## What changed locally

- Recognized quoted emails start open. Boundary explanations, Hide/Show quoted email and an excerpt identify the hidden section. No deduplication claim. Simplify was removed because broad layout resets did not reliably help.
- Images become previews only above 320 CSS pixels at authored displayed height. Short banners/logos and wide, short screenshots keep native display/click behavior. Source/width/load changes reconcile bindings; preview clones no longer duplicate IDs.
- Composer mode controls have 12px vertical/16px horizontal header inset and 32px minimum buttons. Four-sided style acceptance is now required in WORKFLOW/AGENTS/DESIGN. Closed tickets also get native jump suppression and divider removal without needing a composer.
- Popup Export ticket uses the active ticket, hands off synchronously to the worker, and rechecks sender/tab/URL. Closing the popup does not cancel capture/download. Settings chooses a target only for temporary preview/manual title selection.
- A separate local reviewer opens from Start Local Review.command. It accepts a chosen export, uses downloaded Ollama models, and produces one summary/conclusion with actions, verification, documentation candidates and supporting excerpts. Source text is available for comparison. No automatic Notion publication.

## Actual Chrome evidence

Read-only #205358: logo143×16 and banner750×71 stayed inline, quote started open, Hide showed an excerpt, and Show restored exact original source text. Other long samples with 16,20 and 74 rendered messages had no supported boundary and remained intact. Important forwarded correspondence is not presumed redundant. Collapsed/expanded history scrolling after dwell showed no visible See oldest/newest. Closed frame border measured 0px; helper Send/Save stayed absent. No customer fields, messages or timers were changed.

#209867: Blush and Deep Purple, public/internal mode, native header padding and 1100×850 layout checked. Narrow layout had no horizontal overflow. Off restored the native selector, and On restored the segmented control. Both rich drafts matched their private pre-reload backups after the final refresh. Final preferences: Blush, On, shared draft on, latest-five on, automatic title on, existing Harvest styling on. Public reply restored; Priority Normal/Status Open and Save disabled. Harvest remained idle 0:00. No save or send was needed this turn. Other owner-open ticket tabs were not refreshed.

Actual toolbar export of #205358 finished after popup closure:27 messages,10 image references,8 captured. This Chrome profile renamed the requested filename to a generic numbered JSON; a synthetic direct downloads API call reproduced that independently of helper logic. The isolated packaged browser preserves requested names. T77 tracks the environment issue; instructions explain the renamed file. The synthetic test file was removed after verifying its contents.

## Local AI acceptance

Ollama already had `mistral:latest` and `qwen2.5vl:3b`; no models were installed. A fictional case and real local export were processed. Real browser upload, progress, refresh/reconnection, evidence viewer and Markdown download passed. Final run: 27 messages,8 images read,2 unavailable decorative references. Downloaded Markdown matched the server result.

Real output exposed shifted citations, a pending follow-up classified as verification, card-tail/expiry leakage and verbose image notes. Exact-excerpt validation now matches originals, corrects only a unique literal source match, and rejects unmatched quotes. Pending-work verification is omitted with a review note. Known card/expiry patterns are scrubbed and regression-tested; original pixels still reach the local vision model. The final checked output omitted the known leaked card/expiry details. This is not proof of complete anonymization or factual accuracy. Image notes remain unverified, and some public-message visibility metadata is Unknown rather than guessed.

Raw upload stays in server memory; private review folders/files remain local. The server binds 127.0.0.1, checks Host/Origin and a per-launch token, allowlists files/downloads, and runs one job at a time. The development ZIP includes the executable launcher and local app; the Store ZIP excludes them. The local server was stopped after acceptance; reopen the launcher to use it.

Private evidence, corrected email walkthrough, generated reviews and a separately reviewed Notion candidate are outside Git in chat outputs/reading-and-local-ai-2026-11-13/. Earlier PRIVATE-DEMO-NOTES.md now identifies its superseded email behavior. No customer content/captures belong in public release assets.

## Checks and documentation

`npm run check`, formatting and diff checks pass. Seventeen packaged Chromium cases and twelve reviewed macOS snapshots pass, including height-based images, quote preservation/raw export, popup closure, native state/draft guards and theme cleanup. Offline local tests cover privacy, exact excerpts, shifted references, pending verification, request boundaries, disconnected jobs and allowlisted downloads. These tests do not establish every future Zendesk/email/model case.

Local Store/development ZIPs and checksums were built and Store preflight passed. The development launcher retains its executable bit; local AI is absent from the 37-file Store package. Nothing was uploaded. Impeccable’s CSS scan is limited to regex rules; rendered local-review scans at desktop and narrow widths supplement actual visual checks. Initial long-line findings were fixed rather than waived.

README, packaged guide, feature walkthrough, code tour, email/local-processing guides, workflow, policy, reviewer/Store source and five Notion pages were updated and reviewed with the humanizer/ADHD rules. Historical changelog entries and archives remain historical; this was not a rewrite of archived documents. Static public-site drafts were regenerated locally, not deployed. TASKS.md is the only implementation queue; the repository workflow is canonical and Notion is its team-facing summary.

## Remaining boundaries

T61: fresh real Harvest first-grant/cancel/reopen/revoke acceptance in Chrome and Arc. Existing granted access and regressions are not that check. T55: coworker Notion create/own-card edit/screenshots. T05: real screen-reader acceptance. T09: organization rollout/allowlisting. T60: intermittent Arc→Chrome focus report remains unreproduced. T71: native context/app navigation redesign is deferred. T77: environment-specific JSON download names. T62: release hold.

Use only #209867 for authorized edits/saves/sends. Protect both drafts before refresh. Never overwrite a different destination or start Harvest timers for styling. Storage/access differ by browser/profile and extension ID.

Origin: https://github.com/forest-jit/zendesk-helper. Preserve prior approved tags/assets and restore the owner’s GitHub identity after any future push.

[Team guide](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899) · [Workflow](https://app.notion.com/p/41618a28418d81d0833deae74b796d30)
