// Apply compiled theme variables to the Zendesk document and observed native exceptions.
// Revisit cached composers when their mode changes. clear() removes owned styling.
// Forced-colors keeps the operating system's contrast choices authoritative.

'use strict';
(function (root) {
  const forced = root.matchMedia('(forced-colors: active)');
  let selected = 'native',
    enabled = true,
    style = null;
  const system = root.matchMedia('(prefers-color-scheme: dark)');
  let requested = 'native';
  function syncTable(doc = document) {
    if (!doc.documentElement.hasAttribute('data-zdh-theme')) return;
    for (const dialog of doc.querySelectorAll(
      '[role="dialog"][aria-label="Insert Table Button"]'
    )) {
      const focused = dialog.querySelector('button.data-focused-cell');
      const size = focused?.getAttribute('aria-label')?.match(/^(\d+) x (\d+)$/);
      for (const cell of dialog.querySelectorAll('button[aria-label]')) {
        const position = cell.getAttribute('aria-label').match(/^(\d+) x (\d+)$/);
        const selected = String(
          Boolean(
            size &&
            position &&
            Number(position[1]) <= Number(size[1]) &&
            Number(position[2]) <= Number(size[2])
          )
        );
        if (cell.dataset.zdhTableSelected !== selected) cell.dataset.zdhTableSelected = selected;
      }
    }
  }
  for (const event of ['pointerover', 'keyup', 'focusin'])
    document.addEventListener(
      event,
      (e) => {
        if (e.target.closest?.('[role="dialog"][aria-label="Insert Table Button"]'))
          root.requestAnimationFrame(() => syncTable());
      },
      true
    );
  function syncMerge(doc = document) {
    for (const dialog of doc.querySelectorAll('[data-test-id="merge-drawer"]')) {
      const label = [...dialog.querySelectorAll('div')].find(
        (e) => !e.childElementCount && /^Step \d+ of \d+$/.test(e.textContent.trim())
      );
      const step = label?.textContent.match(/Step (\d+) of (\d+)/),
        bar = label?.nextElementSibling;
      if (step && bar?.children.length === Number(step[2]))
        [...bar.children].forEach((part, index) => {
          const value = index < Number(step[1]) ? 'active' : 'pending';
          if (part.dataset.zdhMergeStep !== value) part.dataset.zdhMergeStep = value;
        });
      for (const button of dialog.querySelectorAll('button'))
        if (button.textContent.trim() === 'Next') button.dataset.zdhMergeNext = 'true';
    }
  }
  function sync(doc = document) {
    if (!doc.documentElement.hasAttribute('data-zdh-theme')) return;
    syncTable(doc);
    syncMerge(doc);
    for (const composer of doc.querySelectorAll('[data-test-id="omnichannel-composer"]')) {
      const button = composer.querySelector('[data-test-id="omnichannel-channel-switcher-button"]');
      const mode = root.zdhWorkflow.normalizeMode(
        button?.getAttribute('aria-label') || button?.textContent
      );
      if (composer.dataset.zdhComposerMode !== mode) composer.dataset.zdhComposerMode = mode;
    }
  }
  function apply(id = selected, value = enabled) {
    id = id === 'viridian' ? 'purple' : id;
    requested = id;
    id = root.zdhThemes.systemTheme(id);
    selected = root.zdhThemes.resolve(id) ? id : 'native';
    enabled = value;
    style?.remove();
    style = null;
    delete document.documentElement.dataset.zdhTheme;
    for (const node of document.querySelectorAll('[data-zdh-composer-mode]'))
      delete node.dataset.zdhComposerMode;
    for (const node of document.querySelectorAll('[data-zdh-table-selected]'))
      delete node.dataset.zdhTableSelected;
    for (const node of document.querySelectorAll('[data-zdh-merge-step],[data-zdh-merge-next]')) {
      delete node.dataset.zdhMergeStep;
      delete node.dataset.zdhMergeNext;
    }
    if (!enabled || selected === 'native' || forced.matches) return;
    const { variables } = root.zdhThemes.compileTheme(selected);
    style = document.createElement('style');
    style.id = 'zdh-theme-variables';
    style.textContent = `html[data-zdh-theme="${selected}"]{${Object.entries(variables)
      .map(([name, val]) => `${name}:${val}!important`)
      .join(';')}}`;
    (document.head || document.documentElement).append(style);
    document.documentElement.dataset.zdhTheme = selected;
    sync();
  }
  forced.addEventListener('change', () => apply(requested));
  system.addEventListener('change', () => {
    if (requested === 'system') apply(requested);
  });
  root.zdhThemePage = { apply, sync };
})(globalThis);
