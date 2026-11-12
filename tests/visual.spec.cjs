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
  // Reuse fictional ticket content; add the current native composer wrapper for activity placement.
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

// Simulated native labels check our rendering only; a real second-agent test is still required.
test('activity distinguishes unknown, viewing and editing without submitting', async () => {
  await preferences({ enabled: true, theme: 'purple', layout: true, autoTitle: false });
  const page = await context.newPage();
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('https://itjones.zendesk.com/agent/tickets/222');
  const badge = page.locator('[data-zdh-presence] button');
  const activity = page.locator('[data-zdh-activity]');
  await expect(badge).toHaveAccessibleName('Other agents: activity unknown');
  await expect(badge).toHaveText('?');
  await expect(activity).toHaveText('Other agents · unknown');
  await badge.focus();
  await expect(page.locator('[data-zdh-presence] [role=tooltip]')).toContainText(
    'Someone may still have this ticket open'
  );
  await page.evaluate(() => {
    const signal = document.createElement('span');
    signal.id = 'native-collision-test';
    signal.dataset.testId = 'agent-collision';
    signal.setAttribute('aria-label', 'Morgan is viewing this ticket');
    signal.textContent = 'Morgan';
    document.querySelector('#active-ticket').prepend(signal);
  });
  await expect(badge).toHaveAccessibleName('Morgan is viewing this ticket');
  await expect(page.locator('[data-zdh-presence]')).toHaveAttribute('data-state', 'viewing');
  await page
    .locator('#native-collision-test')
    .evaluate((e) => e.setAttribute('aria-label', 'Morgan is editing this ticket'));
  await expect(badge).toHaveAccessibleName('Morgan is editing this ticket');
  await expect(page.locator('[data-zdh-presence]')).toHaveAttribute('data-state', 'editing');
  await page.locator('#native-collision-test').evaluate((e) => {
    e.hidden = true;
  });
  await expect(badge).toHaveAccessibleName('Other agents: activity unknown');
  await expect(badge).toHaveText('?');
  expect(await page.evaluate(() => globalThis.__nativeActions.submitClicks)).toBe(0);
  await preferences({ enabled: false });
  await expect(badge).toHaveCount(0);
  await expect(activity).toHaveCount(0);
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
