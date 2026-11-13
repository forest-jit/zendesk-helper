// Load the actual Store ZIP in a fresh browser profile. All Zendesk requests are intercepted.
// The small menu reproduces observed Appearance markup; it is not a full Zendesk simulator.
const { test, expect } = require('playwright/test');
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '..');
let context, worker, extensionId, profile, extension, ticketHTML;
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
  /* Observed Polaris roots reset semantic variables below html in both native appearances. */
  html[data-theme=light] .polaris-react-component, [data-test-id=ticket-main-conversation][data-theme=light] {
    --background-default: rgba(255,255,255,1); --foreground-default: rgba(41,50,57,1); --color-scheme: light;
  }
  html[data-theme=dark] .polaris-react-component, [data-test-id=ticket-main-conversation][data-theme=dark] {
    --background-default: rgba(21,26,30,1); --foreground-default: rgba(216,220,222,1); --color-scheme: dark;
  }
  .polaris-react-component { color-scheme: var(--color-scheme) only; }
  /* Native controls also set a literal scheme, independently of the semantic color variables. */
  html[data-theme=light] [data-test-id=ticket-system-field-requester-select] { color-scheme:light only; }
  html[data-theme=dark] [data-test-id=ticket-system-field-requester-select] { color-scheme:dark only; }
  html[data-theme=light] :is([data-zdh-field-row],[data-test-id=header-tab]) { border-bottom:1px solid rgb(216,220,222); }
  html[data-theme=dark] :is([data-zdh-field-row],[data-test-id=header-tab]) { border-bottom:1px solid rgb(57,67,75); }
  #native-disabled { background:var(--background-disabled); color:var(--foreground-disabled); }
  #native-control, #native-theme-boundary { background: var(--background-default); color: var(--foreground-default); }

</style></head><body>
  <h1>Appearance</h1>
  <ul role="menu" aria-label="Appearance">${rows}</ul>
  <section id="native-theme-boundary" data-test-id="ticket-main-conversation" data-theme="light">
    <div class="polaris-react-component"><button id="native-control" data-test-id="ticket-system-field-requester-select">Native component</button>
      <button id="native-disabled" disabled>Unavailable action</button>
      <p id="authored-inside" style="background:rgb(255,240,220);color:rgb(20,40,60)">Authored email panel</p>
    </div>
  </section>
  <div id="native-field-row" data-zdh-field-row="true">Ticket fields</div>
  <a id="native-workspace-tab" data-test-id="header-tab">Ticket tab</a>
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
    downloadsPath: path.join(profile, 'downloads'),
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
    if (route.request().url() === 'https://itjones.zendesk.com/agent/tickets/222')
      return route.fulfill({ contentType: 'text/html', body: ticketHTML });
    return route.abort();
  });
}

