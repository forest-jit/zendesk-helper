// Files from another person must pass palette/contrast validation before touching saved themes.
const assert = require('node:assert/strict');
const files = require('../src/shared/theme-files.js');
const themes = require('../src/shared/themes.js');
for (const [name, palette] of Object.entries(themes.palettes)) {
  const text = files.serialize({ name, palette });
  assert.deepEqual(files.parse(text), { name, palette });
  assert.deepEqual(Object.keys(JSON.parse(text)).sort(), ['format', 'name', 'palette', 'version']);
}
const valid = JSON.parse(files.serialize({ name: 'My theme', palette: themes.palettes.daylight }));
for (const value of [
  { ...valid, version: 2 },
  { ...valid, name: '' },
  { ...valid, palette: { ...valid.palette, surprise: '#ffffff' } },
  { ...valid, palette: { ...valid.palette, text: valid.palette.surface } },
  { ...valid, palette: { page: '#ffffff' } }
])
  assert.throws(() => files.parse(JSON.stringify(value)));
assert.throws(() => files.parse('{ broken'));
assert.throws(() => files.parse('x'.repeat(16385)));
console.log(
  'PASS: portable five-color themes, readable imports, version/size limits and malformed files.'
);
