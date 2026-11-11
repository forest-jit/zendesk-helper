const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const policy = require('../harvest-policy.js');
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
  zdhThemes: require('../themes.js'),
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
vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../harvest-theme.js'), 'utf8'), context);
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
    registerCount = 0;
  const controller = {
    zdhHarvestPolicy: policy,
    chrome: {
      permissions: {
        contains: async () => permitted,
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
        onMessage: { addListener() {} }
      }
    }
  };
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../harvest-controller.js'), 'utf8'),
    controller
  );
  async function flush() {
    for (let i = 0; i < 15; i++) await Promise.resolve();
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
  prefs.harvestTheme = false;
  changed({ harvestTheme: {} }, 'local');
  await flush();
  assert.equal(registered.length, 0);
  prefs.harvestTheme = true;
  permitted = false;
  await removed();
  await flush();
  assert.equal(prefs.harvestTheme, false);
  console.log(
    'PASS: optional Harvest registration, exact embedded context, theme switching, Native/Off/revoke cleanup and forced-colors.'
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
