// Shared theme picker for the small toolbar popup and the full Settings page.
// Hover paints only this document. onChoose is the only path that saves a selection.
'use strict';
(function (root) {
  let style = null;
  const builtins = [
    ['system', 'System light / dark'],
    ['native', 'Zendesk default'],
    ['daylight', 'Daylight'],
    ['midnight', 'Midnight'],
    ['blush', 'Blush pink'],
    ['forest', 'Forest'],
    ['purple', 'Deep Purple'],
    ['magenta', 'Magenta'],
    ['jones', 'Jones IT'],
    ['tealPink', 'Teal & Pink'],
    ['pinkTeal', 'Pink & Teal'],
    ['copper', 'Copper'],
    ['chestnut', 'Chestnut'],
    ['catppuccin', 'Catppuccin Mocha'],
    ['dracula', 'Dracula'],
    ['tokyoNight', 'Tokyo Night'],
    ['nord', 'Nord'],
    ['gruvbox', 'Gruvbox Dark'],
    ['oneDark', 'One Dark']
  ];
  function paint(id) {
    style?.remove();
    style = null;
    delete document.documentElement.dataset.zdhTheme;
    id = root.zdhThemes.systemTheme(id);
    if (matchMedia('(forced-colors: active)').matches || !root.zdhThemes.resolve(id)) return;
    const { variables } = root.zdhThemes.compileTheme(id);
    style = document.createElement('style');
    style.textContent = `:root{${Object.entries(variables)
      .map(([name, value]) => `${name}:${value}`)
      .join(';')}}`;
    document.head.append(style);
    document.documentElement.dataset.zdhTheme = id;
  }
  function createPicker({ preferences, onChoose, onError }) {
    const $ = (id) => document.getElementById(id);
    const label = (id) =>
      builtins.find(([key]) => key === id)?.[1] ||
      preferences().customThemes[id]?.name ||
      'Zendesk default';
    function close() {
      const wasOpen = !$('theme-options').hidden;
      $('theme-options').hidden = true;
      $('theme-trigger').setAttribute('aria-expanded', 'false');
      paint(preferences().theme);
      if (wasOpen) $('theme-trigger').focus();
    }
    function render() {
      const prefs = preferences();
      const entries = [
        ...builtins,
        ...Object.entries(prefs.customThemes)
          .filter(([id]) => root.zdhThemes.resolve(id))
          .map(([id, entry]) => [id, entry.name])
      ];
      $('theme').replaceChildren();
      $('theme-options').replaceChildren();
      for (const [id, name] of entries) {
        const option = document.createElement('option');
        option.value = id;
        option.textContent = name;
        $('theme').append(option);
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
        const palette = root.zdhThemes.resolve(root.zdhThemes.systemTheme(id));
        for (const role of ['page', 'surface', 'accent']) {
          const dot = document.createElement('i');
          dot.style.backgroundColor =
            palette?.[role] || (role === 'accent' ? '#1f73b7' : '#ffffff');
          swatches.append(dot);
        }
        const text = document.createElement('span');
        text.textContent = name;
        button.append(swatches, text);
        button.addEventListener('pointerenter', () => paint(id));
        button.addEventListener('focus', () => paint(id));
        button.addEventListener('click', async () => {
          try {
            await onChoose(id);
          } catch (error) {
            onError(error.message);
          }
        });
        $('theme-options').append(button);
      }
      $('theme').value = prefs.theme;
      $('theme-name').textContent = label(prefs.theme);
    }
    $('theme-trigger').addEventListener('click', () => {
      if (!$('theme-options').hidden) return close();
      $('theme-options').hidden = false;
      $('theme-trigger').setAttribute('aria-expanded', 'true');
      const buttons = [...$('theme-options').children];
      (buttons.find((e) => e.dataset.id === preferences().theme) || buttons[0]).focus();
    });
    $('theme-options').addEventListener('pointerleave', () => paint(preferences().theme));
    $('theme-options').addEventListener('keydown', (event) => {
      const options = [...$('theme-options').children];
      const index = options.indexOf(document.activeElement);
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
        close();
      } else if (event.key === 'Tab') close();
    });
    document.addEventListener('pointerdown', (event) => {
      if (
        !$('theme-options').hidden &&
        !$('theme-options').contains(event.target) &&
        !$('theme-trigger').contains(event.target)
      )
        close();
    });
    for (const query of ['(forced-colors: active)', '(prefers-color-scheme: dark)'])
      matchMedia(query).addEventListener('change', () => paint(preferences().theme));
    return { render, close, label };
  }
  const api = { paint, createPicker, builtins };
  root.zdhThemeControls = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(globalThis);
