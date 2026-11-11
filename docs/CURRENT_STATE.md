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

v0.7.7 store and development packages/checksums are prepared in the chat outputs folder. Store preflight checks runtime files, limited permissions, icons, screenshot sizes and checksum. Screenshots use actual popup/guide code with synthetic preferences, not live customer tickets. Store Listing is now saved in dashboard item bbhdbfdfidlfihbbohohdndpppibgogf: revised description, Workflow & Planning, English, icon, three screenshots, small promo tile and GitHub links. “Item saved” and refresh persistence checked. No review submission, privacy certification, distribution change or package replacement. The uploaded package was not audited in this pass. Privacy explanations, four data categories and the existing public GitHub policy URL are now saved and refreshed successfully. The five privacy explanations and the policy now use shorter plain-language paragraphs. Exact form text persisted after save/refresh. Policy HTML was regenerated for the next package; existing v0.7.7 tag/ZIPs remain unchanged with earlier equivalent wording. The publisher certifications were left for the owner at the last privacy edit; their current contents were not re-audited. Contact email forest.r.welch@gmail.com was added and verified after the owner followed Google’s email link. Settings showed Verified email address after refresh. Submit for review is now enabled; no submission was made. No Pages deployment. The Pages workflow is manual and separate from source checks.

Tagged-release automation is implemented: version-matched tags run checks, build both ZIPs/checksums and create a draft GitHub release. Local checks and tag mismatch regressions pass. The first v0.7.7 run (43077707696) passed build, store preflight, checksum validation and draft creation. Authenticated release inspection confirms both ZIPs and both checksums attached to a draft. The tag points to a7faec9; later documentation commits do not move it. No store API credentials are configured. See docs/release/TAGGED_RELEASES.md. Runtime remains v0.7.7; this is release tooling only.

Owner steps remain final account/policy/distribution/reviewer-access review, tester/company approval and dashboard submission. Contact email is verified. Preferred display name forest has not been applied; the Settings name still shows the Gmail address. No other publisher settings were changed.

## Working boundaries

TASKS.md is the only queue. Other people's tickets stay read-only; #209867 is authorized for edits/saves/sends when needed. Capture both drafts before refresh, retain uncertain backups and never overwrite a distinct destination draft. Approved optional Harvest access persists; do not start timers during visual checks.

Local AI processing remains optional and separate from the store runtime. Previous representative export/media processing passed with manual corrections; text scrubbing and image interpretation require human review. Raw image pixels can reach the local vision model. No hosted AI or Notion publishing is automatic.
