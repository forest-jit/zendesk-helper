# Jones IT Zendesk Helper privacy policy

Last updated: November 11, 2026

Publisher display name: forest  
Privacy and support contact: forest.r.welch@gmail.com

Jones IT Zendesk Helper adds reading controls, reply shortcuts and ticket tools to the Jones IT Zendesk workspace. It protects drafts during field saves and copies or exports ticket information when you ask. It works on `itjones.zendesk.com/agent/` pages. You can also choose to style the Harvest timer embedded there.

## What the extension reads

The helper reads the ticket details needed for its features: titles and ticket numbers, requester and organization details, author names, messages, internal notes, timestamps, images, attachment references and selected fields. It also reads the agent-activity indicators that Zendesk provides. Tickets can contain personal, confidential or other sensitive information.

The helper handles unsent public replies and internal notes, including their formatting. It uses local draft copies to protect field saves, recover interrupted operations and carry text between reply modes.

It reads the current agent-page URL to identify the ticket and direct your actions. It does not collect your general browsing history or independently track agents across tabs.

## What stays on your computer

Settings and custom themes stay in this Chrome profile. Unsaved theme edits use Chrome session storage. Draft recovery copies stay in local extension storage while needed to protect an interrupted save or a conflict between drafts.

Copy commands put the ticket details you choose on your clipboard. Export and recovery commands save files to your computer. These files can contain original, unredacted ticket content, image data and image URLs.

The extension uses Chrome's profile storage without adding its own encryption. Access to your device, profile management, backups and synced folders depends on your device and organization settings.

## When information leaves your computer

Saving ticket fields or sending a reply uses Zendesk's existing controls and service. The helper does not run a separate ticket server.

An export may request images from the media providers already referenced in the ticket. Requests to the same origin may use your existing Zendesk session; requests to other origins omit credentials. Providers can receive the usual network-request information. Reading an email can also load resources through Zendesk and your browser.

This build adds no publisher-run telemetry, analytics, advertising or tracking. It does not sell user data or upload tickets and drafts to a publisher server. The publisher does not receive your tickets through the extension.

If you email support, your email provider and the recipient receive what you send. Leave out customer data unless an authorized support arrangement requires it.

## Optional Harvest styling

If you turn it on, Chrome asks for access to `platform.harvestapp.com` and optional scripting permission. The helper applies theme settings only to the Harvest timer embedded in Zendesk.

It does not read or change project, task, notes, duration or timer values. Harvest and Zendesk keep their own services and privacy practices.

## Optional local AI processing

The browser extension does not call hosted AI or publish to Notion or another documentation service. You can separately run a Python command to process an export with Ollama on your computer at `127.0.0.1:11434`.

The command tries to remove known names and other identifying text before and after local AI processing. It uses known-identity and pattern-based checks. These checks can miss information.

Original image pixels can be passed to the local vision model. Personal information is not automatically removed from images. The model can also misinterpret them. Review every result before sharing it.

The `--fetch-public-media` option explicitly downloads public HTTPS images from their source providers. It does not use browser cookies. Installing models and using other tools can involve their own network requests.

## How long information stays

Settings stay until you change them or remove the extension data. Unsaved theme edits last for the Chrome session, or until you save or delete them in the editor.

Settled draft backups are removed after a verified safe restoration or a completed recovery-file download. Uncertain or conflicting copies stay available for recovery. They have no promised automatic expiry.

Downloads and separately processed files stay on your computer until you delete them. Clipboard contents follow your operating system and clipboard tools; the helper does not clear them.

## What you can control

Turn the helper Off to remove its display changes and controls. Settings and recovery copies stay in place.

Turn Harvest styling off, or revoke its site access, to stop that feature.

Uninstalling the extension removes its extension storage through Chrome's normal behavior. Save any recovery copy you need first. Uninstalling does not delete downloaded or separately processed files.

## Questions and policy changes

Email forest.r.welch@gmail.com with privacy questions. Keep raw tickets and screenshots containing customer information out of your first message.

Changes to the extension or its data use may require updates to this policy and the store disclosures.
