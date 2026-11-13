# Current state — 2026-11-12

## Versions

**Published Store: v0.7.8**, ID `bbhdbfdfidlfihbbohohdndpppibgogf`, used in Arc. **Prepared source: v0.7.11**, matching manifest/package/lock. Chrome’s separate unpacked ID `pfgmgihalnopfhgaodnopkeejgofenba` was reloaded from `~/Projects/zendesk-helper` and live-tested as v0.7.11. Editing source alone does not update either browser or Store users.

The next update is being prepared through the version-tagged release workflow. No new permissions are added. The new full Settings page is declared with options_ui; there is no general tabs/history permission. The optional Harvest grant stays separate. Google submission/approval and a fresh Store-build check remain T62 until confirmed.

## Live Chrome evidence

**0.7.10 theme acceptance completed:** actual unpacked build passed Daylight/Deep Purple/Blush × native Light/Dark × public/internal, all 12 combinations. Both exact rich-text buffers matched durable backups. Chestnut, native menus/dialogs, Daylight/native-Dark list/filter, Off cleanup and 1100×850 fit checks passed. Native Dark is supported by these retained changes; published v0.7.8 still needs Light-mode advice. Arc’s earlier scoped-preview matrix remains supplementary evidence.

**0.7.11 interface checked:** segmented reply switching and ArrowLeft use the native selector correctly. Both mode buffers retained exact original rich HTML. A real native-header foreground override was found and fixed; final active and muted labels were computed in both modes after reloading the actual extension. Off restores the native selector and removes helper controls/styles. The latest-five preference off showed all 19 loaded messages; restored preference showed five.

Small popup, full Settings and packaged guide opened in actual Chrome and were visually reviewed. The new target selector required a choice when opened from a non-Zendesk tab with multiple candidates. Temporary preview on selected #209867 changed the Page color; closing Settings restored Chestnut and kept the draft. Harvest stayed themed and idle. Import/session/save/rollback flows have packaged browser acceptance. Real Copy/Paste contained the linked test-ticket number/URL; exact HTML/Markdown clipboard output is verified by the packaged test, not a denied live clipboard-read API.

A real Command–Enter sidebar save changed Priority Normal → Low while retaining the public draft; the acknowledged save disabled Save. Field-only Save restored Normal. Message count stayed 19. Final #209867: **Chestnut, native Light, Public reply, shared draft on, latest-five on, automatic title on, Normal/Open, Save disabled**. Both public/internal HTML values were `<p>Test that this is a separate thing</p>` and matched backups. Harvest Figma/Figma HPM, Consulting and idle 0:00 retained. No message or time entry was created. Temporary preview CSS, guide/Settings tabs and our DevTools were closed. The owner’s other Chrome ticket tab was not operated on.

## Email demonstration

All tickets was inspected with automatic title updates temporarily off. Other people’s tickets remained read-only. On #178111, a qualifying forwarded body collapsed 3084→926 px with source text unchanged; restoration matched. On #205358, Simplify changed 1845→1633 px, Restore returned 1845 and text matched. Both showed disabled Closed and no visible Send. No saves, messages, field edits or timer actions. Simplify on another layout grew taller due to wrapping; instructions explicitly avoid promising shorter messages. Unknown/quote-only structures stay open.

Private backups, earlier matrix JSON/captures and PRIVATE-DEMO-NOTES.md are outside Git in the chat workspace’s `outputs/presentation-cleanup-2026-11-12/`. Public listing images use actual packaged UI code with synthetic preferences only. No customer captures or demo details belong in release assets.

## Local checks and documentation

Aggregate syntax/lint/resources/behavior checks pass, including draft failure/timeout/navigation/reload races, delayed/distinct mode transfers, Closed guards, image cleanup, title rules, downloads, theme validation/lifecycle and Harvest registration/consent sender guards. Fourteen packaged Chromium tests and twelve existing reviewed macOS snapshots pass. New cases cover native-indicator preservation, segmented switching, exact linked-number clipboard formats, optional in-scroll history and Settings/import/session/preview rollback. These do not simulate all of production Zendesk. Formatting and Store ZIP preflight pass; the prepared package has 37 runtime/icon files and no development dependencies or ticket data. Tagged CI evidence will be recorded after the run completes.

`docs/FEATURE_WALKTHROUGH.md` is the complete feature list and plain-English code explanation. `src/README.md` and `docs/CODE_TOUR.md` are the reading map. Packaged help, README, install/theme/reviewer/policy/Store source and Notion guides match the new interface and distinguish prepared v0.7.11 from published v0.7.8. The duplicate presence adapter/UI was removed at the user’s request; T35 is superseded, not a release gate.

Canonical procedure: docs/WORKFLOW.md. TASKS.md is the only queue; CHROMEWEBSTORE.md holds Store fields/readiness. Humanizer/ADHD rules apply to feature guides, notes and code comments. Notion is the team-facing summary; it is not reopened for every edit. Static public-site files are generated locally, not automatically deployed.

## External acceptance and boundaries

T61: existing Harvest access works; new first-grant completion is regression-tested but still needs a fresh real Chrome/Arc prompt, including cancellation/reopening/revocation. T55: a coworker must verify Notion create/own-card edit/screenshots. T05: a screen-reader user must check announcements/focus/order. T09: organization rollout/allowlisting needs its administrator. T60: intermittent Arc→Chrome focus is not reproduced after two real toolbar checks; no AeroSpace changes made. T71 native context/app navigation remains deliberately deferred.

Use only #209867 for authorized edits/saves/sends. Back up both drafts before refresh. Never overwrite a different destination or start Harvest timers for style checks. Settings/recovery data differ by browser/profile and extension ID. Local AI is separate, best-effort and manually reviewed; raw pixels can reach the local vision model. No hosted AI or automatic Notion publication.

Origin: https://github.com/forest-jit/zendesk-helper. Preserve prior approved tags/assets and restore the owner’s active GitHub identity after a repository push.

[Team guide](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899) · [Workflow](https://app.notion.com/p/41618a28418d81d0833deae74b796d30) · [Reports](https://app.notion.com/p/41618a28418d8148b816ec7c3bd7d641)
