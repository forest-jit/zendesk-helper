# Zendesk live overlay migration

## Intent

Turn Zendesk Helper into an automatic, reversible overlay on the real Jones IT Zendesk agent workspace. The extension should improve the existing Zendesk ticket list and single-ticket screens without creating a separate application or visually replacing native controls.

## Why

The current popup activation step and synthetic visual fixtures slow down evaluation and hide real integration problems. The extension should load where the work happens, and testing should exercise actual Zendesk navigation, fields, composer states, menus, and save workflows on dedicated test tickets.

## Goals

- Apply the extension automatically on `https://itjones.zendesk.com/agent/*`.
- Keep the overlay reversible from the extension popup.
- Preserve Zendesk content, behavior, native controls, keyboard order, save actions, and public/private state.
- Remove broad input, select, button, and focus-ring overrides. Zendesk remains responsible for native control appearance and focus highlighting.
- Keep CSS focused on layout, spacing, pane hierarchy, readable table density, and reversible context visibility.
- Create five real, clearly labeled test tickets using requester Forest Welch and organization Jones IT.
- Use those tickets for real list, navigation, title, composer, status, save, and responsive testing.
- Add conservative title review and a user-triggered suggestion path; never silently rewrite a subject.
- Maintain a feature checklist with test evidence and live ticket IDs.

## Non-goals

- No separate ticket-management website.
- No customer or coworker requester accounts for test tickets.
- No automatic public replies, private notes, status changes, or saves.
- No background ticket scraping or storage of ticket bodies.
- No broad host permissions beyond the approved Jones IT Zendesk agent origin.
- No attempt to clone Zendesk controls or replace its editor, menus, or status machinery.

## Anti-goals

- A visual redesign that makes Zendesk unrecognizable.
- Extra outlines, borders, fills, or focus rings layered over native input states.
- CSS selectors based on generated class names or transient React/Ember IDs.
- Tests that pass only against simplified fixture markup while failing in Zendesk.
- Creating test tickets that notify real clients or contain customer information.

## Chosen approach

Use Manifest V3 `content_scripts` and narrowly scoped `host_permissions` for the approved Zendesk agent origin. Load `content.css`, `validator.js`, and `content.js` automatically at `document_idle`. Add only the `storage` permission needed to persist overlay preferences such as enabled/disabled and context visibility. Keep the popup as a settings and recovery surface, not as the activation mechanism.

The content script will detect the currently visible Zendesk workspace and views table using stable `data-test-id` attributes already verified in the live application. It will apply attributes only to the active surface and will cleanly remove them when disabled or when navigation changes.

## Considered approaches

### Automatic content scripts (chosen)

Best fit for a seamless overlay. It removes manual activation while preserving the existing Chrome extension architecture. The tradeoff is a narrow persistent host permission for the approved Zendesk origin.

### Remembered popup activation

Would preserve `activeTab`, but still depends on a popup action and reinjection timing. It does not meet the request that changes appear by default.

### Zendesk app integration

Could become appropriate for supported API actions later, but it adds packaging, deployment, and platform complexity before CSS-first overlay behavior is proven.

## Styling rules

- Layout CSS may set the ticket workspace grid, pane surfaces, separators, widths, and overflow behavior.
- Ticket-list CSS may set table spacing, readable density, sticky headers, and page surfaces.
- Native inputs, selects, buttons, textareas, comboboxes, focus rings, hover states, active states, disabled states, and validation states remain Zendesk-owned unless a specific verified defect requires a narrowly scoped correction.
- No gradients, glass effects, large shadows, decorative animation, or nested-card treatment.
- Responsive checks cover 1000px, 1280px, wide desktop, and browser zoom through 200%.
- Turning the overlay off must restore the original Zendesk presentation without a page reload where possible.

## Five live test tickets

All use requester Forest Welch and organization Jones IT. Draft subjects contain only the clearly fictional issue description because Zendesk prepends the organization and requester after submission:

1. `TEST Wi-Fi connection issue`
2. `TEST new user email access`
3. `TEST printer queue issue`
4. `TEST shared drive permission review`
5. `TEST microphone input issue`

Each body states that it is a fictional extension test ticket and must not be treated as a customer request. Creation and any later save/send mutation requires action-time confirmation in the browser.

## Testing strategy

- Pure unit tests remain for title parsing and suggestion logic.
- Static checks remain for manifest permissions, syntax, and CSS gates.
- Synthetic visual fixtures stop being the acceptance authority and are removed from the main test command.
- Live read-only checks validate selectors, automatic injection, active workspace detection, ticket-list styling, responsive behavior, focus behavior, and reversible disablement.
- The five real test tickets cover navigation, title warnings/suggestions, composer visibility modes, attachments/menu layout, status selection, save behavior, and restoration.
- No live mutation occurs outside the five test tickets.
- Each implemented feature records the ticket ID, tested workflow, viewport, result, and any remaining limitation in `FEATURES.md`.

## Initial implementation order

1. Automatic content-script injection and stored enable/context preferences.
2. CSS cleanup that removes native-control and extra focus/highlight overrides.
3. Live read-only verification on the current ticket and Views table.
4. Prepare and confirm creation of the five real test tickets.
5. Create the five tickets and record their IDs.
6. Exercise real navigation/title/composer/status workflows on the test set.
7. Implement the next approved feature through failing tests, minimal code, live verification, and a dedicated commit.

## Safety and rollback

- The popup retains a clear **Turn off** action.
- The default is enabled after installation; an explicit **Turn off** choice persists until the user enables it again.
- The content script singleton supports cleanup before reinjection.
- The extension never changes a ticket merely because it detected a problem.
- Live testing stays within the five designated tickets.
- A failed selector or ambiguous state leaves the native Zendesk surface unchanged and reports the limitation.
