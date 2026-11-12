# Small-team installation

**Use Zendesk Light mode:** click your Zendesk profile picture → **Appearance → Light mode**. Choose Light mode explicitly rather than Match system appearance. Native Zendesk Dark mode is not supported by the helper yet and can leave mismatched colors. You can still use the helper’s own dark themes; your Mac’s appearance can stay as it is.

For the prepared private store release, start with [release/START_HERE.md](release/START_HERE.md). It links the listing, policy, disclosures, reviewer instructions, screenshots and remaining owner steps.

This is a local prototype for Jones IT Zendesk. The release zip contains the extension only: no raw tickets, browser profile data, local AI models, credentials, or development dependencies.

1. Unzip the release to a stable folder. Each person keeps their own Chrome preferences and custom themes.
2. In Chrome, open `chrome://extensions`, enable Developer mode, choose **Load unpacked**, and select the unzipped folder.
3. Refresh Zendesk once. Pin **Jones IT Zendesk Helper settings** if desired. The popup's single **On / Off** switch controls the helper; settings save immediately.
4. Harvest theming is optional. Enabling it asks for access to its embedded timer origin. Without that choice, Harvest keeps its own colors.
5. To update, replace files in that folder, reload the extension in Chrome, and refresh Zendesk after protecting any drafts. Verify the loaded version. To roll back, load the preceding release folder and refresh.

For a team pilot, use an authorized test ticket first: check public/internal mode, draft carry/conflict handling, property saves, an actual queue refresh, and Harvest before daily use. Each agent should review whether optional draft carry suits their workflow. Automatic title changes update the native draft; they are saved with the ticket, not submitted in the background. Queue refresh uses Zendesk's existing view refresh, pauses around interaction, and never reloads a ticket page.

Unpacked extensions may be restricted by organization policy. A managed rollout, Chrome Web Store publication, automatic updates, extension allowlisting, and company approval must be arranged through the organization's normal administrator process. This package does not grant or bypass that approval.

Presence depends on Zendesk's native collision reporting. “Not reported” means unknown, not safe to reply. A genuine second-agent session is needed to validate live name/editing indicators for the team's plan.

Raw exports and local recovery copies can contain customer information. Keep them local; review processed documentation before moving it to a shared knowledge base. Uninstalling does not remove files already downloaded.

The v0.7.1 guide also covers quoted-email disclosures, display-only message contrast repair, Closed status, and the fixed desktop rail. Include the guide in any pilot handoff. Assess peer presence with a genuine second agent before relying on it.

GitHub source and information-page hosting: [release/GITHUB_HOSTING.md](release/GITHUB_HOSTING.md).

## Chrome Web Store path

Start with a private tester release. Use a company-owned publisher account if Jones IT will maintain it. Registration requires a one-time fee; complete account verification in Google's dashboard. Do not assume an unpacked development install becomes a store install automatically.

1. Prepare a reviewed release ZIP, icon, screenshots, description, support contact and permission explanations. Keep ticket data out of screenshots. The extension currently runs only on Jones IT Zendesk; publishing it does not enable other Zendesk domains.
2. Host an accurate privacy policy covering ticket content, local draft recovery, preferences, clipboard actions, downloads and optional Harvest access. Complete the dashboard's privacy disclosures consistently. Local processing still handles user data.
3. Upload the ZIP in the developer dashboard and choose distribution. Private limits installation to designated testers. Unlisted permits anyone with the link; it is not access control. Domain publishing can be used when enabled by the organization. Public appears in search.
4. Supply reviewer instructions for the authenticated Zendesk functionality, using an organization-approved test arrangement. Submit for review, including private releases. Share the approved install link after release.
5. Plan migration from unpacked to store installations. Extension IDs and local storage can differ; preserve drafts/recovery data, disable the development copy and verify settings/optional permissions before daily use. Do not run both copies on Zendesk.

For updates: test locally, increase the manifest/package version, rebuild the full ZIP, upload it to the same store item, update changed listing/disclosure details and submit for review. Chrome automatically checks for approved updates on startup and every few hours; arrival and activation are not immediate. Existing Zendesk tabs may retain old content scripts until refreshed. Protect drafts before refreshing; do not force-reload active ticket tabs as an update strategy. New permissions may require further user approval. Keep a separate development install/profile for testing and plan recovery releases before a broad launch.

This documents the process only. No developer registration, payment, upload, terms acceptance or publication has been performed. Store assets, a hosted privacy policy, reviewer access and company approval are still needed before submission.

Official references, checked 2026-11-11: [Register](https://developer.chrome.com/docs/webstore/register/), [Publish](https://developer.chrome.com/docs/webstore/publish), [Distribution](https://developer.chrome.com/docs/webstore/cws-dashboard-distribution), [Privacy](https://developer.chrome.com/docs/webstore/program-policies/privacy), [Updates](https://developer.chrome.com/docs/webstore/update), [Update lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/extensions-update-lifecycle).

## Ask coworkers to test

> Hey @consultants! I'm looking for a few people to test a Zendesk Chrome extension with me in the office this morning.
>
> Especially interested in messy tickets: nested email threads, hard-to-read colors, lots of images, or awkward layouts. I'd also love two people to help check the viewing and editing indicators.
>
> Send me a ticket link or stop by if you're interested. We'll keep real tickets read-only and use my test ticket for any saves or sends. General bug reports and usability feedback are welcome too!
