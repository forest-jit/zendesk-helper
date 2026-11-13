const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../src/content/index.js'),
  'utf8'
);
// Execute the real adapter with late native controls; no Zendesk state or DOM reparenting.
const root = { dataset: {} };
const pane = { dataset: {}, parentElement: root, closest: () => root };
const composer = { dataset: {}, parentElement: pane, querySelector: () => editor };
const inner = { dataset: {}, parentElement: composer };
const editor = { dataset: {}, parentElement: inner };
const log = { dataset: {}, parentElement: pane };
pane.querySelector = (selector) => (selector.includes('omni-log-container') ? log : composer);
let buttons = [];
const path = [pane, composer, inner, editor, log];
const conversation = {
  querySelector: () => pane,
  querySelectorAll: (selector) =>
    selector === 'button' ? buttons : path.filter((e) => e.dataset.zdhFlowPath)
};
function button(text, content = false) {
  return {
    dataset: {},
    textContent: text,
    closest: () => (content ? {} : null),
    hasAttribute() {
      return !!this.dataset.zdhNativeHistoryJump;
    }
  };
}
const context = { Set };
vm.createContext(context);
vm.runInContext(
  source.slice(
    source.indexOf('  function syncConversationScroll('),
    source.indexOf('  function syncConversation(grid)')
  ),
  context
);
context.syncConversationScroll(conversation);
assert.equal(root.dataset.zdhConversationScroll, 'true');
assert.ok(
  path.every((e) => e.dataset.zdhFlowPath === 'true'),
  'release every native scroll wrapper through the editable'
);
buttons = [button('See oldest'), button('See newest'), button('See oldest', true), button('Send')];
context.syncConversationScroll(conversation);
assert.deepEqual(
  buttons.map((e) => !!e.dataset.zdhNativeHistoryJump),
  [true, true, false, false]
);
buttons[0].textContent = 'Another action';
context.syncConversationScroll(conversation);
assert.equal(
  buttons[0].dataset.zdhNativeHistoryJump,
  undefined,
  'do not hide a reused native button'
);
// Closed tickets have no composer, but delayed history jumps must still disappear.
pane.querySelector = (selector) => (selector.includes('omni-log-container') ? log : null);
buttons.push(button('See newest'));
context.syncConversationScroll(conversation);
assert.equal(buttons.at(-1).dataset.zdhNativeHistoryJump, 'true');
// Run actual Off cleanup over owned nodes; empty selectors represent unrelated UI.
const owned = [root, ...path, ...buttons];
context.document = {
  querySelectorAll: (selector) =>
    selector ===
    '[data-zdh-flow-path],[data-zdh-conversation-scroll],[data-zdh-native-history-jump]'
      ? owned
      : []
};
context.closeImageLightbox = () => {};
vm.runInContext(
  source.slice(
    source.indexOf('  const imageBindings ='),
    source.indexOf('  function syncConversationScroll(')
  ),
  context
);
vm.runInContext(
  source.slice(
    source.indexOf('  function clearConversation() {'),
    source.indexOf('  function ticketIdentity()')
  ),
  context
);
context.clearConversation();
assert.ok(
  owned.every(
    (e) =>
      !e.dataset.zdhFlowPath && !e.dataset.zdhConversationScroll && !e.dataset.zdhNativeHistoryJump
  )
);
console.log(
  'PASS: shared scroll paths, delayed oldest/newest cleanup, message exclusion, reused controls and Off restoration.'
);
