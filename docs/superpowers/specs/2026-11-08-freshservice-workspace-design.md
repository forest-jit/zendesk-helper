# Freshservice-Inspired Zendesk Workspace Design

## Intent

Turn the existing Jones IT Zendesk extension into a calmer, denser agent workspace inspired by Freshservice without replacing Zendesk as the source of truth. Agents should read a long ticket, reply or leave a note, and update ticket properties without fighting nested scroll areas or ambiguous submission controls.

## Goals

- Make the browser page the primary scroll container; the conversation and right-side ticket fields scroll away together.
- Give the conversation the majority of the available width and keep the properties sidebar legible.
- Put Public reply and Internal note in an always-visible segmented control using Zendesk's native mode control underneath.
- Put Send at the bottom of the composer. Send preserves the ticket's current status.
- Put status and a separate Save button in the Properties sidebar. Save applies field/status changes without sending composer content.
- Preserve scoped Command-Enter as the deliberate sidebar Save shortcut.
- Show existing requester and SLA data in clearer sidebar sections when Zendesk exposes them. Never invent missing SLA values.
- Add a colored priority indicator derived from the native priority value.
- Collapse older conversation entries behind a `+N conversations` disclosure while leaving recent entries visible.
- Condense inline message images into accessible thumbnails with hover/focus/click previews.
- Make themes comprehensive across the ticket workspace rather than recoloring one panel.
- Preserve keyboard access, native focus behavior, and Zendesk's own save/send mechanisms.

## Non-goals

- Reimplement Zendesk ticket state, authentication, APIs, or rich-text editing.
- Fabricate SLA, requester, priority, status, or conversation data that Zendesk does not render.
- Create a separate ticket-management site.
- Match Freshservice pixel-for-pixel or copy its branding.
- Send or save a real ticket during automated or live visual verification.

## Anti-goals

- A fragile replacement UI whose state can diverge from hidden Zendesk controls.
- A card-heavy dashboard that adds visual bulk without improving scanability.
- More nested scroll containers.
- Theme variants that only swap accent colors.
- Hover-only image access; previews must also work with focus and click.

## Constraints

- The extension is Manifest V3 and runs only on the approved Jones IT Zendesk agent origin.
- Zendesk is a changing React application, so adapters must use stable test IDs and accessible labels with safe fallbacks.
- Native controls remain in the document and perform the actual mode, send, status, and save actions.
- Any selector mismatch must fail closed: show an unavailable state and do not click a guessed control.
- Sending and saving are distinct actions. Send uses the currently displayed native status and must not silently change it. Save must not submit non-empty composer content.
- Live verification may inspect, restyle, switch an empty composer to Internal note, expand/collapse content, and preview images, but it must not send or save.

## Chosen approach

### Adaptive Freshservice-style workspace

Reorganize and restyle Zendesk's existing DOM while adding a small extension-owned control layer that delegates actions to verified native controls.

This approach was chosen over:

- **Aggressive reconstruction:** visually closer, but too likely to drift from Zendesk state and break after upstream changes.
- **CSS-focused refinement:** safer, but unable to provide separate Send/Save behavior, reliable mode controls, conversation collapsing, or accessible image previews.

## Workspace structure

```text
┌──────────────────────────────────────────────────────────────────────┐
│ Ticket heading and metadata                                          │
├─────────────────────────────────────────────┬────────────────────────┤
│ Conversation                                │ Requester              │
│ +N older conversations                      │ SLA (when available)   │
│                                             │                        │
│ Recent messages                             │ Properties             │
│ Compact image attachments                   │ Priority  • Normal     │
│                                             │ Status    [Open      ▾]│
│ [Public reply] [Internal note]               │ Native ticket fields   │
│ ┌─────────────────────────────────────────┐ │                        │
│ │ Native Zendesk composer                 │ │ [Save changes]         │
│ └─────────────────────────────────────────┘ │                        │
│                               [Send]        │                        │
└─────────────────────────────────────────────┴────────────────────────┘
              one browser/page scroll; no internal ticket scrollboxes
```

At desktop widths, use a roughly 70/30 split with a readable minimum sidebar width. At narrower widths, return to Zendesk's safe native layout rather than force the two-column redesign.

## Interaction design

### Reply mode

- Render Public reply and Internal note as a two-option segmented control directly above the native composer.
- The active option reflects the native Zendesk mode.
- Selecting an option opens and chooses the corresponding verified native Zendesk menu item.
- Empty new drafts continue to default to Internal note.
- Public reply retains a deliberate review safeguard, expressed near Send rather than in a disconnected toolbar.

