'use strict';
const fs = require('node:fs'),
  assert = require('node:assert/strict'),
  vm = require('node:vm');
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../src/content/index.js'),
  'utf8'
);
let cleared = 0;
const context = {
  host: { getAttribute: () => 'Expected: Company - Requester - Issue.' },
  field: { value: 'Company - Person - Issue' },
  ticketIdentity: () => ({}),
  clearWarning() {
    cleared++;
  },
  globalThis: { zdTitleReview: (value) => ({ valid: value === 'Company - Person - Issue' }) }
};
vm.createContext(context);
vm.runInContext(
  source.slice(
    source.indexOf('  function refreshTitleWarning() {'),
    source.indexOf('  function sync() {')
  ),
  context
);
context.refreshTitleWarning();
assert.equal(cleared, 1, 'native subject reversion clears the obsolete warning');
context.field.value = '';
context.refreshTitleWarning();
assert.equal(cleared, 1, 'keep a warning while the title remains invalid');
console.log('PASS: title warnings follow the current native value after blur reversion.');
