# Theme foundation

## Supported Zendesk appearance

The published v0.7.8 works best with Zendesk’s **Appearance → Light mode**. The current local v0.7.12 retains the earlier native Light/Dark fixes; it does not change Zendesk’s saved preference. Deployment is on hold. A source build and a Store update are different installations.

The versioned acceptance sections below describe their recorded build. Some historical controls have since changed; use [the feature walkthrough](FEATURE_WALKTHROUGH.md) and [email guide](READING_EMAIL.md) for current behavior.

## Native appearance acceptance — v0.7.10, retained in v0.7.11

Zendesk redeclares palettes inside native Light/Dark roots and Polaris components. One owned stylesheet supplies helper variables at those boundaries. Controls, sidebar separators, ticket-tab borders and disabled states use the same palette.

Actual Chrome unpacked v0.7.10 passed all 12 combinations of Daylight/Deep Purple/Blush, native Light/Dark and Public reply/Internal note. Both rich-text drafts matched backups; Harvest stayed themed and idle. Off restored native Dark without changing its preference. Chrome list/filter, menu/dialog and 1100×850 checks passed. Arc’s earlier scoped preview passed the broader list/dialog matrix too. Private evidence is recorded in CURRENT_STATE.md; customer captures are not public baselines.

This is verified coverage of the visited surfaces, not a promise that every future Zendesk component or authored email is themed. The packaged regression tests cover nested roots, late components, control schemes, border/disabled pairs and forced-colors cleanup.

## Picker, Settings and theme files — v0.7.11

The toolbar popup contains On/Off, theme selection and a small preview. Hover or keyboard focus previews that document only; selecting applies the theme. **Settings → Appearance** contains the five-color editor. **Preview on ticket** uses the selected target tab and rolls back when stopped or when Settings closes. Unsaved editor values stay for the Chrome session.

**Export theme** writes only a name and five colors to JSON. **Import theme** validates the file and fills the editor; it does not apply it. Save and apply is explicit. Files are limited to 16 KB, one supported format version and the five palette roles; unreadable palettes are rejected. Themes and preferences stay in local profile storage.

## Five base colors

| Role | Daylight | Midnight | Blush | Forest | Purple | Magenta | Jones IT | Teal & Pink | Pink & Teal |
|---|---|---|---|---|---|---|---|---|---|
| Page | `#f8f9f9` | `#15191f` | `#fff0f5` | `#101e18` | `#21142f` | `#2b1026` | `#080f14` | `#edf5f4` | `#fdf0f6` |
| Surface | `#ffffff` | `#202832` | `#ffffff` | `#1b3025` | `#322046` | `#431a3b` | `#101c25` | `#fff7fb` | `#f2faf9` |
| Text | `#293239` | `#edf2f7` | `#522e38` | `#e8f2e9` | `#f5edff` | `#fff0fa` | `#ffffff` | `#254549` | `#3e2941` |
| Accent | `#1f73b7` | `#80bfff` | `#b9375e` | `#91c99c` | `#c8a4f0` | `#f19bd2` | `#2c7da0` | `#e12885` | `#137a7f` |
| Attention | `#ac5918` | `#f1b35e` | `#8a2846` | `#d5c384` | `#eba0c8` | `#e9b1f5` | `#e05a26` | `#137a7f` | `#e12885` |

These are five independently chosen colors, not a five-pixel-color restriction. Muted text, borders, hover/selected backgrounds, note washes, scrims and shadows are derived from them. The configurable library still has five roles; rendered colors are not limited to five. The compiler derives state shades and can generate black/white label ink candidates for quiet palettes when exact brand action colors require them. Native/unbranded mode restores Zendesk's own palette, including its status colors.

The compiler rejects extra/malformed colors and unreadable combinations. It derives muted text/link/note text at >=4.5:1, and control outlines/focus at >=3:1 against their specified surfaces. Shared emphasis foreground must work on accent and attention; neutral emphasis uses that same paired background. Tooltip foreground is chosen separately for its text-colored background, allowing light pink accents with dark readable button text. Contrast still needs checking against actual adjacent colors, overlays and states in Chrome; compiler checks alone do not establish accessibility compliance.

