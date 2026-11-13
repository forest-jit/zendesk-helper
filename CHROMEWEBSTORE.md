# Chrome Web Store — Jones IT Zendesk Helper

Last updated: November 12, 2026. Release version 0.7.8. The owner reports that the extension is now published in the Chrome Web Store. [Open the listing](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf). Future package updates require review.

## Store listing

- **Name:** Jones IT Zendesk Helper
- **Publisher display name:** forest
- **Summary:** A collection of tools and improvements for Jones IT Zendesk: conversation controls, draft protection and ticket actions.
- **Category:** Workflow & Planning (under Productivity).
- **Language:** English

## Detailed description

Jones IT Zendesk Helper is a collection of tools and improvements for working in Jones IT Zendesk. It works only on itjones.zendesk.com agent pages and requires an authorized account.

WHAT YOU CAN DO
• Read long tickets: show the latest five messages or expand the loaded history. Collapse supported quoted email threads, simplify bulky email layouts and open images from compact previews.
• Reply with fewer clicks: switch between public replies and internal notes in one click. In Settings, enable shared drafts to move text and formatting without replacing a different draft.
• Save fields separately: update ticket properties while keeping your reply draft. Local recovery copies help protect drafts when a field save is interrupted.
• Reuse ticket details: copy a linked ticket number, export loaded messages and accessible images, and refresh ticket views while idle.
• Adjust your workspace: choose a theme or open Settings to create one from five base colors. Preview it before applying; import/export theme files without ticket data. Optional Harvest styling matches the timer to your theme without changing its entries.

GETTING STARTED
The v0.7.11 update supports Zendesk Light and Dark appearances. If you are still using v0.7.8, choose Zendesk profile picture > Appearance > Light mode until the update arrives.
1. Open a ticket in Jones IT Zendesk.
2. Click the extension icon to turn the helper on and choose your settings.
3. Open Settings for reply preferences, reading controls, Harvest setup and the Feature guide.

OPTIONAL HARVEST SETUP
Harvest styling is off by default. Open the extension > Settings > Harvest, click Match Harvest to theme, and allow access to platform.harvestapp.com. Check that the button says Harvest theme on, then reload the Harvest panel using its reload icon. If approval was interrupted, reopen Settings and click Match Harvest to theme again if needed. Set this up separately in each browser/profile or when switching from an unpacked copy.

KEYBOARD SHORTCUT
Command+Enter sends while you are typing in the reply box. In the sidebar, it saves field changes instead. Check whether you are writing a public reply or internal note before sending.

DATA AND LIMITS
Settings and recovery copies stay in your Chrome profile. Raw exports contain original ticket information and may include personal data. Optional local AI processing is a separate tool; its redaction and image interpretations need your review before sharing. The extension does not call hosted AI or publish documentation.

Zendesk’s own viewing/editing indicators are unchanged. The helper does not add a separate presence badge.

This is a private pilot, independently developed and not an official Zendesk or Harvest product. Other embedded apps keep their own interface.

## Developer information and URLs

Preferred publisher display name: **forest**; the dashboard currently still displays the Gmail address as the name. Contact: **forest.r.welch@gmail.com**, added and verified in publisher Settings after the owner followed Google’s verification link. Repository: https://github.com/forest-jit/zendesk-helper.

Homepage: https://github.com/forest-jit/zendesk-helper. Support: https://github.com/forest-jit/zendesk-helper/issues (issues enabled). Both are saved in the listing. Privacy policy URL: https://github.com/forest-jit/zendesk-helper/blob/main/docs/release/PRIVACY.md (publicly readable without sign-in; saved in the Privacy form). See [hosting steps](docs/release/GITHUB_HOSTING.md). Account ownership, trader declaration, company-approved reviewer access and Google certifications remain owner steps.

## Single purpose and permission justifications

Help Jones IT agents read ticket conversations, write replies and update ticket fields in Zendesk.

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

The extension locally handles **website content**, **personal communications**, and **personally identifiable information** in tickets/drafts. Workspace interactions such as typing, focus and selection pause queue refresh and route shortcuts. These are limited **user activity**, not general browsing telemetry. The duplicate presence adapter has been removed.

Ticket bodies and screenshots can incidentally contain financial, health, authentication or other sensitive material. Raw exports do not filter those categories. Review the dashboard definitions and include applicable categories for the tickets this pilot actually handles. Do not automatically mark all data boxes empty because nothing is uploaded to a publisher server. No dedicated credential/cookie reading, general browser-history collection, payment collection or location service is implemented.

