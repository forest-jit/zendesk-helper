const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

(async () => {
  const launchOptions = { headless: true };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let external = 0;
  page.on('request', request => { if (!request.url().startsWith('file:')) external += 1; });
  await page.goto(`file://${path.join(__dirname, 'fixtures', 'zendesk-ticket.html')}`);
  await page.addStyleTag({ path: path.join(root, 'content.css') });
  for (const file of ['validator.js', 'content.js']) await page.addScriptTag({ path: path.join(root, file) });

  const configured = await page.evaluate(() => globalThis.zdTitleHelper.configure({ layout: true, context: false, manual: false }));
  assert.deepEqual(configured, { titleFound: true, layoutFound: true, narrow: false });
  assert.equal(await page.locator('#active-ticket[data-zdh-layout="true"]').count(), 1);
  assert.equal(await page.locator('[data-test-id="ticket-111-standard-layout"][data-zdh-layout]').count(), 0);
  const conversationBox = await page.locator('#conversation').boundingBox();
  const propertiesBox = await page.locator('#properties').boundingBox();
  assert.ok(conversationBox.x < propertiesBox.x, 'conversation should render left of properties');
  assert.equal(await page.locator('#context').evaluate(element => getComputedStyle(element).display), 'none');

  await page.locator('#active-subject').focus();
  await page.locator('#requester').focus();
  assert.equal(await page.locator('#active-subject + [data-zdh-warning="true"]').count(), 1);
  assert.equal(await page.locator('#active-subject').inputValue(), 'FaceID error');
  assert.ok((await page.locator('#active-subject').getAttribute('aria-describedby')).startsWith('zdh-warning-'));
  await page.locator('#active-subject').fill('Beluga Sales Inc. - Taylor Baxter - FaceID error');
  await page.locator('#requester').focus();
  assert.equal(await page.locator('#active-subject + [data-zdh-warning]').count(), 0);

  const checks = await page.evaluate(() => ['', 'Company - Person', 'Company -  - Issue', 'Company - Person - Issue', 'Company - Person - Issue - detail', 'Company - Person - <img src=x onerror=alert(1)>'].map(globalThis.zdTitleFormat));
  assert.deepEqual(checks, [false, false, false, true, true, true]);
  await page.locator('#active-subject').fill('<img src=x onerror=alert(1)>');
  await page.locator('#requester').focus();
  assert.equal(await page.locator('img').count(), 0);

  await page.evaluate(() => globalThis.zdTitleHelper.configure({ layout: true, context: true, manual: true }));
  await page.locator('#manual-title').click();
  await page.evaluate(() => document.body.append(document.createElement('div')));
  await page.locator('#save').focus();
  assert.equal(await page.locator('#manual-title + [data-zdh-warning="true"]').count(), 1);
  assert.equal(await page.locator('#active-subject + [data-zdh-warning]').count(), 0);
  assert.equal(await page.locator('#context').evaluate(element => getComputedStyle(element).display), 'flex');

  for (const width of [1000, 1280, 1600]) {
    await page.setViewportSize({ width, height: 800 });
    const boxes = await Promise.all([page.locator('#conversation').boundingBox(), page.locator('#properties').boundingBox()]);
    assert.ok(boxes[0].x < boxes[1].x, `conversation should remain left at ${width}px`);
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  }
  await page.evaluate(() => { document.body.style.zoom = '1.25'; });
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  await page.evaluate(() => { document.body.style.zoom = ''; });

  await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'active-subject');
  assert.equal(await page.locator('#active-subject').evaluate(element => getComputedStyle(element).outlineStyle), 'solid');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'requester');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'reply');

  await page.setViewportSize({ width: 900, height: 800 });
  assert.equal(await page.locator('#active-ticket').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length), 3);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.evaluate(() => globalThis.zdTitleHelper.setEnabled(false));
  assert.equal(await page.locator('[data-zdh-layout]').count(), 0);
  assert.equal(await page.locator('[data-zdh-warning]').count(), 0);
  assert.equal(external, 0);
  await browser.close();
  console.log('PASS: synthetic detection, blur warnings, manual selection, active workspace, layout/context placement, narrow fallback, focus, restoration, literal text, and no external requests.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