test.beforeAll(async () => {
  // Reuse fictional ticket content; add the current native composer wrapper for reply controls.
  ticketHTML = (await fs.readFile(path.join(__dirname, 'fixtures/zendesk-ticket.html'), 'utf8'))
    .replace(
      '<section class="composer">',
      '<section class="composer" data-test-id="omnichannel-composer">'
    )
    // Native footer actions have separate containers; hiding them must not hide the Closed notice.
    .replace(
      '<button type="button">Stay on ticket</button>',
      '<span><button type="button">Stay on ticket</button></span><div id="native-submit-controls">'
    )
    .replace('</footer>', '</div></footer>');
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
    await expect(popup.locator('#harvest-theme')).toHaveCount(0);
    await expect(popup.getByRole('button', { name: 'Settings', exact: true })).toBeVisible();
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

// Zendesk owns collision reporting. The helper must neither duplicate nor remove it.
test('native agent activity remains untouched without duplicate helper indicators', async () => {
  await preferences({ enabled: true, theme: 'purple', layout: true, autoTitle: false });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await expect(page.locator('[data-zdh-presence],[data-zdh-activity]')).toHaveCount(0);
  await page.evaluate(() => {
    const signal = document.createElement('span');
    signal.id = 'native-collision-test';
    signal.dataset.testId = 'agent-collision';
    signal.setAttribute('aria-label', 'Morgan is viewing this ticket');
    signal.textContent = 'Morgan';
    document.querySelector('#active-ticket').prepend(signal);
  });
  const signal = page.locator('#native-collision-test');
  await expect(signal).toBeVisible();
  await signal.evaluate((e) => e.setAttribute('aria-label', 'Morgan is editing this ticket'));
  await expect(signal).toHaveAttribute('aria-label', 'Morgan is editing this ticket');
  await expect(page.locator('[data-zdh-presence],[data-zdh-activity]')).toHaveCount(0);
  await preferences({ enabled: false });
  await expect(signal).toBeVisible();
  await expect(signal).toHaveAttribute('aria-label', 'Morgan is editing this ticket');
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await page.close();
});

test('segmented reply control follows native state and restores the original selector on Off', async () => {
  await preferences({
    enabled: true,
    theme: 'purple',
    layout: true,
    autoTitle: false,
    carryDraft: false
  });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await page.evaluate(() => {
    // Production mounts the mode controls inside a header with important native ink.
    const trigger = document.querySelector('[data-test-id=omnichannel-channel-switcher-button]');
    const header = document.createElement('header');
    const inset = document.createElement('div');
    trigger.before(inset);
    inset.append(header);
    header.append(trigger);
    const old = document.querySelector('#reply');
    const editor = document.createElement('div');
    editor.contentEditable = 'true';
    editor.dataset.testId = 'omnicomposer-rich-text-ckeditor';
    editor.textContent = 'Keep this unsent.';
    old.replaceWith(editor);
    for (const choice of document.querySelectorAll(
      '[data-test-id=omnichannel-channel-switcher-menu] button'
    ))
      choice.setAttribute('role', 'menuitemcheckbox');
  });
  const native = page.locator('[data-test-id=omnichannel-channel-switcher-button]');
  const publicChoice = page.getByRole('radio', { name: 'Public reply', exact: true });
  const internalChoice = page.getByRole('radio', { name: 'Internal note', exact: true });
  await expect(publicChoice).toHaveAttribute('aria-checked', 'true');
  const inactiveInk = await internalChoice.evaluate((e) => getComputedStyle(e).color);
  const activeInk = await publicChoice.evaluate((e) => getComputedStyle(e).color);
  expect(inactiveInk).not.toBe(activeInk);
  const spacing = await publicChoice.evaluate((e) => {
    const composer = e.closest('[data-test-id=omnichannel-composer]').getBoundingClientRect();
    const group = e.closest('[role=radiogroup]').getBoundingClientRect();
    return {
      top: group.top - composer.top,
      left: group.left - composer.left,
      height: e.getBoundingClientRect().height
    };
  });
  expect(spacing.top).toBeGreaterThanOrEqual(12);
  expect(spacing.left).toBeGreaterThanOrEqual(16);
  expect(spacing.height).toBeGreaterThanOrEqual(32);
  await expect(native).toBeHidden();
  await expect(page.getByRole('checkbox', { name: 'Carry this draft' })).toHaveCount(0);
  await internalChoice.click();
  await expect(native).toHaveAttribute('aria-label', 'Internal note');
  await expect(internalChoice).toHaveAttribute('aria-checked', 'true');
  await expect(internalChoice).toBeEnabled();
  await internalChoice.focus();
  await page.keyboard.press('ArrowLeft');
  await expect(native).toHaveAttribute('aria-label', 'Public reply');
  await expect(publicChoice).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('[contenteditable=true]')).toHaveText('Keep this unsent.');
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await preferences({ enabled: false });
  await expect(native).toBeVisible();
  await expect(page.getByRole('radiogroup', { name: 'Reply visibility' })).toHaveCount(0);
  await page.close();
});

test('one Copy ticket action writes a linked number without a copy menu', async () => {
  await preferences({ enabled: true, layout: true, autoTitle: false });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await context.grantPermissions(['clipboard-read', 'clipboard-write'], {
    origin: 'https://itjones.zendesk.com'
  });
  await page.getByRole('button', { name: 'Copy ticket', exact: true }).click();
  // Click returns before the asynchronous clipboard write completes.
  await expect
    .poll(() =>
      page.evaluate(async () => {
        const item = (await navigator.clipboard.read())[0];
        if (!item?.types.includes('text/html')) return null;
        return {
          plain: await (await item.getType('text/plain')).text(),
          linkedNumber: (await (await item.getType('text/html')).text()).includes(
            'href="https://itjones.zendesk.com/agent/tickets/222"'
          )
        };
      })
    )
    .toEqual({
      plain: '[#222](https://itjones.zendesk.com/agent/tickets/222)',
      linkedNumber: true
    });
  await context.clearPermissions();
  await expect(page.locator('details[data-zdh-copy-tools]')).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await page.close();
});

test('optional recent-message summary lives inside the scrolling history', async () => {
  await preferences({ enabled: true, layout: true, autoTitle: false, collapseHistory: true });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await page.evaluate(() => {
    const log = document.querySelector('#live-log-shape');
    for (let i = 0; i < 3; i++) log.append(log.querySelector('article').cloneNode(true));
  });
  const disclosure = page.locator('[data-zdh-conversation-disclosure]');
  const entries = page.locator('[data-test-id=omni-log-comment-item]');
  await expect(disclosure).toHaveText('View full conversation');
  await expect(disclosure).toHaveAttribute(
    'aria-label',
    'View full conversation, 3 earlier messages hidden'
  );
  await expect(page.locator('#live-log-shape > [data-zdh-conversation-disclosure]')).toHaveCount(1);
  await expect(entries.locator('visible=true')).toHaveCount(5);
  await disclosure.click();
  await expect(disclosure).toHaveText('Collapse earlier messages');
  await expect(entries.locator('visible=true')).toHaveCount(8);
  await preferences({ collapseHistory: false });
  await expect(disclosure).toHaveCount(0);
  await expect(entries.locator('visible=true')).toHaveCount(8);
  await preferences({ collapseHistory: true });
  await expect(disclosure).toHaveCount(1);
  await expect(entries.locator('visible=true')).toHaveCount(5);
  await preferences({ enabled: false });
  await expect(entries.locator('visible=true')).toHaveCount(8);
  await page.close();
});

test('small popup opens Settings; theme imports preview and roll back without changing the ticket', async () => {
  await preferences({
    enabled: true,
    theme: 'purple',
    customThemes: {},
    carryDraft: false,
    collapseHistory: true
  });
  await worker.evaluate(() =>
    chrome.storage.session.remove(['themeStudioDraft', 'settingsTargetTab'])
  );
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  await expect(
    popup.locator('#theme-studio,#carry-draft,#harvest-theme,#layout,#context')
  ).toHaveCount(0);
  await expect(popup.getByText('Settings for Zendesk', { exact: true })).toHaveCount(0);
  const opened = context.waitForEvent('page');
  await popup.getByRole('button', { name: 'Settings', exact: true }).click();
  const settings = await opened;
  await settings.waitForURL(`chrome-extension://${extensionId}/src/settings/settings.html`);
  await expect(settings.locator('#hex-page')).toHaveValue('#21142f');
  await expect(settings.locator('#target-ticket')).not.toHaveValue('');
  await expect(settings.getByRole('checkbox', { name: /Use the same draft/ })).not.toBeChecked();
  await settings.getByRole('checkbox', { name: /Use the same draft/ }).check();
  await expect
    .poll(() =>
      worker.evaluate(async () => (await chrome.storage.local.get('carryDraft')).carryDraft)
    )
    .toBe(true);
  const files = require('../src/shared/theme-files.js');
  const downloadStarted = settings.waitForEvent('download');
  await settings.getByRole('button', { name: 'Export theme', exact: true }).click();
  const download = await downloadStarted;
  expect(download.suggestedFilename()).toBe('deep-purple.json');
  const exported = await fs.readFile(await download.path(), 'utf8');
  expect(files.parse(exported).name).toBe('Deep Purple');
  expect(Object.keys(JSON.parse(exported)).sort()).toEqual([
    'format',
    'name',
    'palette',
    'version'
  ]);
  const palette = require('../src/shared/themes.js').palettes.blush;
  await settings.locator('#theme-file').setInputFiles({
    name: 'demo-theme.json',
    mimeType: 'application/json',
    buffer: Buffer.from(files.serialize({ name: 'Demo rose', palette }))
  });
  await expect(settings.locator('#custom-name')).toHaveValue('Demo rose');
  await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  await settings.getByRole('button', { name: 'Preview on ticket', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', 'custom-preview');
  await settings.close();
  await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  const again = await context.newPage();
  await again.goto(`chrome-extension://${extensionId}/src/settings/settings.html`);
  await expect(again.locator('#custom-name')).toHaveValue('Demo rose');
  await again.getByRole('button', { name: 'Save and apply', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', /^custom-/);
  await expect
    .poll(() =>
      worker.evaluate(async () =>
        Object.values((await chrome.storage.local.get('customThemes')).customThemes).map(
          (x) => x.name
        )
      )
    )
    .toContain('Demo rose');
  await again.close();
  await popup.close();
  await page.close();
});

test('Settings does not guess a preview target when multiple Zendesk tabs are open', async () => {
  await preferences({ enabled: true, theme: 'purple', customThemes: {} });
  await worker.evaluate(() =>
    chrome.storage.session.remove(['settingsTargetTab', 'themeStudioDraft'])
  );
  const first = await context.newPage();
  await first.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
  const second = await context.newPage();
  await second.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
  const settings = await context.newPage();
  await settings.goto(`chrome-extension://${extensionId}/src/settings/settings.html`);
  await expect(settings.locator('#target-ticket')).toHaveValue('');
  await settings.getByRole('button', { name: 'Preview on ticket', exact: true }).click();
  await expect(settings.locator('#status')).toHaveText(
    'Choose a Zendesk tab for the preview or title tool.'
  );
  await expect(first.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  await expect(second.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  const options = await settings
    .locator('#target-ticket option')
    .evaluateAll((nodes) => nodes.map((n) => n.value).filter(Boolean));
  await settings.locator('#target-ticket').selectOption(options[1]);
  await settings.getByRole('button', { name: 'Preview on ticket', exact: true }).click();
  await expect(second.locator('html')).toHaveAttribute('data-zdh-theme', 'custom-preview');
  await expect(first.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  await settings.close();
  await expect(second.locator('html')).toHaveAttribute('data-zdh-theme', 'purple');
  await first.close();
  await second.close();
});

test('short email images stay inline; tall images preview and restore after source changes', async () => {
  await preferences({
    enabled: true,
    layout: true,
    autoTitle: false,
    collapseHistory: false,
    theme: 'blush'
  });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 850 });
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await page.evaluate(() => {
    const body = document.createElement('div');
    body.dataset.testId = 'omni-log-message-content';
    body.id = 'image-height-case';
    for (const [id, w, h] of [
      ['short-banner', 751, 71],
      ['wide-screen', 1600, 240],
      ['tall-screen', 800, 1200],
      ['portrait-screen', 400, 1600]
    ]) {
      const image = document.createElement('img');
      image.id = id;
      image.style.width = '100%';
      image.style.height = 'auto';
      image.alt = id;
      image.src =
        'data:image/svg+xml,' +
        encodeURIComponent(
          `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><rect width="100%" height="100%" fill="#ddd"/></svg>`
        );
      body.append(image);
    }
    document.querySelector('article').append(body);
  });
  await expect(page.locator('#tall-screen')).toHaveAttribute('data-zdh-message-image', 'true');
  for (const id of ['short-banner', 'wide-screen']) {
    await expect(page.locator('#' + id)).not.toHaveAttribute('data-zdh-message-image');
    expect((await page.locator('#' + id).boundingBox()).width).toBeGreaterThan(100);
  }
  await expect(page.locator('#portrait-screen')).toHaveAttribute('data-zdh-message-image', 'true');
  // A portrait thumbnail itself can be smaller than 64×64. Recheck its authored size,
  // rather than mistaking our thumbnail for a native icon during reconciliation.
  await page.locator('#portrait-screen').evaluate((e) => {
    e.style.width = '60px';
    dispatchEvent(new Event('resize'));
  });
  await expect(page.locator('#portrait-screen')).not.toHaveAttribute('data-zdh-message-image');
  await page.locator('#portrait-screen').evaluate((e) => {
    e.style.width = '100%';
    dispatchEvent(new Event('resize'));
  });
  await expect(page.locator('#portrait-screen')).toHaveAttribute('data-zdh-message-image', 'true');
  await page.locator('#portrait-screen').evaluate((e) => {
    e.style.width = '32px';
    e.style.height = '32px';
    e.src =
      'data:image/svg+xml,' +
      encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>');
  });
  await expect(page.locator('#portrait-screen')).not.toHaveAttribute('data-zdh-message-image');
  await expect(page.locator('#portrait-screen')).not.toHaveAttribute('role', 'button');
  await page.locator('#tall-screen').click();
  await expect(page.locator('[data-zdh-image-lightbox]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page
    .locator('#tall-screen')
    .evaluate((e) => (e.src = document.querySelector('#short-banner').src));
  await expect(page.locator('#tall-screen')).not.toHaveAttribute('data-zdh-message-image');
  await expect(page.locator('#tall-screen')).not.toHaveAttribute('role', 'button');
  await preferences({ enabled: false });
  await expect(page.locator('[data-zdh-image-preview]')).toHaveCount(0);
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await page.close();
});

test('quoted email starts open, explains its boundary, and exports original hidden content', async () => {
  await preferences({ enabled: true, layout: true, autoTitle: false, collapseHistory: false });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await page.evaluate(() => {
    const body = document.createElement('div');
    body.id = 'quote-case';
    body.dataset.testId = 'omni-log-message-content';
    body.innerHTML =
      '<p>New answer: the test now passes.</p><blockquote type="cite"><p>Earlier question: which setting changed?</p><blockquote type="cite">An important inline answer.</blockquote></blockquote>';
    document.querySelector('article [data-zdh-body]').replaceWith(body);
  });
  const control = page.locator('#quote-case [data-zdh-email-disclosure]');
  await expect(control).toHaveText('Hide quoted email');
  await expect(page.getByText('An important inline answer.', { exact: true })).toBeVisible();
  await expect(page.locator('[data-zdh-email-formatting]')).toHaveCount(0);
  await control.click();
  await expect(control).toHaveText('Show quoted email');
  await expect(page.locator('[data-zdh-email-peek]')).toContainText(
    'Earlier question: which setting changed?'
  );
  await expect(page.getByText('An important inline answer.', { exact: true })).toBeHidden();
  // The export collector removes only helper explanation/preview nodes, including while folded.
  const result = await worker.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ url: 'https://itjones.zendesk.com/agent/tickets/222' });
    return chrome.tabs.sendMessage(tab.id, { type: 'zdh-export' });
  });
  expect(result.exported).toBe(true);
  const filename = await worker.evaluate(
    async () => (await chrome.downloads.search({ orderBy: ['-startTime'], limit: 1 }))[0].filename
  );
  const exported = JSON.parse(await fs.readFile(filename, 'utf8'));
  expect(exported.comments[0].body).toContain('An important inline answer.');
  expect(exported.comments[0].body).not.toContain('Earlier email included');
  await control.click();
  await expect(page.getByText('An important inline answer.', { exact: true })).toBeVisible();
  await preferences({ enabled: false });
  await expect(control).toHaveCount(0);
  await expect(page.getByText('An important inline answer.', { exact: true })).toBeVisible();
  await page.close();
});

// A native Closed notice must beat stale Open controls and an old composer in the same workspace.
test('closed ticket keeps an unsent draft and hides Send and Save', async () => {
  await preferences({ enabled: true, theme: 'purple', layout: true, autoTitle: false });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  const draft = page.locator('#reply');
  await draft.fill('Keep this unsent.');
  await page.evaluate(() => {
    const notice = document.createElement('p');
    notice.dataset.testId = 'ticket-footer-helper-text';
    notice.textContent = 'This ticket is closed and cannot be edited.';
    document.querySelector('[data-test-id="ticket-footer"]').append(notice);
  });
  const status = page.getByRole('combobox', { name: 'Status', exact: true });
  await expect(status).toHaveText('Closed');
  await expect(status).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Send', exact: true })).toBeHidden();
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeHidden();
  await draft.focus();
  await page.keyboard.press('Meta+Enter');
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await expect(draft).toHaveValue('Keep this unsent.');
  await page.close();
});

for (const theme of ['daylight', 'purple', 'blush']) {
  test(`${theme}: nested Polaris colors follow the helper through native appearance changes`, async () => {
    await preferences({ enabled: true, theme });
    const page = await context.newPage();
    await page.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
    await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', theme);
    for (const native of ['light', 'dark', 'light', 'dark']) {
      await page.evaluate((native) => {
        document.documentElement.dataset.theme = native;
        document.documentElement.dataset.colorScheme = native;
        document.querySelector('#native-theme-boundary').dataset.theme = native;
      }, native);
      for (const component of await page.locator('#native-control,#native-theme-boundary').all()) {
        const colors = await component.evaluate((e) => {
          const resolve = (name) => {
            const probe = document.createElement('span');
            probe.style.color = `var(${name})`;
            document.body.append(probe);
            const color = getComputedStyle(probe).color;
            probe.remove();
            return color;
          };
          const actual = getComputedStyle(e);
          return {
            background: actual.backgroundColor,
            text: actual.color,
            // The conversation canvas is Page; its input/card surface is Surface.
            expectedBackground: resolve(
              e.id === 'native-theme-boundary' ? '--zdh-theme-page' : '--zdh-theme-surface'
            ),
            nativeBase: actual.getPropertyValue('--background-default'),
            compiledBase: actual.getPropertyValue('--zdh-theme-surface'),
            ink: resolve('--zdh-theme-text'),
            scheme: actual.colorScheme.split(' ')[0],
            expectedScheme: getComputedStyle(document.documentElement)
              .getPropertyValue('--color-scheme')
              .trim()
          };
        });
        expect(colors.background).toBe(colors.expectedBackground);
        expect(colors.text).toBe(colors.ink);
        expect(colors.nativeBase).toBe(colors.compiledBase);
        expect(colors.scheme).toBe(colors.expectedScheme);
      }
      for (const selector of ['#native-field-row', '#native-workspace-tab']) {
        const border = await page.locator(selector).evaluate((e) => {
          const probe = document.createElement('span');
          probe.style.color = 'var(--zdh-theme-border)';
          document.body.append(probe);
          const expected = getComputedStyle(probe).color;
          probe.remove();
          return { actual: getComputedStyle(e).borderBottomColor, expected };
        });
        expect(border.actual).toBe(border.expected);
      }
      // Both native appearances must produce the same helper-colored component image.
      await expect(page.locator('#native-theme-boundary')).toHaveScreenshot(
        `native-boundary-${theme}.png`
      );
      await expect(page.locator('#authored-inside')).toHaveCSS('color', 'rgb(20, 40, 60)');
      await expect(page.locator('#authored-inside')).toHaveCSS(
        'background-color',
        'rgb(255, 240, 220)'
      );
    }
    const disabled = await page.locator('#native-disabled').evaluate((e) => {
      const style = getComputedStyle(e);
      const probe = document.createElement('span');
      document.body.append(probe);
      probe.style.color = 'var(--zdh-theme-page)';
      const background = getComputedStyle(probe).color;
      probe.style.color = 'var(--zdh-theme-muted)';
      const text = getComputedStyle(probe).color;
      probe.remove();
      return { background, text, actualBackground: style.backgroundColor, actualText: style.color };
    });
    expect(disabled.actualBackground).toBe(disabled.background);
    expect(disabled.actualText).toBe(disabled.text);
    expect(disabled.actualText).not.toBe(disabled.actualBackground);
    // New native roots should inherit the scoped stylesheet without another initialization pass.
    await page.evaluate(() => {
      const root = document.createElement('section');
      root.id = 'late-theme-root';
      root.dataset.testId = 'ticket-main-conversation';
      root.dataset.theme = 'dark';
      document.body.append(root);
    });
    const late = await page.locator('#late-theme-root').evaluate((e) => ({
      actual: getComputedStyle(e).getPropertyValue('--background-default'),
      expected: getComputedStyle(e).getPropertyValue('--zdh-theme-surface')
    }));
    expect(late.actual).toBe(late.expected);
    await page.emulateMedia({ forcedColors: 'active' });
    await expect(page.locator('html')).not.toHaveAttribute('data-zdh-theme');
    await expect(page.locator('#zdh-theme-variables')).toHaveCount(0);
    await page.emulateMedia({ forcedColors: 'none' });
    await expect(page.locator('html')).toHaveAttribute('data-zdh-theme', theme);

    // Turning the helper off must restore native Dark, rather than changing the user's setting.
    await preferences({ enabled: false });
    await expect(page.locator('html')).not.toHaveAttribute('data-zdh-theme');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(page.locator('#native-control')).toHaveCSS('background-color', 'rgb(21, 26, 30)');
    await expect(page.locator('#native-control')).toHaveCSS('color', 'rgb(216, 220, 222)');
    await page.close();
  });
}

test('popup exports the captured active ticket after the popup closes', async () => {
  await preferences({ enabled: true, autoTitle: false });
  const page = await context.newPage();
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  await expect(page.locator('[data-zdh-mode-tools]')).toBeAttached();
  const popup = await context.newPage();
  await popup.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  await page.bringToFront();
  await popup.reload();
  await expect(popup.locator('#export-context')).toHaveText('Current ticket: #222');
  await expect(popup.locator('#export-ticket')).toBeEnabled();
  const oldIds = await worker.evaluate(async () =>
    (await chrome.downloads.search({})).map((d) => d.id)
  );
  // The real toolbar popup is destroyed when focus moves away. Close this test surface
  // immediately after the synchronous handoff, before any asynchronous export completes.
  await popup.evaluate(() => document.querySelector('#export-ticket').click());
  await popup.close();
  let completed;
  await expect
    .poll(async () => {
      completed = await worker.evaluate(
        async (oldIds) =>
          (await chrome.downloads.search({})).find(
            (d) => !oldIds.includes(d.id) && d.state === 'complete'
          ),
        oldIds
      );
      return Boolean(completed);
    })
    .toBe(true);
  const raw = JSON.parse(await fs.readFile(completed.filename, 'utf8'));
  expect(String(raw.ticketId)).toBe('222');
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await page.goto('https://itjones.zendesk.com/agent/zdh-visual-test');
  const other = await context.newPage();
  await other.goto(`chrome-extension://${extensionId}/src/popup/popup.html`);
  await page.bringToFront();
  await other.reload();
  await expect(other.locator('#export-ticket')).toBeDisabled();
  await expect(other.locator('#export-context')).toContainText('Open a ticket');
  await other.close();
  await page.close();
});
