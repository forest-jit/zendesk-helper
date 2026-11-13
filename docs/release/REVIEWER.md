# Reviewer test instructions

Paste the approved access details into Google's restricted test-instructions field, not the public listing or repository. This document contains no credentials.

## Access the working environment

This extension is limited to `https://itjones.zendesk.com/agent/` and requires an authenticated, authorized Zendesk agent account. The publisher must arrange company-approved reviewer access, including any SSO/MFA steps and a synthetic test ticket. Do not give Google an employee's normal account or access to real customer tickets without organizational approval. A video or local demo alone may not satisfy the reviewer.

**Before submission, replace these access instructions:**

- Approved reviewer username / secure credential delivery: NEEDS OWNER.
- SSO/MFA and access expiry arrangement: NEEDS OWNER.
- Designated synthetic ticket URL and permitted test actions: NEEDS OWNER.

Fill in all three before submitting.

## Test the extension

1. Sign in with the approved reviewer account, open the designated synthetic ticket and open the toolbar popup. Toggle On/Off; choose a theme. Settings persist locally. Themes do not alter ticket content.
2. Observe the separate conversation/sidebar scrolling, newest-five disclosure, compact images and native-like Status control. A genuinely closed ticket shows disabled Closed and no helper Send/Save. Do not create a follow-up.
3. On the authorized synthetic ticket, switch reply modes with distinct sample drafts. Carry is optional; a different destination is protected. Field-only Save must retain a reply draft without sending it. Command/Ctrl+Enter is contextual; test sending only if that action is explicitly authorized for this synthetic ticket.
4. On a synthetic formatted email, use quoted-history disclosure and Simplify/Restore. Unknown quote structures stay visible. Click Copy ticket once and paste a linked ticket number into a rich-text editor or a Markdown link into plain text. Copy does not update a ticket.
5. Open Settings → Ticket tools & help, select the synthetic ticket and use Export ticket for local AI. Chrome downloads raw JSON; no hosted AI or publisher server is called. Optional Harvest styling can be tested if the test account has the native Harvest app: open Settings → Harvest and grant only the requested timer-origin access, inspect style changes, then turn it off. Do not start a timer.

Zendesk’s own activity indicators are unchanged; the helper adds no duplicate presence UI. Queue refresh uses Zendesk's native view action and pauses during interaction; it does not reload ticket pages.

## Separate local-AI utility

The store ZIP does not include or execute the Python utility. The source/developer release provides `scripts/process_ticket.py`. It is a separately invoked local command, requires user-installed Ollama models, and produces review drafts only. The extension's main workspace features do not depend on it.
