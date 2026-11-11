# Current state — 2026-11-11

## Installed build

v0.7.7 loaded in actual Chrome from `~/Projects/zendesk-helper`; version, source and Reloaded confirmation checked. Runtime files now live under `src/` by responsibility. Keep loading this same repository root: `manifest.json` remains there. No added permissions. Chrome 114+ is now explicit because Status uses the native Popover API.

Start reading at `src/README.md`, then `docs/CODE_TOUR.md`. `docs/DEVELOPMENT.md` explains checks, execution contexts and path bases. The guarded save coordinator remains in `src/content/index.js`; its control CSS is separate. This pass does not claim a full state-machine rewrite or a security/accessibility certification.

## Checks and Chrome acceptance

Local aggregate and formatting pass. ESLint recommended rules, recursive syntax checks and runtime-resource validation now run in read-only GitHub CI on pushes/PRs. npm audit reports zero vulnerabilities with the documented development-only minimatch override. Dynamic Harvest registration updates stale script paths during upgrades; regression covers migration and repeat synchronization.

Actual Chrome checked the moved popup and feature guide, temporary custom preview and rollback, Status options without changing the selection, Midnight/Blush colors and matching Harvest. The original internal HTML remains `<p>Test that this is a separate thing</p>`. Public was empty after reload; carry testing temporarily copied the internal text, then public was restored empty with Carry off before restoring Internal/Carry on. Final Blush, Normal/Open, Save disabled, Harvest idle. No fields saved, messages sent or timer entries created. The other open workspace with an ALP title was left alone. Evidence stays outside GitHub in current chat `outputs/reorg-077/`.

Earlier acceptance still covers Closed/Unavailable status, short headers, received-email contrast, quote/image lifecycle, quiet feedback and hover/keyboard Copy. A native second-agent test and screen-reader walkthrough remain open in TASKS.md. Do not treat unknown presence as nobody else working.

## Release and repository

Origin is `https://github.com/forest-jit/zendesk-helper.git`; source is public. Exclude ignored customer audits, historical evidence and raw exports from all source uploads. `CHROMEWEBSTORE.md` is the single store-field/readiness record; start with `docs/release/START_HERE.md` for owner steps.

v0.7.7 store and development packages/checksums are prepared in the chat outputs folder. Store preflight checks runtime files, limited permissions, icons, screenshot sizes and checksum. Screenshots use actual popup/guide code with synthetic preferences, not live customer tickets. No Web Store submission or Pages deployment. The Pages workflow is manual and separate from source checks.

Owner steps remain publisher ownership/public contact confirmation, account setup and declarations, approved policy hosting, secure reviewer access, tester/company approval and final dashboard submission. Proposed display name forest/contact are not verified publisher identity.

## Working boundaries

TASKS.md is the only queue. Other people's tickets stay read-only; #209867 is authorized for edits/saves/sends when needed. Capture both drafts before refresh, retain uncertain backups and never overwrite a distinct destination draft. Approved optional Harvest access persists; do not start timers during visual checks.

Local AI processing remains optional and separate from the store runtime. Previous representative export/media processing passed with manual corrections; text scrubbing and image interpretation require human review. Raw image pixels can reach the local vision model. No hosted AI or Notion publishing is automatic.
