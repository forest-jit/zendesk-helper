# Zendesk Helper privacy policy

Last updated: November 11, 2026

Publisher display name: forest  
Privacy and support contact: forest.r.welch@gmail.com

Zendesk Helper adjusts the Jones IT Zendesk agent workspace. It changes display settings, adds controls for reading messages, protects reply drafts during field saves, and copies or exports ticket information when requested. It works on `itjones.zendesk.com/agent/` pages. Optional styling applies to the Harvest timer embedded there.

## Information used

The extension reads the ticket content and interface needed for the features you use. This can include ticket titles, identifiers, requester/organization details, author names, public replies, internal notes, timestamps, images and attachment references, selected fields and native agent-activity indicators. Ticket content can contain personal, confidential or other sensitive information.

The extension also handles unsent replies and internal notes, including their formatting. It uses these drafts to protect a field save, recover an interrupted operation or carry text between reply modes. It reads the current agent page URL to identify the active ticket and route actions. It does not collect general browsing history or independently track agents across tabs.

## Where information goes

Preferences and custom themes are stored in this Chrome profile using extension local storage. Unsaved theme-editor values use Chrome session storage. Draft recovery copies are stored locally in extension storage while needed to protect an interrupted or conflicting operation.

Normal field saves and sends use Zendesk's existing controls and service. The extension does not operate a separate ticket server. Copy commands write the chosen ticket information to your clipboard. Export and recovery commands create local downloads, which can contain unredacted ticket content and image bytes or URLs.

When you export, the extension may request image resources referenced by the ticket to include them in the file. These requests go to the existing media provider; same-origin requests may use your existing Zendesk session, while cross-origin requests omit credentials. The provider can receive normal network-request information. Merely reading email content can also load resources under Zendesk/browser behavior. The helper does not add analytics or advertising trackers.

There is no publisher-operated telemetry, advertising, sale of user data, or upload of ticket content to a publisher server in this build. The publisher does not receive your tickets or drafts through the extension. If you separately email support, the email provider and recipient receive what you choose to send; omit customer data unless an authorized support arrangement requires it.

## Optional Harvest styling

If enabled, Chrome asks for access to `platform.harvestapp.com` and optional scripting permission. The adapter is restricted to the embedded Zendesk timer context and applies theme preferences. It does not read or change project, task, notes, duration or timer values. Harvest and Zendesk retain their own services and privacy practices.

## Optional local AI processing

The browser extension does not call hosted AI or publish to Notion or another documentation service. A separately run Python command can process your downloaded export using the local Ollama service at `127.0.0.1:11434`.

That command uses known-identity and pattern-based text scrubbing before/after local inference. It can send original image pixels to a local vision model; it does not automatically remove personal information from images. Scrubbing and model interpretations can be incomplete or incorrect. Review every result before sharing it. An explicit `--fetch-public-media` option can download public HTTPS images from their source providers; it does not use browser cookies. Model installation and other tools have their own network behavior.

## Retention and your controls

Settings remain until changed or extension data is removed. Theme-editor session data lasts for the Chrome session or until saved/deleted through the editor. Verified, settled draft backups are removed after safe restoration or a completed recovery-copy download. Uncertain or conflicting backups are retained for recovery rather than silently discarded; there is no automatic expiry promised for them.

Turn the helper Off to remove its display changes and controls. This keeps settings and recovery data. Turn optional Harvest styling off or revoke its site access to stop that adapter. Removing the extension removes its Chrome extension storage through Chrome's normal behavior; keep any needed recovery copy first. Downloads and separately processed files remain until you delete them. Clipboard content follows your operating system and clipboard tools; the extension does not clear it automatically.

The extension stores its data in Chrome's profile storage without adding its own encryption. Device access, Chrome profile management, backups and synced folders are governed by your device and organization settings.

## Questions and changes

Contact forest.r.welch@gmail.com with privacy questions. Do not include raw tickets or screenshots containing customer information in an initial report. Updates to the extension or its data practices may require an updated policy and store disclosures.
