// Daily controls only: power, theme and the link to full Settings.
// The picker previews this popup; only choosing an option writes the saved theme.
'use strict';
const $ = (id) => document.getElementById(id);
const defaults = { enabled: true, theme: 'native', customThemes: {} };
let prefs = { ...defaults };
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
})().catch((error) => setStatus(error.message));
