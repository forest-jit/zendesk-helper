'use strict';
const assert = require('node:assert/strict'),
  m = require('../message-display.js');
const text = { role: 'text', color: [232, 242, 233, 1] },
  dark = { role: 'dark', color: [0, 0, 0, 1] },
  light = { role: 'light', color: [255, 255, 255, 1] };
assert.equal(m.readableInk([0, 0, 0, 1], [43, 61, 51, 1], [text, dark, light]), 'text');
assert.equal(
  m.readableInk([0, 0, 0, 1], [255, 255, 255, 1], [text, dark, light]),
  null,
  'preserve readable authored email on white'
);
assert.equal(m.readableInk([250, 250, 250, 1], [255, 255, 255, 1], [text, dark, light]), 'dark');
assert.equal(
  m.readableInk([255, 0, 0, 1], null, [text, dark, light]),
  null,
  'unknown image backgrounds stay untouched'
);
assert.equal(
  m.readableInk([255, 255, 255, 0.1], [43, 61, 51, 1], [text, dark, light]),
  'text',
  'account for translucent text'
);
assert.deepEqual(m.rgb('rgba(0, 0, 0, 0.5)'), [0, 0, 0, 0.5]);
assert.ok(m.contrast(text.color, [43, 61, 51, 1]) >= 4.5);
console.log('PASS: display-only contrast decisions preserve readable authored colors.');
