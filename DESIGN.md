# Jones IT Zendesk Helper design baseline

Operate mode: scan the ticket, read messages, reply, adjust properties. Zendesk's native structure and font remain the visual authority.

- Color: five base roles per theme; derive readable borders, states and muted text. Teal/Pink variants use pale opposing washes, with #137a7f and #e12885 for actions/selection. No saturated page floods or near-black backgrounds in these two variants. Accepted Jones IT stays dark, with exact #2c7da0 primary actions.
- Rhythm: 4px base; 8px tight groups; 12px sibling gaps; 16px content insets; 24px larger separation only when space permits. At narrow desktop widths retain 8px field-row gaps and 32px controls.
- Grouping: Harvest remains fully open above native properties. Preserve field order and paired fields. Conversation/header/body/reply receive consistent insets; no nested decorative cards or new pinning. User-requested conversation flow places the native composer after message history in the same left scroll area; the right rail scrolls independently.
- Craft: one continuous reply border, restrained 1px rules, native icons and readable focus states. Preserve authored message content and images.
- Acceptance: actual Chrome at default and 1100×850; Status and Send reachable, expand/collapse works, original drafts retained, timer idle. TASKS.md is the only queue. Impeccable scans support visual/interaction evidence.

- Overlay chrome: notices and floating formatting controls use the shared surface/text/border tokens. Preserve real color-picker swatches; table range retains native geometry and selection behavior.
- Zoom: narrow native history rows wrap their disclosure within available space; avoid overlap with action icons. Keep the shared conversation scroll, restore native scrolling when Off, and hide duplicate helper footer actions consistently.

- Column insets: each bar gets 12px outer spacing on all exposed edges. The right rail shares its outer inset across Harvest and properties; 8px inner field/header/app padding aligns controls at 20px from both sides. Avoid asymmetric compensating left/right paddings.

- Received email: preserve readable authored content and branded panels; repair measured low-contrast text on solid backgrounds. Quote controls stay within the message and do not replace the whole-history disclosure. Ambiguous forwards start open.
- Desktop rail: fixed 400/440px widths own the layout; hide native column handles that point outside it. Layout Off restores native resizing. Harvest stays open while long notes/reference text use bounded internal scroll areas.

- Feedback: make ordinary success quiet. Use the resulting state or Chrome download as feedback. Keep errors, conflicts, recovery instructions, progress and actionable title Undo. Copy choices open on pointer hover, close on leave and retain keyboard/touch access. Closed tickets have no helper Send/Save affordance.

- The desktop conversation/sidebar join has no vertical divider. Keep the composer frame and independent scrolling intact; layout Off restores native borders.
