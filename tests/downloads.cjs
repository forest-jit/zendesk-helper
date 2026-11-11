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
  fs.readFileSync(require('node:path').join(__dirname, '../background.js'), 'utf8'),
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
