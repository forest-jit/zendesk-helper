// Full Settings page: workflow preferences, theme editor, optional Harvest and ticket tools.
// Theme selection UI is shared with the popup. Ticket commands use an explicit target tab.
// Read initialize(), then the event handlers; ordinary saves do not display success toasts.

'use strict';
const defaults = {
  enabled: true,
  layout: true,
  context: false,
  theme: 'native',
  harvestTheme: false,
  customThemes: {},
  autoTitle: true,
  carryDraft: false,
  collapseHistory: true,
  queueRefresh: 15
};
let studioDraftTimer = null;
let prefs = { ...defaults },
  harvestEnabled = false,
  previewPort = null,
  editingId = null,
  studioPalette = null,
  ready = false;
const $ = (id) => document.getElementById(id);
const harvestAccess = {
  permissions: ['scripting'],
  origins: ['https://platform.harvestapp.com/*']
};
const setStatus = (text) => {
  $('status').textContent = text;
};
function readPreferences() {
  return chrome.storage.local.get(defaults);
}
async function writePreferences(patch) {
  await chrome.storage.local.set(patch);
  Object.assign(prefs, patch);
}
async function populateTargets() {
  const selected =
    Number($('target-ticket').value) ||
    (await chrome.storage.session.get('settingsTargetTab')).settingsTargetTab;
  const tabs = await chrome.tabs.query({
    currentWindow: true,
    url: 'https://itjones.zendesk.com/agent/*'
  });
  $('target-ticket').replaceChildren();
  const placeholder = document.createElement('option');
  placeholder.value = '';
  placeholder.textContent = tabs.length
    ? 'Choose a Zendesk tab'
    : 'Open a Jones IT Zendesk tab first';
  $('target-ticket').append(placeholder);
  for (const tab of tabs) {
    const option = document.createElement('option');
    option.value = String(tab.id);
    option.textContent = tab.title || tab.url;
    $('target-ticket').append(option);
  }
  if (tabs.some((tab) => tab.id === selected)) $('target-ticket').value = String(selected);
  else if (tabs.length === 1) $('target-ticket').value = String(tabs[0].id);
}
async function activeZendeskTab() {
  const id = Number($('target-ticket').value);
  if (!id) {
    $('target-ticket').focus();
    throw Error('Choose the Zendesk tab to preview or export.');
  }
  let tab;
  try {
    tab = await chrome.tabs.get(id);
  } catch {
    throw Error('That tab was closed. Choose another Zendesk tab.');
  }
  const url = new URL(tab.url || 'about:blank');
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'itjones.zendesk.com' ||
    !url.pathname.startsWith('/agent/')
  )
    throw Error('The selected tab is no longer a Jones IT Zendesk page.');
  return tab;
}
async function send(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    throw Error('Reload this Zendesk tab once after updating the extension.');
  }
}
const paintPage = zdhThemeControls.paint;
const picker = zdhThemeControls.createPicker({
  preferences: () => prefs,
  onChoose: chooseTheme,
  onError: setStatus
});
const renderThemes = () => picker.render();
const closeThemes = () => picker.close();
function powerState() {
  const on = prefs.enabled !== false;
  $('power').setAttribute('aria-checked', String(on));
  $('power-label').textContent = on ? 'On' : 'Off';
}
function paintHarvestButton() {
  $('harvest-theme').textContent = harvestEnabled ? 'Harvest theme on' : 'Match Harvest to theme';
  $('harvest-theme').setAttribute('aria-pressed', String(harvestEnabled));
}
async function chooseTheme(id) {
  stopPreview();
  await writePreferences({ theme: id });
  $('theme').value = id;
  renderThemes();
  closeThemes();
  loadStudio(id);
  setStatus(prefs.enabled ? '' : 'Turn on to apply your theme.');
}
function stopPreview() {
  if (previewPort) {
    previewPort.disconnect();
    previewPort = null;
  }
  $('preview-site').textContent = 'Preview on ticket';
}
function loadStudio(id) {
  editingId = id.startsWith('custom-') && prefs.customThemes[id] ? id : null;
  const base = zdhThemes.resolve(zdhThemes.systemTheme(id)) || zdhThemes.palettes.daylight;
  studioPalette = { ...base };
  $('custom-name').value = editingId ? prefs.customThemes[id].name : '';
  $('delete-theme').hidden = !editingId;
  for (const role of zdhThemes.roles) {
    $('color-' + role).value = studioPalette[role];
    $('hex-' + role).value = studioPalette[role];
  }
  validateStudio(false);
}
function flushStudioDraft() {
  if (!ready || !studioPalette) return;
  chrome.storage.session
    .set({
      themeStudioDraft: { editingId, name: $('custom-name').value, palette: { ...studioPalette } }
    })
    .catch((error) => setStatus(error.message));
}
function rememberStudio() {
  clearTimeout(studioDraftTimer);
  studioDraftTimer = setTimeout(flushStudioDraft, 120);
}
window.addEventListener('pagehide', () => {
  clearTimeout(studioDraftTimer);
  flushStudioDraft();
});
function validateStudio(paint = true) {
  if (paint && ready) rememberStudio();
  try {
    for (const role of zdhThemes.roles) {
      const value = $('hex-' + role).value.trim();
      if (!/^#[0-9a-f]{6}$/i.test(value))
        throw Error('Use a six-digit hex color for ' + role + '.');
      studioPalette[role] = value.toLowerCase();
      $('color-' + role).value = value;
    }
    zdhThemes.setPreview(studioPalette);
    $('theme-error').textContent = 'Readable contrast ✓';
    $('theme-error').dataset.valid = 'true';
    $('save-theme').disabled = false;
    $('preview-site').disabled = prefs.enabled === false;
    if (paint) paintPage('custom-preview');
    if (previewPort) previewPort.postMessage({ type: 'preview', palette: studioPalette });
    return true;
  } catch (error) {
    $('theme-error').textContent = error.message;
    $('theme-error').dataset.valid = 'false';
    $('save-theme').disabled = true;
    $('preview-site').disabled = true;
    stopPreview();
    return false;
  }
}
async function applyPower(value) {
  stopPreview();
  await writePreferences({ enabled: value });
  powerState();
  validateStudio(false);
  setStatus('');
}
async function initialize() {
  prefs = await readPreferences();
  // The layout has one supported direction. Old sidebar switches no longer change it.
  if (prefs.layout !== true || prefs.context !== false)
    await writePreferences({ layout: true, context: false });
  await populateTargets();
  if (prefs.theme === 'viridian') {
    prefs.theme = 'purple';
    await writePreferences({ theme: 'purple' });
  }
  zdhThemes.setCustomThemes(prefs.customThemes);
  if (!['native', 'system'].includes(prefs.theme) && !zdhThemes.resolve(prefs.theme))
    prefs.theme = 'native';
  for (const role of zdhThemes.roles) {
    const label = document.createElement('label');
    label.className = 'color-row';
    const title = document.createElement('span');
    title.textContent = {
      page: 'Page background',
      surface: 'Fields & messages',
      text: 'Text',
      accent: 'Buttons & links',
      attention: 'Internal notes'
    }[role];
    const picker = document.createElement('input');
    picker.type = 'color';
    picker.id = 'color-' + role;
    picker.setAttribute('aria-label', title.textContent + ' color');
    const hex = document.createElement('input');
    hex.id = 'hex-' + role;
    hex.className = 'hex-input';
    hex.maxLength = 7;
    hex.setAttribute('aria-label', title.textContent + ' hex');
    picker.addEventListener('input', () => {
      hex.value = picker.value;
      validateStudio();
    });
    hex.addEventListener('input', () => validateStudio());
    label.append(title, picker, hex);
    $('color-fields').append(label);
  }
  for (const id of ['auto-title', 'carry-draft', 'collapse-history'])
    $(id).checked = Boolean(
      prefs[
        {
          'auto-title': 'autoTitle',
          'carry-draft': 'carryDraft',
          'collapse-history': 'collapseHistory'
        }[id]
      ]
    );
  $('queue-refresh').value = String(prefs.queueRefresh);
  harvestEnabled = prefs.harvestTheme && (await chrome.permissions.contains(harvestAccess));
  paintHarvestButton();
  powerState();
  renderThemes();
  loadStudio(prefs.theme);
  const draft = (await chrome.storage.session.get('themeStudioDraft')).themeStudioDraft;
  if (draft?.palette) {
    try {
      zdhThemes.setPreview(draft.palette);
      studioPalette = { ...draft.palette };
      editingId = prefs.customThemes[draft.editingId] ? draft.editingId : null;
      $('custom-name').value = String(draft.name || '').slice(0, 60);
      for (const role of zdhThemes.roles) {
        $('color-' + role).value = studioPalette[role];
        $('hex-' + role).value = studioPalette[role];
      }
      $('delete-theme').hidden = !editingId;
      validateStudio(false);
    } catch {}
  }
  paintPage(prefs.theme);
  setStatus('');
  ready = true;
}
$('power').addEventListener('click', () =>
  applyPower(prefs.enabled === false).catch((e) => setStatus(e.message))
);
for (const [id, key] of Object.entries({
  'auto-title': 'autoTitle',
  'carry-draft': 'carryDraft',
  'collapse-history': 'collapseHistory',
  'queue-refresh': 'queueRefresh'
}))
  $(id).addEventListener('change', async () => {
    if (!ready) return;
    try {
      await writePreferences({
        [key]: id === 'queue-refresh' ? Number($(id).value) : $(id).checked
      });
      setStatus('');
    } catch (e) {
      setStatus(e.message);
    }
  });
$('theme-studio').addEventListener('toggle', () => {
  if (!ready) return;
  if ($('theme-studio').open) validateStudio();
  else {
    stopPreview();
    paintPage(prefs.theme);
  }
});
$('preview-site').addEventListener('click', async () => {
  if (previewPort) {
    stopPreview();
    setStatus('');
    return;
  }
  if (!validateStudio()) return;
  try {
    const tab = await activeZendeskTab();
    previewPort = chrome.tabs.connect(tab.id, { name: 'zdh-theme-preview' });
    previewPort.onDisconnect.addListener(() => {
      previewPort = null;
      $('preview-site').textContent = 'Preview on ticket';
    });
    previewPort.postMessage({ type: 'preview', palette: studioPalette });
    $('preview-site').textContent = 'Stop ticket preview';
    setStatus('');
  } catch (e) {
    setStatus(e.message);
  }
});
$('custom-name').addEventListener('input', rememberStudio);
$('save-theme').addEventListener('click', async () => {
  if (!validateStudio()) return;
  const name = $('custom-name').value.trim();
  if (!name) {
    setStatus('Give your theme a name first.');
    $('custom-name').focus();
    return;
  }
  if (!editingId && Object.keys(prefs.customThemes).length >= 32) {
    setStatus('You can keep up to 32 custom themes.');
    return;
  }
  clearTimeout(studioDraftTimer);
  await chrome.storage.session.remove('themeStudioDraft');
  const id = editingId || 'custom-' + crypto.randomUUID();
  const customThemes = { ...prefs.customThemes, [id]: { name, palette: { ...studioPalette } } };
  stopPreview();
  await writePreferences({ customThemes, theme: id });
  zdhThemes.setCustomThemes(customThemes);
  editingId = id;
  renderThemes();
  loadStudio(id);
  paintPage(id);
  setStatus(prefs.enabled ? '' : 'Turn on to apply your theme.');
});
$('delete-theme').addEventListener('click', async () => {
  if (!editingId) return;
  clearTimeout(studioDraftTimer);
  await chrome.storage.session.remove('themeStudioDraft');
  const customThemes = { ...prefs.customThemes };
  delete customThemes[editingId];
  stopPreview();
  await writePreferences({ customThemes, theme: 'native' });
  zdhThemes.setCustomThemes(customThemes);
  renderThemes();
  loadStudio('native');
  paintPage('native');
  setStatus('');
});
$('export').addEventListener('click', async () => {
  try {
    const tab = await activeZendeskTab();
    setStatus('Preparing local export…');
    const result = await send(tab.id, { type: 'zdh-export' });
    if (result?.error) throw Error(result.error);
    setStatus('');
  } catch (e) {
    setStatus(e.message);
  }
});
$('manual').addEventListener('click', async () => {
  try {
    const tab = await activeZendeskTab();
    await send(tab.id, {
      type: 'zdh-manual-select',
      options: { layout: prefs.layout, context: prefs.context }
    });
    await chrome.tabs.update(tab.id, { active: true });
    setStatus('');
  } catch (e) {
    setStatus(e.message);
  }
});
$('harvest-theme').addEventListener('click', async () => {
  try {
    if (harvestEnabled) {
      await writePreferences({ harvestTheme: false });
      harvestEnabled = false;
      paintHarvestButton();
      setStatus('');
      return;
    }
    // Send before awaiting anything: the background requests consent from this click.
    const result = await chrome.runtime.sendMessage({ type: 'zdh-harvest-enable' });
    if (result?.error) throw Error(result.error);
    if (!result?.granted) throw Error('Harvest access was not granted. You can try again.');
    harvestEnabled = true;
    paintHarvestButton();
    setStatus('Harvest theme on. Reload the Harvest panel to apply it.');
  } catch (error) {
    setStatus(error.message);
  }
});
$('target-ticket').addEventListener('change', async () => {
  stopPreview();
  await chrome.storage.session.set({ settingsTargetTab: Number($('target-ticket').value) || null });
});
chrome.tabs.onRemoved.addListener(() =>
  populateTargets().catch((error) => setStatus(error.message))
);
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local' || !ready) return;
  for (const key of Object.keys(defaults))
    if (changes[key]) prefs[key] = changes[key].newValue ?? defaults[key];
  if (changes.customThemes) zdhThemes.setCustomThemes(prefs.customThemes);
  if (changes.theme || changes.customThemes) {
    renderThemes();
    paintPage(prefs.theme);
  }
  if (changes.enabled) {
    powerState();
    if (!prefs.enabled) stopPreview();
    validateStudio(false);
  }
  for (const [id, key] of Object.entries({
    'auto-title': 'autoTitle',
    'carry-draft': 'carryDraft',
    'collapse-history': 'collapseHistory'
  }))
    if (changes[key]) $(id).checked = Boolean(prefs[key]);
  if (changes.queueRefresh) $('queue-refresh').value = String(prefs.queueRefresh);
  if (changes.harvestTheme) {
    harvestEnabled = Boolean(prefs.harvestTheme);
    paintHarvestButton();
  }
});
$('export-theme').addEventListener('click', () => {
  try {
    if (!validateStudio(false)) return;
    const name = $('custom-name').value.trim() || picker.label(prefs.theme);
    const data = zdhThemeFiles.serialize({ name, palette: studioPalette });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download =
      (name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'my-theme') + '.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    setStatus('');
  } catch (error) {
    setStatus(error.message);
  }
});
$('import-theme').addEventListener('click', () => $('theme-file').click());
$('theme-file').addEventListener('change', async () => {
  const file = $('theme-file').files[0];
  if (!file) return;
  try {
    if (file.size > 16384) throw Error('Choose a theme JSON file smaller than 16 KB.');
    const entry = zdhThemeFiles.parse(await file.text());
    stopPreview();
    editingId = null;
    studioPalette = entry.palette;
    $('custom-name').value = entry.name;
    $('delete-theme').hidden = true;
    for (const role of zdhThemes.roles) {
      $('color-' + role).value = studioPalette[role];
      $('hex-' + role).value = studioPalette[role];
    }
    validateStudio();
    $('theme-studio').open = true;
    setStatus('');
  } catch (error) {
    setStatus(error.message);
  } finally {
    $('theme-file').value = '';
  }
});
initialize().catch((e) => setStatus(e.message));
