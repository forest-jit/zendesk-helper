# Change, test and release

A change is finished when it works in the browser people use, its regression checks pass, and its instructions match the released version. Passing local tests alone does not establish that.

## 1. Record the change

Staff reports go in the Internal Tools ticket board. Keep the expected result, actual result, screenshots and follow-up notes in the card body. TASKS.md is the maintainer’s implementation queue; link related work rather than copying every task between systems. Keep one task In progress.

Before editing, record a short acceptance condition: what should someone be able to do when the fix works? Record the browser, extension version, Store or unpacked installation, native Zendesk appearance, helper theme and optional Harvest access when relevant.

## 2. Implement and keep the code readable

Make one focused change. Use the existing module boundaries, descriptive names and short comments explaining a safety boundary or surprising behavior. Update the code tour if responsibilities move. Add a regression test that fails for the reported problem when practical; do not write tests that only repeat implementation text.

Keep Zendesk’s native state authoritative. Do not change customer tickets to test styling. Use #209867 for authorized edits, saves or sends. Capture both drafts before a refresh or an interrupted-save test. Never start a Harvest timer during visual checks.

## 3. Test the change and its neighbors

| Layer | What it establishes | What it cannot establish |
| --- | --- | --- |
| Fast checks: `npm run check` and `npm run format:check` | Syntax, lint, resources, version rules and targeted behavior regressions | Actual Zendesk layout, authentication or browser permissions |
| Isolated browser regression tests | The real packaged extension’s popup, storage and reproducible UI cases; screenshot differences in a fixed environment | That Zendesk’s current production markup still matches the test case |
| Real Zendesk browser checks | Current selectors, layout, menus, dialogs, scrolling and actual Harvest embedding | Every possible ticket or another agent’s permissions/session |
| Fresh Store-install check | First-run defaults, permission prompts, packaged paths and persistence with the published extension ID | That an unpacked-only change has already reached users |

For each UI change, exercise the normal state, the changed state and cleanup. Check keyboard use and a smaller viewport. Theme changes need a light and a dark helper palette; check public reply and internal note separately. Native Zendesk Light mode is the supported baseline until T57 passes.

For reply/save changes, repeat the critical draft checks: field save with a draft, distinct public/internal drafts, refresh/navigation recovery, and an interrupted or failed save. Include attachments when their handling changes. Check the result after refresh; an action being requested is not proof it saved.

For Harvest changes, start from a fresh profile with only one installation. Confirm optional access is absent initially, enable it from the popup, refresh safely, and check on/off, permission removal and browser restart. Store and unpacked copies have separate IDs, settings and permissions. Inspect the timer without changing project, task, notes, duration or entries.

For browser-specific reports, name and target that browser explicitly. A Chrome pass is not an Arc pass. Record whether the wrong window was opened by the extension, a link handler, the automation tool or the window manager before changing any settings.

### Screenshot comparisons

Run `npm run test:visual` for the packaged browser checks and reviewed macOS screenshot comparisons. GitHub runs the semantic browser checks on Linux with `--ignore-snapshots`; visual comparisons remain local until a matching runner environment is established. See [the browser testing instructions](DEVELOPMENT.md#packaged-browser-and-screenshot-checks).

Use Playwright’s screenshot assertions for stable, sanitized UI cases. The project already uses Playwright; another browser library is unnecessary. Use its bundled Chromium and an isolated persistent profile for extension tests. Do not launch against a daily-use Chrome/Arc profile.

Keep baseline OS, browser version, viewport, fonts and scale consistent. Mask changing timestamps, avatars and ticket content in private live captures where appropriate. Never put customer snapshots, cookies, traces or profiles in public GitHub artifacts. Public baselines must use synthetic content.

Compare focused components as well as layout. Review every changed baseline visually; do not regenerate snapshots just to make a failing test pass. The small reproducible cases catch known regressions, while real Zendesk checks catch markup drift. Neither replaces the other.

## 4. Write the release notes and instructions

Add user-visible changes under Unreleased in CHANGELOG.md. Say what changed and what users will notice; retain known limits. Review all new prose, code comments and release copy with the humanizer and i-have-adhd skills. Use short task-based instructions and exact control labels.

Update the packaged feature guide, relevant GitHub docs and the Notion team guide when instructions or features change. Update Store description/disclosures when affected. Do not claim a prepared Store draft is live. Track remaining instructions, screenshots or permission migration as explicit unfinished work.

## 5. Build, review and verify the release

1. Increase manifest/package/lock versions together once for the delivered extension change. Documentation-only repository edits do not need a version bump; changed packaged help reaches installed users through a later package update.
2. Move the reviewed changelog bullets into that version’s section, commit and push a tag. The tag runs checks and creates a draft GitHub release with ZIPs, checksums and matching notes.
3. Test the packaged ZIP in an isolated profile. Confirm it contains the intended fix and that first-run permissions work. Review the notes and publish the GitHub release when ready.
4. Upload the Store ZIP to the existing Store item and submit it for Google review. Every new package version requires review. A GitHub push or release does not publish the Store update.
5. After approval, check the actual Store-installed version in a clean profile, including Harvest setup and the affected behavior. Add the released version/link to the report body and move it to Released only when users can get it.

Keep the previous approved package and tag. If a release regresses, prepare a corrected higher version and submit it; do not move old tags or silently replace release assets.

## What to record at handoff

Use precise labels: **implemented**, **local checks passed**, **live browser checked**, **Store draft prepared**, or **published Store build verified**. Include the version, browser, checks, evidence location and anything not verified. Keep CURRENT_STATE.md short; TASKS.md remains the only repository queue.

[Version-tag steps](release/TAGGED_RELEASES.md) · [Development checks](DEVELOPMENT.md) · [Team guide](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899)