## Use and sharing

Information is used for the stated workspace features, native Zendesk operations and user-requested clipboard/download actions. Preferences/recovery data remain local to Chrome. Export media retrieval may contact existing image providers; optional local-processing public-media fetch is explicit. No advertising, sale, publisher analytics server, credit scoring or hosted-AI transmission is implemented.

The draft policy describes those boundaries. The publisher must personally review and make the dashboard certifications. Do not claim automatic de-identification: local vision receives original image pixels and processed output requires human review.

## Privacy policy

The reviewed policy source is [PRIVACY.md](docs/release/PRIVACY.md). Hosting output is docs/release/site/privacy.html; the extension copy is src/guide/privacy.html. No data-practice change was introduced by the source move.

## Distribution

Private pilot for designated trusted testers. Do not substitute Unlisted for access restriction. The owner reports v0.7.8 published; the prepared update has not been submitted.

## Graphics

128×128 store icon and three 1280×800 screenshots are prepared. The first explains the collection of ticket tools; the theme editor is secondary. The screenshots use actual popup/guide code with synthetic settings and no customer ticket data. [Files, dimensions and provenance](docs/release/ASSETS.md).

## Release automation

Pushing a version tag runs the automated checks, validates matching manifest/package/lockfile versions, builds store/development ZIPs and checksums, then creates a draft GitHub release. See [tagged release instructions](docs/release/TAGGED_RELEASES.md). The first v0.7.7 tagged build passed on GitHub and its draft contains both ZIPs and checksums. No Chrome Web Store upload/submission credentials are configured. The first store item now exists. Future API submission still needs authorized credentials and completion of the required dashboard fields.

## Version history

| Version | Date | Change | Store status |
| --- | --- | --- | --- |
|0.7.8|2026-11-12|Renamed to Jones IT Zendesk Helper across extension, policy, guide and listing artwork; same scope and permissions|Published, owner confirmed|
|0.7.7|2026-11-11|Feature-based src layout, readable control styles, lint/resource/CI checks, migrated Harvest registration paths; no new permissions|Draft|
|0.7.6|2026-11-11|Removed desktop column divider; source pushed to GitHub|Not submitted|

## Review notes

No Google rejection history. Open acceptance: fresh real Harvest permission flow and screen-reader walkthrough. Other third-party frames remain outside the Harvest adapter. Local privacy scrubbing and vision interpretations always need review. Reviewer account/SSO instructions belong in the dashboard's restricted field, never the public repo. See [reviewer instructions](docs/release/REVIEWER.md).

## Dashboard draft, November 11, 2026

Store item ID: `bbhdbfdfidlfihbbohohdndpppibgogf`. Publisher ID in the dashboard URL: `5b7649a9-a4f0-44ce-acc9-f9f0d4d8d6ff`. These identify the item; they are not API credentials. The dashboard is signed into the supplied Gmail account. Publisher display name/account declarations remain owner decisions.

Saved and reloaded: the detailed description above, Workflow & Planning category, English, store icon, three screenshots, small promo tile and GitHub homepage/support links. Title and summary come from the uploaded package and already match this record. No promo video, marquee tile or verified Official URL was invented. Save confirmation read “Item saved.”

Only Store Listing was completed. Privacy disclosures/certifications, policy hosting, Distribution and reviewer access remain outside this pass. The uploaded package itself was not replaced or audited during listing edits. The item remains a draft; Submit for review was not clicked. Evidence is local to the current chat outputs/store-listing.

## Privacy draft, November 11, 2026

The five editable explanations and policy were revised with the humanizer and i-have-adhd skills. Short paragraphs separate uses, storage and limits. All five form values persisted after save/refresh. No data categories, certifications or data practices changed.

Saved and refreshed successfully: single purpose, storage/downloads/scripting/host explanations, four data categories and the existing public GitHub policy URL. No separate site deployment was needed. The three publisher certifications remain unchecked; no submission occurred.

### storage justification

Remember settings and custom themes in this Chrome profile. Keep local copies of unsent drafts so interrupted field saves or reply-mode changes can be recovered.

Unsaved theme edits last for the Chrome session. Settings and draft copies are not uploaded to a publisher server. No settings account is needed.

### downloads justification

Save ticket exports and draft recovery files to your computer when you request them. Exports can contain original messages and accessible images.

