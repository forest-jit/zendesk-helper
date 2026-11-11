# Private release: what is ready

Source is on GitHub. Store Listing is saved as a dashboard draft with description, category/language, images and GitHub links. Privacy/distribution/reviewer setup is still pending. The extension has not been submitted for review, and the policy site has not been deployed.

## Files to use

| Need | File |
| --- | --- |
| Store title, summary, description and disclosures | ../../CHROMEWEBSTORE.md |
| Privacy policy text | PRIVACY.md; the hosting version is site/privacy.html |
| Permission/data explanations | ../../CHROMEWEBSTORE.md |
| Authenticated test instructions | REVIEWER.md |
| Icons, screenshot provenance and image sizes | ASSETS.md |
| Company GitHub / Pages setup | GITHUB_HOSTING.md |

Use the matching `zendesk-helper-0.7.7-store.zip` and checksum in this chat's outputs folder for the dashboard. The separate development ZIP also includes local-processing instructions/tooling. Store artwork and policy pages are outside the extension ZIP. The runtime icon files are inside it. `docs/CODE_TOUR.md` is the reading guide for the source.

## You need to handle these five things

1. **Ownership/account:** confirm “forest” as display name, whether your or the company's publisher account owns the extension, and whether the supplied Gmail should be public. Register/verify the account, pay the registration fee and make the truthful trader declaration. Legal information may be public depending on the required verification.
2. **Hosting:** approve the policy and upload `site/` to an accessible HTTPS location, such as an approved GitHub Pages site. Record the actual homepage, policy and support URLs in CHROMEWEBSTORE.md at the repository root. A private repository alone does not provide a publicly readable policy URL.
3. **Reviewer access:** arrange a company-approved synthetic Zendesk environment/account and MFA/access instructions. Fill REVIEWER.md through the dashboard's secure field. Never add passwords to GitHub or this release packet.
4. **Pilot sign-off:** choose tester Google accounts; arrange the outstanding coworker presence and assistive-technology checks from TASKS.md. Confirm company approval for this authenticated tool and its local data practices.
5. **Submit:** upload the ZIP/assets, copy the listing/disclosures, choose Private and submit for review. Review all certifications yourself. After approval, install the store copy in a clean test profile; plan migration and disable duplicate unpacked copies.

## Later updates

[Tagged GitHub releases](TAGGED_RELEASES.md) explains how a version tag runs checks and prepares ZIPs in a draft release. This stage needs no Google credentials; Web Store submission is not connected yet.

Keep the same store item. Test the change, increase the version, build the ZIP and submit an update for review. Chrome distributes approved updates automatically on its own schedule. A Zendesk tab can retain old page code until refreshed; protect drafts first. Do not force-refresh working tickets. A move between different extension IDs does not promise settings/recovery migration.

## Official sources, checked November 11, 2026

- [Listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing) and [image requirements](https://developer.chrome.com/docs/webstore/images).
- [Privacy fields](https://developer.chrome.com/docs/webstore/cws-dashboard-privacy) and [privacy policy requirement](https://developer.chrome.com/docs/webstore/program-policies/privacy).
- [Private distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution) and [review process](https://developer.chrome.com/docs/webstore/review-process).
- [Account fields](https://developer.chrome.com/docs/webstore/set-up-account) and [trader verification](https://developer.chrome.com/docs/webstore/program-policies/trader-verification-faq).
- [Updates](https://developer.chrome.com/docs/webstore/update) and [automatic update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle).
