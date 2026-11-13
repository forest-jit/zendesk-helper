'use strict';
const assert = require('node:assert/strict'),
  fs = require('node:fs'),
  vm = require('node:vm');
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../src/content/index.js'),
  'utf8'
);
// Execute real sync over short tickets: marker assignment must precede the early return.
for (const count of [0, 1, 2, 5]) {
  const header = { dataset: {} },
    row = { dataset: {} },
    via = { parentElement: row, closest: () => ({ firstElementChild: header }) };
  const log = { children: [] },
    entries = Array.from({ length: count }, () => ({ dataset: {} }));
  let removed = false,
    images = false;
  const disclosure = {
    remove() {
      removed = true;
    }
  };
  const conversation = {
    querySelector: (s) =>
      s.includes('conversation-log') ? log : s.includes('omni-header-via-label') ? via : disclosure,
    querySelectorAll: () => entries
  };
  const context = {
    globalThis: {
      zdhWorkspace: {
        selectors: { conversationEntry: 'entries', conversationLog: 'conversation-log' }
      }
    },
    controlState: () => ({ conversation }),
    syncConversationScroll() {},
    syncImages() {
      images = true;
    }
  };
  vm.createContext(context);
  vm.runInContext(
    source.slice(
      source.indexOf('  function syncConversation(grid)'),
      source.indexOf('  function clearConversation()')
    ),
    context
  );
  context.syncConversation({});
  assert.equal(header.dataset.zdhConversationHeader, 'true');
  assert.equal(row.dataset.zdhTicketToolsRow, 'true');
  assert.ok(removed && images);
  assert.ok(entries.every((e) => e.dataset.zdhConversationEntry === 'true'));
}
console.log('PASS: header theme marker on zero-to-five-message tickets.');