Strict five-color themes intentionally consolidate Zendesk's red/green/orange status and alert hues. Preserve authoritative status labels and existing icons; error/success/internal/public meaning must remain explicit in text and structure. Do not hide these distinctions with a generic accent wash. Do not alter ticket state or message content for styling.

## Architecture

`five base colors → derived semantic tokens → surface adapters → state/interaction acceptance`

- `src/shared/themes.js` is the single palette/derivation library; `src/themes/native.js` applies/removes owned variable styles and classifies native composer mode; `src/themes/native.css` covers observed native exceptions. `compile(palette)` returns helper tokens and candidate Zendesk/CKEditor variable overrides. `tests/themes.cjs` checks representative foreground/background pairs, all eight mapped status pairs and invalid palettes.
- Native adapter: scope an opt-in theme on the agent document; map the observed `--background-*`, `--foreground-*`, `--border-*` variables. Apply the same variables at observed nested `[data-theme="light"]`, `[data-theme="dark"]` and `.polaris-react-component` boundaries. Use that document scope for native menus/dialogs mounted outside the ticket grid. Exclude unrelated embedded documents.
- Editor adapter: map `--ck-color-*`, then handle authoritative Public reply / Internal note state across wrapper, editable area, header, toolbar, borders and focus ring as one component. Root editor variables alone do not cover every inline/nested color. Never change rich-text formatting stored in the draft.
- Helper adapter: use inherited semantic variables inside each owned shadow root; replace fixed foregrounds/backgrounds/borders/outline colors, warning CSS and the Status SVG arrow. Keep native fallbacks when no theme is active. The existing Priority-style copier must retain geometry/typography while respecting theme colors.
- Popup adapter: consume the same selected palette and compiler in its own document. Persist one theme ID separately from layout/enabled preferences; apply it immediately on page load, navigation and refreshed native components. Native mode/disable removes owned overrides and attributes without resetting Zendesk preferences.

Do not use universal `*` recoloring, page inversion, image filters, generated Zendesk class names, continuous whole-document computed-style scans, DOM reparenting, or accumulating per-node inline styles. Stable hooks plus semantic variables form the normal path; narrowly scoped overrides cover observed exceptions. A coverage gap remains open until inspected and tested.

## Turn on Harvest styling

**Harvest styling is off by default.** Choosing a theme does not turn it on.

1. Open Jones IT Zendesk Helper from your browser’s toolbar.
2. Open **Settings → Harvest**, then click **Match Harvest to theme**.
3. Allow access to **platform.harvestapp.com** when your browser asks.
4. Check that the button says **Harvest theme on**. If approval was interrupted, reopen Settings; if it still says **Match Harvest to theme**, click it again.
5. Reload the **Harvest panel** using its reload icon. You can also refresh Zendesk after protecting your drafts.

Harvest should now match your selected helper theme. It changes colors only; it does not start a timer or change time entries. Set this up separately in each browser/profile and when switching between Store and unpacked installations; their settings and permissions do not automatically carry over. If Harvest stays white, check both **Harvest theme on** and the browser’s allowed site access before reporting a theme bug.

## Coverage contract

Current live scope includes the ticket shell, fields, composer, theme studio, lists, Filter, reply menus, Add link, and merge drawer with required-field feedback. Widths, zoom, cached navigation and forced-colors have separate recorded checks. The table is an inventory, not a claim that every state has been visited. Compiler tests alone do not establish live coverage.

