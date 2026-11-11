// Feature-guide presentation only: show the packaged version and selected theme.
// It does not access Zendesk tickets or start any workflow.

'use strict';
document.getElementById('guide-version').textContent = chrome.runtime.getManifest().version;
let style;
async function paint() {
  const prefs = await chrome.storage.local.get({ theme: 'system', customThemes: {} });
  zdhThemes.setCustomThemes(prefs.customThemes);
  style?.remove();
  delete document.documentElement.dataset.zdhTheme;
  if (matchMedia('(forced-colors: active)').matches) return;
  const id = zdhThemes.systemTheme(prefs.theme);
  if (!zdhThemes.resolve(id)) return;
  const { variables } = zdhThemes.compileTheme(id);
  style = document.createElement('style');
  style.textContent = `:root{${Object.entries(variables)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')}}`;
  document.head.append(style);
  document.documentElement.dataset.zdhTheme = id;
}
chrome.storage.onChanged.addListener((c, a) => {
  if (a === 'local' && (c.theme || c.customThemes)) paint();
});
for (const query of ['(prefers-color-scheme: dark)', '(forced-colors: active)'])
  matchMedia(query).addEventListener('change', paint);
paint();
