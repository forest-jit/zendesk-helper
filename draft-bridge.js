// This runs in the page world so it can use the native CKEditor data API.
// The content script sends a request; this bridge checks ticket + expected draft, then replies.
// It never submits tickets. A different destination draft must never be overwritten.

/* Page-world adapter for CKEditor's documented data API; never edits innerHTML. */
(() => {
  'use strict';
  const selector = '[data-test-id="omnicomposer-rich-text-ckeditor"]',
    lock = 'zdh-property-save';
  function mark() {
    for (const node of document.querySelectorAll(selector)) {
      const e = node.ckeditorInstance;
      const ready = Boolean(
        e?.getData && e?.setData && e?.enableReadOnlyMode && e?.disableReadOnlyMode
      );
      if (node.dataset.zdhDraftApi !== String(ready)) node.dataset.zdhDraftApi = String(ready);
    }
  }
  document.documentElement.dataset.zdhDraftBridge = 'ready';
  document.addEventListener('focusin', mark, true);
  new MutationObserver(mark).observe(document.documentElement, { childList: true, subtree: true });
  mark();
  document.addEventListener(
    'zdh-draft-request',
    (event) => {
      mark();
      const node = event.target;
      if (
        !node?.matches?.(selector) ||
        !node.isConnected ||
        !node.getClientRects().length ||
        !/^\/agent\/tickets\/\d+$/.test(location.pathname)
      )
        return;
      let request;
      try {
        request = JSON.parse(event.detail);
      } catch {
        return;
      }
      if (
        !['read', 'park', 'restore', 'replace', 'unlock'].includes(request.operation) ||
        typeof request.id !== 'string'
      )
        return;
      if (request.path !== location.pathname) return;
      const ticket = node.closest('[data-test-id^="ticket-"][data-test-id$="-standard-layout"]');
      if (
        ticket?.dataset.testId !==
        'ticket-' + location.pathname.match(/\/tickets\/(\d+)/)[1] + '-standard-layout'
      )
        return;
      let result;
      try {
        const editor = node.ckeditorInstance;
        if (!editor?.getData || !editor?.setData)
          throw Error('The native editor data API is unavailable. Nothing was submitted.');
        const html = editor.getData();
        if (request.operation === 'replace') {
          if (
            typeof request.html !== 'string' ||
            typeof request.expected !== 'string' ||
            html !== request.expected
          )
            throw Error('The destination draft changed. Nothing was overwritten.');
          if (editor.plugins.has('PendingActions') && editor.plugins.get('PendingActions').hasAny)
            throw Error('Wait for uploads before carrying a draft.');
          try {
            editor.setData(request.html);
            if (editor.getData() !== request.html)
              throw Error('Draft transfer could not be verified.');
          } catch (error) {
            editor.setData(html);
            throw error;
          }
        } else if (request.operation === 'park') {
          if (html !== request.html) throw Error('The draft changed before saving. Try again.');
          if (editor.plugins.has('PendingActions') && editor.plugins.get('PendingActions').hasAny)
            throw Error('Wait for the attachment upload to finish before saving.');
          editor.enableReadOnlyMode(lock);
          try {
            editor.setData('');
            if (editor.getData() !== '') throw Error('The draft could not be held safely.');
          } catch (error) {
            editor.setData(html);
            editor.disableReadOnlyMode(lock);
            throw error;
          }
        } else if (request.operation === 'restore') {
          if (typeof request.html !== 'string') throw Error('Missing draft backup.');
          if (html && html !== request.html) {
            editor.disableReadOnlyMode(lock);
            throw Error('A different draft is present. The saved draft backup was retained.');
          }
          try {
            if (html !== request.html) editor.setData(request.html);
            if (editor.getData() !== request.html)
              throw Error('Draft restoration could not be verified; its backup was retained.');
          } finally {
            editor.disableReadOnlyMode(lock);
          }
        }
        if (request.operation === 'unlock') editor.disableReadOnlyMode(lock);
        result = { html: editor.getData() };
      } catch (error) {
        result = { error: error.message };
      }
      node.dispatchEvent(
        new CustomEvent('zdh-draft-response', {
          detail: JSON.stringify({ id: request.id, ...result })
        })
      );
    },
    true
  );
})();