| Surface | Coverage needed | Boundary/evidence |
|---|---|---|
| Shell | Header, navigation, active/inactive tabs, breadcrumbs, panels, footer, separators, scrollbars | Live root variables and ticket breadcrumb inspected |
| Ticket lists | Header, row striping, selected/hover rows, bulk actions, empty/loading/error states | Lists/selected rows and Filter inspected in T17/T21/T28; rare empty/error states unvisited |
| Ticket fields | Labels, text/select controls, tags, chips, placeholder, required/error state, chevrons | Native inputs + helper Status shadow root inspected |
| Conversation | Public/internal entries, metadata, links, quoted HTML, code/pre, tables, attachment cards | Native comment articles inspected; real forwarded/nested and branded email samples checked; unknown structures remain original |
| Composer | Public/private switching, header/editable/toolbar, focus, formatting menus, disabled controls | Native editor has its own CKEditor variable family |
| Actions | Send, Save/Close/export, enabled/disabled, hover/pressed, progress/errors | Helper controls use separate embedded shadow CSS |
| Menus and dialogs | Assignee/Priority/Status menus, tooltips, popovers, search, confirmations, macro controls | Body-mounted portals require document scope; inspect on open |
| Semantics | Error/warning/success banners, all eight native status pairs, private-note cues | Preserve visible names and existing icons; five-base-color mapping defined |
| Helper extras | Title warning, disclosures, Additional fields, thumbnail border, hover preview, lightbox/scrim | Existing CSS/embedded warning CSS contain fixed colors |
| Icons | `currentColor`, SVG fills/strokes, embedded data-URL arrow, pseudo-elements | Images/logos/avatar pixels are excluded |
| Extension popup | All controls, focus, status panel and theme picker | Separate popup consumes the selected palette and compiler |
| Harvest/apps | Surrounding rail and app header | Outer wrapper is on `3.apps.zdusercontent.com`; opt-in adapter themes its nested platform.harvestapp.com timer |
| Other editors/widgets | Grammarly and browser-native select/file UI, autofill, spellcheck | Separate ownership; inventory exceptions rather than claiming full control |
| Media/accessibility | Attachment images, logos, rich-text colors, forced-colors, selection, zoom | Preserve content colors; honor OS high-contrast choices |

The Settings page sends the Harvest enable click directly to the background. It starts the optional permission request synchronously, then saves the enable preference and registers the adapter only after approval. Completion does not rely on the popup staying open; denied access and unrelated permission events never enable styling. The sender must be this extension’s exact popup or Settings page.

Harvest contents now use an opt-in frame adapter. Required access remains Zendesk agent pages; optional scripting + https://platform.harvestapp.com/* access is requested explicitly. Registration matches only /platform/timer*, and runtime guards require the exact timer path, Zendesk app/service parameters and Jones IT Zendesk as the top ancestor. No access to 3.apps.zdusercontent.com or Harvest account subdomains is requested. The adapter styles the document and reads extension preferences; it does not read/change timer fields. Native, Off, disabled Harvest support and forced-colors remove owned theme variables. Same-origin iframes also require styles inside their own document.

## Wider acceptance still open

1. Apply Daylight and Midnight on real ticket and list pages. Record each surface/state above as covered, intentionally preserved, inaccessible, or still open, with live evidence. Unknown/unvisited components are not covered.
2. Exercise public→internal→public and focus/blur, dropdowns, rich formatting, errors, disabled/selected states and cached ticket navigation. Check nested containers and pseudo-elements for old-color seams. Preserve drafts; no send/save is needed for color tests.
3. Refresh and switch tickets/themes repeatedly. Check no stale variables, per-element colors or duplicate controls remain; popup and page agree. Native/Off restores the original styling.
4. Check desktop/narrow width, 125%/150%/200% zoom, text/control contrast, visible keyboard focus and forced-colors. Theme rules must not change spacing, scrolling or field order.
5. Keep the picker description clear about the verified scope and iframe/content exceptions. Add focused regression checks for actual failures; fixture colors alone do not establish Zendesk coverage.

## Sources

