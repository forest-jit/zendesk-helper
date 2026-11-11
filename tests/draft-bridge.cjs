const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
let handler,
  response,
  html = '<p><strong>Keep me</strong></p>',
  locked = false,
  pending = false,
  failClear = false;
const editor = {
  getData: () => html,
  setData: (value) => {
    if (failClear && value === '') throw Error('clear failed');
    html = value;
  },
  enableReadOnlyMode: () => (locked = true),
  disableReadOnlyMode: () => (locked = false),
  plugins: {
    has: () => true,
    get: () => ({
      get hasAny() {
        return pending;
      }
    })
  }
};
const node = {
  isConnected: true,
  dataset: {},
  ckeditorInstance: editor,
  matches: () => true,
  closest: () => ({ dataset: { testId: 'ticket-209867-standard-layout' } }),
  getClientRects: () => [{}],
  dispatchEvent: (event) => (response = JSON.parse(event.detail))
};
vm.runInNewContext(fs.readFileSync(require.resolve('../draft-bridge.js'), 'utf8'), {
  document: {
    documentElement: { dataset: {} },
    querySelectorAll: () => [node],
    addEventListener: (name, fn) => {
      if (name === 'zdh-draft-request') handler = fn;
    }
  },
  location: { pathname: '/agent/tickets/209867' },
  MutationObserver: class {
    observe() {}
  },
  CustomEvent: class {
    constructor(name, options) {
      Object.assign(this, options);
    }
  }
});
const request = (operation, data, path = '/agent/tickets/209867', expected) => {
  response = null;
  handler({
    target: node,
    detail: JSON.stringify({ id: 'test', operation, html: data, path, expected })
  });
  return response;
};
const original = html;
assert.equal(request('read').html, original);
assert.match(request('park', 'stale').error, /changed/);
assert.equal(html, original);
pending = true;
assert.match(request('park', original).error, /upload/);
assert.equal(html, original);
pending = false;
failClear = true;
assert.match(request('park', original).error, /clear failed/);
assert.equal(html, original);
assert.equal(locked, false);
failClear = false;
assert.equal(request('park', original).html, '');
assert.equal(locked, true);
assert.equal(request('restore', original).html, original);
assert.equal(locked, false);
html = '<p>Newer draft</p>';
assert.match(request('restore', original).error, /different draft/);
assert.equal(html, '<p>Newer draft</p>');
console.log(
  'PASS: rich draft read/hold/restore, stale edits, upload guard, rollback and conflict protection.'
);

locked = true;
request('restore', original);
assert.equal(locked, false);
assert.equal(request('park', html, '/agent/tickets/999'), null);
assert.equal(html, '<p>Newer draft</p>');
locked = true;
request('unlock');
assert.equal(locked, false);

const beforeReplace = html;
assert.match(
  request('replace', '<p>Carry me</p>', '/agent/tickets/209867', 'stale').error,
  /changed/
);
assert.equal(html, beforeReplace);
pending = true;
assert.match(request('replace', '<p>Carry me</p>', '/agent/tickets/209867', html).error, /uploads/);
assert.equal(html, beforeReplace);
pending = false;
assert.equal(
  request('replace', '<p><strong>Carried</strong></p>', '/agent/tickets/209867', html).html,
  '<p><strong>Carried</strong></p>'
);
