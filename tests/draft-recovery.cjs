const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const workflow = require('../src/tickets/workflow.js');
const source = fs.readFileSync(require.resolve('../src/content/index.js'), 'utf8');
const saveSource = source.slice(
  source.indexOf('  async function savePropertiesActive('),
  source.indexOf('  async function prepareExport(')
);
async function scenario(kind) {
  let html = '<p><strong>Unsent rich draft</strong></p>',
    clicks = 0,
    restores = 0,
    persisted = 'open',
    failed = false;
  const data = {},
    removed = [],
    output = { textContent: '' },
    record = {},
    region = { isConnected: true, inert: false },
    grid = { isConnected: true };
  const node = { closest: () => region },
    select = { value: 'pending', dataset: { touched: 'true' } };
  const state = {
    mode: 'public',
    nativeReady: true,
    status: 'open',
    submit: { disabled: false, getAttribute: () => null },
    get composerContent() {
      return html;
    }
  };
  const ctx = {
    zdhWorkflow: workflow,
    workflowGrid: grid,
    pageLeaving: false,
    ticketEpoch: 0,
    location: { pathname: '/agent/tickets/209867' },
    crypto: require('node:crypto'),
    activeHeldDraft: null,
    saveLock: workflow.createSaveLock(),
    saveUI: () => ({ querySelector: () => output }),
    propertiesUI: () => ({ querySelector: () => select }),
    controlState: () => state,
    draftSafe: () => true,
    propertyDirty: () => true,
    hasQueuedAttachments: () => false,
    draftBackups: async () => Object.entries(data).map(([key, value]) => ({ ...value, key })),
    draftKey: () => 'draft:test:public',
    draftEditor: () => node,
    draftRequest: async (_node, op, value) => {
      if (op === 'park') html = '';
      if (op === 'restore') {
        restores++;
        assert.ok(!html || html === value);
        html = value;
      }
      return { html };
    },
    chrome: {
      storage: {
        local: {
          set: async (values) => {
            for (const [key, value] of Object.entries(values))
              data[key] = JSON.parse(JSON.stringify(value));
          },
          remove: async (key) => {
            removed.push(key);
            delete data[key];
          }
        }
      }
    },
    nativeBusy: (s) => s.submit.disabled,
    propertyRecord: () => record,
    propertySnapshot: () => 'fields',
    propertyBaselines: new Map([[grid, record]]),
    persistedTicketStatus: () => persisted,
    saveError: () => failed,
    chooseNativeStatus: async () => {
      state.status = 'pending';
      return true;
    },
    document: {
      querySelectorAll: () => [],
      querySelector: () => ({ getAttribute: () => 'false' })
    },
    visible: () => true,
    saveNotice: (text) => (output.textContent = text),
    refreshWorkflow: () => {},
    scheduleSync: () => {},
    finishCloseExport: () => {},
    pendingCloseExport: null,
    exportFeedback: '',
    recoveryPending: new Set(),
    recoveryAfter: new Map(),
    setTimeout: (fn, delay) =>
      setTimeout(() => {
        if (kind === 'reload-during-cleanup' && delay === 750) {
          ctx.ticketEpoch++;
          ctx.pageLeaving = true;
        }
        fn();
      }, 0)
  };
  state.submit.click = () => {
    clicks++;
    assert.equal(html, '', 'Native Submit must never receive the held draft');
    state.submit.disabled = true;
    if (kind === 'reload') {
      ctx.pageLeaving = true;
      ctx.ticketEpoch++;
    }
    if (kind === 'navigation') {
      ctx.location.pathname = '/agent/home/tickets';
      ctx.ticketEpoch++;
    }
    if (kind === 'failure') {
      failed = true;
      state.submit.disabled = false;
    }
    if (kind === 'success' || kind === 'reload-during-cleanup') {
      persisted = 'pending';
      state.submit.disabled = false;
    }
  };
  const save = vm.runInNewContext(saveSource + '\nsavePropertiesActive;', ctx);
  await save();
  assert.equal(clicks, 1);
  assert.equal(ctx.saveLock.busy, false);
  if (kind === 'success' || kind === 'failure') {
    assert.equal(html, '<p><strong>Unsent rich draft</strong></p>');
    assert.equal(Object.keys(data).length, 0, kind + ': ' + output.textContent);
  } else {
    assert.equal(
      Object.keys(data).length,
      1,
      'Unconfirmed/interrupted saves must retain a durable copy'
    );
    assert.equal(removed.length, 0);
  }
  if (kind === 'reload' || kind === 'navigation' || kind === 'timeout')
    assert.equal(
      restores,
      0,
      'Do not restore into a departing page or while native Submit is busy'
    );
  return data;
}
(async () => {
  for (const kind of [
    'success',
    'failure',
    'reload',
    'navigation',
    'timeout',
    'reload-during-cleanup'
  ])
    await scenario(kind);
  console.log(
    'PASS: real save orchestration retains rich drafts on failure, timeout, navigation and both reload races; native payload stays empty.'
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
