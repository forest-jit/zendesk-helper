const assert = require('node:assert/strict');
const m = require('../ticket-model.js');
const identity = { organization: 'Jones IT', requester: 'Forest Welch' };
assert.equal(m.identityTitle('Wi-Fi issue', identity), 'Jones IT - Forest Welch - Wi-Fi issue');
assert.equal(
  m.identityTitle('Old company - Old requester - Wi-Fi - VPN issue', identity),
  'Jones IT - Forest Welch - Wi-Fi - VPN issue'
);
assert.equal(
  m.identityTitle('Jones IT - Forest Welch - Jones IT - Forest Welch - Wi-Fi issue', identity),
  'Jones IT - Forest Welch - Wi-Fi issue'
);
assert.equal(m.identityTitle('Issue', { organization: '', requester: 'Forest' }), null);
for (const [source, dest, previous, want] of [
  ['new', '', '', 'replace'],
  ['new', 'other', '', 'conflict'],
  ['new', 'new', '', 'same'],
  ['new', 'old', 'old', 'replace'],
  ['', 'old', '', 'empty']
])
  assert.equal(m.transferDecision(source, dest, previous), want);
const safe = {
  enabled: true,
  interval: 15,
  path: '/agent/filters/123',
  visible: true,
  online: true,
  editing: false,
  selection: false,
  overlay: false,
  busy: false,
  idleMs: 6000
};
assert.equal(m.queueAllowed(safe), true);
for (const patch of [
  { path: '/agent/tickets/123' },
  { visible: false },
  { online: false },
  { editing: true },
  { selection: true },
  { overlay: true },
  { busy: true },
  { idleMs: 0 },
  { enabled: false },
  { interval: 0 },
  { interval: 2 }
])
  assert.equal(m.queueAllowed({ ...safe, ...patch }), false);
assert.equal(
  m.copyText(
    { id: '123', title: 'A [link]', url: 'https://itjones.zendesk.com/agent/tickets/123' },
    'markdown'
  ),
  '[A \\[link\\] (#123)](https://itjones.zendesk.com/agent/tickets/123)'
);
assert.equal(m.activity([]).kind, 'unknown');
assert.equal(m.activity(['No agent viewing this ticket']).kind, 'unknown');
assert.equal(m.activity(['Taylor is editing this ticket']).kind, 'editing');
assert.equal(m.activity(['Sam is viewing this ticket']).kind, 'viewing');
console.log(
  'PASS: identity prefixes, issue preservation, distinct draft conflict, clipboard escaping, queue interruption gates and reported activity states.'
);

// Native Requester uses a selected display value, not the hidden search input.
const vm = require('node:vm'),
  fs = require('node:fs');
let selected = 'Forest Welch',
  org = 'Jones IT';
const selectedNode = {
  get textContent() {
    return selected;
  }
};
const input = { value: '', getAttribute: () => 'search name or contact info' };
const identityContext = {
  document: {
    querySelectorAll: () => [
      {
        get textContent() {
          return org;
        }
      }
    ]
  },
  visible: () => true
};
const adapter = fs.readFileSync(require.resolve('../ticket-tools.js'), 'utf8');
vm.runInNewContext(
  adapter.slice(
    adapter.indexOf(' function identity('),
    adapter.indexOf(' function writeSubject(')
  ) + '\nthis.readIdentity=identity;',
  identityContext
);
const identityState = {
  properties: {
    querySelector: (selector) =>
      selector.includes('dropdowns.combobox.value') ? selectedNode : input
  }
};
assert.equal(identityContext.readIdentity(identityState).requester, 'Forest Welch');
selected = 'search name or contact info';
assert.equal(identityContext.readIdentity(identityState).requester, '');
selected = 'Forest Welch';
org = '-';
assert.equal(identityContext.readIdentity(identityState).organization, '');
