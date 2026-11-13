# Chrome Web Store release

The owner reported publication on November 12, 2026. [Install Jones IT Zendesk Helper](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf). The first Store package prepared here was v0.7.8.

**Deployment hold:** no uploads, submissions, image replacements, tags or publication until the owner lifts the hold. Local preparation can continue.

## Files to use

| Need | File |
| --- | --- |
| Store title, summary, description and disclosures | ../../CHROMEWEBSTORE.md |
| Privacy policy text | PRIVACY.md; the hosting version is site/privacy.html |
| Permission/data explanations | ../../CHROMEWEBSTORE.md |
| Authenticated test instructions | REVIEWER.md |
| Icons, screenshot provenance and image sizes | ASSETS.md |
| Company GitHub / Pages setup | GITHUB_HOSTING.md |

Use the matching Store ZIP and checksum from the version-tagged GitHub release for an update. Local source is 0.7.12; the existing Store/GitHub drafts are 0.7.11 and the published Store version is 0.7.8. Local 0.7.12 packages have not been uploaded. The separate development ZIP also includes local-processing instructions/tooling. Store artwork and policy pages are outside the extension ZIP. The runtime icon files are inside it. `docs/CODE_TOUR.md` is the reading guide for the source.

## What remains outside this release packet

- Company rollout and managed installation need the appropriate administrator.
- The fresh Harvest-permission check and screen-reader walkthrough remain in TASKS.md.
- Test the Store installation in a separate profile before disabling an unpacked copy. Different extension IDs do not share settings or recovery data automatically.

## Later updates

[Tagged GitHub releases](TAGGED_RELEASES.md) explains how a version tag runs checks and prepares ZIPs in a draft release. This stage needs no Google credentials; Web Store submission is not connected yet.

Keep the same store item. Test the change, increase the version, build the ZIP and submit an update for review. Chrome distributes approved updates automatically on its own schedule. A Zendesk tab can retain old page code until refreshed; protect drafts first. Do not force-refresh working tickets. A move between different extension IDs does not promise settings/recovery migration.

## Official sources, checked November 11, 2026

- [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [image requirements](https://developer.chrome.com/docs/webstore/images).
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) and [privacy policy requirement](https://developer.chrome.com/docs/webstore/program-policies/privacy).
- [Private distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution) and [review process](https://developer.chrome.com/docs/webstore/review-process).
- [Account fields](https://developer.chrome.com/docs/webstore/set-up-account) and [trader verification](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).
- [Updates](https://developer.chrome.com/docs/webstore/update) and [automatic update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle).
