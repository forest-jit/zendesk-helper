// One source for Harvest access and frame restrictions.
// Permission to a host is broader than our feature: runtime checks narrow it to the Zendesk timer.

'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhHarvestPolicy = api;
})(globalThis, function () {
  const origin = 'https://platform.harvestapp.com/*';
  const access = { permissions: ['scripting'], origins: [origin] };
  function embeddedTimer(href, ancestors, isTop) {
    try {
      const url = new URL(href);
      return (
        !isTop &&
        url.origin === 'https://platform.harvestapp.com' &&
        url.pathname === '/platform/timer' &&
        url.searchParams.get('service') === 'itjones.zendesk.com' &&
        url.searchParams.get('app_name') === 'Zendesk' &&
        ancestors.length > 0 &&
        ancestors[ancestors.length - 1] === 'https://itjones.zendesk.com'
      );
    } catch {
      return false;
    }
  }
  const registration = {
    id: 'zdh-harvest-theme',
    matches: ['https://platform.harvestapp.com/platform/timer*'],
    js: [
      'src/shared/themes.js',
      'src/integrations/harvest/policy.js',
      'src/integrations/harvest/theme.js'
    ],
    css: ['src/integrations/harvest/theme.css'],
    allFrames: true,
    runAt: 'document_idle',
    persistAcrossSessions: true
  };
  return { origin, access, embeddedTimer, registration };
});
