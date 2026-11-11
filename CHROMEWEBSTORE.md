# Chrome Web Store — Zendesk Helper

Last updated: November 11, 2026. Version 0.7.7 is a local draft; nothing has been submitted to the store.

## Store listing

- **Name:** Zendesk Helper
- **Publisher display name:** forest
- **Summary:** A collection of tools and improvements for Jones IT Zendesk: conversation controls, draft protection and ticket actions.
- **Suggested category:** Productivity (choose the closest current dashboard category).
- **Language:** English

## Detailed description

Zendesk Helper is a collection of tools and improvements for working in Jones IT Zendesk. It works only on itjones.zendesk.com agent pages and requires an authorized account.

- Read messages and write replies in one scrolling column. Ticket fields scroll separately. Show the latest five messages or expand the full loaded history.
- Open images from compact previews. Hide supported quoted email history. Use Simplify email formatting to reduce table padding and fixed widths; it does not shorten the thread or edit message content.
- Switch between public reply and internal note in one click. Optional draft carry keeps text and formatting without replacing a different draft. Save sidebar fields while keeping your reply draft. Recovery copies help protect interrupted saves.
- Copy a ticket number or link, refresh ticket views while idle, and export loaded messages and accessible images to a local JSON file.
- Choose a theme or make one from five base colors. Preview it before applying. Optional Harvest styling changes the embedded timer's colors, not its entries.

Command+Enter sends when you are typing in the composer. In the sidebar, it saves fields instead. Check the reply mode before sending.

The activity badge shows viewing/editing information only when Zendesk supplies a recognized signal. Recognition still needs a two-person check in this private pilot. “Not reported” means unknown.

Exports contain original ticket information and may include personal data. Optional local AI processing is a separate command, not a browser feature. Its scrubbing and image interpretations need human review before sharing. The extension does not call hosted AI or publish documentation.

This is a private pilot. It is independently developed, not an official Zendesk or Harvest product. Other embedded apps keep their own interface.

## Developer information and URLs

Publisher display name: **forest**. Contact: **forest.r.welch@gmail.com**. Both remain proposed public values pending owner confirmation. Repository: https://github.com/forest-jit/zendesk-helper.

Privacy, homepage and support URLs are not live/verified yet. See [hosting steps](docs/release/GITHUB_HOSTING.md). Account ownership, trader declaration, company-approved reviewer access and Google certifications remain owner steps.

## Single purpose and permission justifications

Customize the Jones IT Zendesk agent workspace to make reading tickets and completing normal reply/field workflows easier, with local preferences and optional local exports.

## Permission explanations

| Permission | Why it is used |
| --- | --- |
| `storage` | Keep local preferences/custom themes and protect rich-text drafts during interrupted field saves or reply-mode transfers. Session storage keeps unsaved theme edits. No server-based settings account is used. |
| `downloads` | Save user-requested raw ticket exports and draft recovery copies locally. The background worker waits for the specific extension download to complete before reporting success. It does not scan unrelated downloaded file content. |
| `https://itjones.zendesk.com/agent/*` | Run the workspace UI, inspect native ticket state and perform user-requested native ticket actions only on the company's agent pages. No general all-sites access. |
| Optional `scripting` | Register/remove the packaged Harvest theme adapter only after the user enables optional Harvest support and grants access. |
| Optional `https://platform.harvestapp.com/*` | Style the embedded `/platform/timer` in the Jones IT Zendesk context. Runtime guards require the Zendesk app/service and top ancestor. The code does not read/change timer fields or operate account pages. |

Chrome host matching can grant origin-level capability beyond a path. The manifest/content matches and runtime checks together enforce our intended narrower behavior; do not describe path text as an absolute browser-enforced security boundary.

## Remote code

**No remotely hosted executable code.** JavaScript/CSS are packaged. No remote script imports, eval-based loader or remote executable configuration is used. Ticket HTML and media are data rendered by Zendesk, not extension code. Optional local AI processing is a separate user-run Python tool and does not execute model output.

## Data categories to review

The extension locally handles **website content**, **personal communications**, and **personally identifiable information** in tickets/drafts. It also interprets native viewing/editing activity, so disclose that limited **user activity** rather than presenting it as independent browsing telemetry.

Ticket bodies and screenshots can incidentally contain financial, health, authentication or other sensitive material. Raw exports do not filter those categories. Review the dashboard definitions and include applicable categories for the tickets this pilot actually handles. Do not automatically mark all data boxes empty because nothing is uploaded to a publisher server. No dedicated credential/cookie reading, general browser-history collection, payment collection or location service is implemented.

## Use and sharing

Information is used for the stated workspace features, native Zendesk operations and user-requested clipboard/download actions. Preferences/recovery data remain local to Chrome. Export media retrieval may contact existing image providers; optional local-processing public-media fetch is explicit. No advertising, sale, publisher analytics server, credit scoring or hosted-AI transmission is implemented.

The draft policy describes those boundaries. The publisher must personally review and make the dashboard certifications. Do not claim automatic de-identification: local vision receives original image pixels and processed output requires human review.

## Privacy policy

The reviewed policy source is [PRIVACY.md](docs/release/PRIVACY.md). Hosting output is docs/release/site/privacy.html; the extension copy is src/guide/privacy.html. No data-practice change was introduced by the source move.

## Distribution

Private pilot for designated trusted testers. Do not substitute Unlisted for access restriction. No Web Store item has been submitted or approved.

## Graphics

128×128 store icon and three 1280×800 screenshots are prepared. The first explains the collection of ticket tools; the theme editor is secondary. The screenshots use actual popup/guide code with synthetic settings and no customer ticket data. [Files, dimensions and provenance](docs/release/ASSETS.md).

## Version history

| Version | Date | Change | Store status |
| --- | --- | --- | --- |
|0.7.7|2026-11-11|Feature-based src layout, readable control styles, lint/resource/CI checks, migrated Harvest registration paths; no new permissions|Draft|
|0.7.6|2026-11-11|Removed desktop column divider; source pushed to GitHub|Not submitted|

## Review notes

No Google rejection history. Open acceptance: real second-agent presence recognition and screen-reader walkthrough. Other third-party frames remain outside the Harvest adapter. Local privacy scrubbing and vision interpretations always need review. Reviewer account/SSO instructions belong in the dashboard's restricted field, never the public repo. See [reviewer instructions](docs/release/REVIEWER.md).
