'use strict';
const fs = require('node:fs'),
  vm = require('node:vm'),
  assert = require('node:assert/strict');
const source = fs.readFileSync(
  require('node:path').join(__dirname, '../src/content/index.js'),
  'utf8'
);
class Element extends EventTarget {
  constructor() {
    super();
    this.attrs = new Map();
    this.dataset = {};
    this.isConnected = true;
    this.width = 800;
    this.height = 400;
    this.naturalWidth = 800;
    this.children = [];
  }
  getAttribute(k) {
    return this.attrs.get(k) ?? null;
  }
  setAttribute(k, v) {
    this.attrs.set(k, String(v));
  }
  removeAttribute(k) {
    this.attrs.delete(k);
  }
  set tabIndex(v) {
    this.setAttribute('tabindex', v);
  }
  closest() {
    return null;
  }
  matches() {
    return false;
  }
  cloneNode() {
    return new Element();
  }
  append(n) {
    this.children.push(n);
  }
  insertAdjacentElement(_where, n) {
    this.adjacent = n;
  }
  remove() {
    this.isConnected = false;
  }
}
const image = new Element();
image.setAttribute('role', 'img');
image.setAttribute('tabindex', '3');
image.setAttribute('aria-label', 'Original label');
const context = {
  AbortController,
  Map,
  Set,
  Math,
  enabled: true,
  layout: true,
  document: { createElement: () => new Element() },
  opened: 0,
  openImageLightbox() {
    context.opened++;
  }
};
vm.createContext(context);
vm.runInContext(
  source.slice(
    source.indexOf('  const imageBindings ='),
    source.indexOf('  function syncConversationScroll(')
  ),
  context
);
context.syncImages({ querySelectorAll: () => [image] });
assert.equal(image.getAttribute('role'), 'button');
assert.equal(image.getAttribute('tabindex'), '0');
delete image.dataset.zdhMessageImage;
image.setAttribute('role', 'img');
context.syncImages({ querySelectorAll: () => [image] });
assert.equal(
  image.getAttribute('role'),
  'button',
  'repair native attribute reconciliation on the same image'
);
image.dispatchEvent(new Event('click', { cancelable: true }));
assert.equal(context.opened, 1);
context.clearImageBindings();
image.dispatchEvent(new Event('click', { cancelable: true }));
assert.equal(context.opened, 1, 'Off removes image action listeners');
assert.equal(image.getAttribute('role'), 'img');
assert.equal(image.getAttribute('tabindex'), '3');
assert.equal(image.getAttribute('aria-label'), 'Original label');
assert.equal(image.dataset.zdhMessageImage, undefined);
assert.equal(image.adjacent.isConnected, false);
console.log('PASS: image preview cleanup restores native attributes and removes owned bindings.');
