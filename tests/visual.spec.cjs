// Load the actual Store ZIP in a fresh browser profile. All Zendesk requests are intercepted.
// The small menu reproduces observed Appearance markup; it is not a full Zendesk simulator.
const { test, expect } = require('playwright/test');
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
let context, worker, extensionId, profile, extension;
// These stable hooks and the fixed foreground were observed in Zendesk's live Appearance menu.
const choices = [
  { label: 'Light mode', id: 'light-mode' },
  { label: 'Dark mode', id: 'dark-mode' },
  { label: 'Match system appearance', id: 'system-appearance' }
];
const rows = choices
  .map(
    ({ label, id }, index) => `
  <li role="menuitemradio" aria-checked="${index === 0}" tabindex="0"
      data-test-id="toolbar-profile-menu-${id}-item" data-garden-id="dropdowns.menu.item">
    <svg data-garden-id="dropdowns.menu.item.icon" viewBox="0 0 20 20">
      <path fill="currentColor" d="M10 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Z"/>
    </svg><span data-garden-id="dropdowns.menu.item.content">${label}</span>
  </li>`
  )
  .join('');
const appearance = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { font:16px Arial; margin:32px }
  [role=menu] { width:340px; padding:12px; border:1px solid #ddd; border-radius:8px }
  li { list-style:none; padding:14px; color:rgb(41,50,57); border-radius:5px; cursor:pointer }
  [data-garden-id='dropdowns.menu.item.content'] { color:rgb(41,50,57) }
  li[aria-checked=true] { background:#eee }
  svg { width:20px; height:20px; margin-right:12px; vertical-align:middle }
</style></head><body>
  <h1>Appearance</h1>
  <ul role="menu" aria-label="Appearance">${rows}</ul>
  <p id="authored" style="color:rgb(41,50,57)">Authored message colors stay outside menu rules.</p>
</body></html>`;

async function preferences(values) {
  await worker.evaluate((values) => chrome.storage.local.set(values), values);
}

async function launchPackagedBrowser() {
  context = await chromium.launchPersistentContext(path.join(profile, 'profile'), {
    channel: 'chromium',
    executablePath: process.env.ZDH_TEST_BROWSER || undefined,
    headless: true,
    viewport: { width: 900, height: 720 },
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  worker = context.serviceWorkers()[0] || (await context.waitForEvent('serviceworker'));
  extensionId = new URL(worker.url()).host;
  // Never reach the real Zendesk service, Harvest, or any other network destination.
  await context.route('**/*', (route) => {
    if (route.request().url().startsWith(`chrome-extension://${extensionId}/`))
      return route.continue();
    if (route.request().url() === 'https://itjones.zendesk.com/agent/zdh-visual-test')
      return route.fulfill({ contentType: 'text/html', body: appearance });
    return route.abort();
  });
}

test.beforeAll(async () => {
  const zip = path.join(root, 'test-results/visual-extension.zip');
  if (!process.env.ZDH_TEST_PACKAGE)
    execFileSync('python3', ['scripts/package_extension.py', '--store', '--output', zip], {
      cwd: root
    });
  // A new temporary directory prevents stale files from surviving package changes.
  profile = await fs.mkdtemp(path.join(os.tmpdir(), 'zdh-visual-'));
  extension = path.join(profile, 'extension');
  execFileSync('python3', ['-m', 'zipfile', '-e', process.env.ZDH_TEST_PACKAGE || zip, extension]);
  await launchPackagedBrowser();
});

test.afterAll(async () => {
  await context?.close();
  if (profile) await fs.rm(profile, { recursive: true, force: true });
});

for (const theme of ['daylight', 'purple', 'blush']) {
  test(`${theme}: packaged Appearance menu and popup`, async () => {
    await preferences({ enabled: true, theme, harvestTheme: false });
    const page = await context.newPage();
    await page.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
    await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', theme);
    const options = page.getByRole('menuitemradio');
    await expect(options).toHaveCount(3);
    // Native options had a fixed dark foreground even when the surrounding menu was themed.
    for (const option of await options.all()) {
      const colors = await option.evaluate((e) => {
        const resolve = (name) => {
          const probe = document.createElement('span');
          probe.style.color = `var(${name})`;
          document.body.append(probe);
          const color = getComputedStyle(probe).color;
          probe.remove();
          return color;
        };
        const selected = e.getAttribute('aria-checked') === 'true';
        return {
          own: getComputedStyle(e).color,
          label: getComputedStyle(e.querySelector('span')).color,
          expected: resolve(selected ? '--zdh-theme-selected-text' : '--zdh-theme-text')
        };
      });
      expect(colors.own).toBe(colors.expected);
      expect(colors.label).toBe(colors.expected);
    }
    await expect(page.getByRole('menu')).toHaveScreenshot(`appearance-${theme}.png`);
    await options.nth(1).focus();
    await expect(page.getByRole('menu')).toHaveScreenshot(`appearance-${theme}-focus.png`);
    await expect(page.locator('#authored')).toHaveCSS('color', 'rgb(41, 50, 57)');
    const popup = await context.newPage();
    await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
    await expect(popup.locator('html')).toHaveAttribute('data-zdh-theme', theme);
    await expect(popup.locator('#harvest-theme')).toHaveText('Match Harvest to theme');
    await expect(popup.locator('.theme-preview')).toHaveScreenshot(`popup-preview-${theme}.png`);
    await popup.locator('#theme-trigger').click();
    const preview = theme === 'purple' ? 'blush' : 'purple';
    await popup.locator(`[role=option][data-id=${preview}]`).hover();
    await expect(popup.locator('html')).toHaveAttribute('data-zdh-theme', preview);
    await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', theme);
    await popup.keyboard.press('Escape');
    await expect(popup.locator('html')).toHaveAttribute('data-zdh-theme', theme);
    // A global Off restores the native menu, including its selected fill and authored foreground.
    await preferences({ enabled: false });
    await expect(page.locator('html')).not.toHaveAttribute('data-zdh-theme');
    await expect(options.nth(0)).toHaveCSS('color', 'rgb(41, 50, 57)');
    await popup.close();
    await page.close();
  });
}

// Restart only this disposable browser. Stored preferences should survive a new background worker.
test('browser restart reloads the packaged extension and retains preferences', async () => {
  await preferences({ enabled: true, theme: 'purple' });
  await context.close();
  await launchPackagedBrowser();
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
  await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  await expect(page.getByRole('menuitemradio').nth(1)).toHaveCSS('color', 'rgb(245, 237, 255)');
  await page.close();
});
