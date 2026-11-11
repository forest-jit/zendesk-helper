// Runs inside the permitted Harvest timer frame. Apply the shared theme, then listen for changes.
// Never read or write project, task, notes, duration or timer values.

'use strict';
(function (root) {
  // No reads or writes to timer/project/task/note fields; styling and extension preferences only.
  if (
    !root.zdhHarvestPolicy.embeddedTimer(
      location.href,
      Array.from(location.ancestorOrigins),
      root.top === root
    )
  )
    return;
  if (root.zdhHarvestTheme) return;
  const defaults = { enabled: true, theme: 'native', harvestTheme: false, customThemes: {} };
  let style = null,
    prefs = { ...defaults };
  const forced = matchMedia('(forced-colors: active)');
  let preview = false;
  function apply() {
    style?.remove();
    style = null;
    delete document.documentElement.dataset.zdhHarvestTheme;
    const theme = root.zdhThemes.systemTheme(preview ? 'custom-preview' : prefs.theme);
    if (!prefs.enabled || !prefs.harvestTheme || forced.matches || !root.zdhThemes.resolve(theme))
      return;
    const { tokens: t, variables } = root.zdhThemes.compileTheme(theme);
    const aliases = {
      '--pds-text': t.text,
      '--pds-charcoal': t.text,
      '--pds-text-muted': t.muted,
      '--pds-gray': t.muted,
      '--pds-gray-100': t.hover,
      '--pds-gray-150': t.border,
      '--pds-gray-200': t.border,
      '--pds-gray-300': t.controlBorder,
      '--pds-gray-400': t.controlBorder,
      '--pds-gray-500': t.muted,
      '--pds-gray-600': t.muted,
      '--pds-gray-700': t.text,
      '--pds-gray-800': t.text,
      '--pds-gray-900': t.text,
      '--pds-blue': t.link,
      '--pds-blue-100': t.selected,
      '--pds-blue-500': t.link,
      '--pds-blue-600': t.link,
      '--pds-green': t.accent,
      '--pds-green-500': t.accent,
      '--pds-green-600': t.accent
    };
    for (const level of [100, 150, 200, 300, 400, 500, 600, 700, 800, 900])
      aliases['--pds-gray-alpha-' + level] = level < 300 ? t.border : t.muted;
    style = document.createElement('style');
    style.id = 'zdh-harvest-theme-variables';
    style.textContent = `html[data-zdh-harvest-theme]{${Object.entries({ ...variables, ...aliases })
      .map(([name, value]) => `${name}:${value}!important`)
      .join(';')}}`;
    (document.head || document.documentElement).append(style);
    document.documentElement.dataset.zdhHarvestTheme = theme;
  }
  function read() {
    chrome.storage.local.get(defaults, (next) => {
      prefs = { ...next, theme: next.theme === 'viridian' ? 'purple' : next.theme };
      root.zdhThemes.setCustomThemes(prefs.customThemes);
      apply();
    });
  }
  chrome.storage.onChanged.addListener((changes, area) => {
    if (
      area === 'local' &&
      (changes.theme || changes.enabled || changes.harvestTheme || changes.customThemes)
    )
      read();
  });
  chrome.runtime?.onConnect?.addListener((port) => {
    if (
      port.name !== 'zdh-theme-preview' ||
      port.sender?.id !== chrome.runtime.id ||
      port.sender?.url !== chrome.runtime.getURL('src/popup/popup.html')
    )
      return;
    port.onMessage.addListener((message) => {
      try {
        if (message.type === 'preview') {
          root.zdhThemes.setPreview(message.palette);
          preview = true;
        } else preview = false;
        apply();
      } catch {}
    });
    port.onDisconnect.addListener(() => {
      preview = false;
      apply();
    });
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', apply);
  forced.addEventListener('change', apply);
  root.zdhHarvestTheme = { apply };
  read();
})(globalThis);
