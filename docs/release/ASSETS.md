# Store images

The store icon and at least one screenshot are required. Small/marquee promotional tiles are optional under Google's current listing/image documentation (checked November 11, 2026).

| File | Dimensions | Use |
| --- | --- | --- |
| `../../assets/icons/icon-128.png` | 128×128 PNG | Store icon; also included in the extension manifest/ZIP |
| `../../assets/icons/icon-{16,32,48}.png` | 16/32/48px PNG | Chrome toolbar/extension UI |
| `screenshot-1-overview-1280x800.jpg` | 1280×800 JPEG | Overview of conversation, reply, ticket and workspace tools |
| `screenshot-2-studio-1280x800.jpg` | 1280×800 JPEG | Five-role custom theme editor |
| `screenshot-3-guide-1280x800.jpg` | 1280×800 JPEG | Included feature guide |
| `small-promo-440x280.png` | 440×280 PNG | Optional small promo tile |

`privacy-mobile-check.jpg` is internal layout evidence, not a listing screenshot.

## Provenance

The icon and tile are original code-drawn artwork, not Zendesk/Harvest logos. Rebuild with `python3 scripts/make_release_assets.py` (Pillow; local macOS fonts for the tile). The 128px icon has16px transparent outer padding.

Popup and Settings screenshots use the actual shipped HTML/CSS/JavaScript on a loopback preview with synthetic in-memory Chrome preferences. Preview images are labeled as sample settings/palettes. They contain no customer ticket content, real profile, browser chrome or fabricated presence result. The guide screenshot uses the actual guide. These are listing images, not proof of live Zendesk compatibility.

Reproduce with `python3 scripts/release_preview.py`, open the printed loopback URL in Chrome at1280×800, capture the overview at `/`, the full editor at `/demo-settings.html`, then the guide at `/guide.html`. Use Playwright’s `channel: chromium` if only the full test browser is installed. Stop the local server afterward. This server uses a narrow asset allowlist and is bound to127.0.0.1. Do not run screenshot demos against live customer data or present a fabricated ticket as a real one.

Source references: [image requirements](https://developer.chrome.com/docs/webstore/images), [listing fields](https://developer.chrome.com/docs/webstore/cws-dashboard-listing).
