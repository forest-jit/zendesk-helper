# Chrome Web Store — Zendesk Helper

Last updated: November 11, 2026. Release version 0.7.7. The Store Listing draft is saved in the dashboard; nothing has been submitted for review.

## Store listing

- **Name:** Zendesk Helper
- **Publisher display name:** forest
- **Summary:** A collection of tools and improvements for Jones IT Zendesk: conversation controls, draft protection and ticket actions.
- **Category:** Workflow & Planning (under Productivity).
- **Language:** English

## Detailed description

Zendesk Helper is a collection of tools and improvements for working in Jones IT Zendesk. It works only on itjones.zendesk.com agent pages and requires an authorized account.

WHAT YOU CAN DO
• Read long tickets: show the latest five messages or expand the loaded history. Collapse supported quoted email threads, simplify bulky email layouts and open images from compact previews.
• Reply with fewer clicks: switch between public replies and internal notes in one click. Turn on Carry this draft to move text and formatting without replacing a different draft.
• Save fields separately: update ticket properties while keeping your reply draft. Local recovery copies help protect drafts when a field save is interrupted.
• Reuse ticket details: copy a ticket number or link, export loaded messages and accessible images, and refresh ticket views while idle.
• Adjust your workspace: choose a theme or create one from five base colors. Preview it before applying. Optional Harvest styling matches the timer to your theme without changing its entries.

GETTING STARTED
1. Open a ticket in Jones IT Zendesk.
2. Click the extension icon to turn the helper on and choose your settings.
3. Open Help & feature guide in the popup for instructions.

KEYBOARD SHORTCUT
Command+Enter sends while you are typing in the reply box. In the sidebar, it saves field changes instead. Check whether you are writing a public reply or internal note before sending.

DATA AND LIMITS
Settings and recovery copies stay in your Chrome profile. Raw exports contain original ticket information and may include personal data. Optional local AI processing is a separate tool; its redaction and image interpretations need your review before sharing. The extension does not call hosted AI or publish documentation.

The activity badge shows only information Zendesk reports. Viewing/editing recognition still needs a two-person pilot test. “Not reported” means unknown, not that nobody else is working on the ticket.

This is a private pilot, independently developed and not an official Zendesk or Harvest product. Other embedded apps keep their own interface.

## Developer information and URLs

Publisher display name: **forest**. Contact: **forest.r.welch@gmail.com**. Both remain proposed public values pending owner confirmation. Repository: https://github.com/forest-jit/zendesk-helper.

Homepage: https://github.com/forest-jit/zendesk-helper. Support: https://github.com/forest-jit/zendesk-helper/issues (issues enabled). Both are saved in the listing. The privacy policy URL is not hosted/verified yet. See [hosting steps](docs/release/GITHUB_HOSTING.md). Account ownership, trader declaration, company-approved reviewer access and Google certifications remain owner steps.

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

## Release automation

Pushing a version tag runs the automated checks, validates matching manifest/package/lockfile versions, builds store/development ZIPs and checksums, then creates a draft GitHub release. See [tagged release instructions](docs/release/TAGGED_RELEASES.md). The first v0.7.7 tagged build passed on GitHub and its draft contains both ZIPs and checksums. No Chrome Web Store upload/submission credentials are configured. The first store item now exists. Future API submission still needs authorized credentials and completion of the required dashboard fields.

## Version history

| Version | Date | Change | Store status |
| --- | --- | --- | --- |
|0.7.7|2026-11-11|Feature-based src layout, readable control styles, lint/resource/CI checks, migrated Harvest registration paths; no new permissions|Draft|
|0.7.6|2026-11-11|Removed desktop column divider; source pushed to GitHub|Not submitted|

## Review notes

No Google rejection history. Open acceptance: real second-agent presence recognition and screen-reader walkthrough. Other third-party frames remain outside the Harvest adapter. Local privacy scrubbing and vision interpretations always need review. Reviewer account/SSO instructions belong in the dashboard's restricted field, never the public repo. See [reviewer instructions](docs/release/REVIEWER.md).

## Dashboard draft, November 11, 2026

Store item ID: `bbhdbfdfidlfihbbohohdndpppibgogf`. Publisher ID in the dashboard URL: `5b7649a9-a4f0-44ce-acc9-f9f0d4d8d6ff`. These identify the item; they are not API credentials. The dashboard is signed into the supplied Gmail account. Publisher display name/account declarations remain owner decisions.

Saved and reloaded: the detailed description above, Workflow & Planning category, English, store icon, three screenshots, small promo tile and GitHub homepage/support links. Title and summary come from the uploaded package and already match this record. No promo video, marquee tile or verified Official URL was invented. Save confirmation read “Item saved.”

Only Store Listing was completed. Privacy disclosures/certifications, policy hosting, Distribution and reviewer access remain outside this pass. The uploaded package itself was not replaced or audited during listing edits. The item remains a draft; Submit for review was not clicked. Evidence is local to the current chat outputs/store-listing.