- Live Chrome audit: #209867, 2026-11-09. Zendesk exposed background/foreground/border families and CKEditor variables at the root. Helper controls were separate shadow roots; Harvest had a separate origin.
- [Custom-property inheritance](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Cascading_variables/Using_custom_properties) and [shadow CSS scoping](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scoping).
- [WCAG text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) and [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

## Historical evidence — 2026-11-09

- Chrome loaded v0.6.28 from ~/Projects/zendesk-helper. Picker changes apply immediately and persist; popup uses the selected palette. Native and overlay Off remove the owned variable style and composer markers. Re-enabling restores the selection. Forced-colors bypass/restore is covered locally, not live OS-tested.
- Final build: both themes passed public/internal/public state checks. All four composer layers (outer/header container, editor wrapper, editable, toolbar) matched the mode-specific background; the editor wrapper had no background image. Native scrolling remains intact.
- Root cause of the old white/yellow seams: four fixed-color native scroll-shading gradients on ticket-rich-text-editor, separate from background-color. The themed editor disables those gradients; Zendesk default restores them automatically.
- Midnight exceptions corrected: composite field triggers, Assignee tag, active tab text, message bubble/metadata, toolbar icons, dropdown options and footer. Priority menu options were checked in Chrome; all four labels were readable. No Priority value changed.
- Midnight 1100×850: Status and Send remained reachable. Viewport override reset afterward. Harvest remained visible at the top; embedded Harvest/Grammarly content keeps its own colors. Image pixels and authored rich-text colors remain outside UI recoloring.
- Private note text was captured and restored exactly after native refresh lost its inactive buffer. Final public draft matches the original empty HTML; private draft matches its original HTML. Final state: Daylight, Public reply, Normal priority, On-hold, 15 comments. No send/save/timer action.
- npm run check passes, including palette contrast and theme replacement/mode/cleanup/forced-colors lifecycle tests. Synthetic tests do not replace the live evidence above.
- Screenshots and bounded computed-style evidence: this chat's outputs/theme-daylight-public.png, theme-daylight-internal.png, theme-midnight-internal.png and theme-verification.json.

## v0.6.29 — lists, menus, dialogs and Blush pink

- Blush pink references the supplied rosy power icon and pink dock. Five base colors only; darker links/focus and muted tones derive from them. Button/tooltip foregrounds are paired independently so pale accents remain readable. Palette contrast and lifecycle checks include Blush.
- Added native table head/body/group/selection/hover rules, view-sidebar text and counters, status badges, checkbox visuals and splitter handle; modal/drawer inner sections, close icons and backdrops; menu icons, draft dot, secondary labels and explicit Internal note background.
- Chrome loaded v0.6.29 from ~/Projects/zendesk-helper. Live My Unsolved Tickets list, Filter drawer/Priority dropdown, reply mode menu and Add link modal checked in Daylight, Midnight and Blush; sampled text >=4.5:1. Midnight selected rows checked and cleared. No filters applied, links inserted or bulk actions invoked.
- The reply menu had a fixed peach Internal note row and a separate hardcoded gray Call subtitle. Both were corrected and rechecked in all themes. No generated Zendesk classes used.
- Blush persistence checked on list reload and public/internal composer backgrounds checked. Final #209867: Blush, Public reply, original public/private draft HTML matches, Normal priority, On-hold, 15 comments. No send/save/timer action. Agent-created list test tab closed.
- Evidence: current chat outputs/coverage-*.png, coverage-verification.json and theme-coverage.md. Full original zoom/forced-colors/navigation/rare-dialog coverage remains unverified; do not infer it from these sampled checks.

## v0.6.30 — Harvest adapter and composer border

- `src/integrations/harvest/policy.js`: exact embedded-context guard and optional registration contract; `src/integrations/harvest/controller.js`: permission/preference-gated registration; `src/integrations/harvest/theme.js` / `.css`: shared-palette adapter, PDS controls, project menu, footer/client text, icons and focus. User approved the new host/scripting access at action time. No changes to login/account pages, no API/time-entry calls and no form-value reads/writes by adapter code.
- Live #209867: Harvest follows Midnight, Daylight and Blush. Sampled text minima: 5.71:1 / 4.81:1 / 4.65:1; Midnight project menu 5.96:1. Native and global Off clear the Harvest attribute and variable style; re-enable restores Midnight with one style instance. Project, task, notes, empty duration and idle Start timer state match the original. No timer/time entry action.
- Composer root had a native 1px outline, 3px focus border, our extra shadow and a native hover !important outline. Replaced with a stable 1px full frame, no outline/shadow, accent border on focus and neutral border on blur. Scope includes Native-color mode while layout is enabled; Off still restores Zendesk itself. Public/internal focus, idle, Native hover specificity and Blush checked in Chrome.
- Local checks include policy rejection for top-level/unrelated Harvest contexts, permission-gated registration, theme replacement, Native/Off/forced-colors cleanup and revocation preference reset. No universal frame permissions, timer replacement, iframe reparenting or filters/inversion.
- Final: Midnight, original Internal note mode, both original draft HTML values match; Normal/On-hold, 15 comments. Evidence: current chat outputs/harvest-midnight.png, harvest-daylight.png, harvest-blush.png, composer-border-fixed.png and harvest-border-verification.json.
- T19 is the separate queued request to refine Blush against https://alexischao.com/kitchen-sink and https://alexischao.com/src/themes/native.css. The web text tool could not fetch the CSS; retrieve it through the browser when starting that task rather than claiming its tokens were analyzed here.


## v0.6.31 palette acceptance

- Alexis kitchen-sink page loaded in Chrome; its loaded src/themes/native.css v2.0.0 CSSOM supplied --bg-page, --bg-surface, --c9, --c6 and --c7 for Blush's exact five colors. Zendesk's native typography, spacing and geometry are retained; no remote fonts or foreign stylesheet imported.
- Chrome extension Reloaded toast, version 0.6.31 and ~/Projects/zendesk-helper source confirmed. Forest and Viridian & Purple added to the live picker. New palette persistence across reload observed for Viridian.
- All three: public/internal/public background consistency across four composer layers; reply menu and Add link dialog text checks; Harvest form/footer and project-menu contrast >=4.5:1. Final-build Harvest form minimums: Blush 4.90, Forest 5.40, Viridian 5.14. Existing generated-color overrides missed composer To labels/mode/draft icons and PDS chevron stroke; stable scoped hooks now correct these.
- npm run check passes, including new page/Harvest palette lifecycle transitions. Both original draft HTML values match. Final Blush/Internal note, Normal/On-hold, 15 comments and idle timer; no send/save/time-entry action. Evidence: current chat outputs/theme-alexis.png, theme-forest.png, theme-viridian.png, coverage-{alexis,forest,viridian}-{reply-menu,link-dialog}.png and themes-0631-verification.json. Lists, zoom and unvisited dialogs were not retested in this palette-only iteration.


## v0.6.32 Blush correction

The exact reference palette looked grey in Zendesk because neutral fills were derived from dark text. Blush now uses a clearer #fff0f5 canvas and compileTheme(id) enables chromatic surface derivation from the same five-color palette. Accent hue is normalized for pale pink hover/message, selected and note washes; rose control borders remain >=3:1. No independent sixth color. Other palettes retain their existing compiler output. All three adapters use compileTheme; generic compile remains available for palette validation.

Chrome: message fills rgb(255,244,247), internal-note fill rgb(255,236,242), four composer layers consistent in both modes. Message/link text >=5.18:1, Harvest form >=5.00:1, project/reply menu >=4.54:1; Add link dialog passed. Final note matches original, public draft empty, timer idle; no ticket submission. Aggregate checks and chromatic-wash regression pass. Screenshot: current chat outputs/theme-blush-warmer.png.


## v0.6.33 acceptance

- Blush list/selected row, Actions menu, Filter drawer/Priority menu, reply menu and Add link dialog checked in real Chrome. Grey fill regression not observed; chromatic wash derivation covers these surfaces. Fixed Garden's embedded blue focus shadow/option icon. Sampled list/menu text >=4.54:1.
- Deep Purple/Magenta/Jones IT replace Viridian; legacy ID resolves to Purple at adapters and migrates when popup opens. All three public/internal four-layer composer checks, matching Status typography/height and readable Harvest passed. Harvest form minimums: Purple 5.59, Magenta 5.64, Jones IT 4.51. Native/Off lifecycle remains covered locally.
- Jones base palette exactly matches the supplied table. White on exact orange is only 3.71:1; compileTheme('jones') retains raw attention color and derives attentionEmphasis for native warning/danger emphasis at >=4.5:1. White on exact logo-blue primary actions is 4.62:1. No sixth independent color.
- Header's negative margins/extra border caused partial/double reply frame. Scoped first-child hook fixes containment; public/internal focus/idle and 1100×850 checked. New Status popover has themed options, matching Garden geometry, top-layer placement and contextual keyboard handling; no browser-default select popup. Underlying hidden select remains the save-model value only.
- History button wording and 5→15→5 verified. Enter/Space select Pending/On-hold drafts without changing native status; Escape/Tab/outside dismissal pass. Both original draft HTML buffers retained; final Blush/Public reply, Normal/On-hold, 15 comments, idle timer. No ticket/filter/bulk/time submission.
- npm run check passes. Evidence: current chat outputs/polish-0633-verification.json and polish-blush-*.png, theme-deep-purple.png, theme-magenta.png, theme-jones-it.png. Wider unvisited states remain T15.


## v0.6.36 design acceptance

- User accepted the darker Jones IT palette; no further change to its page/surface/brand action colors. User rejected both near-black and fully saturated two-tone surfaces. Quiet variants now use opposing pale washes, dark hue-tinted body text, original exact accent hues, restrained chromatic borders/hover/note shades, and generated contrasting action label inks. Removed the rejected split-ink/full-saturation CSS machinery.
- Link/muted contrast derivation now checks message hover, note and selected surfaces as well as page/controls; a real Jones message link failure (3.74:1) was fixed and regression coverage added. All configurable palettes still have exactly five base roles.
- Existing Impeccable 4.8.1 layout/quieter/Operate/polish guidance informed the pass. Independent layout review plus mechanical scan identified modest container changes; engine 0.1.19 is initialized and final layout scan returns no findings. DESIGN.md records the reusable 4/8/12/16/24 rhythm and constraints.
- Live quiet palette message text minimums >=4.76:1; Harvest >=4.75:1; lists >=4.52:1; filter >=12.40:1. Public/internal composer layers, matching Status typography, reply menu and Add link dialog checked. Jones Harvest >=4.62:1; Blush fields/frame checked. These are sampled foreground/background pairs, not full accessibility certification.
- Actual fresh-ticket 1100×850 test used 8px field gaps; Status and Send were visible, menu stayed open/in bounds, and keyboard Pending→On-hold changed only the draft. Queued focus/automation scroll events no longer dismiss the menu. Original drafts retained; final Jones/Public, Normal/On-hold, 15 comments and idle timer. No ticket or time submission.
- Evidence: current chat outputs/design-polish-0636-verification.json, spacing-jones-it.png, theme-teal-pink-subtle.png, theme-pink-teal-subtle.png, spacing-quiet-list.png, spacing-quiet-filter.png. Earlier dark/vivid two-tone images are superseded references.

## v0.6.41 palette additions

Copper uses exact #7F2B0A actions on warm ivory. Chestnut takes the same reddish-brown hue into dark page/field surfaces and uses a lighter copper accent for readable controls, following Forest/Purple elevation. Editor themes adapt official palettes into the existing five roles; they do not reproduce editor syntax highlighting. All secondary colors remain derived semantic states.

| Theme | Page | Surface | Text | Accent | Attention |
|---|---|---|---|---|---|
| Copper | `#fff4e8` | `#fffbf7` | `#40271d` | `#7f2b0a` | `#9c3d2d` |
| Chestnut | `#24130e` | `#351c14` | `#f8e9df` | `#df9c7b` | `#e9bc83` |
| Catppuccin Mocha | `#1e1e2e` | `#313244` | `#cdd6f4` | `#cba6f7` | `#fab387` |
| Dracula | `#282a36` | `#44475a` | `#f8f8f2` | `#bd93f9` | `#ff79c6` |
| Tokyo Night | `#1a1b26` | `#292e42` | `#c0caf5` | `#7aa2f7` | `#f7768e` |
| Nord | `#2e3440` | `#3b4252` | `#eceff4` | `#88c0d0` | `#ebcb8b` |
| Gruvbox Dark | `#282828` | `#3c3836` | `#ebdbb2` | `#fabd2f` | `#fe8019` |
| One Dark | `#282c34` | `#21252b` | `#abb2bf` | `#61afef` | `#e5c07b` |

Sources: [Catppuccin](https://catppuccin.com/palette/), [Dracula](https://draculatheme.com/contribute), [Tokyo Night](https://github.com/folke/tokyonight.nvim), [Nord](https://www.nordtheme.com/docs/colors-and-palettes/), [Gruvbox](https://github.com/morhetz/gruvbox), [One Dark](https://github.com/atom/one-dark-syntax/blob/master/styles/colors.less).

Live acceptance: all eight new picker selections, public/internal/public layers and Harvest checked. Copper/Chestnut lists, Status menus and Add link dialogs inspected; native blue list row focus marker now follows the shared focus token. Chestnut survives refresh. Draft HTML and 19 comment IDs unchanged; no submission/time entry. npm run check passes; screenshots and detailed report are in current chat outputs/t28-verification.json. Unvisited surfaces remain T15.

## v0.7.0 custom theme lifecycle

Historically, the popup registered at most32 validated custom palettes; v0.7.11 moves this editor to Settings. Each has exactly the five base roles above; the compiler derives readable states. Color wells and hex fields update the popup immediately. Save commits the palette locally. Preview on ticket uses a scoped popup connection; closing it restores the saved selection on Zendesk and Harvest. Unsaved editor values live in Chrome session storage. Delete removes only the selected custom theme.

System selects Daylight/Midnight from OS appearance and responds to media changes. Forced-colors removes owned page and Harvest variables rather than recoloring system contrast. Lifecycle regressions cover these paths; native DevTools forced-colors was also checked live. Current widths1000/1100/1280px and zoom125–200% produced no horizontal overflow. At under1000 CSS pixels the native layout remains in use.

## v0.7.1 received content and dialogs

The short-ticket header is marked independently of older-message disclosure. Closed pages use the native closed-footer signal and show disabled Closed; missing native controls show Unavailable, never an invented Open state. Cached hidden footer controls do not establish current state.

`src/conversations/message-display.js` checks text within received message bodies against solid effective backgrounds. It marks only low-contrast text; CSS supplies a readable theme-role ink or a neutral luminance endpoint. These are derived display inks, not new configurable palette roles. Authored backgrounds, readable colors and image pixels remain intact. A bounded settling pass handles native theme transitions. Complex background images are left unchanged. Composer content is excluded.

Known merge-drawer headings, suggested-ticket cards, required-field feedback, progress and Next use theme tokens. Forest and Daylight are the live acceptance pair. Native status indicators inside suggestion cards retain their semantic colors. This coverage record does not certify every future Zendesk widget.

In local v0.7.12, only received images exceeding 320 CSS pixels at their authored displayed height become previews. Short unmarked images retain native geometry and click behavior. Source/width changes recheck eligibility; Off restores original attributes. Recognized quoted sections start open and retain original text in raw export.

Local v0.7.12 removes Simplify/Restore because broad width, spacing and fill resets did not reliably improve emails. Measured contrast repair remains and also sets text-fill ink for authored inline important colors. Native/Off removes owned repairs. Current behavior is explained in [Reading email](READING_EMAIL.md); earlier measurements above are historical acceptance, not a reason to hide important content.
