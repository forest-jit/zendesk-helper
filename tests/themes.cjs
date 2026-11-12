const assert = require('node:assert/strict');
const { roles, palettes, compile, compileTheme, contrast } = require('../src/shared/themes.js');
assert.equal(roles.length, 5);
for (const id of Object.keys(palettes)) {
  const { tokens: t, variables: v } = compileTheme(id);
  for (const [fg, bg, min] of [
    [t.text, t.page, 4.5],
    [t.text, t.surface, 4.5],
    [t.muted, t.surface, 4.5],
    [t.muted, t.page, 4.5],
    [t.link, t.page, 4.5],
    [t.controlBorder, t.page, 3],
    [t.focus, t.page, 3],
    [t.link, t.surface, 4.5],
    [t.link, t.hover, 4.5],
    [t.link, t.note, 4.5],
    [t.link, t.selected, 4.5],
    [t.muted, t.hover, 4.5],
    [t.muted, t.note, 4.5],
    [t.muted, t.selected, 4.5],
    [t.selectedText, t.selected, 4.5],
    [t.onEmphasis, t.accent, 4.5],
    [t.onEmphasis, t.attentionEmphasis, 4.5],
    [t.onText, t.text, 4.5],
    [t.noteText, t.note, 4.5],
    [t.attentionText, t.note, 4.5],
    [t.controlBorder, t.surface, 3],
    [t.focus, t.surface, 3]
  ])
    assert.ok(contrast(fg, bg) >= min, `${fg} on ${bg} must reach ${min}:1`);
  assert.ok(
    contrast(v['--foreground-disabled'], v['--background-disabled']) >= 4.5,
    'disabled labels need distinct readable foreground and background tokens'
  );
  assert.notEqual(v['--background-warning'], v['--background-default']);
  assert.equal(v['--ck-color-input-background'], t.surface);
  assert.equal(v['--foreground-onEmphasis'], t.onEmphasis);
  assert.ok(contrast(v['--foreground-onEmphasis'], v['--background-emphasis']) >= 4.5);
  assert.ok(contrast(v['--ck-color-tooltip-text'], v['--ck-color-tooltip-background']) >= 4.5);
  for (const status of [
    'Closed',
    'Default',
    'Hold',
    'New',
    'Open',
    'Pending',
    'Solved',
    'Suspended'
  ])
    assert.ok(
      contrast(v['--foreground-status' + status], v['--background-status' + status]) >= 4.5
    );
}
assert.throws(() => compile({ ...palettes.daylight, extra: '#ff0000' }), /exactly five/);
assert.throws(() => compile({ ...palettes.daylight, text: '#ffffff' }), /contrast/);
assert.throws(() => compile({ ...palettes.daylight, accent: 'url(x)' }), /hex/);
console.log(
  'PASS: five-color palettes, invalid inputs, readable component pairs, editor and status mappings.'
);

// Blush fills must remain pink; neutral text must not grey the washes.
const pink = compileTheme('blush').tokens;
for (const name of ['page', 'hover', 'note', 'selected', 'border']) {
  const rgb = pink[name]
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16));
  assert.ok(rgb[0] - rgb[1] >= 10 && rgb[2] > rgb[1], name + ' must be a chromatic pink');
}
for (const id of ['daylight', 'midnight', 'forest', 'purple', 'magenta'])
  assert.deepEqual(compileTheme(id), compile(palettes[id]));

assert.deepEqual(palettes.jones, {
  page: '#080f14',
  surface: '#101c25',
  text: '#ffffff',
  accent: '#2c7da0',
  attention: '#e05a26'
});
assert.ok(
  contrast(
    compileTheme('jones').variables['--foreground-onEmphasis'],
    compileTheme('jones').variables['--background-warningEmphasis']
  ) >= 4.5
);
assert.equal(palettes.viridian, undefined);

assert.equal(palettes.tealPink.accent, '#e12885');
assert.equal(palettes.pinkTeal.accent, '#137a7f');
assert.equal(palettes.tealPink.attention, palettes.pinkTeal.accent);
assert.equal(palettes.pinkTeal.attention, palettes.tealPink.accent);

// Every selectable palette has a shared compiler and accessible role mappings.
const picker = require('node:fs').readFileSync(
  require('node:path').join(__dirname, '../src/popup/popup.html'),
  'utf8'
);
const pickerIds = [
  ...picker
    .match(/<select id="theme"[^>]*>([\s\S]*?)<\/select>/)[1]
    .matchAll(/<option value="([^"]+)"/g)
]
  .map((m) => m[1])
  .filter((id) => !['native', 'system'].includes(id));
assert.deepEqual([...pickerIds].sort(), Object.keys(palettes).sort());
assert.equal(palettes.copper.accent, '#7f2b0a');
assert.equal(compileTheme('chestnut').variables['--color-scheme'], 'dark');

const custom = { ...palettes.forest, accent: '#c8a4f0' };
const api = require('../src/shared/themes.js');
api.setCustomThemes({
  'custom-test': { name: 'Test', palette: custom },
  'bad-id': { palette: custom },
  'custom-invalid': { palette: { ...custom, text: custom.page } }
});
assert.deepEqual(api.resolve('custom-test'), custom);
assert.equal(api.resolve('bad-id'), undefined);
assert.equal(api.resolve('custom-invalid'), undefined);
assert.ok(contrast(compileTheme('custom-test').tokens.text, custom.page) >= 4.5);
assert.throws(() => api.setPreview({ ...custom, text: custom.page }), /contrast/);
api.setPreview(custom);
assert.deepEqual(api.resolve('custom-preview'), custom);
api.setCustomThemes({});
assert.equal(api.resolve('custom-test'), undefined);