### Send

- Place Send at the lower-right edge of the composer.
- Send delegates to Zendesk's native submit button while preserving the native current ticket status.
- If the reply is public, require the public-review confirmation immediately beside the Send action.
- Disable Send when the native composer/action controls cannot be verified.
- Prevent duplicate sends with the existing action lock.

### Properties and Save

- Place an extension status select in the Properties sidebar and initialize it from Zendesk's current status.
- Status and other native field edits remain unsaved until Save changes.
- Save changes verifies the target status, chooses it through the native status menu, and invokes the native submit action only when the composer is empty.
- If the composer contains text, Save is disabled with a message directing the agent to Send or clear the draft. This prevents property saves from accidentally sending a reply or note.
- Scoped Command-Enter invokes Save only while focus is in the Properties sidebar and the same safety checks pass.

### Conversations

- Detect rendered conversation entries in the active workspace.
- When more than the configured recent count is visible, hide older entries and add a disclosure such as `+3 conversations`.
- Expanding restores all entries without loading or modifying data.
- New entries or SPA navigation recalculate the count.

### Images

- Only images inside conversation messages are condensed; avatars, icons, composer tools, and branding are excluded.
- Render a small thumbnail/attachment treatment that preserves the original image and alt text.
- Hover or keyboard focus shows a bounded preview near the thumbnail; click opens a dismissible lightbox.
- Escape closes the lightbox. Reduced-motion preferences disable animated transitions.

## Visual direction

This is an operational interface: restrained, spacious, and information-dense rather than decorative.

- **Typography:** use a modern system stack beginning with Inter when locally available, then `-apple-system`, BlinkMacSystemFont, and `Segoe UI`. Do not download fonts.
- **Geometry:** use 8–10px radii for fields and controls, 12px for major grouped sections, and avoid applying the same radius to every Zendesk element.
- **Spacing:** consistent 4/8/12/16/24px rhythm, with compact field labels and comfortable conversation reading width.
- **Hierarchy:** neutral surfaces and borders; reserve strong accent color for active mode, primary actions, focus, and meaningful status.
- **Priority:** show a small semantic dot: cool gray for low, blue for normal, amber for high, and red for urgent.
- **Motion:** only stateful transitions for disclosures and previews, respecting `prefers-reduced-motion`.

## Themes

Themes apply tokens to the complete active ticket workspace, including page background, headers, ticket chrome, conversation entries, fields, composer, buttons, focus rings, borders, muted text, preview surfaces, and sidebar groups.

### System

Clean neutral surfaces that follow OS light/dark preference where safe. This remains the default.

### Calm

Cool slate and mist surfaces with desaturated blue-green accents. Designed for long support sessions with reduced contrast between large background regions while maintaining text and control contrast.

### Contrast

Bright surfaces, dark text and borders, stronger focus rings, and clearer state differentiation. Intended for accessibility and difficult display conditions.

Theme selection remains in the extension popup and is also exposed in a compact workspace appearance menu so the result is discoverable where it applies. Selection persists through the existing extension configuration.

## State and adapters

- Extend the pure workflow model to distinguish `send` from `saveProperties`.
- Add adapter functions for native mode, current status, native submit, composer emptiness, priority, requester, SLA, and conversation entries.
- Store only extension preferences such as theme and collapse count; do not persist ticket content.
- Re-run synchronization after SPA navigation and relevant DOM additions while avoiding attribute-observer loops.

## Failure handling

- Missing native mode control: disable mode and Send controls.
- Missing native status controls: disable sidebar Save.
- Non-empty composer during property Save: block Save and explain why.
- Public reply without review: block Send and focus the confirmation.
- Missing SLA: omit the SLA block instead of showing a placeholder value.
- Image load failure: retain the original link/alt text and remove the preview affordance.
- Unknown Zendesk layout: leave the native layout unchanged.

## Testing

- Unit tests for send/save separation, status preservation, public-review gating, empty-composer Save requirement, and action locks.
- Browser tests for segmented mode controls, Send placement, sidebar Save, scoped Command-Enter, conversation disclosure, image preview keyboard behavior, themes, responsive fallback, and full-page scrolling.
- Assert no external requests and no implicit submit during mounting or theme changes.
- Live Zendesk smoke test for layout, mode reflection, themes, scrolling, disclosure, and preview behavior only. Do not click Send or Save.

## Delivery

- Update the current extension in place; no separate site.
- Bump the extension version and update feature documentation.
- Reload the unpacked Chrome extension and refresh the live test ticket after implementation.
