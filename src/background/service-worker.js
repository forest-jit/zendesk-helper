// Background jobs: approve local downloads and register optional Harvest styling.
// Popup requests target an approved ticket; downloads originate in its content script.
// A download is successful only when Chrome reports completion, not when it returns an ID.

'use strict';
importScripts('../integrations/harvest/policy.js', '../integrations/harvest/controller.js');
// Each message type has its own sender guard before any tab action or file download.
chrome.runtime.onMessage.addListener((message, sender, respond) => {
  if (message?.type === 'zdh-export-active-ticket') {
    const popup = `chrome-extension://${chrome.runtime.id}/src/popup/popup.html`;
    if (
      sender.id !== chrome.runtime.id ||
      sender.url?.split('#')[0] !== popup ||
      !Number.isInteger(message.tabId) ||
      !/^\d+$/.test(message.ticketId || '')
    ) {
      respond({ error: 'Open the helper on the ticket you want to export.' });
      return;
    }
    // Own this request before the popup can close. Recheck the captured tab/URL, then
    // let the content script and download job finish independently of the popup.
    (async () => {
      try {
        const tab = await chrome.tabs.get(message.tabId);
        const url = new URL(tab.url || 'about:blank');
        if (
          url.origin !== 'https://itjones.zendesk.com' ||
          url.pathname.replace(/\/$/, '') !== '/agent/tickets/' + message.ticketId
        )
          throw Error('The selected ticket changed. Reopen the popup on the ticket you want.');
        respond(await chrome.tabs.sendMessage(tab.id, { type: 'zdh-export' }));
      } catch (error) {
        respond({ error: error.message });
      }
    })();
    return true;
  }
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
