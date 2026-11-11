# Work on the extension

Use Node 24+ or Node 22.13+, Python 3 and Chrome 114+. Node is only needed for development checks; the extension itself runs in Chrome. Chrome 114 is the minimum because the custom Status picker uses the native Popover API.

## Run the checks

1. Run `npm ci --ignore-scripts` to install the pinned development tools.
2. Run `npm run check` for syntax, ESLint, runtime-resource validation and behavior regressions.
3. Run `npm run format` after editing, or `npm run format:check` to check without rewriting.
4. Reload this same project folder in `chrome://extensions`, then refresh an authorized test ticket after protecting its drafts.
5. Verify the changed behavior in Chrome and update the guide/current state. A passing fixture is not live Zendesk acceptance.

GitHub's Check extension source workflow runs formatting and the local checks on pushes/PRs. It has read-only repository access and does not deploy anything. The Pages workflow remains a separate manual action.

## What the checks mean

| Check | What it catches |
| --- | --- |
| Syntax | Invalid JavaScript in runtime, tests and Node tooling |
| ESLint recommended | Undefined names, unused state, duplicate declarations and other likely errors; intentional empty catch blocks are allowed |
| Resources | Missing manifest entries, HTML links/scripts/styles, worker imports, runtime URLs and dynamic Harvest files; inline executable HTML handlers/scripts |
| Behavior regressions | Draft recovery/save races, closed status, title rules, copy escaping, theme lifecycle and native integration guards |
| Store preflight | ZIP contents, icon/screenshot dimensions, manifest references and checksum; not Google approval or a security certification |

## Source boundaries

Keep runtime files in `src/`, icons in `assets/`, development commands in `scripts/`, tests in `tests/`, and prose/release assets in `docs/`. The store package includes only runtime `.js/.css/.html`, manifest and icons. It excludes source notes, tests, tooling and CHROMEWEBSTORE.md. No raw ticket data belongs in these folders.

`manifest.json` sets content-script order. `chrome.runtime.getURL` and dynamic registration use extension-root paths. HTML assets and service-worker `importScripts` use paths relative to their own files. Do not fix one by guessing the other's base; `tests/resources.cjs` checks all three cases.

`content/index.js` is still the coordinator for the save lifecycle and reading layout. Its Send/Status/Save stylesheet is now readable separately in `content/control-styles.js`. Further extraction of the save state machine should be its own behavior-tested change, not a side effect of moving files.

## Chrome guidance, applied to this project

Google's Chrome Extensions skill was installed from GoogleChrome/modern-web-guidance. Installed from https://github.com/GoogleChrome/modern-web-guidance, skills/chrome-extensions; upstream main at review: `4dd968349e54ca45a05dd5c818fb035c9054b022`. Apply relevant guidance against current API documentation, rather than treating every generic example as a requirement to add APIs or permissions.

- Manifest V3, packaged scripts, synchronous worker event registration, explicit async response lifetimes, existing real icons, scoped hosts and optional Harvest consent are retained.
- Host permission already allows reading the matching Zendesk tab URL. General `tabs` access is unnecessary; Chrome's API reference explicitly documents this alternative.
- Settings and held drafts use durable Chrome storage. The Harvest promise queue and per-download completion listeners are transient coordination, not durable product state. A worker restart must not be interpreted as a confirmed save/download. Local tests cover interrupted native saves; this pass does not claim an independent worker-termination experiment.
- The content coordinator batches reconciliation with requestAnimationFrame. Large received-message scans are cached; long-ticket responsiveness still needs real-ticket observation rather than a universal performance claim.
- Existing callback-style Chrome download handling remains because its tested completion/timeout contract matters. New orchestration should prefer async/await; a style migration must preserve response/lifetime behavior.
- The user requested quiet success feedback. Do not add toasts from generic context-menu examples. Keep errors, recovery instructions, draft conflicts and Undo visible.

A `.then()` or local variable is not by itself a broken extension. Check its actual role and lifetime. No DevTools MCP installation or broader browser permission was added for this review.

## Pinned development dependency

ESLint 10 is used with its recommended rules. `minimatch` is overridden to 11.0.8 because the ESLint dependency range resolved to a version with an npm advisory during this pass. This is development tooling and never ships in the extension. Remove the override after upstream dependencies resolve to a reviewed fixed version. The resulting `npm audit` reports zero vulnerabilities at the time of this review.

## Official references

- [Chrome agent setup](https://developer.chrome.com/docs/extensions/ai/build-with-ai).
- [Tabs permissions, including host-scoped access](https://developer.chrome.com/docs/extensions/reference/api/tabs#permissions).
- [Service-worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle).
- [Content-script isolated world](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts).

This is a focused architecture/tooling review, not a certification of every Chrome/Web Store policy or an accessibility/security audit. Real coworker presence, screen-reader testing, hosting and store submission remain in TASKS.md.
