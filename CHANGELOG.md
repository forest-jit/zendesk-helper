# Changelog

Changes to Jones IT Zendesk Helper, written for the people using it.

## Unreleased

## 0.7.11 - 2026-11-12

### Changed

- Switch between Public reply and Internal note with one two-part control. The selected side is highlighted; arrow keys work too. Draft sharing now lives in Settings, away from the reply box.
- Copy ticket is one click for a linked ticket number. Rich-text apps receive a link; plain text receives Markdown.
- View full conversation / Collapse earlier messages now sits at the top of the scrolling history. Turn off the latest-five summary in Settings to show all loaded messages.
- The toolbar popup keeps On/Off, theme selection and Settings. Custom themes, workflow preferences, Harvest setup and help have a full Settings page. Confusing layout-side switches are removed.
- Removed duplicate helper viewing/editing badges and unknown-activity text. Zendesk’s own indicators remain unchanged.

### Added

- Export a theme as a small JSON file, or import one into the editor before saving. Files contain only a name and five colors.
- Choose the Zendesk tab for temporary previews and exports. When several tabs are open, the helper does not guess.
- Direct links to the feature guide, problem reports and a plain-English implementation walkthrough in Settings.

### Fixed

- Themes now reach nested Zendesk containers and native controls that could keep old colors. Native Light/Dark checks passed in Chrome for Daylight, Deep Purple and Blush, in both reply modes. Zendesk’s saved appearance is left alone.
- Appearance-menu labels/icons, sidebar dividers, ticket-tab borders and disabled text/background pairs follow the helper palette.
- Harvest permission setup completes in the background after approval, even if the popup closes. Setup is explicit: Settings → Harvest → Match Harvest to theme → allow access → check Harvest theme on → reload the panel. Each installation needs its own setup.

### Documentation and checks

- Updated the packaged, GitHub and Notion guides for the new controls, clear Harvest setup and the difference between published and prepared versions. Added a full feature list with short implementation explanations.
- Rechecked quote collapse and Simplify/Restore on real read-only emails. Simplify changes layout; it does not remove threads or guarantee a shorter message.
- Added packaged browser checks for the new controls, Settings, portable themes and preview rollback. Existing draft failure/recovery, Closed-ticket, theme and native-cleanup regressions remain in place. Focused synthetic screenshots supplement live Zendesk checks.

### Still needs outside acceptance

- A fresh real Harvest permission prompt, a screen-reader walkthrough and the Notion reporting-permission check remain open. No broader extension permissions or hosted service was added.
- This GitHub version is not automatically a Store update. Google review and a check of the approved Store build are separate steps.

## 0.7.8 - 2026-11-12

First Chrome Web Store release. The extension runs only on Jones IT Zendesk agent pages.

### What you can do

- Read the latest five messages or expand the loaded history. Open image previews and collapse supported quoted email threads.
- Switch between public replies and internal notes in one click. Optional draft carry keeps text and formatting without replacing a different draft.
- Save ticket fields while keeping your reply draft. Recovery copies help protect interrupted saves.
- Copy ticket details, export loaded messages and images, and refresh ticket views while idle.
- Choose a theme or make one from five colors. Optional Harvest styling matches the embedded timer.

### Things to know

- The name is now **Jones IT Zendesk Helper**. Existing settings are kept.
- Activity indicators depend on information Zendesk supplies. “Not reported” means unknown; real two-person recognition still needs testing.
- Exports contain original ticket information. Review local AI output before sharing it.

[Install from the Chrome Web Store](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf)
