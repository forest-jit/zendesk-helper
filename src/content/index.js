// Start here: this file coordinates the active ticket. Pure decisions live in ../tickets/workflow.js.
// Reading path: mountWorkflow → refreshWorkflow → sendActive / savePropertiesActive.
// Safety boundary: save fields only after parking the draft; restore only if nothing newer exists.
// Full map and glossary: docs/CODE_TOUR.md.

(() => {
  'use strict';
  if (globalThis.zdTitleHelper) return;
  const defaults = {
    enabled: true,
    layout: true,
    context: false,
    theme: 'native',
    customThemes: {},
    autoTitle: true,
    carryDraft: false,
    collapseHistory: true,
    queueRefresh: 15
  };
  let selectedTheme = 'native',
    preferences = { ...defaults };
  let enabled = false,
    armed = false,
    manualField = false,
    field = null,
    host = null,
    layout = false,
    context = false,
    syncFrame = 0,
    warningActionPointer = false,
    composerHost = null,
    propertiesHost = null,
    saveHost = null,
    workflowGrid = null;
  let pageLeaving = false,
    ticketEpoch = 0,
    observedPath = location.pathname,
    activeHeldDraft = null;
  function leavePage() {
    pageLeaving = true;
    ticketEpoch++;
    if (activeHeldDraft) {
      const copy = { ...activeHeldDraft, phase: 'uncertain' };
      chrome.storage.local.set({ [copy.key]: copy }).catch(() => {});
    }
  }
  addEventListener('pagehide', leavePage, true);
  addEventListener(
    'beforeunload',
    () => {
      leavePage();
      setTimeout(() => {
        pageLeaving = false;
      }, 0);
    },
    true
  );
  const saveLock = globalThis.zdhWorkflow.createSaveLock();
  const marked = new Set();
  const propertyBaselines = new WeakMap();
  let pendingCloseExport = null,
    exportFeedback = '';
  function clearWarning() {
    if (field && host?.id) {
      const ids = (field.getAttribute('aria-describedby') || '')
        .split(/\s+/)
        .filter((id) => id && id !== host.id);
      if (ids.length) field.setAttribute('aria-describedby', ids.join(' '));
      else field.removeAttribute('aria-describedby');
    }
    host?.remove();
    host = null;
  }
  function message(text, anchor, action) {
    clearWarning();
    host = document.createElement('div');
    const anchored = Boolean(anchor?.isConnected);
    host.id = 'zdh-warning-' + Math.random().toString(36).slice(2);
    host.dataset.zdhWarning = 'true';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    host.setAttribute('aria-label', text);
    if (!anchored) host.dataset.floating = 'true';
    const root = host.attachShadow({ mode: 'open' });
    const css = document.createElement('style');
    css.textContent =
      ':host{display:block!important;position:relative!important;z-index:2147483647!important}section{pointer-events:auto;margin:6px 0;padding:10px 14px;background:var(--zdh-theme-note,#fff4d6);color:var(--zdh-theme-note-text,#513d09);border:1px solid var(--zdh-theme-attention,#d8ad3e);border-radius:6px;font:14px/1.5 system-ui;white-space:normal}:host([data-floating="true"]) section{pointer-events:none}button{float:right;margin-left:12px;cursor:pointer}';
    const panel = document.createElement('section');
    panel.setAttribute('role', 'status');
    panel.setAttribute('aria-live', 'polite');
    const label = document.createElement('span');
    label.textContent = text;
    const close = document.createElement('button');
    close.type = 'button';
    close.textContent = 'Dismiss';
    close.addEventListener('click', clearWarning);
    if (action) {
      const apply = document.createElement('button');
      apply.type = 'button';
      apply.textContent = action.label;
      apply.addEventListener('pointerdown', () => {
        warningActionPointer = true;
      });
      apply.addEventListener('pointerup', () => {
        warningActionPointer = false;
      });
      apply.addEventListener('pointercancel', () => {
        warningActionPointer = false;
      });
      apply.addEventListener('click', (event) => {
        warningActionPointer = false;
        action.run(event);
      });
      panel.append(apply);
    }
    if (anchored) panel.append(close);
    panel.append(label);
    root.append(css, panel);
    if (anchored) {
      anchor.insertAdjacentElement('afterend', host);
      anchor.setAttribute(
        'aria-describedby',
        [anchor.getAttribute('aria-describedby'), host.id].filter(Boolean).join(' ')
      );
    } else {
      host.style.cssText =
        'position:fixed!important;bottom:70px!important;right:16px!important;max-width:430px!important;pointer-events:none!important';
      document.documentElement.append(host);
    }
  }
  function visible(el) {
    if (!el?.isConnected || el.closest('[hidden],[aria-hidden="true"]')) return false;
    const styles = getComputedStyle(el);
    return (
      styles.display !== 'none' &&
      styles.visibility !== 'hidden' &&
      styles.opacity !== '0' &&
      el.getClientRects().length > 0
    );
  }
  function activeTitle() {
    return (
      [...document.querySelectorAll('input[data-test-id="omni-header-subject"]')].find(visible) ||
      null
    );
  }
  function controlState(grid) {
    return globalThis.zdhWorkspace.readState(grid);
  }
  function clickText(root, text) {
    const wanted = text.toLowerCase();
    const button = [
      ...root.querySelectorAll('button,[role="menuitem"],[role="menuitemcheckbox"],[role="option"]')
    ].find((node) => {
      const label = node.textContent.trim().toLowerCase();
      return visible(node) && (label === wanted || label.endsWith(` as ${wanted}`));
    });
    button?.click();
    return Boolean(button);
  }
  async function chooseNativeStatus(state, status, path = location.pathname, grid = workflowGrid) {
    const active = () => location.pathname === path && workflowGrid === grid && grid?.isConnected;
    if (!active()) return false;
    if (state.status === status && !state.submit.disabled) return true;
    state.statusMenu.click();
    let selected = false;
    for (let i = 0; i < 8 && !selected; i++) {
      if (!active()) return false;
      selected = clickText(
        document,
        status === 'on-hold' ? 'On-hold' : status[0].toUpperCase() + status.slice(1)
      );
      if (!selected) await new Promise((resolve) => setTimeout(resolve, 75));
    }
    if (!selected) return false;
    for (let i = 0; i < 20; i++) {
      if (!active()) return false;
      const latest = controlState(workflowGrid);
      if (latest.status === status && latest.submit?.isConnected && !latest.submit.disabled)
        return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }
  function draftEditor(state) {
    return state.composer?.matches('[data-test-id="omnicomposer-rich-text-ckeditor"]')
      ? state.composer
      : state.composer?.querySelector('[data-test-id="omnicomposer-rich-text-ckeditor"]');
  }
  function hasQueuedAttachments(state) {
    const region = state.composer?.closest('[data-test-id="omnichannel-composer"]');
    if (!region) return false;
    return (
      [...region.querySelectorAll('input[type="file"]')].some((node) => node.files?.length) ||
      [
        ...region.querySelectorAll(
          '[data-test-id*="attachment"],a[download],a[href*="/attachments/"],a[href*="/uploads/"],.ck-upload-placeholder'
        )
      ].some(
        (node) =>
          !node.closest(
            '.ck-editor__editable,[data-test-id="omnichannel-composer-toolbar"],button,[role="button"]'
          ) &&
          visible(node) &&
          Boolean(node.textContent.trim() || node.matches('a,.ck-upload-placeholder'))
      )
    );
  }
  function draftSafe(state) {
    return Boolean(
      draftEditor(state) && document.documentElement.dataset.zdhDraftBridge === 'ready'
    );
  }
  function draftRequest(node, operation, html, expected) {
    return new Promise((resolve, reject) => {
      if (!node) return reject(Error('The native editor is unavailable.'));
      const id = crypto.randomUUID();
      const finish = (event) => {
        let result;
        try {
          result = JSON.parse(event.detail);
        } catch {
          return;
        }
        if (result.id !== id) return;
        clearTimeout(timer);
        node.removeEventListener('zdh-draft-response', finish);
        result.error ? reject(Error(result.error)) : resolve(result);
      };
      const timer = setTimeout(() => {
        node.removeEventListener('zdh-draft-response', finish);
        reject(Error('The editor did not acknowledge draft protection.'));
      }, 1500);
      node.addEventListener('zdh-draft-response', finish);
      node.dispatchEvent(
        new CustomEvent('zdh-draft-request', {
          bubbles: true,
          detail: JSON.stringify({ id, operation, html, expected, path: location.pathname })
        })
      );
    });
  }
  const draftRecoveryBusy = new Set(),
    recoveryPending = new Set(),
    recoveryChecked = new Set(),
    recoveryAfter = new Map();
  function draftKey(mode, path = location.pathname) {
    return 'zdh-held-draft:' + path + ':' + mode;
  }
  function nativeBusy(state) {
    return (
      !state.nativeReady ||
      Boolean(state.submit?.disabled || state.submit?.getAttribute('aria-disabled') === 'true')
    );
  }
  function saveError(previous = new Map()) {
    return [...document.querySelectorAll('[role="alert"]')]
      .filter(visible)
      .some(
        (node) =>
          previous.get(node) !== node.textContent &&
          globalThis.zdhWorkflow.saveFailure(node.textContent)
      );
  }
  function saveNotice(text) {
    const output = saveUI()?.querySelector('[data-state]');
    if (output && output.textContent !== text) output.textContent = text;
  }
  async function draftBackups(path = location.pathname) {
    const values = await chrome.storage.local.get(null),
      prefix = 'zdh-held-draft:' + path + ':';
    return Object.entries(values)
      .filter(
        ([key, value]) =>
          key.startsWith(prefix) &&
          typeof value?.html === 'string' &&
          ['public', 'internal'].includes(value.mode)
      )
      .map(([key, value]) => ({ ...value, key }));
  }
  // Resume after reload/navigation. Keep backups until the current native draft is verified.
  async function recoverDraft(state) {
    const path = location.pathname,
      key = draftKey(state.mode),
      now = Date.now();
    if (pageLeaving) return;
    if (
      saveLock.busy ||
      !draftSafe(state) ||
      state.mode === 'unknown' ||
      draftRecoveryBusy.has(key) ||
      (recoveryAfter.get(key) || 0) > now
    )
      return;
    recoveryAfter.set(key, now + 500);
    draftRecoveryBusy.add(key);
    try {
      const backups = await draftBackups(path);
      if (location.pathname !== path || saveLock.busy) return;
      recoveryChecked.add(path);
      if (!backups.length) {
        recoveryPending.delete(path);
        const button = saveUI()?.querySelector('[data-recovery-copy]');
        if (button) button.hidden = true;
        return;
      }
      recoveryPending.add(path);
      const button = saveUI()?.querySelector('[data-recovery-copy]');
      if (button) button.hidden = false;
      const latest = controlState(workflowGrid);
      if (nativeBusy(latest)) {
        saveNotice('Zendesk is still saving. Your draft backup is safe.');
        setTimeout(scheduleSync, 500);
        return;
      }
      const matching = backups.filter((backup) => backup.mode === latest.mode);
      if (!matching.length) {
        saveNotice(
          'A held ' +
            (backups[0].mode === 'internal' ? 'internal note' : 'public reply') +
            ' is available. Switch reply mode to recover it.'
        );
        return;
      }
      if (new Set(matching.map((backup) => backup.html)).size > 1) {
        saveNotice(
          'Different saved drafts need review. Save a recovery copy to keep all versions.'
        );
        return;
      }
      const node = draftEditor(latest),
        current = await draftRequest(node, 'read');
      const backup = matching[0],
        decision = globalThis.zdhWorkflow.draftRecoveryAction({
          currentHtml: current.html,
          backupHtml: backup.html,
          phase: backup.phase,
          nativeBusy: false
        });
      if (decision === 'conflict') {
        await draftRequest(node, 'unlock');
        saveNotice('A newer draft is present. Save a recovery copy to keep both versions.');
        return;
      }
      if (decision === 'restore') {
        // Recovered data must survive late native hydration and another reload.
        for (const item of matching) {
          item.phase = 'uncertain';
          await chrome.storage.local.set({ [item.key]: item });
        }
        await draftRequest(node, 'restore', backup.html);
      } else await draftRequest(node, 'unlock');
      // Submitted/uncertain copies remain available until explicitly saved to a local file.
      const safe =
        decision === 'restore'
          ? []
          : matching.filter((item) => ['held', 'settled'].includes(item.phase || 'held'));
      if (pageLeaving || location.pathname !== path) return;
      if (safe.length) await chrome.storage.local.remove(safe.map((item) => item.key));
      if (safe.length === backups.length) {
        recoveryPending.delete(path);
        if (button) button.hidden = true;
        saveNotice('');
      } else
        saveNotice(
          'Draft restored. Save a recovery copy before continuing; the interrupted save was not confirmed.'
        );
    } catch (error) {
      saveNotice(error.message);
    } finally {
      draftRecoveryBusy.delete(key);
      refreshRecoveryButtons();
    }
  }
  function refreshRecoveryButtons() {
    const blocked =
      recoveryPending.has(location.pathname) || !recoveryChecked.has(location.pathname);
    if (blocked) {
      const send = composerUI()?.querySelector('[data-send]'),
        save = saveUI()?.querySelector('[data-save]');
      if (send) {
        send.disabled = true;
        send.title = 'Resolve the held draft before sending.';
      }
      if (save) save.disabled = true;
    }
  }
  async function downloadDraftRecovery() {
    if (saveLock.busy) return;
    const path = location.pathname;
    try {
      const backups = await draftBackups(path);
      if (!backups.length || location.pathname !== path) return;
      if (nativeBusy(controlState(workflowGrid)))
        throw Error('Wait for Zendesk to finish before releasing the recovery copy.');
      const ticketId = path.match(/\/tickets\/(\d+)/)?.[1];
      const result = await chrome.runtime.sendMessage({
        type: 'zdh-download',
        filename: `ticket-${ticketId}-draft-recovery-${Date.now()}.raw.json`,
        text: JSON.stringify({ schemaVersion: 1, ticketId, drafts: backups }, null, 2)
      });
      if (result?.error || result?.downloadId === undefined)
        throw Error(
          result?.error || 'The recovery download did not complete. Backups were retained.'
        );
      await chrome.storage.local.remove(backups.map((item) => item.key));
      recoveryPending.delete(path);
      recoveryAfter.clear();
      if (location.pathname === path) {
        saveNotice('');
        refreshWorkflow();
      }
    } catch (error) {
      saveNotice(error.message);
    }
  }
  function composerUI() {
    return composerHost?.shadowRoot;
  }
  function propertiesUI() {
    return propertiesHost?.shadowRoot;
  }
  function saveUI() {
    return saveHost?.shadowRoot;
  }
  function propertySnapshot(state) {
    const copy = state.properties?.cloneNode(true);
    copy
      ?.querySelectorAll(
        '[role="listbox"],button,[data-zdh-properties-actions],[data-zdh-additional-toggle]'
      )
      .forEach((node) => node.remove());
    const controls = [...(state.properties?.querySelectorAll('input,textarea,select') || [])]
      .filter((node) => !node.hidden && node.type !== 'hidden')
      .map((node) => [
        node.getAttribute('aria-label') || node.name || node.type,
        node.type === 'checkbox' ? node.checked : node.value
      ]);
    return JSON.stringify([
      activeTitle()?.value || '',
      copy?.textContent.replace(/\s+/g, ' ').trim() || '',
      controls
    ]);
  }
  function propertyRecord(state) {
    let record = propertyBaselines.get(workflowGrid);
    if (!record) {
      record = {
        snapshot: propertySnapshot(state),
        status: persistedTicketStatus() || state.status,
        armed: false,
        pending: false
      };
      propertyBaselines.set(workflowGrid, record);
    }
    return record;
  }
  // Baselines distinguish user field edits from late native hydration after a save.
  function propertyDirty(state, status) {
    const record = propertyRecord(state),
      snapshot = propertySnapshot(state);
    const tab = document.querySelector(
      '[data-test-id="header-tab"][data-entity-is-selected="true"]'
    );
    if (record.pending) {
      const busy = Boolean(
        state.submit?.disabled || state.submit?.getAttribute('aria-disabled') === 'true'
      );
      record.pending.sawBusy = record.pending.sawBusy || busy;
      const hasError = [...document.querySelectorAll('[role="alert"]')].some(
        (node) => visible(node) && globalThis.zdhWorkflow.saveFailure(node.textContent)
      );
      if (
        globalThis.zdhWorkflow.saveAcknowledged({
          nativeReady: state.nativeReady,
          nativeBusy: busy,
          sawBusy: record.pending.sawBusy,
          tabModified: tab?.getAttribute('data-entity-is-modified') !== 'false',
          hasError
        })
      ) {
        record.snapshot = record.pending.snapshot;
        record.status = record.pending.status;
        record.armed = true;
        record.settling = { editVersion: record.editVersion || 0, until: Date.now() + 1500 };
        const savedStatus = record.pending.status;
        record.pending = false;
        const select = propertiesUI()?.querySelector('[data-status]');
        if (select?.value === savedStatus) {
          delete select.dataset.touched;
          select.value = state.status;
        }
        const output = saveUI()?.querySelector('[data-state]');
        if (output) output.textContent = '';
      }
    }
    if (!record.armed) {
      record.snapshot = snapshot;
      record.status = persistedTicketStatus() || state.status;
    }
    if (
      globalThis.zdhWorkflow.shouldRebaseProperties({
        settling: record.settling,
        now: Date.now(),
        editVersion: record.editVersion || 0,
        nativeBusy: nativeBusy(state),
        statusMatches:
          status === record.status &&
          state.status === record.status &&
          persistedTicketStatus() === record.status
      })
    )
      record.snapshot = snapshot;
    return snapshot !== record.snapshot || status !== record.status;
  }
  function beginPropertyEdit(event) {
    if (!workflowGrid) return;
    const state = controlState(workflowGrid);
    if (!state.properties?.contains(event.target) && event.target !== activeTitle()) return;
    const record = propertyRecord(state);
    if (event.type !== 'focusin' && event.isTrusted)
      record.editVersion = (record.editVersion || 0) + 1;
    if (!record.armed) {
      record.snapshot = propertySnapshot(state);
      record.armed = true;
    }
  }
  function placeComposerHost(state) {
    const toolbar = state.grid?.querySelector('[data-test-id="omnichannel-composer-toolbar"]');
    const target =
      toolbar ||
      state.composer?.closest('.composer,[aria-label="Message composer"]') ||
      state.conversation;
    if (target && composerHost.parentElement !== target) target.append(composerHost);
  }
  function persistedTicketStatus() {
    const breadcrumb = [
      ...document.querySelectorAll('[data-test-id="tabs-section-nav-item-ticket"]')
    ].find((node) =>
      node.textContent.includes(`Ticket #${location.pathname.match(/\/tickets\/(\d+)/)?.[1]}`)
    );
    return (
      breadcrumb?.querySelector('.ticket_status_label')?.textContent.trim().toLowerCase() || ''
    );
  }
  function finishCloseExport(state) {
    const pending = pendingCloseExport;
    if (!pending || pending.path !== location.pathname) return;
    const busy = Boolean(
      state.submit?.disabled || state.submit?.getAttribute('aria-disabled') === 'true'
    );
    pending.sawBusy = pending.sawBusy || busy;
    // Status saves can replace Zendesk's entire grid, so this receipt survives grid remounts.
    const persisted = persistedTicketStatus() === 'solved';
    const hasError = [...document.querySelectorAll('[role="alert"]')].some(
      (node) => visible(node) && globalThis.zdhWorkflow.saveFailure(node.textContent)
    );
    if (
      !state.nativeReady ||
      busy ||
      hasError ||
      !persisted ||
      (!pending.sawBusy && pending.previousStatus === 'solved')
    )
      return;
    pendingCloseExport = null;
    exportFeedback = 'Saving local export…';
    pending.ticket.status = 'solved';
    pending.ticket.closedAt = new Date().toISOString();
    deliverExport(pending.ticket, 'json')
      .then((file) => {
        const output = saveUI()?.querySelector('[data-state]');
        exportFeedback = '';
        if (output) {
          output.textContent = exportFeedback;
          output.title = file.filename || '';
        }
      })
      .catch((error) => {
        const output = saveUI()?.querySelector('[data-state]');
        exportFeedback = 'Ticket saved, but export failed: ' + error.message;
        if (output) output.textContent = exportFeedback;
      });
  }
  // Render action availability from fresh native state. This function never submits anything.
  function refreshWorkflow() {
    if (!workflowGrid || !composerHost?.isConnected || !propertiesHost?.isConnected) return;
    const state = controlState(workflowGrid),
      composer = composerUI(),
      properties = propertiesUI(),
      status = properties.querySelector('[data-status]');
    composerHost.dataset.mode = state.mode;
    composerHost.hidden = Boolean(state.readOnly);
    saveHost.hidden = Boolean(state.readOnly);
    if (state.readOnly) delete status.dataset.touched;
    if (!status.dataset.touched)
      status.value =
        state.status === 'closed'
          ? 'closed'
          : globalThis.zdhWorkflow.statuses.has(state.status)
            ? state.status
            : 'unknown';
    const statusTrigger = properties.querySelector('#zdh-status-trigger');
    statusTrigger.disabled = Boolean(state.readOnly || !state.nativeReady);
    statusTrigger.title =
      state.status === 'closed'
        ? 'This ticket is closed and cannot be edited.'
        : statusTrigger.disabled
          ? 'Zendesk status controls are unavailable.'
          : '';
    if (
      statusTrigger.disabled &&
      properties.querySelector('#zdh-status-menu').matches(':popover-open')
    )
      properties.querySelector('#zdh-status-menu').hidePopover();
    const statusText = status.selectedOptions[0]?.textContent || status.value;
    const statusValue = properties.querySelector('[data-status-value]');
    if (statusValue.textContent !== statusText) statusValue.textContent = statusText;
    for (const option of properties.querySelectorAll('[role="option"]')) {
      const selected = String(option.dataset.value === status.value);
      if (option.getAttribute('aria-selected') !== selected)
        option.setAttribute('aria-selected', selected);
    }
    const sendGate = globalThis.zdhWorkflow.canSend({
      mode: state.mode,
      publicReviewed: true,
      composerContent: state.composerContent,
      busy:
        saveLock.busy ||
        recoveryPending.has(location.pathname) ||
        !recoveryChecked.has(location.pathname),
      nativeReady: !state.readOnly && state.nativeReady && !nativeBusy(state)
    });
    const saveGate = globalThis.zdhWorkflow.canSaveProperties({
      draftSafe: draftSafe(state),
      composerContent: state.composerContent,
      status: status.value,
      busy:
        saveLock.busy ||
        recoveryPending.has(location.pathname) ||
        !recoveryChecked.has(location.pathname),
      nativeReady: !state.readOnly && state.nativeReady && !nativeBusy(state),
      dirty: propertyDirty(state, status.value)
    });
    composer.querySelector('[data-send]').disabled = !sendGate.allowed;
    composer.querySelector('[data-send]').title = sendGate.reason || 'Send (⌘Enter)';
    composer.querySelector('[data-send]').setAttribute('aria-keyshortcuts', 'Meta+Enter');
    finishCloseExport(state);
    if (exportFeedback) saveUI().querySelector('[data-state]').textContent = exportFeedback;
    if (!saveLock.busy) recoverDraft(state);
    const close = status.value === 'solved';
    saveUI().querySelector('[data-save]').disabled = !saveGate.allowed;
    saveUI().querySelector('[data-save]').textContent = close ? 'Close ticket' : 'Save changes';
    saveUI().querySelector('[data-save]').title =
      saveGate.reason ||
      (close
        ? 'Close ticket as Solved (⌘Enter in ticket fields)'
        : 'Save changes (⌘Enter in ticket fields)');
    saveUI().querySelector('[data-save]').setAttribute('aria-keyshortcuts', 'Meta+Enter');
    const exportButton = saveUI().querySelector('[data-close-export]');
    exportButton.hidden = !close;
    exportButton.disabled = !saveGate.allowed;
    refreshRecoveryButtons();
  }
  function releaseAction() {
    setTimeout(() => {
      saveLock.release();
      refreshWorkflow();
    }, 1200);
  }
  // Send uses the native Submit button. Closed state and unresolved recovery block it.
  async function sendActive() {
    if (
      !workflowGrid ||
      recoveryPending.has(location.pathname) ||
      !recoveryChecked.has(location.pathname) ||
      !saveLock.acquire()
    )
      return false;
    const state = controlState(workflowGrid);
    globalThis.zdhTicketTools?.prepareTitle(state);
    const gate = globalThis.zdhWorkflow.canSend({
      mode: state.mode,
      publicReviewed: true,
      composerContent: state.composerContent,
      busy: false,
      nativeReady: !state.readOnly && state.nativeReady
    });
    if (!gate.allowed) {
      saveLock.release();
      refreshWorkflow();
      return false;
    }
    state.submit.click();
    refreshWorkflow();
    releaseAction();
    return true;
  }
  /**
   * Property-only save, with a draft present:
   * 1. Back up rich editor data locally before touching the native draft.
   * 2. Park the active draft and verify the native editor is empty.
   * 3. Choose status, submit once, and wait for Zendesk acknowledgement.
   * 4. Restore only into the same ticket/mode without replacing newer content.
   * Failure or navigation retains recovery data rather than guessing the save succeeded.
   */
  async function savePropertiesActive({ exportAfterSave = false } = {}) {
    if (!workflowGrid || !saveLock.acquire()) return false;
    const path = location.pathname,
      state = controlState(workflowGrid),
      ui = saveUI(),
      status = propertiesUI().querySelector('[data-status]').value;
    globalThis.zdhTicketTools?.prepareTitle(state);
    const gate = globalThis.zdhWorkflow.canSaveProperties({
      draftSafe: draftSafe(state),
      composerContent: state.composerContent,
      status,
      busy: false,
      nativeReady: !state.readOnly && state.nativeReady,
      dirty: propertyDirty(state, status)
    });
    let held = null,
      submitted = false,
      confirmed = false,
      failed = false,
      composerRegion = null;
    const targetGrid = workflowGrid,
      epoch = ticketEpoch;
    const stillHere = () =>
      !pageLeaving &&
      ticketEpoch === epoch &&
      location.pathname === path &&
      workflowGrid === targetGrid &&
      targetGrid.isConnected;
    try {
      if (!gate.allowed) throw Error(gate.reason);
      if ((await draftBackups(path)).length)
        throw Error('Recover the held draft before saving again.');
      if (!stillHere()) throw Error('The active ticket changed. Nothing was submitted.');
      if (hasQueuedAttachments(state))
        throw Error(
          'Queued attachments must be sent or removed before a property-only save. Your draft was kept.'
        );
      exportFeedback = '';
      ui.querySelector('[data-state]').textContent = 'Saving properties…';
      let exportTicket = null;
      if (exportAfterSave) {
        if (status !== 'solved') throw Error('Choose Solved before exporting.');
        exportTicket = await prepareExport();
      }
      if (location.pathname !== path)
        throw Error('The active ticket changed. Nothing was submitted.');
      // Back up rich editor data before temporarily clearing the active native draft.
      if (globalThis.zdhWorkflow.composerHasContent(state.composerContent)) {
        const node = draftEditor(state),
          snapshot = await draftRequest(node, 'read');
        held = {
          key: draftKey(state.mode, path) + ':' + crypto.randomUUID(),
          html: snapshot.html,
          mode: state.mode,
          phase: 'held',
          createdAt: Date.now()
        };
        await chrome.storage.local.set({ [held.key]: held });
        activeHeldDraft = held;
        if (!stillHere())
          throw Error('Ticket navigation interrupted preparation. The draft backup is safe.');
        composerRegion = node.closest('[data-zdh-composer-mode]');
        if (composerRegion) composerRegion.inert = true;
        await draftRequest(node, 'park', held.html);
      }
      const previousStatus = persistedTicketStatus();
      if (!stillHere()) throw Error('The active ticket changed. Nothing was submitted.');
      if (!(await chooseNativeStatus(controlState(workflowGrid), status, path, targetGrid)))
        throw Error('Zendesk did not confirm the status. Nothing was submitted.');
      const latest = controlState(workflowGrid);
      if (
        location.pathname !== path ||
        !latest.nativeReady ||
        latest.submit.disabled ||
        hasQueuedAttachments(latest) ||
        globalThis.zdhWorkflow.composerHasContent(latest.composerContent)
      )
        throw Error('The editor or ticket changed. Nothing was submitted.');
      propertyRecord(latest).pending = {
        snapshot: propertySnapshot(latest),
        status,
        sawBusy: false
      };
      if (exportTicket)
        pendingCloseExport = { ticket: exportTicket, path, previousStatus, sawBusy: false };
      if (held) {
        held.phase = 'submitted';
        await chrome.storage.local.set({ [held.key]: held });
      }
      const ready = controlState(workflowGrid);
      if (
        !stillHere() ||
        nativeBusy(ready) ||
        hasQueuedAttachments(ready) ||
        globalThis.zdhWorkflow.composerHasContent(ready.composerContent)
      )
        throw Error('The editor or ticket changed. Nothing was submitted.');
      const previousErrors = new Map(
        [...document.querySelectorAll('[role="alert"]')]
          .filter(visible)
          .map((node) => [node, node.textContent])
      );
      ready.submit.click();
      submitted = true;
      let sawBusy = false;
      for (let attempt = 0; attempt < 300; attempt++) {
        if (!stillHere())
          throw Error('Ticket navigation interrupted the save. The draft backup is retained.');
        const current = controlState(workflowGrid),
          busy = Boolean(
            current.submit?.disabled || current.submit?.getAttribute('aria-disabled') === 'true'
          );
        sawBusy = sawBusy || busy;
        const hasError = !busy && saveError(previousErrors);
        if (hasError) {
          failed = true;
          throw Error('Zendesk could not save the ticket. Your draft is being restored.');
        }
        const tab = document.querySelector(
          '[data-test-id="header-tab"][data-entity-is-selected="true"]'
        );
        if (
          globalThis.zdhWorkflow.saveAcknowledged({
            nativeReady: current.nativeReady,
            nativeBusy: busy,
            sawBusy,
            tabModified: tab?.getAttribute('data-entity-is-modified') !== 'false',
            hasError
          }) &&
          persistedTicketStatus() === status
        ) {
          confirmed = true;
          const record = propertyRecord(current);
          record.snapshot = propertySnapshot(current);
          record.status = status;
          record.pending = false;
          record.armed = true;
          record.settling = { editVersion: record.editVersion || 0, until: Date.now() + 1500 };
          const select = propertiesUI()?.querySelector('[data-status]');
          if (select) delete select.dataset.touched;
          saveNotice('');
          refreshWorkflow();
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      if (!confirmed)
        throw Error('Save confirmation timed out. Check the ticket before trying again.');
      if (exportTicket) finishCloseExport(controlState(workflowGrid));
      return true;
    } catch (error) {
      if (!confirmed) pendingCloseExport = null;
      const output = saveUI()?.querySelector('[data-state]');
      if (output) output.textContent = error.message;
      return false;
    } finally {
      if (held && !pageLeaving) {
        try {
          held.phase = stillHere() && (!submitted || confirmed || failed) ? 'settled' : 'uncertain';
          await chrome.storage.local.set({ [held.key]: held });
          if (location.pathname === path) {
            const current = controlState(workflowGrid);
            if (nativeBusy(current)) {
              recoveryPending.add(path);
              saveNotice('Zendesk is still saving. Your draft backup is safe.');
            } else if (current.mode === held.mode) {
              await draftRequest(draftEditor(current), 'restore', held.html);
              if (held.phase === 'settled') {
                await new Promise((resolve) => setTimeout(resolve, 750));
                if (
                  stillHere() &&
                  !nativeBusy(controlState(workflowGrid)) &&
                  (await draftRequest(draftEditor(controlState(workflowGrid)), 'read')).html ===
                    held.html &&
                  !pageLeaving
                )
                  await chrome.storage.local.remove(held.key);
                else {
                  held.phase = 'uncertain';
                  await chrome.storage.local.set({ [held.key]: held });
                }
              } else {
                recoveryPending.add(path);
                saveNotice(
                  'Draft restored. Save a recovery copy before continuing; the save was not confirmed.'
                );
              }
            }
          }
        } catch (error) {
          saveNotice(error.message);
        }
      }
      if (!confirmed && location.pathname === path) {
        const record = propertyBaselines.get(targetGrid);
        if (record) record.pending = false;
      }
      if (composerRegion?.isConnected) composerRegion.inert = false;
      if (activeHeldDraft === held) activeHeldDraft = null;
      saveLock.release();
      recoveryAfter.clear();
      refreshWorkflow();
      setTimeout(scheduleSync, 250);
    }
  }
  async function prepareExport() {
    if (!workflowGrid?.isConnected) throw new Error('Open a ticket before exporting.');
    const target = workflowGrid;
    const ticket = globalThis.zdhExporter.collect(document, location, target);
    if (!ticket.comments.length)
      throw new Error('The conversation is not ready to export. Load its messages first.');
    return globalThis.zdhExporter.captureMedia(ticket, target);
  }
  async function deliverExport(ticket, format) {
    const response = await chrome.runtime.sendMessage({
      type: 'zdh-download',
      filename: globalThis.zdhExporter.filename(ticket, format),
      text: globalThis.zdhExporter.serialize(ticket, format)
    });
    if (response?.error || response?.downloadId === undefined)
      throw new Error(response?.error || 'Chrome did not start the export download.');
    return response;
  }
  async function downloadExport(format = 'json') {
    const ticket = await prepareExport();
    await deliverExport(ticket, format);
    return ticket;
  }
  const controlStyle = globalThis.zdhControlStyles;
  function placePropertiesHost(state) {
    const priorityField =
      state.properties?.querySelector('[data-test-id="ticket-fields-priority-label"]')
        ?.parentElement || state.priority?.parentElement;
    if (priorityField) {
      priorityField.dataset.zdhPriorityField = 'true';
      if (propertiesHost.previousElementSibling !== priorityField)
        priorityField.insertAdjacentElement('afterend', propertiesHost);
      // Use the existing field row; never reparent Zendesk's React-owned control.
      const row = priorityField.parentElement;
      if (row.children.length === 2) {
        row.dataset.zdhPriorityStatusRow = 'true';
      }
      const label = priorityField.querySelector('label'),
        control = priorityField.querySelector('[role="combobox"],select');
      if (label && control) {
        const labelStyle = getComputedStyle(label),
          controlStyle = getComputedStyle(control);
        const tokens = { 'label-font': labelStyle.font, 'label-color': labelStyle.color };
        for (const property of [
          'font',
          'color',
          'background-color',
          'border',
          'border-radius',
          'padding',
          'height'
        ]) {
          if (property === 'border' && control.matches(':focus,:focus-within,:hover')) continue;
          tokens[property] = controlStyle.getPropertyValue(property);
        }
        for (const [name, value] of Object.entries(tokens)) {
          const property = `--zdh-native-${name}`;
          if (propertiesHost.style.getPropertyValue(property) !== value)
            propertiesHost.style.setProperty(property, value);
        }
      }
    } else if (propertiesHost.parentElement !== state.properties)
      state.properties?.prepend(propertiesHost);
  }
  function syncAdditionalFields(state) {
    const side = state.properties;
    if (!side) return;
    const keep = new Set([
      'requester',
      'assignee',
      'followers',
      'tags',
      'ticket code',
      'priority',
      'status'
    ]);
    const columns = [...side.querySelectorAll('[data-garden-id="grid.col"]')];
    const optional = [];
    for (const column of columns) {
      if (column.querySelector('[data-garden-id="grid.col"]')) continue;
      const labels = [...column.querySelectorAll('label')].filter(
        (label) => label.closest('[data-garden-id="grid.col"]') === column
      );
      const isEssential = labels.some((label) =>
        keep.has(label.textContent.trim().replace(/\*$/, '').trim().toLowerCase())
      );
      const isField =
        labels.length || column.querySelector('input,textarea,select,[role="combobox"]');
      if (isEssential) {
        column.dataset.zdhEssentialField = 'true';
        column.dataset.zdhFieldName = labels
          .map((label) => label.textContent.trim().replace(/\*$/, '').trim().toLowerCase())
          .find((name) => keep.has(name));
      } else {
        delete column.dataset.zdhEssentialField;
        delete column.dataset.zdhFieldName;
      }
      if (column.parentElement?.getAttribute('data-garden-id') === 'grid.row')
        column.parentElement.dataset.zdhFieldRow = 'true';
      if (isField && !isEssential) {
        column.dataset.zdhAdditionalField = 'true';
        optional.push(column);
      } else delete column.dataset.zdhAdditionalField;
    }
    const priorityColumn = side
      .querySelector('[data-zdh-priority-field]')
      ?.closest('[data-garden-id="grid.col"]');
    const row = priorityColumn?.parentElement;
    if (!row || !optional.length) return;
    let toggle = side.querySelector('[data-zdh-additional-toggle]');
    if (!toggle) {
      toggle = document.createElement('button');
      toggle.type = 'button';
      toggle.dataset.zdhAdditionalToggle = 'true';
      toggle.addEventListener('click', () => {
        const expanded = side.dataset.zdhFieldsExpanded !== 'true';
        side.dataset.zdhFieldsExpanded = String(expanded);
        toggle.setAttribute('aria-expanded', String(expanded));
        toggle.textContent = expanded ? 'Hide additional fields' : 'Additional fields';
      });
      const anchor =
        priorityColumn.nextElementSibling === propertiesHost ? propertiesHost : priorityColumn;
      anchor.insertAdjacentElement('afterend', toggle);
    }
    if (!toggle.hasAttribute('aria-expanded')) toggle.setAttribute('aria-expanded', 'false');
    if (!toggle.textContent) toggle.textContent = 'Additional fields';
  }
  function placeSaveHost(state) {
    const stay = [...document.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === 'Stay on ticket'
    );
    if (stay) {
      const container = stay.parentElement;
      container.dataset.zdhStayAction = 'true';
      if (saveHost.previousElementSibling !== container)
        container.insertAdjacentElement('afterend', saveHost);
    }
  }
  function mountWorkflow(grid) {
    if (
      workflowGrid === grid &&
      composerHost?.isConnected &&
      propertiesHost?.isConnected &&
      saveHost?.isConnected
    ) {
      const state = controlState(grid);
      placeComposerHost(state);
      placePropertiesHost(state);
      placeSaveHost(state);
      syncAdditionalFields(state);
      refreshWorkflow();
      return;
    }
    composerHost?.remove();
    propertiesHost?.remove();
    saveHost?.remove();
    workflowGrid = grid;
    composerHost = document.createElement('div');
    composerHost.dataset.zdhComposerActions = 'true';
    const composerRoot = composerHost.attachShadow({ mode: 'open' });
    composerRoot.innerHTML = `${controlStyle}<section aria-label="Reply actions"><button class="primary" data-send type="button">Send</button></section>`;
    propertiesHost = document.createElement('div');
    propertiesHost.dataset.zdhPropertiesActions = 'true';
    const propertiesRoot = propertiesHost.attachShadow({ mode: 'open' });
    propertiesRoot.innerHTML = `${controlStyle}<section class="properties status-field" aria-label="Ticket status"><label id="zdh-status-label" for="zdh-status-trigger">Status</label><button id="zdh-status-trigger" class="status-trigger" type="button" role="combobox" aria-labelledby="zdh-status-label" aria-controls="zdh-status-menu" aria-haspopup="listbox" aria-expanded="false"><span data-status-value></span></button><div id="zdh-status-menu" role="listbox" aria-label="Status" popover="auto"></div><select hidden id="zdh-ticket-status" data-status aria-label="Status value"><option value="closed" disabled>Closed</option><option value="unknown" disabled>Unavailable</option><option value="open">Open</option><option value="pending">Pending</option><option value="on-hold">On-hold</option><option value="solved">Solved</option></select></section>`;
    saveHost = document.createElement('div');
    saveHost.dataset.zdhSaveAction = 'true';
    const saveRoot = saveHost.attachShadow({ mode: 'open' });
    saveRoot.innerHTML = `${controlStyle}<section class="properties" aria-label="Save ticket changes"><div class="save-actions"><button class="primary" data-save type="button">Save changes</button><button data-close-export type="button" hidden>Close and export</button><button data-recovery-copy type="button" hidden>Save recovery copy</button></div><output data-state aria-live="polite"></output></section>`;
    composerRoot.querySelector('[data-send]').addEventListener('click', sendActive);
    saveRoot.querySelector('[data-recovery-copy]').addEventListener('click', downloadDraftRecovery);
    propertiesRoot.querySelector('[data-status]').addEventListener('change', (event) => {
      event.target.dataset.touched = 'true';
      refreshWorkflow();
    });
    saveRoot.querySelector('[data-save]').addEventListener('click', () => savePropertiesActive());
    saveRoot
      .querySelector('[data-close-export]')
      .addEventListener('click', () => savePropertiesActive({ exportAfterSave: true }));
    const state = controlState(grid);
    placeComposerHost(state);
    mountStatusMenu(propertiesRoot);
    placePropertiesHost(state);
    placeSaveHost(state);
    syncAdditionalFields(state);
    for (const delay of [250, 1000])
      setTimeout(() => {
        if (workflowGrid === grid) {
          const latest = controlState(grid);
          placePropertiesHost(latest);
          placeSaveHost(latest);
          syncAdditionalFields(latest);
        }
      }, delay);
    markNativeControls(state);
    state.composer?.addEventListener('input', refreshWorkflow);
    refreshWorkflow();
  }
  function mountStatusMenu(root) {
    const select = root.querySelector('[data-status]'),
      trigger = root.querySelector('#zdh-status-trigger'),
      menu = root.querySelector('#zdh-status-menu');
    const options = [...select.options]
      .filter((option) => !option.disabled)
      .map((option) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.role = 'option';
        button.tabIndex = -1;
        button.dataset.value = option.value;
        button.textContent = option.textContent;
        button.addEventListener('click', () => {
          if (trigger.disabled) return;
          select.value = option.value;
          select.dispatchEvent(new Event('change', { bubbles: true }));
          menu.hidePopover();
          trigger.focus({ preventScroll: true });
        });
        menu.append(button);
        return button;
      });
    const opened = () => menu.matches(':popover-open');
    let dismissal;
    function open(edge) {
      if (trigger.disabled || opened()) return;
      const rect = trigger.getBoundingClientRect(),
        height = Math.min(240, options.length * 36 + 8),
        above = innerHeight - rect.bottom < height + 8 && rect.top > height + 8;
      menu.style.width = rect.width + 'px';
      menu.style.left = Math.max(8, Math.min(rect.left, innerWidth - rect.width - 8)) + 'px';
      menu.style.top = (above ? rect.top - height - 4 : rect.bottom + 4) + 'px';
      menu.showPopover();
      trigger.setAttribute('aria-expanded', 'true');
      const current = options.findIndex((option) => option.dataset.value === select.value);
      options[
        edge === 'first' ? 0 : edge === 'last' ? options.length - 1 : Math.max(current, 0)
      ].focus({ preventScroll: true });
    }
    root.addEventListener('focusin', (event) => event.stopPropagation());
    trigger.addEventListener('pointerdown', (event) => {
      if (event.button === 0) {
        event.preventDefault();
        trigger.focus({ preventScroll: true });
      }
    });
    trigger.addEventListener('click', (event) => {
      event.stopPropagation();
      opened() ? menu.hidePopover() : open();
    });
    trigger.addEventListener('keydown', (event) => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        open(event.key === 'Home' ? 'first' : event.key === 'End' ? 'last' : undefined);
      }
    });
    menu.addEventListener('keydown', (event) => {
      const index = options.indexOf(root.activeElement);
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        event.stopPropagation();
        options[index]?.click();
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault();
        options[
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? options.length - 1
              : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
        ].focus({ preventScroll: true });
      }
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        menu.hidePopover();
        trigger.focus({ preventScroll: true });
      }
      if (event.key === 'Tab') {
        menu.hidePopover();
        trigger.focus({ preventScroll: true });
      }
    });
    menu.addEventListener('toggle', () => {
      const expanded = String(opened());
      if (trigger.getAttribute('aria-expanded') !== expanded)
        trigger.setAttribute('aria-expanded', expanded);
      dismissal?.abort();
      if (opened()) {
        dismissal = new AbortController();
        // Zendesk intercepts Enter before it reaches nested menu handlers.
        // Capture only activation keys originating from one of our own options.
        window.addEventListener(
          'keydown',
          (event) => {
            if (
              (event.key !== 'Enter' && event.key !== ' ') ||
              event.metaKey ||
              event.ctrlKey ||
              event.altKey
            )
              return;
            const option = options.find((button) => event.composedPath().includes(button));
            if (!option) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            option.click();
          },
          { capture: true, signal: dismissal.signal }
        );
        const scrollPositions = new Map();
        const position = (node) =>
          node === document ? [scrollX, scrollY] : [node.scrollLeft, node.scrollTop];
        for (let node = trigger; node; node = node.parentElement || node.getRootNode()?.host)
          scrollPositions.set(node, position(node));
        scrollPositions.set(document, position(document));
        document.addEventListener(
          'scroll',
          (event) => {
            if (menu.contains(event.target)) return;
            const before = scrollPositions.get(event.target),
              after = position(event.target);
            // Ignore queued focus/automation scroll events that predate opening.
            if (before && before[0] === after[0] && before[1] === after[1]) return;
            menu.hidePopover();
          },
          { capture: true, signal: dismissal.signal }
        );
        window.addEventListener('resize', () => menu.hidePopover(), { signal: dismissal.signal });
      }
    });
  }
  function markNativeControls(state) {
    const submitContainer = state.submit?.parentElement;
    if (submitContainer) submitContainer.dataset.zdhNativeActions = 'true';
  }
  function clearWorkflow() {
    composerHost?.remove();
    propertiesHost?.remove();
    saveHost?.remove();
    document.querySelector('[data-zdh-additional-toggle]')?.remove();
    for (const node of document.querySelectorAll(
      '[data-zdh-native-mode],[data-zdh-native-actions],[data-zdh-stay-action],[data-zdh-priority-field],[data-zdh-priority-status-row],[data-zdh-fields-expanded],[data-zdh-essential-field],[data-zdh-field-name],[data-zdh-field-row],[data-zdh-additional-field]'
    )) {
      delete node.dataset.zdhNativeMode;
      delete node.dataset.zdhNativeActions;
      delete node.dataset.zdhStayAction;
      delete node.dataset.zdhPriorityField;
      delete node.dataset.zdhPriorityStatusRow;
      delete node.dataset.zdhAdditionalField;
      delete node.dataset.zdhFieldsExpanded;
      delete node.dataset.zdhEssentialField;
      delete node.dataset.zdhFieldName;
      delete node.dataset.zdhFieldRow;
    }
    composerHost = null;
    propertiesHost = null;
    saveHost = null;
    workflowGrid = null;
    delete document.documentElement.dataset.zdhTheme;
  }
  function closeImageLightbox() {
    const lightbox = document.querySelector('[data-zdh-image-lightbox]');
    if (!lightbox) return;
    const returnId = lightbox.dataset.returnId;
    lightbox.remove();
    if (returnId)
      document
        .querySelector(`[data-zdh-preview-trigger][data-zdh-preview-id="${CSS.escape(returnId)}"]`)
        ?.focus();
  }
  function openImageLightbox(image) {
    closeImageLightbox();
    const lightbox = document.createElement('div');
    lightbox.dataset.zdhImageLightbox = 'true';
    lightbox.dataset.returnId = image.dataset.zdhPreviewId;
    lightbox.tabIndex = -1;
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-label', image.alt || 'Image preview');
    const backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.dataset.zdhImageBackdrop = 'true';
    backdrop.setAttribute('aria-label', 'Close image preview');
    backdrop.addEventListener('click', closeImageLightbox);
    const full = image.cloneNode();
    full.removeAttribute('data-zdh-message-image');
    full.removeAttribute('data-zdh-preview-id');
    full.removeAttribute('tabindex');
    full.removeAttribute('role');
    lightbox.append(backdrop, full);
    document.body.append(lightbox);
    lightbox.focus();
  }
  const imageBindings = new Map();
  function clearImageBindings() {
    for (const record of imageBindings.values()) record.restore();
    imageBindings.clear();
  }
  function syncImages(log) {
    for (const [image, record] of imageBindings)
      if (!image.isConnected) {
        record.restore();
        imageBindings.delete(image);
      }
    for (const image of log.querySelectorAll(
      'article img,.message img,[data-zdh-conversation-entry] img'
    )) {
      if (
        image.closest('[data-zdh-image-preview],[data-zdh-image-lightbox]') ||
        image.matches('.avatar,[class*="avatar" i],[data-test-id*="avatar" i]') ||
        ((image.width || image.naturalWidth) <= 64 && (image.height || image.naturalHeight) <= 64)
      )
        continue;
      if (imageBindings.has(image)) {
        imageBindings.get(image).refresh();
        continue;
      }
      const nativeTrigger = image.closest('button,[role="button"]'),
        trigger = nativeTrigger || image;
      const snapshots = [...new Set([image, trigger])].map((node) => ({
        node,
        values: Object.fromEntries(
          ['tabindex', 'role', 'aria-label'].map((key) => [key, node.getAttribute(key)])
        )
      }));
      const abort = new AbortController();
      const id = `zdh-image-${Math.random().toString(36).slice(2)}`;
      image.dataset.zdhMessageImage = 'true';
      image.dataset.zdhPreviewId = id;
      trigger.dataset.zdhPreviewTrigger = 'true';
      trigger.dataset.zdhPreviewId = id;
      if (!nativeTrigger) {
        image.tabIndex = 0;
        image.setAttribute('role', 'button');
      }
      if (!trigger.getAttribute('aria-label'))
        trigger.setAttribute('aria-label', `Preview ${image.alt || 'message image'}`);
      const preview = document.createElement('span');
      preview.dataset.zdhImagePreview = 'true';
      preview.setAttribute('aria-hidden', 'true');
      const clone = image.cloneNode();
      for (const key of [
        'data-zdh-message-image',
        'data-zdh-preview-id',
        'data-zdh-preview-trigger',
        'tabindex',
        'role'
      ])
        clone.removeAttribute(key);
      preview.append(clone);
      trigger.insertAdjacentElement('afterend', preview);
      trigger.addEventListener(
        'click',
        (event) => {
          if (!enabled || !layout) return;
          event.preventDefault();
          openImageLightbox(image);
        },
        { signal: abort.signal }
      );
      trigger.addEventListener(
        'keydown',
        (event) => {
          if (enabled && layout && (event.key === 'Enter' || event.key === ' ')) {
            event.preventDefault();
            openImageLightbox(image);
          }
        },
        { signal: abort.signal }
      );
      imageBindings.set(image, {
        refresh() {
          image.dataset.zdhMessageImage = 'true';
          image.dataset.zdhPreviewId = id;
          trigger.dataset.zdhPreviewTrigger = 'true';
          trigger.dataset.zdhPreviewId = id;
          if (!nativeTrigger) {
            image.tabIndex = 0;
            image.setAttribute('role', 'button');
          }
          if (!trigger.getAttribute('aria-label'))
            trigger.setAttribute(
              'aria-label',
              snapshots.find((s) => s.node === trigger)?.values['aria-label'] ||
                `Preview ${image.alt || 'message image'}`
            );
          if (!preview.isConnected) trigger.insertAdjacentElement('afterend', preview);
          if (clone.getAttribute('src') !== image.getAttribute('src')) {
            clone.removeAttribute('srcset');
            clone.setAttribute('src', image.getAttribute('src') || '');
          }
        },
        restore() {
          abort.abort();
          preview.remove();
          for (const { node, values } of snapshots) {
            for (const [key, value] of Object.entries(values)) {
              if (value === null) node.removeAttribute(key);
              else node.setAttribute(key, value);
            }
            delete node.dataset.zdhMessageImage;
            delete node.dataset.zdhPreviewId;
            delete node.dataset.zdhPreviewTrigger;
          }
        }
      });
    }
  }
  function syncConversationScroll(conversation) {
    const pane = conversation?.querySelector('[data-test-id="convopane-resizable-grid"]');
    const root = pane?.closest('[data-editor-container="true"]');
    const log = pane?.querySelector('[data-test-id="omni-log-container"]');
    const composer = pane?.querySelector('[data-test-id="omnichannel-composer"]');
    if (!root || !log || !composer) return;
    const paths = new Set();
    for (const leaf of [log, composer.querySelector('[contenteditable="true"]') || composer])
      for (let node = leaf; node && node !== root; node = node.parentElement) paths.add(node);
    for (const node of conversation.querySelectorAll('[data-zdh-flow-path]'))
      if (!paths.has(node)) delete node.dataset.zdhFlowPath;
    if (root.dataset.zdhConversationScroll !== 'true') root.dataset.zdhConversationScroll = 'true';
    for (const node of paths)
      if (node.dataset.zdhFlowPath !== 'true') node.dataset.zdhFlowPath = 'true';
    // Zendesk inserts these floating jumps after scrolling/idle; the shared flow supersedes both.
    for (const button of conversation.querySelectorAll('button')) {
      const redundant =
        !button.closest(
          'article,[data-zdh-conversation-entry],[data-test-id="omnichannel-composer"]'
        ) && /^see (oldest|newest)$/i.test(button.textContent.trim().replace(/\s+/g, ' '));
      if (redundant) {
        if (!button.hasAttribute('data-zdh-native-history-jump'))
          button.dataset.zdhNativeHistoryJump = 'true';
      } else if (button.hasAttribute('data-zdh-native-history-jump'))
        delete button.dataset.zdhNativeHistoryJump;
    }
  }
  // The latest-five disclosure and per-message quote disclosures are separate controls.
  function syncConversation(grid) {
    const state = controlState(grid),
      liveEntries = [
        ...(state.conversation?.querySelectorAll(
          globalThis.zdhWorkspace.selectors.conversationEntry
        ) || [])
      ],
      log =
        state.conversation?.querySelector(globalThis.zdhWorkspace.selectors.conversationLog) ||
        liveEntries[0]?.parentElement;
    if (!log) return;
    const entries = liveEntries.length
      ? liveEntries
      : [...log.children].filter((node) =>
          node.matches('article,.message,[data-zdh-export-comment]')
        );
    for (const entry of entries) entry.dataset.zdhConversationEntry = 'true';
    syncConversationScroll(state.conversation);
    const via = state.conversation.querySelector('[data-test-id="omni-header-via-label"]');
    const toolsRow = via?.parentElement;
    if (toolsRow) {
      toolsRow.dataset.zdhTicketToolsRow = 'true';
      const header = via.closest('[data-editor-container]')?.firstElementChild;
      if (header) header.dataset.zdhConversationHeader = 'true';
    }
    let disclosure = state.conversation.querySelector('[data-zdh-conversation-disclosure]');
    if (entries.length <= 5 || preferences.collapseHistory === false) {
      disclosure?.remove();
      for (const entry of entries)
        if (entry.dataset.zdhCollapsed) {
          entry.hidden = false;
          delete entry.dataset.zdhCollapsed;
        }
      syncImages(state.conversation);
      globalThis.zdhEmailThreads?.sync(state.conversation);
      globalThis.zdhMessageDisplay?.sync(state.conversation);
      return;
    }
    if (!disclosure) {
      disclosure = document.createElement('button');
      disclosure.type = 'button';
      disclosure.dataset.zdhConversationDisclosure = 'true';
      disclosure.addEventListener('click', () => {
        disclosure.dataset.expanded = String(disclosure.getAttribute('aria-expanded') !== 'true');
        syncConversation(grid);
      });
      log.insertAdjacentElement('beforebegin', disclosure);
    }
    // This belongs to the history, so it scrolls away with the messages, not the header.
    const firstEntry = entries[0];
    if (firstEntry && disclosure.nextElementSibling !== firstEntry)
      firstEntry.insertAdjacentElement('beforebegin', disclosure);
    const expanded = disclosure.dataset.expanded === 'true',
      hiddenCount = entries.length - 5;
    const label = expanded ? 'Collapse earlier messages' : 'View full conversation';
    const accessibleLabel = expanded ? label : `${label}, ${hiddenCount} earlier messages hidden`;
    if (disclosure.getAttribute('aria-label') !== accessibleLabel)
      disclosure.setAttribute('aria-label', accessibleLabel);
    if (disclosure.textContent !== label) disclosure.textContent = label;
    disclosure.setAttribute('aria-expanded', String(expanded));
    entries.forEach((entry, index) => {
      const collapse = !expanded && index < hiddenCount;
      if (collapse) {
        entry.hidden = true;
        entry.dataset.zdhCollapsed = 'true';
      } else if (entry.dataset.zdhCollapsed) {
        entry.hidden = false;
        delete entry.dataset.zdhCollapsed;
      }
    });
    syncImages(state.conversation);
    globalThis.zdhEmailThreads?.sync(state.conversation);
    globalThis.zdhMessageDisplay?.sync(state.conversation);
  }
  function clearConversation() {
    globalThis.zdhEmailThreads?.clear();
    globalThis.zdhMessageDisplay?.clear();
    for (const node of document.querySelectorAll(
      '[data-zdh-flow-path],[data-zdh-conversation-scroll],[data-zdh-native-history-jump]'
    )) {
      delete node.dataset.zdhFlowPath;
      delete node.dataset.zdhConversationScroll;
      delete node.dataset.zdhNativeHistoryJump;
    }
    for (const node of document.querySelectorAll(
      '[data-zdh-ticket-tools-row],[data-zdh-conversation-header]'
    )) {
      delete node.dataset.zdhTicketToolsRow;
      delete node.dataset.zdhConversationHeader;
    }
    for (const disclosure of document.querySelectorAll('[data-zdh-conversation-disclosure]'))
      disclosure.remove();
    for (const entry of document.querySelectorAll('[data-zdh-collapsed]')) {
      entry.hidden = false;
      delete entry.dataset.zdhCollapsed;
    }
    for (const preview of document.querySelectorAll('[data-zdh-image-preview]')) preview.remove();
    for (const trigger of document.querySelectorAll('[data-zdh-preview-trigger]')) {
      trigger.removeAttribute('data-zdh-preview-trigger');
      trigger.removeAttribute('data-zdh-preview-id');
    }
    for (const image of document.querySelectorAll('[data-zdh-message-image]')) {
      image.removeAttribute('data-zdh-message-image');
      image.removeAttribute('data-zdh-preview-id');
    }
    clearImageBindings();
    closeImageLightbox();
  }
  function ticketIdentity() {
    return (
      globalThis.zdhTicketTools?.identity(workflowGrid ? controlState(workflowGrid) : null) || {}
    );
  }
  function clearHarvest(grid) {
    delete grid.dataset.zdhHarvest;
    for (const node of grid.querySelectorAll('[data-zdh-harvest-path],[data-zdh-harvest-panel]')) {
      delete node.dataset.zdhHarvestPath;
      delete node.dataset.zdhHarvestPanel;
    }
  }
  function syncHarvest(grid) {
    const column = grid.querySelector(':scope > [data-test-id="column-3"]');
    const frame = column?.querySelector('iframe[title="Harvest"],iframe[name^="app_Harvest_"]');
    const app = frame?.closest('[data-test-id="app-element"]');
    const panel = app?.parentElement;
    if (!panel) {
      clearHarvest(grid);
      return;
    }
    // Keep the live app and iframe in their original DOM parents.
    grid.dataset.zdhHarvest = 'true';
    panel.dataset.zdhHarvestPanel = 'true';
    for (let node = panel.parentElement; node && node !== column; node = node.parentElement)
      node.dataset.zdhHarvestPath = 'true';
  }
  function refreshTitleWarning() {
    if (
      !host ||
      !field ||
      !/^(Expected:|This title may contain)/.test(host.getAttribute('aria-label') || '')
    )
      return;
    const review = globalThis.zdTitleReview?.(field.value, ticketIdentity()) || {
      valid: globalThis.zdTitleFormat(field.value)
    };
    if (review.valid) clearWarning();
  }
  // Main reconciliation loop: locate the active ticket, then repair only our owned UI.
  function sync() {
    if (observedPath !== location.pathname) {
      observedPath = location.pathname;
      ticketEpoch++;
    }
    if (!enabled) return;
    globalThis.zdhThemePage.sync();
    if (!armed && !manualField) {
      const current = activeTitle();
      if (current !== field) {
        clearWarning();
        field = current;
      }
    }
    refreshTitleWarning();
    const grids = [
      ...document.querySelectorAll('[data-test-id^="ticket-"][data-test-id$="-standard-layout"]')
    ];
    for (const grid of grids) {
      if (
        !grid.querySelector(':scope > [data-test-id="column-1"]') ||
        !grid.querySelector(':scope > [data-test-id="column-2"]')
      )
        continue;
      if (layout && visible(grid)) {
        grid.setAttribute('data-zdh-layout', 'true');
        grid.setAttribute('data-zdh-context', String(context));
        delete grid.dataset.zdhPageScroll;
        marked.add(grid);
        mountWorkflow(grid);
        syncConversation(grid);
        syncHarvest(grid);
      } else {
        clearHarvest(grid);
        grid.removeAttribute('data-zdh-layout');
        grid.removeAttribute('data-zdh-context');
        delete grid.dataset.zdhPageScroll;
        marked.delete(grid);
      }
    }
    for (const grid of marked) if (!grid.isConnected) marked.delete(grid);
    globalThis.zdhTicketTools?.sync({
      enabled,
      preferences,
      state: () => {
        const grid = globalThis.zdhWorkspace.findActiveGrid(document);
        return grid ? controlState(grid) : null;
      },
      busy: () => saveLock.busy || pageLeaving || recoveryPending.has(location.pathname),
      acquire: () => saveLock.acquire(),
      release: () => saveLock.release(),
      request: draftRequest,
      uploads: hasQueuedAttachments,
      refresh: () => {
        if (workflowGrid) refreshWorkflow();
        scheduleSync();
      },
      beforeTitleChange: () => {
        if (workflowGrid) {
          const state = controlState(workflowGrid),
            record = propertyRecord(state);
          if (!record.armed) {
            record.snapshot = propertySnapshot(state);
            record.armed = true;
          }
          record.editVersion = (record.editVersion || 0) + 1;
          delete record.settling;
        }
      }
    });
  }
  function check() {
    if (!enabled || !field?.isConnected || !visible(field)) return;
    if (workflowGrid && controlState(workflowGrid).readOnly) {
      clearWarning();
      return;
    }
    const review = globalThis.zdTitleReview?.(field.value, ticketIdentity()) || {
      valid: globalThis.zdTitleFormat(field.value),
      kind: 'format'
    };
    if (review.valid) clearWarning();
    else if (review.kind === 'duplicate-identity')
      message(
        `This title may contain two company/requester prefixes. Review this suggestion: ${review.suggestion}. Nothing was changed; you can still save.`,
        field,
        {
          label: 'Use suggestion',
          run: () => {
            const target = field;
            target.focus({ preventScroll: true });
            target.select();
            const applied = document.execCommand('insertText', false, review.suggestion);
            if (!applied) {
              const setter = Object.getOwnPropertyDescriptor(
                HTMLInputElement.prototype,
                'value'
              )?.set;
              if (setter) setter.call(target, review.suggestion);
              else target.value = review.suggestion;
              target.dispatchEvent(
                new InputEvent('input', {
                  bubbles: true,
                  composed: true,
                  inputType: 'insertReplacementText',
                  data: review.suggestion
                })
              );
            }
            target.dispatchEvent(new Event('change', { bubbles: true }));
            clearWarning();
            target.focus();
          }
        }
      );
    else
      message(
        'Expected: Company - Requester - Issue. Example: Beluga Sales Inc. - Taylor Baxter - FaceID error. Format only; names are not verified. You can still save.',
        field
      );
  }
  function scheduleSync() {
    if (syncFrame) return;
    syncFrame = requestAnimationFrame(() => {
      syncFrame = 0;
      sync();
    });
  }
  const observer = new MutationObserver(scheduleSync);
  document.addEventListener('focusin', beginPropertyEdit, true);
  document.addEventListener('pointerdown', beginPropertyEdit, true);
  document.addEventListener('keydown', beginPropertyEdit, true);
  document.addEventListener('beforeinput', beginPropertyEdit, true);
  function refreshNativeInput(event) {
    if (
      event.target === propertiesHost ||
      event.target === composerHost ||
      event.target === saveHost
    )
      return;
    if (workflowGrid) refreshWorkflow();
    scheduleSync();
  }
  document.addEventListener('input', refreshNativeInput, true);
  document.addEventListener('change', refreshNativeInput, true);
  document.addEventListener(
    'focusout',
    (event) => {
      const next = event.relatedTarget;
      const movingToWarning =
        warningActionPointer || Boolean(host && (next === host || host.shadowRoot?.contains(next)));
      if (event.target === field && !movingToWarning) check();
    },
    true
  );
  document.addEventListener('submit', check, true);
  document.addEventListener(
    'click',
    (event) => {
      if (!enabled || !armed) return;
      const target = event.target;
      if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) return;
      if (target instanceof HTMLInputElement && !['text', 'search'].includes(target.type)) return;
      if (target.disabled || target.readOnly) return;
      clearWarning();
      field = target;
      armed = false;
      manualField = true;
      message('Title selected. Leave this field to check its format.', field);
    },
    true
  );
  // Observe only element additions/removals, not values, text or our attribute updates.
  globalThis.zdTitleHelper = {
    configure(options) {
      enabled = true;
      layout = Boolean(options.layout);
      context = Boolean(options.context);
      armed = Boolean(options.manual);
      manualField = false;
      clearWarning();
      field = null;
      globalThis.zdhThemePage.apply(selectedTheme, true);
      observer.disconnect();
      sync();
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-entity-is-modified', 'disabled', 'aria-label']
      });
      if (armed) message('Click the title field to select it. No edits or submissions.');
      return {
        titleFound: Boolean(field),
        layoutFound: marked.size > 0,
        narrow: innerWidth < 1000
      };
    },
    setEnabled(value) {
      if (value) return this.configure({ layout: false, context: false, manual: true });
      globalThis.zdhThemePage.apply(selectedTheme, false);
      globalThis.zdhTicketTools?.clear();
      enabled = false;
      armed = false;
      manualField = false;
      observer.disconnect();
      if (syncFrame) cancelAnimationFrame(syncFrame);
      syncFrame = 0;
      clearWarning();
      field = null;
      clearWorkflow();
      clearConversation();
      for (const grid of marked) {
        clearHarvest(grid);
        grid.removeAttribute('data-zdh-layout');
        grid.removeAttribute('data-zdh-context');
        delete grid.dataset.zdhTheme;
        delete grid.dataset.zdhPageScroll;
      }
      marked.clear();
    },
    sendActive,
    savePropertiesActive
  };
  window.addEventListener(
    'keydown',
    (event) => {
      if (!enabled || !workflowGrid || event.defaultPrevented) return;
      const state = controlState(workflowGrid);
      const target = event.composedPath()[0];
      const editor = target?.closest?.('textarea,[contenteditable="true"],[role="textbox"]');
      const action = globalThis.zdhWorkflow.shortcutAction({
        key: event.key,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        altKey: event.altKey,
        shiftKey: event.shiftKey,
        isComposing: event.isComposing,
        repeat: event.repeat,
        inComposer: Boolean(editor && state.composer?.contains(editor)),
        inProperties: Boolean(
          state.properties?.contains(event.target) ||
          propertiesHost?.contains(event.target) ||
          [...(state.properties?.querySelectorAll('[aria-controls]') || [])].some((control) =>
            (control.getAttribute('aria-controls') || '')
              .split(/\s+/)
              .some((id) => document.getElementById(id)?.contains(event.target))
          )
        )
      });
      if (!action) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (action === 'send') sendActive();
      else if (action === 'save') {
        // Commit the highlighted custom Status option before saving its draft value.
        if (propertiesUI()?.contains(target) && target.matches?.('[role="option"][data-value]'))
          target.click();
        savePropertiesActive();
      }
    },
    true
  );
  function receivedImage(target) {
    if (
      !enabled ||
      !layout ||
      target?.tagName !== 'IMG' ||
      target.closest('[data-zdh-image-preview],[data-zdh-image-lightbox]')
    )
      return null;
    return target.closest('[data-zdh-layout="true"] [data-test-id="omni-log-message-content"]')
      ? target
      : null;
  }
  document.addEventListener(
    'click',
    (event) => {
      const image = receivedImage(event.target);
      if (!image) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      openImageLightbox(image);
    },
    true
  );
  document.addEventListener(
    'keydown',
    (event) => {
      const image = receivedImage(event.target);
      if (image && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        event.stopImmediatePropagation();
        openImageLightbox(image);
      } else if (event.key === 'Escape') closeImageLightbox();
    },
    true
  );
  document.addEventListener(
    'load',
    (event) => {
      if (
        enabled &&
        event.target?.tagName === 'IMG' &&
        event.target.closest('[data-zdh-conversation-entry]')
      )
        scheduleSync();
    },
    true
  );
  addEventListener('resize', scheduleSync, { passive: true });
  const runtime = globalThis.chrome?.runtime;
  runtime?.onMessage?.addListener((message, _sender, sendResponse) => {
    if (message?.type === 'zdh-export') {
      downloadExport('json').then(
        (ticket) =>
          sendResponse?.({
            exported: true,
            comments: ticket.comments.length,
            images: ticket.mediaSummary
          }),
        (error) => sendResponse?.({ error: error.message })
      );
      return true;
    }
    let result;
    if (message?.type === 'zdh-configure')
      result = globalThis.zdTitleHelper.configure(message.options || defaults);
    else if (message?.type === 'zdh-manual-select')
      result = globalThis.zdTitleHelper.configure({
        ...defaults,
        ...message.options,
        manual: true
      });
    else if (message?.type === 'zdh-set-enabled') {
      globalThis.zdTitleHelper.setEnabled(Boolean(message.value));
      result = { enabled: Boolean(message.value) };
    } else return false;
    sendResponse?.(result);
    return false;
  });
  runtime?.onConnect?.addListener((port) => {
    if (
      port.name !== 'zdh-theme-preview' ||
      port.sender?.id !== runtime.id ||
      ![
        runtime.getURL('src/popup/popup.html'),
        runtime.getURL('src/settings/settings.html')
      ].includes(port.sender?.url?.split('#')[0])
    )
      return;
    port.onMessage.addListener((message) => {
      try {
        if (message.type === 'preview') {
          globalThis.zdhThemes.setPreview(message.palette);

          globalThis.zdhThemePage.apply('custom-preview', enabled);
        } else {
          globalThis.zdhThemePage.apply(selectedTheme, enabled);
        }
      } catch {}
    });
    port.onDisconnect.addListener(() => {
      globalThis.zdhThemePage.apply(selectedTheme, enabled);
    });
  });
  const storage = globalThis.chrome?.storage?.local;
  globalThis.chrome?.storage?.onChanged?.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const key of Object.keys(defaults))
      if (changes[key]) preferences[key] = changes[key].newValue ?? defaults[key];
    if (changes.customThemes) globalThis.zdhThemes.setCustomThemes(preferences.customThemes);
    if (changes.enabled) {
      if (preferences.enabled === false) globalThis.zdTitleHelper.setEnabled(false);
      else globalThis.zdTitleHelper.configure(preferences);
    }
    if (changes.layout || changes.context) {
      if (preferences.enabled) globalThis.zdTitleHelper.configure(preferences);
    }
    if (changes.theme || changes.customThemes) {
      selectedTheme = preferences.theme;

      globalThis.zdhThemePage.apply(selectedTheme, enabled);
    }
    scheduleSync();
  });
  if (storage?.get)
    storage.get(defaults, (next) => {
      preferences = { ...next, layout: true, context: false };
      globalThis.zdhThemes.setCustomThemes(preferences.customThemes);
      selectedTheme = preferences.theme;
      if (preferences.enabled === false) globalThis.zdTitleHelper.setEnabled(false);
      else
        globalThis.zdTitleHelper.configure({
          layout: preferences.layout,
          context: preferences.context,
          manual: false
        });
    });
  else globalThis.zdTitleHelper.configure(defaults);
})();
