'use strict';
const assert = require('node:assert/strict');
const workspace = require('../workspace.js');
global.getComputedStyle = (e) => ({
  display: e.visible === false ? 'none' : 'block',
  visibility: 'visible'
});
global.zdhWorkflow = { normalizeMode: () => 'public' };
function node(text, visible = true) {
  return {
    textContent: text,
    isConnected: true,
    visible,
    closest: () => null,
    getClientRects: () => (visible ? [{}] : []),
    getAttribute: () => null
  };
}
let submit = [],
  menus = [],
  footers = [];
const doc = {
  querySelectorAll: (s) =>
    s === workspace.selectors.submit
      ? submit
      : s === workspace.selectors.statusMenu
        ? menus
        : footers
};
const composer = { innerHTML: '<p>Unsent</p>' },
  mode = node('Public reply');
const grid = {
  ownerDocument: doc,
  querySelector: (s) =>
    s === workspace.selectors.composer
      ? composer
      : s === workspace.selectors.modeButton
        ? mode
        : null
};
submit = [node('Submit as Pending', false)];
menus = [node('', false)];
footers = [node('This ticket is closed and cannot be edited')];
let state = workspace.readState(grid);
assert.equal(state.status, 'closed');
assert.equal(state.readOnly, true);
assert.equal(state.nativeReady, false);
submit = [node('Submit as Pending', false), node('Submit as On-hold')];
menus = [node('', false), node('')];
footers = [node('This ticket is closed and cannot be edited', false)];
state = workspace.readState(grid);
assert.equal(state.status, 'on-hold');
assert.equal(state.readOnly, false);
assert.equal(state.nativeReady, true);
submit = [];
menus = [];
footers = [];
state = workspace.readState(grid);
assert.equal(state.status, 'unknown');
assert.equal(state.readOnly, true);
assert.notEqual(state.status, 'open', 'missing native controls never imply Open');
console.log('PASS: closed/unknown status and cached footer isolation.');
