// Background jobs: approve local downloads and register optional Harvest styling.
// Requests must come from this extension on the allowed Zendesk site.
// A download is successful only when Chrome reports completion, not when it returns an ID.

importScripts('harvest-policy.js', 'harvest-controller.js');
('use strict');
// Only this extension's content script on the approved Zendesk agent site can save exports.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type !== 'zdh-download') return;
  const url = new URL(sender.url || 'about:blank');
  if (
    sender.id !== chrome.runtime.id ||
    url.origin !== 'https://itjones.zendesk.com' ||
    !url.pathname.startsWith('/agent/')
  ) {
    respond({ error: 'Export source is not an approved ticket page.' });
    return;
  }
  if (
    !/^ticket-[a-z0-9-]+\.(raw\.json|md)$/i.test(message.filename || '') ||
    typeof message.text !== 'string' ||
    message.text.length > 60 * 1024 * 1024
  ) {
    respond({ error: 'Invalid export file.' });
    return;
  }
  const mime = message.filename.endsWith('.json') ? 'application/json' : 'text/markdown';
  chrome.downloads.download(
    {
      url: `data:${mime};charset=utf-8,${encodeURIComponent(message.text)}`,
      filename: message.filename,
      saveAs: false
    },
    (id) => {
      if (chrome.runtime.lastError) {
        respond({ error: chrome.runtime.lastError.message });
        return;
      }
      let done = false;
      const finish = () =>
        chrome.downloads.search({ id }, (items) => {
          if (done) return;
          const item = items?.[0];
          if (item?.state !== 'complete' && item?.state !== 'interrupted') return;
          done = true;
          clearTimeout(timeout);
          chrome.downloads.onChanged.removeListener(changed);
          respond(
            item.state === 'complete'
              ? { downloadId: id, filename: item.filename }
              : { error: 'Chrome interrupted the export download.' }
          );
        });
      const changed = (delta) => {
        if (delta.id === id) finish();
      };
      const timeout = setTimeout(() => {
        if (!done) {
          done = true;
          chrome.downloads.onChanged.removeListener(changed);
          respond({
            error: 'The download has not completed. Check Chrome before exporting again.'
          });
        }
      }, 60000);
      chrome.downloads.onChanged.addListener(changed);
      finish();
    }
  );
  return true;
});
