// Small native-adjacent features: identity titles, reply-mode switch, copy and queue refresh.
// Find a feature by its syncName function. sync() reconnects tools after Zendesk navigation.

'use strict';
// Native DOM adapters only: no private Zendesk stores, polling endpoints or remote services.
(function (root) {
  const model = root.zdhTicketModel;
  let ctx = null,
    modeBar = null,
    copyBar = null,
    copyFeedback = null,
    titleHint = null,
    queueBar = null,
    nativeModeButtons = new Set(),
    lastInput = Date.now(),
    lastRefresh = 0,
    pendingRefresh = null,
    refreshPath = '',
    timer = null;
  const carried = new Map(),
    titleHistory = new Map(),
    identitySeen = new Map();
  const visible = (e) =>
    !!e?.isConnected &&
    e.getClientRects().length > 0 &&
    getComputedStyle(e).display !== 'none' &&
    getComputedStyle(e).visibility !== 'hidden';
  const text = (e, value) => {
    if (e && e.textContent !== value) e.textContent = value;
  };
  const button = (label, handler) => {
    const e = document.createElement('button');
    e.type = 'button';
    e.textContent = label;
    e.addEventListener('click', handler);
    return e;
  };
  const getState = () => ctx?.state?.();
  const editorOf = (s) =>
    s?.composer?.matches('[data-test-id="omnicomposer-rich-text-ckeditor"]')
      ? s.composer
      : s?.composer?.querySelector('[data-test-id="omnicomposer-rich-text-ckeditor"]');
  const live = (path) =>
    ctx?.enabled && location.pathname === path && getState()?.grid?.isConnected;
  function notice(value) {
    text(modeBar?.querySelector('[data-mode-notice]'), value);
  }
  function identity(state) {
    const selected = state?.properties?.querySelector(
      '[data-test-id="ticket-system-field-requester-select"] [data-garden-id="dropdowns.combobox.value"]'
    );
    const input = state?.properties?.querySelector(
      '[data-test-id="ticket-system-field-requester-select"] input,input[aria-label="Requester"]'
    );
    let requester = (selected?.textContent || (!selected ? input?.value : '') || '').trim();
    if (
      requester === input?.getAttribute('placeholder') ||
      /^(?:search name or contact info|select requester|loading[. …]*)$/i.test(requester)
    )
      requester = '';
    let organization =
      [
        ...document.querySelectorAll(
          '[data-test-id="tabs-nav-item-organizations"],[data-test-id="organization_id-field-test-id"]'
        )
      ]
        .find(visible)
        ?.textContent.trim()
        .replace(/^Org\.\s*/i, '') || '';
    if (/^(?:-|none|select an? organization|loading[. …]*)$/i.test(organization)) organization = '';
    return { requester, organization };
  }
  function writeSubject(field, value) {
    const prior = document.activeElement;
    field.focus({ preventScroll: true });
    field.select();
    const applied = document.execCommand('insertText', false, value);
    if (!applied) {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set;
      if (setter) {
        setter.call(field, value);
        field.dispatchEvent(
          new InputEvent('input', {
            bubbles: true,
            composed: true,
            inputType: 'insertReplacementText',
            data: value
          })
        );
      }
    }
    field.dispatchEvent(new Event('change', { bubbles: true }));
    if (prior && prior !== field && prior.isConnected) prior.focus({ preventScroll: true });
    return field.value === value;
  }
  function syncTitle(state, force = false) {
    const field = state?.grid?.querySelector('input[data-test-id="omni-header-subject"]');
    if (!field) return;
    const identityNow = identity(state),
      next = model.identityTitle(field.value, identityNow);
    const signature = JSON.stringify(identityNow),
      seen = identitySeen.get(location.pathname);
    if (!seen || seen.signature !== signature)
      identitySeen.set(location.pathname, { signature, at: Date.now() });
    const stableIdentity = seen?.signature === signature && Date.now() - seen.at >= 700;
    if (
      ctx.preferences.autoTitle &&
      !state.readOnly &&
      state.nativeReady &&
      next &&
      next !== field.value &&
      (force ||
        (stableIdentity &&
          document.activeElement !== field &&
          !state.composer?.contains(document.activeElement) &&
          !state.properties?.querySelector('[aria-expanded="true"]') &&
          !ctx.busy()))
    ) {
      const prior = field.value;
      ctx.beforeTitleChange();
      if (writeSubject(field, next)) {
        titleHistory.set(location.pathname, { prior, next });
        ctx.refresh();
      }
    }
    const last = titleHistory.get(location.pathname);
    if (last && field.value === last.next) {
      if (!titleHint?.isConnected || !state.grid.contains(titleHint)) {
        titleHint?.remove();
        titleHint = document.createElement('span');
        titleHint.dataset.zdhTitleHint = 'true';
        titleHint.setAttribute('role', 'status');
        field.insertAdjacentElement('afterend', titleHint);
      }
      if (!titleHint.querySelector('button')) {
        const label = document.createElement('span');
        label.textContent = 'Title updated from company and requester. ';
        titleHint.append(
          label,
          button('Undo', async () => {
            ctx.beforeTitleChange();
            writeSubject(field, last.prior);
            await chrome.storage.local.set({ autoTitle: false });
            titleHistory.delete(location.pathname);
            titleHint?.remove();
            ctx.refresh();
          })
        );
      }
    } else titleHint?.remove();
  }
  function waitFor(test, timeout = 2500) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        try {
          const value = test();
          if (value) return resolve(value);
        } catch {}
        if (Date.now() - start > timeout)
          return reject(Error('Zendesk did not switch modes. Your draft was kept.'));
        setTimeout(tick, 40);
      };
      tick();
    });
  }
  // Zendesk can load a mode before its draft arrives. Wait for stable data before comparing it.
  async function settledEditor(mode, path) {
    let previous = null,
      stable = 0;
    const until = Date.now() + 3500;
    while (Date.now() < until) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const state = getState();
      if (!live(path) || state?.mode !== mode)
        throw Error('Ticket or reply mode changed. Draft copy retained.');
      const editor = editorOf(state);
      if (!editor?.isConnected) continue;
      const current = editor.innerHTML;
      if (current === previous) stable++;
      else stable = 0;
      previous = current;
      if (stable < 4) continue;
      try {
        const result = await ctx.request(editor, 'read');
        return { state, html: result.html };
      } catch {
        stable = 0;
      }
    }
    throw Error('Wait for Zendesk to finish loading this draft. Both drafts were kept.');
  }
  // Carry is opt-in. A distinct destination draft wins; retain both rather than replacing it.
  async function switchMode(requestedMode) {
    const state = getState(),
      path = location.pathname,
      transaction = ctx;
    const target = ['public', 'internal'].includes(requestedMode)
      ? requestedMode
      : state?.mode === 'public'
        ? 'internal'
        : 'public';
    if (
      target === state?.mode ||
      !state?.nativeReady ||
      state.readOnly ||
      ctx.busy() ||
      !ctx.acquire()
    )
      return;
    const carry = ctx.preferences.carryDraft;
    let backupKey = null;
    try {
      if (carry && ctx.uploads(state))
        throw Error('Finish or remove queued attachments before carrying a draft.');
      const source = carry ? (await ctx.request(editorOf(state), 'read')).html : null;
      if (carry && source) {
        backupKey = 'zdh-held-draft:' + path + ':' + state.mode + ':' + crypto.randomUUID();
        await chrome.storage.local.set({
          [backupKey]: { html: source, mode: state.mode, phase: 'uncertain', createdAt: Date.now() }
        });
      }
      if (!live(path)) throw Error('Ticket changed. Draft copy retained.');
      state.modeButton.click();
      const option = await waitFor(() =>
        [...document.querySelectorAll('[role="menuitemcheckbox"],[role="menuitem"]')].find(
          (e) =>
            visible(e) &&
            root.zdhWorkflow.normalizeMode(e.getAttribute('aria-label') || e.textContent) === target
        )
      );
      option.click();
      const destination = await waitFor(() => {
        const s = getState();
        return live(path) && s?.mode === target && editorOf(s)?.isConnected ? s : null;
      });
      editorOf(destination).focus({ preventScroll: true });
      if (carry && source) {
        const current = await settledEditor(target, path);
        const previous = carried.get(path)?.[target];
        const decision = model.transferDecision(source, current.html, previous);
        if (decision === 'conflict') {
          notice('This mode already has a different draft. Both kept; nothing overwritten.');
        } else {
          if (decision === 'replace')
            await ctx.request(editorOf(current.state), 'replace', source, current.html);
          const verified = await settledEditor(target, path);
          if (verified.html !== source)
            throw Error('Zendesk changed the destination draft. Source recovery copy retained.');
          carried.set(path, { public: source, internal: source });
          notice('');
        }
      } else notice('');
      if (backupKey) {
        await chrome.storage.local.remove(backupKey);
        backupKey = null;
      }
      editorOf(destination).focus({ preventScroll: true });
    } catch (error) {
      notice(error.message);
    } finally {
      transaction.release();
      transaction.refresh();
      if (ctx?.enabled) syncMode(getState());
    }
  }
  function syncMode(state) {
    if (!state?.modeButton || state.readOnly || !['public', 'internal'].includes(state.mode)) {
      modeBar?.remove();
      for (const native of nativeModeButtons) native.removeAttribute('data-zdh-native-mode');
      nativeModeButtons.clear();
      return;
    }
    if (!modeBar?.isConnected || !state.modeButton.parentElement.contains(modeBar)) {
      modeBar?.remove();
      modeBar = document.createElement('span');
      modeBar.dataset.zdhModeTools = 'true';
      const choices = document.createElement('span');
      choices.dataset.modeChoices = 'true';
      choices.setAttribute('role', 'radiogroup');
      choices.setAttribute('aria-label', 'Reply visibility');
      for (const [mode, label] of [
        ['public', 'Public reply'],
        ['internal', 'Internal note']
      ]) {
        const choice = button(label, () => switchMode(mode));
        choice.dataset.modeChoice = mode;
        choice.setAttribute('role', 'radio');
        choices.append(choice);
      }
      choices.addEventListener('keydown', async (event) => {
        if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        const target =
          event.key === 'Home'
            ? 'public'
            : event.key === 'End'
              ? 'internal'
              : getState()?.mode === 'public'
                ? 'internal'
                : 'public';
        await switchMode(target);
        modeBar?.querySelector('[aria-checked="true"]')?.focus();
      });
      const output = document.createElement('span');
      output.dataset.modeNotice = 'true';
      output.setAttribute('role', 'status');
      modeBar.append(choices, output);
      state.modeButton.insertAdjacentElement('afterend', modeBar);
    }
    // Keep the native selector in the DOM as the state source and action target.
    // Only our UI replaces its visible trigger; Off restores the original immediately.
    state.modeButton.dataset.zdhNativeMode = 'true';
    nativeModeButtons.add(state.modeButton);
    for (const choice of modeBar.querySelectorAll('[data-mode-choice]')) {
      const selected = choice.dataset.modeChoice === state.mode;
      const disabled = ctx.busy() || !state.nativeReady;
      choice.setAttribute('aria-checked', String(selected));
      choice.tabIndex = selected ? 0 : -1;
      if (choice.disabled !== disabled) choice.disabled = disabled;
    }
  }
  function syncCopy(state) {
    const field = state?.grid?.querySelector('input[data-test-id="omni-header-subject"]');
    if (!field) return;
    const row = state.conversation?.querySelector('[data-zdh-ticket-tools-row]');
    if (copyBar?.isConnected && state.grid.contains(copyBar)) {
      if (row && copyBar.parentElement !== row) {
        row.append(copyBar);
        if (copyFeedback) row.append(copyFeedback);
      }
      return;
    }
    copyBar?.remove();
    copyFeedback?.remove();
    const output = document.createElement('span');
    output.setAttribute('role', 'status');
    output.dataset.zdhCopyFeedback = 'true';
    copyFeedback = output;
    copyBar = button('Copy ticket', async () => {
      try {
        const id = location.pathname.match(/^\/agent\/tickets\/(\d+)$/)?.[1];
        const link = model.ticketLink(id || '');
        // Rich editors receive a linked number; plain-text destinations receive Markdown.
        if (globalThis.ClipboardItem && navigator.clipboard.write) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({
                'text/html': new Blob([link.html], { type: 'text/html' }),
                'text/plain': new Blob([link.plain], { type: 'text/plain' })
              })
            ]);
          } catch {
            await navigator.clipboard.writeText(link.plain);
          }
        } else await navigator.clipboard.writeText(link.plain);
        text(output, '');
      } catch (error) {
        text(output, error.message);
      }
    });
    copyBar.dataset.zdhCopyTools = 'true';
    copyBar.title = 'Copy the ticket number as a link';
    if (row) row.append(copyBar);
    else field.insertAdjacentElement('afterend', copyBar);
    copyBar.insertAdjacentElement('afterend', output);
  }
  function overlayOpen() {
    return [...document.querySelectorAll('[role="dialog"],[role="menu"],[role="listbox"]')].some(
      visible
    );
  }
  // Refresh the native view only when idle. Never reload a ticket page with a draft.
  function syncQueue() {
    const interval = Number(ctx?.preferences.queueRefresh) || 0,
      isView = /^\/agent\/filters\/\d+\/?$/.test(location.pathname);
    if (!ctx?.enabled || !isView) {
      queueBar?.remove();
      queueBar = null;
      pendingRefresh = null;
      refreshPath = '';
      return;
    }
    const refresh = document.querySelector('[data-test-id="views_views-list_header-refresh"]'),
      updated = document.querySelector('[data-test-id="views_views-header-last-refreshed"]');
    if (!visible(refresh) || !updated) return;
    if (refreshPath !== location.pathname) {
      refreshPath = location.pathname;
      lastRefresh = Date.now();
      pendingRefresh = null;
    }
    if (!queueBar?.isConnected) {
      queueBar = document.createElement('span');
      queueBar.dataset.zdhQueueStatus = 'true';
      queueBar.setAttribute('role', 'status');
      updated.insertAdjacentElement('afterend', queueBar);
    }
    const now = Date.now(),
      active = document.activeElement;
    const state = {
      enabled: ctx.enabled,
      interval,
      path: location.pathname,
      visible: !document.hidden,
      online: navigator.onLine,
      editing: !!active?.matches?.(
        'input:not([type="checkbox"]),textarea,[contenteditable="true"],select'
      ),
      selection: !!document.querySelector(
        '[data-test-id="generic-table"] input[type="checkbox"]:checked'
      ),
      overlay: overlayOpen(),
      busy: !!refresh.disabled,
      idleMs: now - lastInput
    };
    if (pendingRefresh) {
      if (
        updated.textContent !== pendingRefresh.before &&
        /just now|0s ago|1s ago/i.test(updated.textContent)
      ) {
        lastRefresh = now;
        pendingRefresh = null;
        queueBar.dataset.lastRefresh = new Date(now).toISOString();
      } else if (now - pendingRefresh.at > 12000) {
        pendingRefresh = null;
        lastRefresh = now + 45000;
      } else {
        text(queueBar, ' · Refreshing…');
        return;
      }
    }
    if (!interval) {
      text(queueBar, ' · Auto-refresh off');
      return;
    }
    if (!model.queueAllowed(state)) {
      text(queueBar, ' · Auto-refresh paused');
      return;
    }
    text(queueBar, ' · Refresh every ' + interval + 's');
    if (now - lastRefresh >= interval * 1000) {
      pendingRefresh = { at: now, before: updated.textContent };
      refresh.click();
      text(queueBar, ' · Refreshing…');
    }
  }
  function sync(options) {
    ctx = options;
    if (!timer)
      timer = setInterval(() => {
        if (ctx?.enabled) {
          syncQueue();
          const state = getState();
          if (state) {
            syncTitle(state);
          }
        }
      }, 1000);
    syncQueue();
    const state = getState();
    if (!state) return;
    syncTitle(state);
    syncMode(state);
    syncCopy(state);
  }
  function clear() {
    if (timer) clearInterval(timer);
    timer = null;
    for (const e of [modeBar, copyBar, copyFeedback, titleHint, queueBar]) e?.remove();
    modeBar = copyBar = copyFeedback = titleHint = queueBar = null;
    for (const native of nativeModeButtons) native.removeAttribute('data-zdh-native-mode');
    nativeModeButtons.clear();
    ctx = null;
  }
  for (const event of ['pointerdown', 'keydown', 'input', 'wheel'])
    document.addEventListener(
      event,
      (e) => {
        if (e.isTrusted) lastInput = Date.now();
      },
      { capture: true, passive: true }
    );
  root.zdhTicketTools = {
    sync,
    clear,
    identity,
    prepareTitle: (state) => {
      if (ctx?.enabled) syncTitle(state, true);
    }
  };
})(globalThis);
