# Zendesk agent workflow controls

## Intent

Add five local, reversible capabilities to the existing Zendesk Helper overlay: private/public reply safeguards, explicit draft status plus deliberate save, scoped Command-Enter save, local JSON/Markdown export, and personal themes.

## Constraints

- Keep the extension limited to `https://itjones.zendesk.com/agent/*` with no new host permissions.
- Use Zendesk's native composer mode, status menu, validation, attachments, and submit button as the authority. Do not fabricate server state.
- Never send automatically. A deliberate helper save may click the native submit control exactly once only after all guard conditions pass.
- Do not store ticket bodies. Store preferences only.
- Exports are explicit downloads created locally from the visible active ticket; unloaded history is labeled incomplete.
- Themes style extension-owned controls and existing overlay tokens, not generic Zendesk inputs, buttons, focus rings, or validation.

## Interaction design

The helper adds one compact workflow bar above the native ticket actions. It reports the current reply mode, holds a draft status, exposes a deliberate **Save changes** action, offers JSON/Markdown export, and shows errors/status without obscuring native controls.

### Reply safety

- An empty composer defaults to Internal note by choosing Zendesk's native Internal note menu item once per active ticket workspace.
- Existing nonempty drafts are never switched automatically.
- Internal notes can use the deliberate save directly.
- Public replies require an explicit **Public reply reviewed** checkbox in the helper bar. Changing mode or editing after confirmation clears that confirmation.
- If mode cannot be determined, helper save is disabled and explains why. Native Zendesk controls remain available and untouched.

### Status and save

- The helper status selector contains Open, Pending, On-hold, and Solved.
- Selecting a status changes only helper draft state.
- **Save changes** maps the selected draft status to Zendesk's native submit-status menu, verifies the native submit button label, then clicks that button once.
- The save lock prevents duplicate clicks until Zendesk changes ticket state or the action fails.
- Native required-field and server errors remain visible. The helper does not hide or replace them.

### Keyboard

- Command-Enter invokes the same helper save path only when focus is inside the visible active ticket workspace.
- It ignores repeated key events, IME composition, disabled/ambiguous state, and editable controls that declare their own conflicting shortcut.
- Ctrl-Enter is not added.

### Export

- Explicit JSON and Markdown buttons export visible ticket evidence: schema version, ticket ID/URL, export time, title, requester, organization, status, reply mode, visible comments with author/time/visibility where present, and a warning that unloaded content may be absent.
- Filenames are sanitized and begin with the ticket ID when available.
- Exports use Blob/object URLs and a temporary download link; no network request or persistent ticket storage is introduced.

### Themes

- Preferences: `system`, `calm`, and `contrast`.
- System follows Zendesk/system neutrals; Calm uses the existing restrained blue-grey palette; Contrast increases rule and text contrast without changing native controls.
- The popup owns theme selection. The content script applies `data-zdh-theme` to the active overlay surface and ticket-list root.

## Approaches considered

### Native-control adapter (chosen)

Use stable labels/test IDs to read and operate Zendesk's existing mode/status/submit controls. This preserves native validation and attachment behavior while keeping the helper small. The cost is selector maintenance when Zendesk changes markup.

### Replacement composer/footer

Rejected because it would duplicate Zendesk behavior, increase send risk, and violate the CSS-first/native-control direction.

### Zendesk API/app integration

Deferred. It could provide stronger server guarantees but requires credentials, deployment, and broader product scope. Export and workflow safeguards can ship locally first.

## Verification

- Automated fixture tests cover mode detection, safe defaulting, confirmation clearing, status drafting, single-click save, Command-Enter scoping, export schemas/files, theme persistence, cleanup, and no external requests.
- Real Chrome read-only checks validate current Zendesk selectors, modes, status menu labels, active workspace detection, theme appearance, and export extraction.
- No real submit, reply, note, or status mutation is performed without the separate action-time confirmation required by browser policy.

