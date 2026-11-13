# Presentation: Jones IT Zendesk Helper

Plan for 15 minutes of demonstration and 3–5 minutes of questions. Use the tested development build for the demo. Publishing stays on hold.

## Do these first

1. **Check the demo build.** Use Chrome with the unpacked v0.7.12 extension. Run only one copy of the helper. Our last verified Store release is v0.7.8, so introduce newer controls as a preview of the upcoming update.
2. **Open the test ticket.** Use [#209867](https://itjones.zendesk.com/agent/tickets/209867) for every live edit or save. Keep a local copy of both existing drafts before refreshing. Start with Save changes disabled, and note the original status so you can restore it.
3. **Check the appearance.** Use Zendesk Light mode for a consistent starting point. Pick a readable helper theme. If Harvest is white, open Settings → Harvest → Match Harvest to theme, allow access if requested, confirm Harvest theme on, and reload the Harvest panel. Leave the timer stopped.
4. **Rehearse the field-save demonstration below once.** This is the most important action to get comfortable with. Sending a message is unnecessary for this presentation.
5. **Open the links you will share.** Have the Store listing, Internal Tools guide and reporting page ready. Keep your existing screenshots nearby as a fallback. Share only the intended browser window, with customer tabs and notifications out of view.

The earlier browser checks passed. This checklist is the presentation-day rehearsal; it has not been repeated since resuming from the pause.

## Opening

> I’ve been working on a handful of tools and improvements for Jones IT Zendesk. They give conversations and replies more room, make common actions easier to reach, and let you save ticket fields while keeping a reply draft. I’ll show the daily workflow first, then where to install it and report problems. Some of the controls you’ll see are in the upcoming update.

## Demo order

| Time | Show | Point to make |
| --- | --- | --- |
| 0–2 minutes | A brief Off/On comparison on the test ticket | The helper adjusts the existing Zendesk interface. Off returns to native Zendesk. |
| 2–5 minutes | Two columns, independent scrolling, and recent/full history | Read through the conversation and continue down to the reply box. Ticket fields and Harvest have their own scrollbar. |
| 5–10 minutes | Reply-mode switching and saving fields with an unsent draft | Public reply/Internal note takes one click. Saving properties and sending a message are separate actions. |
| 10–13 minutes | Two contrasting themes and matching Harvest | Themes cover the workspace; Harvest styling needs its own one-time setup in each installation. |
| 13–15 minutes | Copy ticket, installation and reporting | Copy a linked ticket number, show where to install, and show the prominent Submit a ticket action in Internal Tools. |

Use the remaining time for questions. If people ask about implementation, use the short explanations below. If time runs short, finish the field-save demonstration and go straight to installation and feedback.

### The field-save demonstration

1. Show that a reply draft exists. Keep an existing draft intact; if the box is empty, use a short demo sentence. Note the original Status.
2. Choose **Pending** in the sidebar. If the ticket is already Pending, choose Open instead.
3. With focus still in the sidebar, press **Command + Enter**, or click **Save changes**.
4. Wait for Save to become disabled. Point out the saved status, the draft that is still present, and the unchanged conversation: no message was sent.
5. Restore the original status and save it the same way.

Say:

> I can update the ticket while I’m still writing. This draft stays here, and the status change saves separately. Command–Enter follows where I’m working: in the sidebar it saves fields; inside the reply box it sends the displayed reply or note.

Keep the pointer and focus in the sidebar while demonstrating the save shortcut. Show the Send button and explain its shortcut without sending a message.

### Switching reply modes

Click **Internal note**, then **Public reply**. The selected side identifies the current mode.

Explain that **Settings → Replies & reading → Use the same draft when switching reply modes** is optional. When enabled, it carries text into an empty or matching destination. A different destination draft is protected. Queued attachments block carrying.

Use the current setting during the demo. Changing settings and preparing conflicting drafts can wait for a separate testing session.

### Images and long conversations

Show **View full conversation**, then **Collapse earlier messages**. This changes which loaded ticket messages are visible.

If the test ticket has a suitable tall image, show its preview. Otherwise use one of your existing sanitized screenshots. Explain the current rule: short banners and wide, short screenshots stay inline; images taller than 320 displayed pixels become previews.

## Keep these optional

**Quoted email:** leave it out of the main demo unless you are comfortable explaining the exact boundary. It folds earlier correspondence embedded inside one received email. It starts open, and the Hide/Show control preserves the original content. It does not identify duplicates or summarize the thread. Use a sanitized example; avoid exploring unfamiliar customer emails while presenting.

**Simplify formatting:** removed from v0.7.12. It reset widths, spacing and background fills, which could make an email taller without helping. Do not include it in the feature list.

**Local AI:** use a prepared reviewed result if there is time. Explain the flow: Export ticket → separate local reviewer → summary, conclusion and supporting excerpts → human review → chosen Notion page. Processing uses downloaded local models; redaction and image interpretations still need review. The Store extension does not install the reviewer. Avoid waiting for image processing during the presentation.

Automatic title updates and idle queue refresh can be mentioned in questions. They do not need a live demonstration to explain the main workflow.

## How it works, in plain English

| Feature | Short explanation |
| --- | --- |
| Layout and scrolling | Plain JavaScript finds the existing conversation, editor and sidebar. Owned attributes and CSS adjust their layout. |
| Reply-mode switch | Our button opens Zendesk’s native selector and selects the requested mode. Zendesk remains responsible for the actual mode. |
| Save with a draft | The helper backs up the rich draft, temporarily parks it through CKEditor’s data API, uses Zendesk’s Submit action with an empty editor, and restores the draft after observing the save. |
| Themes | Five base colors generate the shades used by CSS variables and component overrides. Harvest gets a separate permission-gated adapter inside its embedded panel. |
| Reading controls | Older messages and recognized quotes are folded with display attributes. Tall-image previews use the original image source. Stored messages are unchanged. |

For the complete feature list and implementation paths, use [the feature walkthrough](FEATURE_WALKTHROUGH.md).

## Questions you are likely to get

- **Can I install everything shown today?** The Store link installs the last approved version. This demo uses v0.7.12 source; its newer controls will reach Store users after a separate release and Google review.
- **Does it show who else is viewing or editing?** Zendesk supplies its own indicators. The duplicate helper badge was removed.
- **Does ticket content go to an AI service?** The extension exports locally when requested. The separate reviewer uses downloaded models on the Mac and does not publish to Notion automatically.
- **Is draft recovery a continuous backup?** It protects drafts around helper operations. It is not a backup of everything typed into Zendesk. Protect drafts before refreshing or reloading an extension.
- **What should I report?** The action, what you expected, what happened, and a ticket link or screenshot in the Internal Tools card. Customer information belongs in approved internal systems, not public GitHub issues.

## Closing

> The install link and guide are in Internal Tools. If something looks wrong or gets in your way, click Submit a ticket and describe what you expected and what happened. Screenshots help. I’m especially interested in messy emails, image-heavy tickets, and anything awkward in your normal workflow.

## Links to have open

- [Chrome Web Store listing](https://chromewebstore.google.com/detail/jones-it-zendesk-helper/bbhdbfdfidlfihbbohohdndpppibgogf)
- [Internal Tools: extension guide](https://app.notion.com/p/41618a28418d81e5a7e6c239ce3d3899)
- [Internal Tools: report a problem](https://app.notion.com/p/41618a28418d8148b816ec7c3bd7d641)
- [Complete feature list and explanations](https://github.com/forest-jit/zendesk-helper/blob/main/docs/FEATURE_WALKTHROUGH.md)

## If something fails during the demo

Keep the current draft and move to your existing screenshots. An uncertain save should not be retried until the result is checked. Skip optional email/AI examples and finish with the install and feedback links. Debugging, release work and the remaining queue can wait until after the presentation.
