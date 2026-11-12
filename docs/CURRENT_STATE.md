# Current state — 2026-11-12

## Published and prepared builds

Jones IT Zendesk Helper is published as **v0.7.8**, Store ID `bbhdbfdfidlfihbbohohdndpppibgogf`. This session used the Store installation in Arc. The owner removed the unpacked copy; do not assume the development build is installed in their daily browser.

Source, manifest, package and lockfile now match **v0.7.9**. The Store ZIP is prepared and passes preflight. It has not been uploaded, submitted or published. Keep changes under Unreleased until preparing the version tag; a tag must have a matching nonempty changelog entry. No Store API credentials or automatic submission are configured. Public-site HTML is generated locally, not deployed.

Runtime files remain under `src/`; load the repository root for development. Chrome 114+ is required for Status popovers. No permissions were added. Start reading at `src/README.md` and `docs/CODE_TOUR.md`.

## What was checked

- **Store Harvest in Arc:** after optional access and enabling the setting, the embedded timer matched Deep Purple. Project, task, notes and idle 0:00 remained unchanged. Styling is off by default and separate for each browser/profile and Store/unpacked installation. The first permission prompt left the reopened popup off; clicking again worked. T61 tracks whether popup closure interrupts completion.
- **Appearance menu:** live inspection found `menuitemradio` options with a fixed dark foreground. v0.7.9 includes these in theme/selected/focus rules. A temporary scoped preview on real Zendesk gave the labels and icons themed colors, then was removed. The actual new package was checked in isolated Chromium; it is not yet the published Store build.
- **Draft and scrolling:** on #209867, public draft text matched before and after, Status returned to Open, Save was disabled, and Harvest stayed idle. No field saves, messages, timer starts or full ticket refresh occurred. History was scrolled with both expansion states; no visible See oldest/See newest appeared. The other ticket workspace was untouched. The owner took over showcase screenshots.
- **Local verification:** aggregate syntax/lint/resources/behavior checks, formatting, nine reviewed macOS component images, four packaged browser tests and Store ZIP preflight pass. The old stylesheet fails the new Appearance assertion. Tests cover real extension storage, hover-only popup preview, Escape rollback, Off cleanup and preferences after a browser restart. These are focused regressions, not a production Zendesk replica.
- **Browser focus:** opening the helper through Arc’s Extensions menu stayed in Arc. The reported toolbar switch with both Arc and Chrome open is not reproduced. Source contains no Chrome-launch command. A local AeroSpace rule moves all new Arc windows to workspace 1; that is a possible cause, not a confirmed diagnosis. No window-manager configuration was changed.

## Workflow and documentation

`docs/WORKFLOW.md` is the change → tests → documentation → release procedure. `TASKS.md` remains the only implementation queue. `CHROMEWEBSTORE.md` holds Store fields and readiness. `docs/DEVELOPMENT.md` explains browser checks and their limits; GitHub pushes/PRs and version-tag builds now include packaged semantic browser checks on Linux. macOS screenshot comparisons remain local because pixels depend on OS/browser/fonts.

The new Playwright runner builds and extracts the Store ZIP into a disposable profile. Zendesk/Harvest/network requests are intercepted; it never uses the daily browser profile or real tickets. Synthetic baselines are public; live ticket evidence stays outside Git. The optional macOS file watcher is omitted from development installation, rather than bypassing the reported fsevents.node verification warning. Chromium's stalled archive extraction was completed from the official Playwright download with the macOS archive tool; the default local test command now works.

Harvest’s off-by-default setup, exact button names, optional access, success check, panel reload and per-installation setup are explicit in the README, team/theme/packaged guides, public-site drafts, Store-description source and Notion hub/install/workflow pages. Notion’s reply guide explains that “not reported” means no native signal was found, not that the ticket is unoccupied. Repository and Notion prose follow the humanizer/i-have-adhd rules.

Team guide: https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899

Workflow: https://app.notion.com/p/41618a28418d81d0833deae74b796d30

## Reporting and remaining acceptance

The Internal Tools hub and guides are org view-only, with Forest retaining edit access. The report database alone allows view/create and a Created by → Can edit rule. The prominent Submit a ticket button opens a card with Tool=Jones IT Zendesk Helper, Status=New and the requested freeform body template. Screenshots and behavior notes belong in the body, not separate properties. A coworker still needs to verify creation, creator attribution, own-card editing and screenshot upload. The old form remains closed.

Report page: https://app.notion.com/p/41618a28418d8148b816ec7c3bd7d641

The queue retains native Dark-mode compatibility, unknown-activity wording, Arc focus and first-permission completion. Live two-person presence recognition, a screen-reader walkthrough and managed company rollout remain external acceptance. Keep Zendesk’s own appearance on **Light mode** for now; any helper theme, including dark themes, can be used. Do not claim presence detection has been fully verified.

## Working boundaries

Other people’s tickets stay read-only; #209867 is authorized for edits/saves/sends when needed. Capture both drafts before refresh, retain uncertain backups and never replace a distinct destination draft. Permission to style Harvest does not authorize starting timers.

Origin: https://github.com/forest-jit/zendesk-helper (public). Existing v0.7.8 and earlier tagged assets stay unchanged. GitHub release notes and Store copy come from CHANGELOG.md; source pushes do not update Store users. Preserve the owner’s active GitHub identity when switching to the repository account for a push.

Local AI processing remains optional and separate from the runtime. Redaction and image interpretation need human review; raw image pixels can reach the local vision model. No hosted AI call or Notion publication is automatic.
