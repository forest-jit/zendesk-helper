# Changelog

Changes to Jones IT Zendesk Helper, written for the people using it.

## Unreleased

### Fixes and setup

- Themes now reach ticket sections that could revert to Zendesk’s own colors. Browser controls follow the selected helper palette too. The helper leaves your Zendesk appearance preference alone. Full native Dark-mode acceptance is still pending; keep Zendesk on Light mode for now.
- Sidebar dividers and ticket-tab borders use the helper theme instead of fixed native gray. Disabled labels now have distinct text and background colors.
- Unknown activity now uses a question mark and **Other agents · unknown**. Its help text says someone may still have the ticket open; an eye is reserved for reported viewing activity.
- Harvest setup now finishes in the background after permission approval, even if the popup closes during the prompt. Access is still requested only when you click **Match Harvest to theme**.
- Light mode, Dark mode and Match system appearance labels now follow the helper theme in Zendesk’s Appearance menu, including the selected option and keyboard focus.
- Harvest setup is explicit: styling starts off. Click **Match Harvest to theme**, allow access, check **Harvest theme on**, then reload the Harvest panel. Each browser/profile and Store/unpacked installation needs its own setup.
- The popup explains the Harvest setup beside the control. The installation and theme guides include troubleshooting when the timer stays white.

### Development

- Added a change/test/documentation/release workflow and packaged-extension browser checks. Focused screenshot comparisons cover the Appearance menu and popup preview in Daylight, Deep Purple and Blush, plus Off cleanup and browser restart. Packaged checks also cover simulated activity states and Closed-ticket Send guards. These do not replace real Zendesk checks.
- Added theme regressions for nested Light/Dark containers, native control schemes, dividers and disabled labels. They also check newly added components, preserved email colors and high-contrast cleanup.

### Documentation

- Added the supported setup: keep Zendesk’s own appearance in Light mode. The helper’s dark themes remain available; native Zendesk Dark mode compatibility is still pending.

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
