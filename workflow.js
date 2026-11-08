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
  function canSave({ mode, publicReviewed, status, busy, nativeReady }) {
    if (busy) return { allowed: false, reason: 'A save is already in progress.' };
    if (!nativeReady) return { allowed: false, reason: 'Zendesk save controls are unavailable.' };
    if (mode === 'unknown') return { allowed: false, reason: 'Reply mode is unavailable.' };
    if (!statuses.has(status)) return { allowed: false, reason: 'Choose a valid status.' };
    if (mode === 'public' && !publicReviewed) return { allowed: false, reason: 'Review and confirm the public reply before saving.' };
    return { allowed: true, reason: '' };
  }
  function createSaveLock() {
    let busy = false;
    return {
      acquire() { if (busy) return false; busy = true; return true; },
      release() { busy = false; },
      get busy() { return busy; }
    };
  }
  return { statuses, normalizeMode, submitLabel, canSave, createSaveLock };
});

