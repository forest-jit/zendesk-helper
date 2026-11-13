const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
let handler, download;
const chrome = {
  runtime: {
    id: 'helper',
    onMessage: {
      addListener(fn) {
        handler = fn;
      }
    }
  },
  downloads: {
    download(options, cb) {
      download = options;
      cb(42);
    },
    search(query, cb) {
      cb([{ state: 'complete', filename: '/Downloads/' + download.filename }]);
    },
    onChanged: { addListener() {}, removeListener() {} }
  }
};
vm.runInNewContext(
  fs.readFileSync(
    require('node:path').join(__dirname, '../src/background/service-worker.js'),
    'utf8'
  ),
  { chrome, URL, encodeURIComponent, setTimeout, clearTimeout, importScripts() {} }
);
const sender = { id: 'helper', url: 'https://itjones.zendesk.com/agent/tickets/209867' };
const message = {
  type: 'zdh-download',
  filename: 'ticket-209867-20261109T0142525.raw.json',
  text: '{"comments":[]}'
};
let result;
assert.equal(
  handler(message, sender, (value) => {
    result = value;
  }),
  true
);
assert.equal(result.downloadId, 42);
assert.ok(result.filename.endsWith(message.filename));
assert.equal(download.filename, message.filename);
assert.equal(decodeURIComponent(download.url.split(',')[1]), message.text);
for (const [change, source] of [
  [{ filename: '../private.json' }, sender],
  [{}, { ...sender, url: 'https://other.example/agent/tickets/1' }]
]) {
  download = null;
  handler({ ...message, ...change }, source, (value) => {
    result = value;
  });
  assert.ok(result.error);
  assert.equal(download, null);
}
console.log(
  'PASS: ticket export downloads accept timestamped filenames and reject unrelated sources/paths.'
);

(async () => {
  const calls = [];
  chrome.tabs = {
    async get(id) {
      return { id, url: 'https://itjones.zendesk.com/agent/tickets/209867' };
    },
    async sendMessage(id, message) {
      calls.push({ id, message });
      return { filename: 'ticket-209867.raw.json' };
    }
  };
  const popup = { id: 'helper', url: 'chrome-extension://helper/src/popup/popup.html' };
  const request = { type: 'zdh-export-active-ticket', tabId: 4, ticketId: '209867' };
  const invoke = (source, value = request) =>
    new Promise((resolve) => handler(value, source, resolve));
  assert.equal((await invoke(popup)).filename, 'ticket-209867.raw.json');
  assert.deepEqual(
    calls.map((call) => call.id),
    [4]
  );
  assert.equal(calls[0].message.type, 'zdh-export');
  assert.ok((await invoke(sender)).error, 'content scripts cannot impersonate the popup');
  assert.ok((await invoke({ ...popup, id: 'foreign' })).error);
  assert.ok((await invoke(popup, { ...request, tabId: '4' })).error);
  chrome.tabs.get = async (id) => ({ id, url: 'https://itjones.zendesk.com/agent/tickets/222' });
  assert.ok((await invoke(popup)).error, 'navigation must not export another ticket');
  assert.equal(calls.length, 1);
  chrome.tabs.get = async () => {
    throw Error('No tab with id');
  };
  assert.ok((await invoke(popup)).error);
  console.log('PASS: background export validates the popup and captured ticket before handoff.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
