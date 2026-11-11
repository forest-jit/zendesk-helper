const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../src/tickets/tools.js'), 'utf8');
const implementation = source.slice(
  source.indexOf(' function waitFor('),
  source.indexOf(' function syncMode(')
);
async function scenario(destination) {
  let html = '<p><strong>Source draft</strong></p>',
    busy = false,
    notice = '',
    backups = {};
  const editor = {
    isConnected: true,
    innerHTML: 'stable',
    dataset: { zdhDraftApi: 'true' },
    matches: () => true,
    focus() {}
  };
  const state = {
    nativeReady: true,
    mode: 'public',
    composer: editor,
    grid: { isConnected: true },
    modeButton: { click() {} }
  };
  const option = {
    textContent: 'Internal note',
    getAttribute() {
      return '';
    },
    click() {
      state.mode = 'internal';
      setTimeout(() => {
        html = destination;
      }, 80);
    }
  };
  const ctx = {
    enabled: true,
    preferences: { carryDraft: true },
    state: () => state,
    busy: () => busy,
    acquire() {
      if (busy) return false;
      busy = true;
      return true;
    },
    release() {
      busy = false;
    },
    refresh() {},
    uploads: () => false,
    async request(_node, operation, value, expected) {
      if (operation === 'replace') {
        assert.equal(html, expected);
        html = value;
      }
      return { html };
    }
  };
  const context = {
    ctx,
    root: { zdhWorkflow: require('../src/tickets/workflow.js') },
    model: require('../src/tickets/model.js'),
    getState: () => state,
    editorOf: () => editor,
    visible: () => true,
    live: () => true,
    location: { pathname: '/agent/tickets/209867' },
    document: { querySelectorAll: () => [option] },
    notice: (value) => (notice = value),
    carried: new Map(),
    syncMode() {},
    setTimeout,
    Date,
    crypto: require('node:crypto').webcrypto,
    chrome: {
      storage: {
        local: {
          async set(value) {
            Object.assign(backups, value);
          },
          async remove(key) {
            delete backups[key];
          }
        }
      }
    }
  };
  vm.runInNewContext(implementation + '\nthis.run=switchMode;', context);
  await context.run();
  return { html, notice, busy, backups };
}
(async () => {
  const empty = await scenario('');
  assert.equal(empty.html, '<p><strong>Source draft</strong></p>');
  assert.equal(empty.notice, '');
  assert.equal(empty.busy, false);
  assert.equal(Object.keys(empty.backups).length, 0);
  const conflict = await scenario('<p>Independent private draft</p>');
  assert.equal(conflict.html, '<p>Independent private draft</p>');
  assert.match(conflict.notice, /different draft/);
  assert.equal(conflict.busy, false);
  console.log(
    'PASS: real mode orchestration waits for delayed native draft loading and retains distinct destination drafts.'
  );
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
