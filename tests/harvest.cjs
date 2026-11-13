const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../src/integrations/harvest/policy.js');
const timer =
  'https://platform.harvestapp.com/platform/timer?service=itjones.zendesk.com&app_name=Zendesk';
const ancestors = ['https://3.apps.zdusercontent.com', 'https://itjones.zendesk.com'];
assert.equal(policy.embeddedTimer(timer, ancestors, false), true);
for (const [url, parents, top] of [
  [timer, ancestors, true],
  [timer, [], false],
  [timer, ['https://other.zendesk.com'], false],
  [timer.replace('/timer?', '/timer-extra?'), ancestors, false],
  [timer.replace('itjones', 'other'), ancestors, false],
  [timer.replace('platform.harvestapp.com', 'evil.example'), ancestors, false]
])
  assert.equal(policy.embeddedTimer(url, parents, top), false);
assert.deepEqual(policy.registration.matches, ['https://platform.harvestapp.com/platform/timer*']);
// Real adapter lifecycle against a root-only fake document; no timer form API exists to touch.
let styles = [];
const html = { dataset: {} };
let prefs = { enabled: true, harvestTheme: true, theme: 'midnight' },
  onStorage;
const media = {
  matches: false,
  addEventListener(_type, callback) {
    this.changed = callback;
  }
};
const context = {
  location: { href: timer, ancestorOrigins: ancestors },
  top: {},
  document: {
    documentElement: html,
    head: {
      append(n) {
        styles.push(n);
      }
    },
    createElement() {
      return {
        remove() {
          styles = styles.filter((n) => n !== this);
        }
      };
    }
  },
  matchMedia: (q) =>
    q.includes('forced-colors') ? media : { matches: false, addEventListener() {} },
  zdhHarvestPolicy: policy,
  zdhThemes: require('../src/shared/themes.js'),
  chrome: {
    storage: {
      local: {
        get(_defaults, callback) {
          callback(prefs);
        }
      },
      onChanged: {
        addListener(callback) {
          onStorage = callback;
        }
      }
    }
  }
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../src/integrations/harvest/theme.js'), 'utf8'),
  context
);
assert.equal(html.dataset.zdhHarvestTheme, 'midnight');
assert.equal(styles.length, 1);
for (const theme of ['blush', 'forest', 'purple', 'magenta', 'jones', 'tealPink', 'pinkTeal']) {
  prefs = { ...prefs, theme };
  onStorage({ theme: {} }, 'local');
  assert.equal(html.dataset.zdhHarvestTheme, theme);
  assert.equal(styles.length, 1);
}
prefs = { ...prefs, enabled: false };
onStorage({ enabled: {} }, 'local');
assert.equal(html.dataset.zdhHarvestTheme, undefined);
assert.equal(styles.length, 0);
prefs = { ...prefs, enabled: true };
onStorage({ enabled: {} }, 'local');
assert.equal(styles.length, 1);
media.matches = true;
media.changed();
assert.equal(styles.length, 0);
media.matches = false;
media.changed();
assert.equal(styles.length, 1);
prefs = { ...prefs, harvestTheme: false };
onStorage({ harvestTheme: {} }, 'local');
assert.equal(styles.length, 0);
// Registration is impossible without both optional permissions and the user's enable preference.
(async () => {
  let permitted = false,
    registered = [],
    installed,
    changed,
    removed,
    messageListener,
    resolvePermission,
    permissionRequests = 0,
    registerCount = 0,
    updateCount = 0;
  const controller = {
    zdhHarvestPolicy: policy,
    chrome: {
      permissions: {
        contains: async () => permitted,
        request(access) {
          assert.equal(access, policy.access);
          permissionRequests++;
          return new Promise((resolve) => {
            resolvePermission = resolve;
          });
        },
        onAdded: { addListener() {} },
        onRemoved: {
          addListener(fn) {
            removed = fn;
          }
        }
      },
      storage: {
        local: {
          get: async () => prefs,
          set: async (v) => {
            prefs = { ...prefs, ...v };
          }
        },
        onChanged: {
          addListener(fn) {
            changed = fn;
          }
        }
      },
      scripting: {
        getRegisteredContentScripts: async () => registered,
        registerContentScripts: async (entries) => {
          registerCount++;
          registered = entries;
        },
        updateContentScripts: async (entries) => {
          updateCount++;
          registered = entries;
        },
        unregisterContentScripts: async () => {
          registered = [];
        }
      },
      runtime: {
        onInstalled: {
          addListener(fn) {
            installed = fn;
          }
        },
        onStartup: { addListener() {} },
        id: 'test-extension',
        getURL: (name) => 'chrome-extension://test-extension/' + name,
        onMessage: {
          addListener(fn) {
            messageListener = fn;
          }
        }
      }
    }
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../src/integrations/harvest/controller.js'), 'utf8'),
    controller
  );
  async function flush() {
    // Drain the permission/storage/registration microtasks without a wall-clock sleep.
    await new Promise(setImmediate);
  }
  prefs = { enabled: true, harvestTheme: true };
  installed();
  await flush();
  assert.equal(registerCount, 0);
  permitted = true;
  changed({ harvestTheme: {} }, 'local');
  await flush();
  assert.equal(registerCount, 1);
  assert.equal(registered[0].allFrames, true);
  registered = [{ ...registered[0], js: ['themes.js', 'harvest-policy.js', 'harvest-theme.js'] }];
  installed();
  await flush();
  assert.equal(updateCount, 1, 'surviving registrations must migrate old runtime paths');
  assert.deepEqual(registered[0].js, policy.registration.js);
  installed();
  await flush();
  assert.equal(updateCount, 1, 'current registrations do not need repeated updates');
  prefs.harvestTheme = false;
  changed({ harvestTheme: {} }, 'local');
  await flush();
  assert.equal(registered.length, 0);
  prefs.harvestTheme = true;
  permitted = false;
  await removed();
  await flush();
  assert.equal(prefs.harvestTheme, false);
  const popup = {
    id: 'test-extension',
    url: 'chrome-extension://test-extension/src/popup/popup.html'
  };
  const enable = { type: 'zdh-harvest-enable' };
  let response;
  // No popup callback remains. Granting still persists the preference and registers the adapter.
  messageListener(enable, popup, () => {});
  assert.equal(permissionRequests, 1, 'request must start synchronously from the click message');
  assert.equal(prefs.harvestTheme, false, 'asking is not approval');
  permitted = true;
  resolvePermission(true);
  await flush();
  assert.equal(prefs.harvestTheme, true, 'grant completes without a live popup');
  assert.equal(registered.length, 1);

  messageListener(enable, { ...popup, url: 'https://itjones.zendesk.com/agent/' }, (r) => {
    response = r;
  });
  assert.equal(permissionRequests, 1, 'a content page must not request optional access');
  assert.ok(response?.error);
  messageListener(enable, { ...popup, id: 'another-extension' }, () => {});
  assert.equal(permissionRequests, 1, 'another extension cannot request access');

  prefs.harvestTheme = false;
  changed({ harvestTheme: {} }, 'local');
  await flush();
  assert.equal(registered.length, 0);
  permitted = false;
  messageListener(enable, popup, (r) => {
    response = r;
  });
  resolvePermission(false);
  await flush();
  assert.equal(response.granted, false);
  assert.equal(prefs.harvestTheme, false, 'denial must not enable styling');
  assert.equal(registered.length, 0);

  // Settings is another exact, packaged extension page; its section anchors are allowed.
  messageListener(
    enable,
    { ...popup, url: 'chrome-extension://test-extension/src/settings/settings.html#harvest' },
    (r) => {
      response = r;
    }
  );
  assert.equal(permissionRequests, 3);
  permitted = true;
  resolvePermission(true);
  await flush();
  assert.equal(response.granted, true);
  assert.equal(prefs.harvestTheme, true);
  prefs.harvestTheme = false;
  changed({ harvestTheme: {} }, 'local');
  await flush();
  messageListener(
    enable,
    { ...popup, url: 'chrome-extension://another-extension/src/settings/settings.html' },
    (r) => {
      response = r;
    }
  );
  assert.ok(response.error);
  assert.equal(permissionRequests, 3);

  // Unrelated grant events still reconcile preferences; they never turn the feature on.
  permitted = true;
  installed();
  await flush();
  assert.equal(prefs.harvestTheme, false);
  assert.equal(registered.length, 0);
  console.log(
    'PASS: optional Harvest registration, exact embedded context, theme switching, Native/Off/revoke cleanup, consent without a live popup, denial and forced-colors.'
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
