# Current state — 2026-11-12

## Installed build

v0.7.8 loaded in actual Chrome from `~/Projects/zendesk-helper`; version, source and Reloaded confirmation checked. The installed name is now Jones IT Zendesk Helper. Runtime files live under `src/` by responsibility. Keep loading this same repository root: `manifest.json` remains there. No added permissions. Chrome 114+ is now explicit because Status uses the native Popover API.

Start reading at `src/README.md`, then `docs/CODE_TOUR.md`. `docs/DEVELOPMENT.md` explains checks, execution contexts and path bases. The guarded save coordinator remains in `src/content/index.js`; its control CSS is separate. This pass does not claim a full state-machine rewrite or a security/accessibility certification.

## Checks and Chrome acceptance

Local aggregate and formatting pass. ESLint recommended rules, recursive syntax checks and runtime-resource validation now run in read-only GitHub CI on pushes/PRs. npm audit reports zero vulnerabilities with the documented development-only minimatch override. Dynamic Harvest registration updates stale script paths during upgrades; regression covers migration and repeat synchronization.

Actual Chrome checked the moved popup and feature guide, temporary custom preview and rollback, Status options without changing the selection, Midnight/Blush colors and matching Harvest. The original internal HTML remains `<p>Test that this is a separate thing</p>`. Public was empty after reload; carry testing temporarily copied the internal text, then public was restored empty with Carry off before restoring Internal/Carry on. Final Blush, Normal/Open, Save disabled, Harvest idle. No fields saved, messages sent or timer entries created. The other open workspace with an ALP title was left alone. Evidence stays outside GitHub in current chat `outputs/reorg-077/`.

Earlier acceptance still covers Closed/Unavailable status, short headers, received-email contrast, quote/image lifecycle, quiet feedback and hover/keyboard Copy. A native second-agent test and screen-reader walkthrough remain open in TASKS.md. Do not treat unknown presence as nobody else working.

## Release and repository

Current name: Jones IT Zendesk Helper. v0.7.8 metadata/package/lock versions match. Current UI, policy, guides, release tooling and artwork use the name; internal IDs, storage keys, repo and ZIP prefixes are unchanged. Historical evidence and prior tags retain their original names. Aggregate, format checks and store preflight pass. Actual Chrome source/version/Reloaded and renamed popup verified. No ticket edits/saves/sends. Local preview closed, viewport reset and preview server stopped. Evidence: current chat outputs/rename-078.

Origin is https://github.com/forest-jit/zendesk-helper (public). The v0.7.8 tag points to ecdc33f; GitHub run43083408272 passed checks, packaging, checksums and draft-release creation. The existing v0.7.8 release is now public with reviewed changelog notes and generated store-text attachments; its original tagged ZIPs are unchanged. The earlier v0.7.7 tag stays at a7faec9. No store API credentials or automatic submission are configured. See docs/release/TAGGED_RELEASES.md. Exclude ignored customer audits, raw exports and historical private evidence from uploads.

The owner reports Chrome Web Store publication on November 12, 2026: https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf. The prepared package was v0.7.8; this turn did not independently inspect the live listing/package. Earlier dashboard draft/submission notes are historical. Company rollout, second-agent presence and screen-reader checks remain open. Publisher display name was not changed in this turn. No Pages deployment.

CHANGELOG.md now supplies GitHub notes and plain-text store update copy. Future tags validate a matching nonempty entry before packaging. dist/store-description.txt includes the current base description plus latest notes; this text has not been saved or published in the Store dashboard. No Google API submission credentials are configured. Contributions guide and a public sanitized bug template are included; customer evidence belongs in company Notion.

Internal Tools now links to https://app.notion.com/p/41618a28418d8148b816ec7c3bd7d641. Its report database has an inline five-stage board, screenshot property, owner/priority and manual Minutes spent; the Time spent view is separate. The closed form draft contains only Summary: SHOW did not create the other questions. Owner confirmed all Internal Tools, with Jones IT Zendesk Helper as the default Tool and an option to choose another. That default is documented but not configured. Complete its questions/default and company-only audience in Notion before opening/sharing it. Browser attempt reached a sign-in page and then lost attachment, so no form submission, sharing configuration or attachment upload was tested. No timer/Harvest synchronization is implemented.

CHROMEWEBSTORE.md is the store-field/readiness record; TASKS.md is the only queue. Start at docs/release/START_HERE.md for owner steps.

## Working boundaries

TASKS.md is the only queue. Other people's tickets stay read-only; #209867 is authorized for edits/saves/sends when needed. Capture both drafts before refresh, retain uncertain backups and never overwrite a distinct destination draft. Approved optional Harvest access persists; do not start timers during visual checks.

Local AI processing remains optional and separate from the store runtime. Previous representative export/media processing passed with manual corrections; text scrubbing and image interpretation require human review. Raw image pixels can reach the local vision model. No hosted AI or Notion publishing is automatic.