The helper checks that its own download finishes. It does not inspect unrelated downloaded file contents.

### scripting justification

Apply theme colors to the embedded Harvest timer after you turn on Harvest styling and grant access. Use only the scripts and stylesheet included in the extension.

The helper removes the registered scripts when styling is turned off or access is revoked. It does not load remote code or change timer fields or entries.

### Host permission justification

https://itjones.zendesk.com/agent/*: read the active ticket to provide conversation controls, draft recovery, field changes, copy/export and themes. Saves and sends happen through Zendesk’s own controls when requested.

Optional https://platform.harvestapp.com/*: style only the embedded Zendesk timer after permission is granted. Runtime checks restrict this to the timer context. The helper does not read or change Harvest project, task, notes, duration or timer values.

No general access to other sites or browsing history.

Selected categories: Personally identifiable information, Personal communications, User activity and Website content. Historically User activity included native activity indicators. In v0.7.11 those duplicate indicators are removed; focus/typing/selection still support workspace features. No general monitoring is added. No dedicated health, finance, credentials, location or browser-history collection is implemented; these were left unchecked in the draft. Raw messages/exports do not filter incidental sensitive content, so the owner must review applicable categories against actual pilot use before certifying.

Publisher action: review the policy and category choices, then make the three declarations about sale/transfer, use limited to the single purpose, and no creditworthiness/lending use. These declarations were not accepted on the owner’s behalf. Current form did not show a separate remote-code control; packaged-code/no-remote-code details remain above. Evidence: current chat outputs/store-privacy.

## Publisher contact verified, November 11, 2026

Added forest.r.welch@gmail.com in Settings and requested verification. The owner completed the email link. After refresh, Google showed “Verified email address.” On returning to the item, Submit for review was enabled and the contact-email blockers were gone. No submission was made. Other account settings, declarations and access were not changed. Previous unchecked-certification observations describe earlier privacy edits; current certification/distribution contents were not re-audited in this pass. Evidence: current chat outputs/publisher-contact.

## Name update, version 0.7.8

Current product name is Jones IT Zendesk Helper. Runtime-only v0.7.8 was uploaded to the existing item; Package confirms the version. Store title and description use the name, with refreshed three screenshots and small promo tile. Save confirmation and refresh persistence passed. Chrome loaded source/version/Reloaded and the renamed popup were checked. Aggregate, format, preflight and tagged-release run 43083408272 pass. Submit for review is enabled; it was not clicked. Previous tagged releases and their names stay unchanged. No data practices, permissions, internal IDs or storage keys changed.

## Update notes

CHANGELOG.md supplies the user-facing notes. The tagged release generates store-update-notes.txt and store-description.txt; the latter includes the base description above plus the latest update. Copy that text into the dashboard description when preparing an update. GitHub does not sync it to the Store automatically. See docs/release/TAGGED_RELEASES.md.

## Next update — v0.7.11, prepared

The new reply control clearly separates Public reply and Internal note. Draft sharing moves into Settings. Copy ticket becomes one click for a linked number. History controls scroll with the conversation and the latest-five summary can be disabled. The popup keeps On/Off and themes; full Settings contains custom themes, Harvest, workflow choices and help. Theme JSON import/export and an explicit preview/export target are added. Duplicate helper activity badges and layout-side switches are removed.

Native Light/Dark checks passed in Chrome on the preceding 0.7.10 theme changes retained here. Appearance labels and nested native surfaces use the selected palette. Harvest approval finishes independently of popup lifetime; first real consent acceptance remains open. No broader permissions or hosted services are added. This is the next-description source, not a claim that it is saved in Google’s dashboard.

## Update draft verified — November 13, 2026

Uploaded the Store ZIP from the successful v0.7.11 tagged build (commit a1331b2, run 43389694785). Google Package shows Draft 0.7.11 and Published 0.7.8. Generated store-description.txt, including the matching changelog, was saved and retained after a full page reload. Submit for review is enabled; it was not clicked. The published item is public, as observed in the dashboard; distribution was not changed.

The three replacement listing screenshots use current popup/Settings/guide code with sample preferences and were visually reviewed. They are ready in docs/release, but the old dashboard images remain: Google labels their removal irreversible, so the prompt was canceled pending owner confirmation. No listing image was deleted. Remaining first-permission/accessibility/rollout acceptance is in TASKS.md, not a second checklist here.
