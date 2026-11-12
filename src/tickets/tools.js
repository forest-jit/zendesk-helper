// Small native-adjacent features: identity titles, reply-mode switch, copy, presence and queue refresh.
// Find a feature by its syncName function. sync() reconnects tools after Zendesk navigation.
// Presence is observed from native DOM signals; this file does not create a presence service.

'use strict';
// Native DOM adapters only: no private Zendesk stores, polling endpoints or remote services.
(function (root) {
  const model = root.zdhTicketModel;
  let ctx = null,
    modeBar = null,
    copyBar = null,
    copyFeedback = null,
    activityBadge = null,
    activityBar = null,
    titleHint = null,
    queueBar = null,
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
  async function switchMode() {
    const state = getState(),
      path = location.pathname,
      transaction = ctx;
    if (!state?.nativeReady || ctx.busy() || !ctx.acquire()) return;
    const target = state.mode === 'public' ? 'internal' : 'public',
      carry = ctx.preferences.carryDraft;
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
    if (!state?.modeButton) return;
    if (
      !modeBar?.isConnected ||
      modeBar.closest('[data-test-id="omnichannel-composer"]') !==
        state.composer?.closest('[data-test-id="omnichannel-composer"]')
    ) {
      modeBar?.remove();
      modeBar = document.createElement('span');
      modeBar.dataset.zdhModeTools = 'true';
      const change = button('', switchMode);
      change.dataset.modeSwitch = 'true';
      const carryLabel = document.createElement('label'),
        carry = document.createElement('input');
      carry.type = 'checkbox';
      carry.dataset.carryDraft = 'true';
      carry.addEventListener('change', () => {
        if (!carry.checked) notice('');
        ctx.preferences.carryDraft = carry.checked;
        chrome.storage.local.set({ carryDraft: carry.checked });
      });
      carryLabel.append(carry, document.createTextNode('Carry this draft'));
      carryLabel.title =
        'Carry text and formatting when switching. A different destination draft is never overwritten.';
      const output = document.createElement('span');
      output.dataset.modeNotice = 'true';
      output.setAttribute('role', 'status');
      modeBar.append(change, carryLabel, output);
      state.modeButton.insertAdjacentElement('afterend', modeBar);
    }
    const change = modeBar.querySelector('[data-mode-switch]');
    text(change, state.mode === 'public' ? 'Internal note' : 'Public reply');
    change.title = state.mode === 'public' ? 'Switch to internal note' : 'Switch to public reply';
    const disabled = ctx.busy() || !['public', 'internal'].includes(state.mode);
    if (change.disabled !== disabled) change.disabled = disabled;
    modeBar.querySelector('input').checked = ctx.preferences.carryDraft;
  }
  function syncCopy(state) {
    const field = state?.grid?.querySelector('input[data-test-id="omni-header-subject"]');
    if (!field) return;
    if (copyBar?.isConnected && state.grid.contains(copyBar)) {
      const row = state.conversation?.querySelector('[data-zdh-history-row]');
      if (row && copyBar.parentElement !== row) {
        row.append(copyBar);
        if (copyFeedback) row.append(copyFeedback);
        if (activityBadge) row.append(activityBadge);
      }
      return;
    }
    copyBar?.remove();
    copyFeedback?.remove();
    copyBar = document.createElement('details');
    copyBar.dataset.zdhCopyTools = 'true';
    const summary = document.createElement('summary');
    summary.textContent = 'Copy ticket';
    const actions = document.createElement('div');
    actions.setAttribute('role', 'group');
    actions.setAttribute('aria-label', 'Copy ticket');
    const output = document.createElement('span');
    output.setAttribute('role', 'status');
    output.dataset.zdhCopyFeedback = 'true';
    copyFeedback = output;
    for (const [format, label] of [
      ['number', 'Copy number'],
      ['url', 'Copy link'],
      ['title', 'Copy title and link'],
      ['markdown', 'Copy Markdown link']
    ])
      actions.append(
        button(label, async () => {
          try {
            const id = location.pathname.match(/^\/agent\/tickets\/(\d+)$/)?.[1];
            if (!id) throw Error('Open a ticket first.');
            const title =
              getState()?.grid?.querySelector('input[data-test-id="omni-header-subject"]')?.value ||
              '';
            const url = location.origin + '/agent/tickets/' + id;
            await navigator.clipboard.writeText(model.copyText({ id, title, url }, format));
            text(output, '');
            copyBar.open = false;
          } catch (error) {
            text(output, error.message);
          }
        })
      );
    copyBar.append(summary, actions);
    const panel = copyBar;
    panel.addEventListener('pointerenter', (event) => {
      if (event.pointerType !== 'touch') panel.open = true;
    });
    panel.addEventListener('pointerleave', (event) => {
      if (event.pointerType !== 'touch') panel.open = false;
    });
    summary.addEventListener('click', (event) => {
      if (event.detail && matchMedia('(hover: hover)').matches) {
        event.preventDefault();
        panel.open = true;
      }
    });
    panel.addEventListener('focusout', (event) => {
      if (!panel.contains(event.relatedTarget)) panel.open = false;
    });
    panel.addEventListener('keydown', (event) => {
      if (event.target === summary && ['Enter', ' '].includes(event.key)) {
        event.preventDefault();
        panel.open = !panel.open;
      } else if (event.key === 'Escape') {
        event.preventDefault();
        panel.open = false;
        summary.focus();
      }
    });
    const row = state.conversation?.querySelector('[data-zdh-history-row]');
    if (row) row.append(copyBar);
    else field.insertAdjacentElement('afterend', copyBar);
    copyBar.insertAdjacentElement('afterend', output);
  }
  // Read accessible native collision labels. No signal is unknown, not proof nobody is there.
  function nativeActivity() {
    return model.activity(
      [
        ...document.querySelectorAll(
          '[data-test-id*="collision"],[data-test-id*="presence"],[aria-label*=" is editing" i],[aria-label*=" is viewing" i],[title*=" is editing" i],[title*=" is viewing" i]'
        )
      ]
        .filter(
          (e) =>
            visible(e) &&
            !e.closest(
              '[data-zdh-activity],[data-zdh-presence],article,[data-test-id="omnichannel-composer"]'
            )
        )
        .map((e) => e.getAttribute('aria-label') || e.title || e.textContent)
    );
  }
  function syncActivity(state) {
    const composer = state?.composer?.closest('[data-test-id="omnichannel-composer"]');
    if (!composer) return;
    if (!activityBar?.isConnected || activityBar.parentElement !== composer.parentElement) {
      activityBar?.remove();
      activityBar = document.createElement('div');
      activityBar.dataset.zdhActivity = 'true';
      activityBar.setAttribute('role', 'status');
      composer.insertAdjacentElement('beforebegin', activityBar);
    }
    const a = nativeActivity();
    if (!activityBadge?.isConnected || !state.grid.contains(activityBadge)) {
      activityBadge?.remove();
      activityBadge = document.createElement('span');
      activityBadge.dataset.zdhPresence = 'true';
      const trigger = document.createElement('button');
      trigger.type = 'button';
      trigger.dataset.presenceTrigger = 'true';
      const tooltip = document.createElement('span');
      tooltip.role = 'tooltip';
      tooltip.id = 'zdh-presence-' + crypto.randomUUID();
      trigger.setAttribute('aria-describedby', tooltip.id);
      activityBadge.append(trigger, tooltip);
      const copy = state.grid.querySelector('[data-zdh-copy-tools]');
      if (copy) copy.insertAdjacentElement('afterend', activityBadge);
      else
        state.grid
          .querySelector('input[data-test-id="omni-header-subject"]')
          ?.insertAdjacentElement('afterend', activityBadge);
    }
    const copy = state.grid.querySelector('[data-zdh-copy-tools]');
    if (copy && activityBadge.parentElement !== copy.parentElement)
      copy.insertAdjacentElement('afterend', activityBadge);
    const badge = activityBadge.querySelector('button'),
      tooltip = activityBadge.querySelector('[role="tooltip"]');
    const unknownHelp =
      'The helper has not found a native Zendesk viewing or editing signal. Someone may still have this ticket open.';
    const label = a.kind === 'unknown' ? 'Other agents: activity unknown' : a.text;
    if (activityBadge.dataset.state !== a.kind) {
      activityBadge.dataset.state = a.kind;
      badge.innerHTML =
        a.kind === 'unknown'
          ? '<span aria-hidden="true">?</span>'
          : a.kind === 'editing'
            ? '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m10.5 2 3.5 3.5-7.8 7.8-4.2.7.7-4.2L10.5 2Z" stroke="currentColor" stroke-width="1.3" stroke-linejoin="round"/><path d="m9 3.5 3.5 3.5" stroke="currentColor" stroke-width="1.3"/></svg>'
            : '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 8s2.5-4.5 7-4.5S15 8 15 8s-2.5 4.5-7 4.5S1 8 1 8Z" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="8" r="2" stroke="currentColor" stroke-width="1.3"/></svg>';
    }
    if (badge.getAttribute('aria-label') !== label) badge.setAttribute('aria-label', label);
    text(tooltip, a.kind === 'unknown' ? label + '. ' + unknownHelp : label);
    activityBar.dataset.state = a.kind;
    text(activityBar, a.kind === 'unknown' ? 'Other agents · unknown' : a.text);
    activityBar.title =
      a.kind === 'unknown' ? unknownHelp : 'Reported by Zendesk’s native collision indicator.';
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
            syncActivity(state);
          }
        }
      }, 1000);
    syncQueue();
    const state = getState();
    if (!state) return;
    syncTitle(state);
    syncMode(state);
    syncCopy(state);
    syncActivity(state);
  }
  function clear() {
    if (timer) clearInterval(timer);
    timer = null;
    for (const e of [
      modeBar,
      copyBar,
      copyFeedback,
      activityBadge,
      activityBar,
      titleHint,
      queueBar
    ])
      e?.remove();
    modeBar = copyBar = copyFeedback = activityBadge = activityBar = titleHint = queueBar = null;
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
    activity: nativeActivity,
    prepareTitle: (state) => {
      if (ctx?.enabled) syncTitle(state, true);
    }
  };
})(globalThis);
