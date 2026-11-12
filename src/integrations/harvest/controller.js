// Background registration only: consent + preferences determine whether the timer adapter runs.
// sync() serializes changes so quick toggles cannot race registration against removal.
// Registration is limited to the embedded timer, not Harvest account pages.

'use strict';
// Register only the optional embedded-timer adapter; never inject into Harvest account pages.
(function () {
  const policy = globalThis.zdhHarvestPolicy;
  let queue = Promise.resolve();
  async function reconcile() {
    const permitted = await chrome.permissions.contains(policy.access);
    const prefs = await chrome.storage.local.get({ enabled: true, harvestTheme: false });
    if (!permitted) return { active: false };
    const registered = await chrome.scripting.getRegisteredContentScripts({
      ids: [policy.registration.id]
    });
    const active = prefs.enabled !== false && prefs.harvestTheme === true;
    if (active && !registered.length)
      await chrome.scripting.registerContentScripts([policy.registration]);
    else if (
      active &&
      registered.length &&
      ['js', 'css', 'matches', 'allFrames', 'runAt', 'persistAcrossSessions'].some(
        (key) => JSON.stringify(registered[0][key]) !== JSON.stringify(policy.registration[key])
      )
    ) {
      // Dynamic registrations survive updates; migrate old file paths before the next iframe load.
      await chrome.scripting.updateContentScripts([policy.registration]);
    } else if (!active && registered.length)
      await chrome.scripting.unregisterContentScripts({ ids: [policy.registration.id] });
    return { active };
  }
  function sync() {
    queue = queue.catch(() => {}).then(reconcile);
    return queue;
  }
  // The permission prompt may close the popup. Finish consent and persistence here instead.
  // Accept the already-started request: awaiting anything before request() loses the click gesture.
  async function finishEnable(permissionRequest) {
    if (!(await permissionRequest)) return { granted: false, active: false };
    await chrome.storage.local.set({ harvestTheme: true });
    return { granted: true, ...(await sync()) };
  }
  const run = () => sync().catch(() => {});
  chrome.runtime.onInstalled.addListener(run);
  chrome.runtime.onStartup.addListener(run);
  chrome.permissions.onAdded.addListener(run);
  chrome.permissions.onRemoved.addListener(async () => {
    if (!(await chrome.permissions.contains(policy.access)))
      await chrome.storage.local.set({ harvestTheme: false });
    run();
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.harvestTheme || changes.enabled)) run();
  });
  chrome.runtime.onMessage.addListener((message, sender, reply) => {
    if (!['zdh-harvest-sync', 'zdh-harvest-enable'].includes(message?.type)) return;
    if (
      sender.id !== chrome.runtime.id ||
      sender.url !== chrome.runtime.getURL('src/popup/popup.html')
    ) {
      reply({ error: 'Open the extension popup to configure Harvest styling.' });
      return;
    }
    if (message.type === 'zdh-harvest-enable') {
      // No await before this call. Chrome carries the popup click through this message hop.
      try {
        const permissionRequest = chrome.permissions.request(policy.access);
        finishEnable(permissionRequest).then(reply, (error) => reply({ error: error.message }));
      } catch (error) {
        reply({ error: error.message });
        return false;
      }
    } else sync().then(reply, (error) => reply({ error: error.message }));
    return true;
  });
})();
