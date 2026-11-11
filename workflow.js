// Pure safety rules. These functions decide whether an action is allowed; they do not click.
// Read canSend and canSaveProperties first. Tests can exercise them without Zendesk.

'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.zdhWorkflow = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const statuses = new Set(['open', 'pending', 'on-hold', 'solved']);
  function normalizeMode(label = '') {
    const value = String(label).trim().toLowerCase();
    if (value.includes('internal note')) return 'internal';
    if (value.includes('public reply')) return 'public';
    return 'unknown';
  }
  function submitLabel(status) {
    if (!statuses.has(status)) return '';
    return `Submit as ${status === 'on-hold' ? 'On-hold' : status[0].toUpperCase() + status.slice(1)}`;
  }
  function composerHasContent(value = '') {
    if (/<(?:img|video|audio|iframe|object|embed)\b/i.test(String(value))) return true;
    return (
      String(value)
        .replace(/<[^>]*>/g, '')
        .replace(/&(?:nbsp|#160|#x0*a0);/gi, ' ')
        .replace(/[\s\u00a0\u200b-\u200d\ufeff]/g, '').length > 0
    );
  }
  function canSend({ mode, publicReviewed, composerContent, busy, nativeReady }) {
    if (busy) return { allowed: false, reason: 'A send is already in progress.' };
    if (!nativeReady) return { allowed: false, reason: 'Zendesk send controls are unavailable.' };
    if (mode === 'unknown') return { allowed: false, reason: 'Reply mode is unavailable.' };
    if (!composerHasContent(composerContent))
      return { allowed: false, reason: 'Write a reply or note before sending.' };
    if (mode === 'public' && !publicReviewed)
      return { allowed: false, reason: 'Review and confirm the public reply before sending.' };
    return { allowed: true, reason: '' };
  }
  function canSaveProperties({
    composerContent,
    status,
    busy,
    nativeReady,
    dirty = false,
    draftSafe = false
  }) {
    if (busy) return { allowed: false, reason: 'A save is already in progress.' };
    if (!nativeReady) return { allowed: false, reason: 'Zendesk save controls are unavailable.' };
    if (!statuses.has(status)) return { allowed: false, reason: 'Choose a valid status.' };
    if (composerHasContent(composerContent) && !draftSafe)
      return {
        allowed: false,
        reason: 'The draft cannot be held safely by this editor. Nothing will be submitted.'
      };
    if (!dirty) return { allowed: false, reason: 'No property changes to save.' };
    return { allowed: true, reason: '' };
  }
  function canSave({ mode, publicReviewed, status, busy, nativeReady }) {
    if (busy) return { allowed: false, reason: 'A save is already in progress.' };
    if (!nativeReady) return { allowed: false, reason: 'Zendesk save controls are unavailable.' };
    if (mode === 'unknown') return { allowed: false, reason: 'Reply mode is unavailable.' };
    if (!statuses.has(status)) return { allowed: false, reason: 'Choose a valid status.' };
    if (mode === 'public' && !publicReviewed)
      return { allowed: false, reason: 'Review and confirm the public reply before saving.' };
    return { allowed: true, reason: '' };
  }
  function saveAcknowledged({ nativeReady, nativeBusy, sawBusy, tabModified, hasError }) {
    return Boolean(nativeReady && !nativeBusy && !hasError && (sawBusy || tabModified === false));
  }
  function shortcutAction({
    key,
    metaKey,
    ctrlKey,
    altKey,
    shiftKey,
    isComposing,
    repeat,
    inComposer,
    inProperties
  }) {
    if (key !== 'Enter' || !metaKey || ctrlKey || altKey || shiftKey || isComposing) return null;
    const action = inComposer ? 'send' : inProperties ? 'save' : null;
    return action && repeat ? 'consume' : action;
  }
  function shouldRebaseProperties({ settling, now, editVersion, nativeBusy, statusMatches }) {
    return Boolean(
      settling &&
      now <= settling.until &&
      editVersion === settling.editVersion &&
      !nativeBusy &&
      statusMatches
    );
  }
  function saveFailure(text = '') {
    return /error|failed|could not|unable|required|not saved|not updated|offline/i.test(
      String(text)
    );
  }
  function draftRecoveryAction({ currentHtml, backupHtml, phase = 'held', nativeBusy }) {
    if (nativeBusy) return 'wait';
    if (currentHtml && currentHtml !== backupHtml) return 'conflict';
    if (!currentHtml) return 'restore';
    return ['held', 'settled'].includes(phase) ? 'retire' : 'retain';
  }
  function createSaveLock() {
    let busy = false;
    return {
      acquire() {
        if (busy) return false;
        busy = true;
        return true;
      },
      release() {
        busy = false;
      },
      get busy() {
        return busy;
      }
    };
  }
  return {
    statuses,
    normalizeMode,
    submitLabel,
    composerHasContent,
    canSend,
    canSaveProperties,
    canSave,
    saveAcknowledged,
    shortcutAction,
    shouldRebaseProperties,
    saveFailure,
    draftRecoveryAction,
    createSaveLock
  };
});
