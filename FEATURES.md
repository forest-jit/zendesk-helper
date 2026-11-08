# Zendesk Helper feature checklist

This is the working product and test inventory. Live mutation tests require a named test ticket and an explicit list of allowed actions. Until then, all automated tests use fictional local fixtures.

## Working now

- [x] On-demand activation on Jones IT Zendesk agent pages
- [x] Conversation-left, properties-right single-ticket layout
- [x] Optional customer context/apps column
- [x] Spacious, token-based styling for the ticket fields and ticket-list table
- [x] Responsive fallback below 1000px and tested zoom behavior
- [x] Structural title warning on blur
- [x] Conservative duplicate-identity-prefix warning with a suggested title
- [x] Manual title-field fallback that persists through DOM updates
- [x] Active-workspace filtering so cached tickets are not styled
- [x] Reversible **Turn off** behavior
- [x] Synthetic browser tests with fictional single-ticket and six-ticket list views

## Next test passes

- [ ] Verify the extension CSS on the live ticket list at 1000px, 1280px, and wide desktop
- [ ] Verify the live single-ticket composer, attachments, menus, resizers, errors, and required fields
- [ ] Verify 125%, 150%, and 200% browser zoom on both live views
- [ ] Verify keyboard traversal and screen-reader names in the live Zendesk DOM
- [ ] Confirm organization/requester extraction on multiple designated test tickets
- [ ] Decide whether a duplicate-prefix suggestion is sufficient or whether an explicit **Apply suggestion** button is desired

## Planned behavior

- [ ] Authoritative title correction using organization and requester fields, never invented values
- [ ] Navigation-safe title warnings when switching among cached workspaces
- [ ] Private-note default and public-reply safeguards after native state is verified
- [ ] Separate draft status selection from deliberate save behavior
- [ ] Scoped ⌘Enter save after duplicate-submit behavior is ruled out
- [ ] Explicit local ticket export to reviewable JSON and Markdown
- [ ] Local documentation-draft generation from exported evidence
- [ ] Connect reviewed drafts to the existing Notion workflow
- [ ] ClickDoc import contract for captions and action evidence
- [ ] Team deployment, updates, and organization-approved distribution
- [ ] Optional personal layout/theme preferences without broadening site permissions

## Deliberately out of scope for now

- Automatic sends, replies, notes, saves, or status changes
- Background scraping or storage of ticket bodies
- Hosted AI or third-party telemetry at runtime
- Public webhooks or broad host permissions
- Automatic Notion writes

## Recommended development loop

1. Pick one unchecked item and define its observable acceptance criteria.
2. Add or update a fictional fixture state first.
3. Run `npm run check` and review `test-results/ticket-list.png` plus `test-results/single-ticket.png`.
4. Run `$impeccable critique <target>` for hierarchy/UX, then `$impeccable polish <target>` after resolving priority findings.
5. Run `$impeccable audit <target>` for accessibility, responsiveness, and technical quality.
6. Test read-only on live Zendesk. Use a named test ticket and explicit authorization before any save/send path.
7. Commit one feature or test slice with the checklist updated.

