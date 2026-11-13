# Find the feature you want to change

Keep `manifest.json` at the project root. Chrome loads this source directly; there is no bundler or generated JavaScript to read first.

| Want to understand… | Start here |
| --- | --- |
| Sending, field saves and draft recovery | `tickets/workflow.js` for rules, then `content/index.js` for orchestration; `page/draft-bridge.js` talks to the native editor |
| Conversation reading | `conversations/` for quote/contrast controls; `content/index.js` for history/images/shared scroll; `content/layout.css` for layout |
| Titles, copy, reply switching and queue refresh | `tickets/model.js` for pure decisions; `tickets/tools.js` for native DOM adapters |
| Theme selection and page colors | `popup/` for quick controls; `settings/` for preferences/editor; `shared/theme-controls.js` for the shared picker; `shared/theme-files.js` for import/export; `shared/themes.js` for palettes; `themes/` for native Zendesk styling |
| Downloads and Harvest | `export/exporter.js` collects files; `background/service-worker.js` downloads; `integrations/harvest/` contains the optional timer adapter |

The included help and privacy pages live in `guide/`. Only `page/draft-bridge.js` runs in Zendesk's page world. The rest of the content scripts run in the extension's isolated world, in manifest order.

Pure rules return values without clicking or changing the DOM. Adapters read or change native controls. The coordinator connects them and rechecks ticket/editor state before a save. Keep those responsibilities distinct.

The full reading path and worked examples are in [the code tour](../docs/CODE_TOUR.md). Each runtime file also starts with a short explanation.
