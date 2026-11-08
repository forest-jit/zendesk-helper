const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const root = path.join(__dirname, '..');
const chromePath = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const resultsDir = path.join(root, 'test-results');
fs.mkdirSync(resultsDir, { recursive: true });

(async () => {
  const launchOptions = { headless: true };
  if (fs.existsSync(chromePath)) launchOptions.executablePath = chromePath;
  const browser = await chromium.launch(launchOptions);
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  let external = 0;
  page.on('request', request => { if (!request.url().startsWith('file:')) external += 1; });
  await page.goto(`file://${path.join(__dirname, 'fixtures', 'zendesk-ticket.html')}`);
  await page.addStyleTag({ path: path.join(root, 'content.css') });
  await page.evaluate(() => {
    globalThis.chrome = {
      storage: { local: { get: (defaults, callback) => callback(defaults) } },
      runtime: { onMessage: { addListener: listener => { globalThis.__zdhMessage = listener; } } }
    };
  });
  for (const file of ['validator.js', 'workflow.js', 'exporter.js', 'workspace.js', 'content.js']) await page.addScriptTag({ path: path.join(root, file) });

  await page.waitForTimeout(0);
  assert.equal(await page.locator('#active-ticket[data-zdh-layout="true"]').count(), 1, 'default startup should enable the visible ticket layout');
  const composerActions=page.locator('[data-zdh-composer-actions="true"]');
  const propertiesActions=page.locator('[data-zdh-properties-actions="true"]');
  assert.equal(await composerActions.count(),1,'active ticket should receive composer actions');
  assert.equal(await propertiesActions.count(),1,'active ticket should receive property actions');
  assert.equal(await page.locator('[data-test-id="ticket-111-standard-layout"] [data-zdh-composer-actions]').count(),0,'inactive ticket must not receive actions');
  assert.equal(await composerActions.locator('[data-mode-choice="public"]').count(),1);
  assert.equal(await composerActions.locator('[data-mode-choice="internal"]').count(),1);
  assert.equal(await composerActions.locator('[data-send]').count(),1);
  assert.equal(await propertiesActions.locator('[data-status]').count(),1);
  assert.equal(await propertiesActions.locator('[data-save]').count(),1);
  assert.equal(await page.locator('[data-test-id="omnichannel-channel-switcher-button"]').innerText(),'Internal note','empty composer should default through the native mode control');
  assert.equal((await page.evaluate(()=>globalThis.__nativeActions)).modeClicks,1);

  const disabledPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await disabledPage.goto(`file://${path.join(__dirname, 'fixtures', 'zendesk-ticket.html')}`);
  await disabledPage.addStyleTag({ path: path.join(root, 'content.css') });
  await disabledPage.evaluate(() => {
    globalThis.chrome = {
      storage: { local: { get: (defaults, callback) => callback({ ...defaults, enabled: false }) } },
      runtime: { onMessage: { addListener: listener => { globalThis.__zdhMessage = listener; } } }
    };
  });
  for (const file of ['validator.js', 'workflow.js', 'exporter.js', 'workspace.js', 'content.js']) await disabledPage.addScriptTag({ path: path.join(root, file) });
  await disabledPage.waitForTimeout(0);
  assert.equal(await disabledPage.locator('[data-zdh-layout]').count(), 0, 'stored disabled preference should win over defaults');
  await disabledPage.evaluate(() => globalThis.__zdhMessage({ type: 'zdh-configure', options: { layout: true, context: true, manual: false } }, {}, () => {}));
  assert.equal(await disabledPage.locator('#active-ticket[data-zdh-context="true"]').count(), 1);
  await disabledPage.evaluate(() => globalThis.__zdhMessage({ type: 'zdh-set-enabled', value: false }, {}, () => {}));
  assert.equal(await disabledPage.locator('[data-zdh-layout]').count(), 0);
  await disabledPage.close();

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

  const statusSelect=propertiesActions.locator('[data-status]');
  await statusSelect.selectOption('pending');
  assert.equal(await page.locator('[data-test-id="submit_button-button"]').innerText(),'Submit as Open','draft status must not touch native Zendesk before save');
  await page.locator('#reply').fill('Private diagnostic note');
  await composerActions.locator('[data-send]').click();
  assert.equal(await page.locator('[data-test-id="submit_button-button"]').innerText(),'Submit as Open','Send must preserve the native status');
  assert.equal((await page.evaluate(()=>globalThis.__nativeActions)).submitClicks,1);
  await page.waitForTimeout(1250);
  await composerActions.locator('[data-mode-choice="public"]').click();
  await page.locator('#reply').fill('A reviewed public test response');
  await page.evaluate(()=>document.body.append(document.createElement('b')));
  const helperSend=composerActions.locator('[data-send]');
  assert.equal(await helperSend.isEnabled(),false,'public reply must be blocked before review');
  await composerActions.locator('[data-public-review]').check();
  assert.equal(await helperSend.isEnabled(),true);
  await helperSend.click();
  assert.equal((await page.evaluate(()=>globalThis.__nativeActions)).submitClicks,2);
  await page.waitForTimeout(1250);
  await page.locator('#reply').fill('');
  const helperSave=propertiesActions.locator('[data-save]');
  assert.equal(await helperSave.isEnabled(),true);
  await helperSave.click();
  assert.deepEqual(await page.evaluate(()=>globalThis.__nativeActions),{modeClicks:2,statusClicks:1,submitClicks:3});
  assert.equal(await page.locator('[data-test-id="submit_button-button"]').innerText(),'Submit as Pending');
  assert.equal(await helperSave.isEnabled(),false,'save lock should prevent duplicate submission');
  await page.waitForTimeout(1250);
  await page.locator('#reply').fill('Unsent draft');
  assert.equal(await helperSave.isEnabled(),false,'property Save must not send a composer draft');
  await page.locator('#reply').fill('');
  await statusSelect.focus();
  await page.keyboard.press('Meta+Enter');
  assert.equal((await page.evaluate(()=>globalThis.__nativeActions)).submitClicks,4,'Command-Enter should save only from property actions');
  await page.waitForTimeout(1250);
  await page.locator('#reply').focus();
  await page.keyboard.press('Meta+Enter');
  assert.equal((await page.evaluate(()=>globalThis.__nativeActions)).submitClicks,4,'Command-Enter in composer must not save');
  const jsonDownload=page.waitForEvent('download');
  await propertiesActions.locator('[data-json]').click();
  const jsonFile=await jsonDownload;
  assert.match(jsonFile.suggestedFilename(),/^ticket-|^\d+-/);
  assert.equal(JSON.parse(fs.readFileSync(await jsonFile.path(),'utf8')).schemaVersion,1);
  const markdownDownload=page.waitForEvent('download');
  await propertiesActions.locator('[data-md]').click();
  const markdownFile=await markdownDownload;
  assert.match(fs.readFileSync(await markdownFile.path(),'utf8'),/Visible content only/);
  await page.evaluate(() => globalThis.__zdhMessage({ type: 'zdh-configure', options: { layout: true, context: false, theme: 'contrast', manual: false } }, {}, () => {}));
  assert.equal(await page.locator('#active-ticket').getAttribute('data-zdh-theme'),'contrast');

  const checks = await page.evaluate(() => ['', 'Company - Person', 'Company -  - Issue', 'Company - Person - Issue', 'Company - Person - Issue - detail', 'Company - Person - <img src=x onerror=alert(1)>'].map(globalThis.zdTitleFormat));
  assert.deepEqual(checks, [false, false, false, true, true, true]);
  const duplicate = await page.evaluate(() => globalThis.zdTitleReview('Beluga Sales Inc. - Taylor Baxter - Test company Inc. - Test name - Test error', { organization: 'Beluga Sales Inc.', requester: 'Taylor Baxter' }));
  assert.deepEqual(duplicate, { valid: false, kind: 'duplicate-identity', suggestion: 'Beluga Sales Inc. - Taylor Baxter - Test error' });
  await page.evaluate(() => {
    globalThis.__zdhEvents={input:0,change:0,submit:0,inputClass:null,inputType:null,data:null};
    const subject=document.querySelector('#active-subject');
    subject.addEventListener('input',event=>{globalThis.__zdhEvents.input++;globalThis.__zdhEvents.inputClass=event.constructor.name;globalThis.__zdhEvents.inputType=event.inputType;globalThis.__zdhEvents.data=event.data;});
    subject.addEventListener('change',()=>globalThis.__zdhEvents.change++);
    document.addEventListener('submit',event=>{globalThis.__zdhEvents.submit++;event.preventDefault();});
  });
  await page.locator('#active-subject').fill('Beluga Sales Inc. - Taylor Baxter - Test company Inc. - Test name - Test error');
  await page.locator('#requester').focus();
  assert.match(await page.locator('#active-subject + [data-zdh-warning]').getAttribute('aria-label'), /possible duplicate identity|two company\/requester prefixes/i);
  const useSuggestion=page.locator('#active-subject + [data-zdh-warning]').getByRole('button',{name:'Use suggestion'});
  assert.equal(await useSuggestion.count(),1);
  await page.evaluate(()=>{globalThis.__zdhEvents={input:0,change:0,submit:0,inputClass:null,inputType:null,data:null};});
  await page.locator('#active-subject').focus();
  const warningId=await page.locator('#active-subject + [data-zdh-warning]').getAttribute('id');
  await useSuggestion.evaluate(button=>button.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,composed:true})));
  await page.locator('#active-subject').evaluate(subject=>subject.dispatchEvent(new FocusEvent('focusout',{bubbles:true,relatedTarget:null})));
  assert.equal(await page.locator('#active-subject + [data-zdh-warning]').getAttribute('id'),warningId,'pointer-down must preserve the actionable warning through an ambiguous focusout');
  await useSuggestion.click();
  assert.equal(await page.locator('#active-subject').inputValue(),'Beluga Sales Inc. - Taylor Baxter - Test error');
  assert.deepEqual(await page.evaluate(()=>globalThis.__zdhEvents),{input:1,change:1,submit:0,inputClass:'InputEvent',inputType:'insertText',data:'Beluga Sales Inc. - Taylor Baxter - Test error'});
  assert.equal(await page.locator('#active-subject + [data-zdh-warning]').count(),0);
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
  await page.evaluate(() => { document.body.style.zoom = ''; globalThis.zdTitleHelper.configure({ layout: true, context: true, manual: false }); });
  await page.locator('#active-subject').fill('Beluga Sales Inc. - Taylor Baxter - Laptop cannot join office Wi-Fi');
  await page.locator('#requester').focus();
  await page.locator('#manual-fixture').evaluate(element => { element.hidden = true; });
  await page.screenshot({ path: path.join(resultsDir, 'single-ticket.png'), fullPage: false });

  await page.evaluate(() => { document.body.tabIndex = -1; document.body.focus(); });
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'requester');
  assert.equal(await page.locator('#requester').evaluate(element => getComputedStyle(element).outlineStyle), 'dashed');
  assert.equal(await page.locator('#requester').evaluate(element => getComputedStyle(element).outlineWidth), '3px');
  for(let i=0;i<12&&await page.evaluate(()=>document.activeElement.id!=='active-subject');i++)await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'active-subject');
  for(let i=0;i<12&&await page.evaluate(()=>document.activeElement.id!=='reply');i++)await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'reply');

  await page.setViewportSize({ width: 900, height: 800 });
  assert.equal(await page.locator('#active-ticket').evaluate(element => getComputedStyle(element).gridTemplateColumns.split(' ').length), 3);
  await page.setViewportSize({ width: 1280, height: 800 });

  await page.evaluate(() => globalThis.zdTitleHelper.setEnabled(false));
  assert.equal(await page.locator('[data-zdh-layout]').count(), 0);
  assert.equal(await page.locator('[data-zdh-warning]').count(), 0);
  assert.equal(external, 0);

  const listPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await listPage.goto(`file://${path.join(__dirname, 'fixtures', 'tickets-list.html')}`);
  assert.equal(await listPage.locator('tbody tr').count(), 6);
  assert.equal(await listPage.locator('table[data-test-id="generic-table"] th').first().evaluate(element => getComputedStyle(element).position), 'sticky');
  for (const width of [1000, 1280, 1600]) {
    await listPage.setViewportSize({ width, height: 800 });
    assert.equal(await listPage.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), true);
  }
  await listPage.locator('a').first().focus();
  assert.notEqual(await listPage.locator('a').first().evaluate(element => getComputedStyle(element).outlineStyle), 'none');
  await listPage.screenshot({ path: path.join(resultsDir, 'ticket-list.png'), fullPage: true });
  await browser.close();
  console.log('PASS: synthetic list/single views, duplicate-title suggestion, blur warnings, manual selection, active workspace, responsive placement, focus, restoration, literal text, screenshots, and no external requests.');
})().catch(error => {
  console.error(error);
  process.exit(1);
});
