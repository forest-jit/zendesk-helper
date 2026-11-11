'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../content.js'), 'utf8');
let clicked = 0,
  released = 0;
const state = {
  readOnly: true,
  nativeReady: true,
  mode: 'public',
  composerContent: '<p>Hidden stale draft</p>',
  submit: {
    click() {
      clicked++;
    }
  }
};
const context = {
  workflowGrid: {},
  location: { pathname: '/agent/tickets/205358' },
  recoveryPending: new Set(),
  recoveryChecked: new Set(['/agent/tickets/205358']),
  saveLock: {
    acquire: () => true,
    release() {
      released++;
    }
  },
  controlState: () => state,
  globalThis: { zdhWorkflow: require('../workflow.js') },
  refreshWorkflow() {},
  releaseAction() {}
};
vm.createContext(context);
vm.runInContext(
  source.slice(
    source.indexOf('  async function sendActive()'),
    source.indexOf('  async function savePropertiesActive(')
  ),
  context
);
(async () => {
  assert.equal(await context.sendActive(), false);
  assert.equal(clicked, 0, 'closed ticket cannot submit even with stale ready composer controls');
  assert.equal(released, 1);
  console.log('PASS: closed-ticket Send rejects stale composer controls.');
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
