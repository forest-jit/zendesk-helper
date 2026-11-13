// Daily controls: power, theme, active-ticket export and the link to full Settings.
// The picker previews this popup; only choosing an option writes the saved theme.
'use strict';
const $ = (id) => document.getElementById(id);
const defaults = { enabled: true, theme: 'native', customThemes: {} };
let prefs = { ...defaults };
let exportTarget = null;
const setStatus = (message) => {
  $('status').textContent = message;
};
const picker = zdhThemeControls.createPicker({
  preferences: () => prefs,
  onError: setStatus,
  async onChoose(theme) {
    await chrome.storage.local.set({ theme });
    prefs.theme = theme;
    picker.render();
    picker.close();
    setStatus('');
  }
});
function render() {
  const on = prefs.enabled !== false;
  $('power').setAttribute('aria-checked', String(on));
  $('power-label').textContent = on ? 'On' : 'Off';
  zdhThemes.setCustomThemes(prefs.customThemes);
  picker.render();
  zdhThemeControls.paint(prefs.theme);
}
$('power').addEventListener('click', async () => {
  try {
    const enabled = prefs.enabled === false;
    await chrome.storage.local.set({ enabled });
    prefs.enabled = enabled;
    render();
    setStatus('');
  } catch (error) {
    setStatus(error.message);
  }
});
async function activeTicket() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab?.url || 'about:blank');
  const match = url.pathname.match(/^\/agent\/tickets\/(\d+)\/?$/);
  if (url.origin !== 'https://itjones.zendesk.com' || !match)
    throw Error('Open a Jones IT ticket to export it.');
  return { tab, ticketId: match[1] };
}
async function showExportContext() {
  try {
    exportTarget = await activeTicket();
    const { ticketId } = exportTarget;
    $('export-context').textContent = 'Current ticket: #' + ticketId;
    $('export-ticket').disabled = false;
  } catch {
    exportTarget = null;
    $('export-context').textContent = 'Open a ticket to export it.';
    $('export-ticket').disabled = true;
  }
}
$('export-ticket').addEventListener('click', async () => {
  $('export-ticket').disabled = true;
  try {
    if (!exportTarget) throw Error('Open a Jones IT ticket to export it.');
    setStatus('Preparing export…');
    // Send immediately from the click. The background revalidates the tab and owns completion.
    const result = await chrome.runtime.sendMessage({
      type: 'zdh-export-active-ticket',
      tabId: exportTarget.tab.id,
      ticketId: exportTarget.ticketId
    });
    if (result?.error) throw Error(result.error);
    if (!result?.exported)
      throw Error('No export was confirmed. Check Chrome downloads before retrying.');
    setStatus('');
  } catch (error) {
    setStatus(
      error.message.includes('Receiving end does not exist')
        ? 'Protect your drafts and refresh this ticket after the extension update.'
        : error.message
    );
  } finally {
    await showExportContext();
  }
});
$('settings').addEventListener('click', async () => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = new URL(tab?.url || 'about:blank');
    const zendesk =
      url.protocol === 'https:' &&
      url.hostname === 'itjones.zendesk.com' &&
      url.pathname.startsWith('/agent/');
    await chrome.storage.session.set({ settingsTargetTab: zendesk ? tab.id : null });
    await chrome.runtime.openOptionsPage();
  } catch (error) {
    setStatus(error.message);
  }
});
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  let changed = false;
  for (const key of Object.keys(defaults)) {
    if (changes[key]) {
      prefs[key] = changes[key].newValue ?? defaults[key];
      changed = true;
    }
  }
  if (changed) render();
});
(async () => {
  prefs = await chrome.storage.local.get(defaults);
  if (prefs.theme === 'viridian') {
    prefs.theme = 'purple';
    await chrome.storage.local.set({ theme: 'purple' });
  }
  render();
  await showExportContext();
})().catch((error) => setStatus(error.message));
