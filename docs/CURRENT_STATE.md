# Current state — 2026-11-11

## Installed build

v0.7.8 loaded in actual Chrome from `~/Projects/zendesk-helper`; version, source and Reloaded confirmation checked. The installed name is now Jones IT Zendesk Helper. Runtime files live under `src/` by responsibility. Keep loading this same repository root: `manifest.json` remains there. No added permissions. Chrome 114+ is now explicit because Status uses the native Popover API.

Start reading at `src/README.md`, then `docs/CODE_TOUR.md`. `docs/DEVELOPMENT.md` explains checks, execution contexts and path bases. The guarded save coordinator remains in `src/content/index.js`; its control CSS is separate. This pass does not claim a full state-machine rewrite or a security/accessibility certification.

## Checks and Chrome acceptance

Local aggregate and formatting pass. ESLint recommended rules, recursive syntax checks and runtime-resource validation now run in read-only GitHub CI on pushes/PRs. npm audit reports zero vulnerabilities with the documented development-only minimatch override. Dynamic Harvest registration updates stale script paths during upgrades; regression covers migration and repeat synchronization.

Actual Chrome checked the moved popup and feature guide, temporary custom preview and rollback, Status options without changing the selection, Midnight/Blush colors and matching Harvest. The original internal HTML remains `<p>Test that this is a separate thing</p>`. Public was empty after reload; carry testing temporarily copied the internal text, then public was restored empty with Carry off before restoring Internal/Carry on. Final Blush, Normal/Open, Save disabled, Harvest idle. No fields saved, messages sent or timer entries created. The other open workspace with an ALP title was left alone. Evidence stays outside GitHub in current chat `outputs/reorg-077/`.

Earlier acceptance still covers Closed/Unavailable status, short headers, received-email contrast, quote/image lifecycle, quiet feedback and hover/keyboard Copy. A native second-agent test and screen-reader walkthrough remain open in TASKS.md. Do not treat unknown presence as nobody else working.

## Release and repository

Current name: Jones IT Zendesk Helper. v0.7.8 metadata/package/lock versions match. Current UI, policy, guides, release tooling and artwork use the name; internal IDs, storage keys, repo and ZIP prefixes are unchanged. Historical evidence and prior tags retain their original names. Aggregate, format checks and store preflight pass. Actual Chrome source/version/Reloaded and renamed popup verified. No ticket edits/saves/sends. Local preview closed, viewport reset and preview server stopped. Evidence: current chat outputs/rename-078.

Origin is https://github.com/forest-jit/zendesk-helper (public). The v0.7.8 tag points to ecdc33f; GitHub run43083408272 passed checks, packaging, checksums and draft-release creation. Store/development ZIPs are in chat outputs and the GitHub draft. The earlier v0.7.7 tag stays at a7faec9. No store API credentials or automatic submission are configured. See docs/release/TAGGED_RELEASES.md. Exclude ignored customer audits, raw exports and historical private evidence from uploads.

Store item bbhdbfdfidlfihbbohohdndpppibgogf now has the runtime-only v0.7.8 package. Package confirms version; title/description, three refreshed screenshots and promo tile persisted after Save draft and refresh. Image replacement explicitly approved. Workflow & Planning, English, icon and GitHub homepage/support links retained. Submit for review enabled, not clicked. Screenshots use actual popup/guide code with synthetic preferences, not customer tickets.

Privacy purpose/permission explanations, four data categories and the public GitHub policy URL are saved. Plain-language policy is included in v0.7.8. Publisher contact forest.r.welch@gmail.com is verified after the owner followed Google's email link. Publisher certifications were left to the owner at the last privacy edit; current certification/distribution choices were not re-audited. Preferred publisher display name forest has not been applied; Settings still shows the Gmail address. Final account/policy/distribution/reviewer-access review, tester/company approval and submission remain owner steps. No Pages deployment; that workflow stays manual.

CHROMEWEBSTORE.md is the store-field/readiness record; TASKS.md is the only queue. Start at docs/release/START_HERE.md for owner steps.

## Working boundaries

TASKS.md is the only queue. Other people's tickets stay read-only; #209867 is authorized for edits/saves/sends when needed. Capture both drafts before refresh, retain uncertain backups and never overwrite a distinct destination draft. Approved optional Harvest access persists; do not start timers during visual checks.

Local AI processing remains optional and separate from the store runtime. Previous representative export/media processing passed with manual corrections; text scrubbing and image interpretation require human review. Raw image pixels can reach the local vision model. No hosted AI or Notion publishing is automatic.
