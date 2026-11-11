// Toolbar settings: read preferences → render controls → save only the changed setting.
// Theme hover affects this popup; a preview connection temporarily affects the ticket.
// Start at initialize(), then follow the event handlers at the bottom.

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
  queueRefresh: 15
};
let studioDraftTimer = null;
let prefs = { ...defaults },
  popupThemeStyle = null,
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
const status = (text) => {
  $('status').textContent = text;
};
function readPreferences() {
  return chrome.storage.local.get(defaults);
}
async function writePreferences(patch) {
  await chrome.storage.local.set(patch);
  Object.assign(prefs, patch);
}
async function activeZendeskTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab?.url || 'about:blank');
  if (
    url.protocol !== 'https:' ||
    url.hostname !== 'itjones.zendesk.com' ||
    !url.pathname.startsWith('/agent/')
  )
    throw Error('Open a Jones IT Zendesk agent page first.');
  return tab;
}
async function send(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch {
    throw Error('Reload this Zendesk tab once after updating the extension.');
  }
}
function paintPopup(id) {
  popupThemeStyle?.remove();
  popupThemeStyle = null;
  delete document.documentElement.dataset.zdhTheme;
  id = zdhThemes.systemTheme(id);
  if (matchMedia('(forced-colors: active)').matches || !zdhThemes.resolve(id)) return;
  const { variables } = zdhThemes.compileTheme(id);
  popupThemeStyle = document.createElement('style');
  popupThemeStyle.textContent = `:root{${Object.entries(variables)
    .map(([key, value]) => `${key}:${value}`)
    .join(';')}}`;
  document.head.append(popupThemeStyle);
  document.documentElement.dataset.zdhTheme = id;
}
function powerState() {
  const on = prefs.enabled !== false;
  $('power').setAttribute('aria-checked', String(on));
  $('power-label').textContent = on ? 'On' : 'Off';
}
function paintHarvestButton() {
  $('harvest-theme').textContent = harvestEnabled ? 'Harvest theme on' : 'Match Harvest to theme';
  $('harvest-theme').setAttribute('aria-pressed', String(harvestEnabled));
}
function themeLabel(id) {
  return (
    $('theme').querySelector(`option[value="${id}"]`)?.textContent ||
    prefs.customThemes[id]?.name ||
    'Zendesk default'
  );
}
function renderThemes() {
  const box = $('theme-options');
  box.replaceChildren();
  const entries = [...$('theme').options].map((o) => ({ id: o.value, name: o.textContent }));
  for (const [id, entry] of Object.entries(prefs.customThemes))
    if (zdhThemes.resolve(id)) entries.push({ id, name: entry.name });
  for (const { id, name } of entries) {
    const button = document.createElement('button');
    button.type = 'button';
    button.role = 'option';
    button.className = 'theme-option secondary';
    button.dataset.id = id;
    button.setAttribute('aria-selected', String(id === prefs.theme));
    button.tabIndex = -1;
    const swatches = document.createElement('span');
    swatches.className = 'theme-swatches';
    swatches.setAttribute('aria-hidden', 'true');
    const palette = zdhThemes.resolve(zdhThemes.systemTheme(id));
    for (const role of ['page', 'surface', 'accent']) {
      const dot = document.createElement('i');
      dot.style.backgroundColor =
        palette?.[role] || (['page', 'surface'].includes(role) ? '#ffffff' : '#1f73b7');
      swatches.append(dot);
    }
    const label = document.createElement('span');
    label.textContent = name;
    button.append(swatches, label);
    button.addEventListener('pointerenter', () => paintPopup(id));
    button.addEventListener('focus', () => paintPopup(id));
    button.addEventListener('click', () => chooseTheme(id).catch((e) => status(e.message)));
    box.append(button);
  }
  $('theme-name').textContent = themeLabel(prefs.theme);
}
function closeThemes() {
  const wasOpen = !$('theme-options').hidden;
  $('theme-options').hidden = true;
  $('theme-trigger').setAttribute('aria-expanded', 'false');
  paintPopup(prefs.theme);
  if (wasOpen) $('theme-trigger').focus();
}
function openThemes() {
  $('theme-options').hidden = false;
  $('theme-trigger').setAttribute('aria-expanded', 'true');
  const buttons = [...$('theme-options').children];
  (buttons.find((e) => e.dataset.id === prefs.theme) || buttons[0]).focus();
}
async function chooseTheme(id) {
  stopPreview();
  await writePreferences({ theme: id });
  $('theme').value = id;
  renderThemes();
  closeThemes();
  loadStudio(id);
  status(prefs.enabled ? '' : 'Turn on to apply your theme.');
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
function rememberStudio() {
  clearTimeout(studioDraftTimer);
  studioDraftTimer = setTimeout(
    () =>
      chrome.storage.session.set({
        themeStudioDraft: { editingId, name: $('custom-name').value, palette: { ...studioPalette } }
      }),
    120
  );
}
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
    if (paint) paintPopup('custom-preview');
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
  status('');
}
async function initialize() {
  prefs = await readPreferences();
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
  for (const id of ['layout', 'context', 'auto-title', 'carry-draft'])
    $(id).checked = Boolean(
      prefs[
        {
          layout: 'layout',
          context: 'context',
          'auto-title': 'autoTitle',
          'carry-draft': 'carryDraft'
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
  paintPopup(prefs.theme);
  status(prefs.enabled ? 'Changes save automatically.' : 'Off · Your settings are kept.');
  ready = true;
}
$('theme-trigger').addEventListener('click', () => {
  $('theme-options').hidden ? openThemes() : closeThemes();
});
$('theme-options').addEventListener('pointerleave', () => paintPopup(prefs.theme));
$('theme-options').addEventListener('keydown', (event) => {
  const options = [...$('theme-options').children],
    index = options.indexOf(document.activeElement);
  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    event.preventDefault();
    const next =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? options.length - 1
          : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  } else if (event.key === 'Escape') {
    event.preventDefault();
    closeThemes();
  } else if (event.key === 'Tab') closeThemes();
});
document.addEventListener('pointerdown', (event) => {
  if (
    !$('theme-options').hidden &&
    !$('theme-options').contains(event.target) &&
    !$('theme-trigger').contains(event.target)
  )
    closeThemes();
});
$('power').addEventListener('click', () =>
  applyPower(prefs.enabled === false).catch((e) => status(e.message))
);
for (const [id, key] of Object.entries({
  layout: 'layout',
  context: 'context',
  'auto-title': 'autoTitle',
  'carry-draft': 'carryDraft',
  'queue-refresh': 'queueRefresh'
}))
  $(id).addEventListener('change', async () => {
    if (!ready) return;
    try {
      await writePreferences({
        [key]: id === 'queue-refresh' ? Number($(id).value) : $(id).checked
      });
      status('');
    } catch (e) {
      status(e.message);
    }
  });
$('theme-studio').addEventListener('toggle', () => {
  if ($('theme-studio').open) validateStudio();
  else {
    stopPreview();
    paintPopup(prefs.theme);
  }
});
$('preview-site').addEventListener('click', async () => {
  if (previewPort) {
    stopPreview();
    status('');
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
    status('Temporary preview · closing this popup restores your theme.');
  } catch (e) {
    status(e.message);
  }
});
$('custom-name').addEventListener('input', rememberStudio);
$('save-theme').addEventListener('click', async () => {
  if (!validateStudio()) return;
  const name = $('custom-name').value.trim();
  if (!name) {
    status('Give your theme a name first.');
    $('custom-name').focus();
    return;
  }
  if (!editingId && Object.keys(prefs.customThemes).length >= 32) {
    status('You can keep up to 32 custom themes.');
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
  paintPopup(id);
  status(prefs.enabled ? '' : 'Turn on to apply your theme.');
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
  paintPopup('native');
  status('');
});
$('export').addEventListener('click', async () => {
  try {
    const tab = await activeZendeskTab();
    status('Preparing local export…');
    const result = await send(tab.id, { type: 'zdh-export' });
    if (result?.error) throw Error(result.error);
    status('');
  } catch (e) {
    status(e.message);
  }
});
$('manual').addEventListener('click', async () => {
  try {
    const tab = await activeZendeskTab();
    await send(tab.id, {
      type: 'zdh-manual-select',
      options: { layout: prefs.layout, context: prefs.context }
    });
    status('Close this popup and click the title field.');
  } catch (e) {
    status(e.message);
  }
});
$('harvest-theme').addEventListener('click', () => {
  if (harvestEnabled) {
    writePreferences({ harvestTheme: false }).then(() => {
      harvestEnabled = false;
      paintHarvestButton();
      status('');
    });
    return;
  }
  chrome.permissions
    .request(harvestAccess)
    .then(async (granted) => {
      if (!granted) {
        status('Harvest access was not granted.');
        return;
      }
      await writePreferences({ harvestTheme: true });
      const result = await chrome.runtime.sendMessage({ type: 'zdh-harvest-sync' });
      if (result?.error) throw Error(result.error);
      harvestEnabled = true;
      paintHarvestButton();
      status('Harvest theme on. Refresh once if needed.');
    })
    .catch((e) => status(e.message));
});
initialize().catch((e) => status(e.message));
