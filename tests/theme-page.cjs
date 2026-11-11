const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
// Exercise lifecycle against two cached ticket composers without touching their draft content.
const styles = [];
const root = {
  dataset: {},
  hasAttribute(name) {
    return name === 'data-zdh-theme' && this.dataset.zdhTheme !== undefined;
  }
};
function composer(label, draft) {
  const button = {
    textContent: label,
    getAttribute() {
      return null;
    }
  };
  return {
    dataset: {},
    draft,
    button,
    querySelector() {
      return button;
    }
  };
}
const publicComposer = composer('Public reply', '<p>Existing public draft</p>');
const noteComposer = composer('Internal note', '<p>Existing private draft</p>');
const composers = [publicComposer, noteComposer];
const systemMedia = { matches: false, addEventListener() {} };
const media = {
  matches: false,
  addEventListener(_event, fn) {
    this.changed = fn;
  }
};
let focusedTableCell = 0;
const tableCells = ['1 x 1', '2 x 1', '1 x 2', '2 x 2', '3 x 1'].map((label) => ({
  dataset: {},
  getAttribute() {
    return label;
  }
}));
const tableDialog = {
  querySelector() {
    return tableCells[focusedTableCell];
  },
  querySelectorAll() {
    return tableCells;
  }
};
let mergeStep = 1;
const mergeParts = [{ dataset: {} }, { dataset: {} }],
  mergeNext = { dataset: {}, textContent: 'Next' };
const mergeLabel = {
  childElementCount: 0,
  get textContent() {
    return 'Step ' + mergeStep + ' of 2';
  },
  nextElementSibling: { children: mergeParts }
};
const mergeDialog = { querySelectorAll: (s) => (s === 'div' ? [mergeLabel] : [mergeNext]) };
const document = {
  documentElement: root,
  head: {
    append(style) {
      styles.push(style);
    }
  },
  createElement() {
    return {
      remove() {
        const i = styles.indexOf(this);
        if (i >= 0) styles.splice(i, 1);
      }
    };
  },
  addEventListener() {},
  querySelectorAll(selector) {
    if (selector === '[data-test-id="merge-drawer"]') return [mergeDialog];
    if (selector === '[data-zdh-merge-step],[data-zdh-merge-next]')
      return [...mergeParts, mergeNext];
    if (selector === '[data-zdh-composer-mode]')
      return composers.filter((c) => c.dataset.zdhComposerMode);
    if (selector === '[data-test-id="omnichannel-composer"]') return composers;
    if (selector === '[role="dialog"][aria-label="Insert Table Button"]') return [tableDialog];
    if (selector === '[data-zdh-table-selected]')
      return tableCells.filter((c) => c.dataset.zdhTableSelected !== undefined);
    return [];
  }
};
const context = {
  document,
  matchMedia: (query) => (query.includes('forced-colors') ? media : systemMedia),
  zdhThemes: require('../src/shared/themes.js'),
  zdhWorkflow: require('../src/tickets/workflow.js')
};
vm.runInNewContext(
  fs.readFileSync(path.join(__dirname, '../src/themes/native.js'), 'utf8'),
  context
);
const api = context.zdhThemePage;
for (const id of [
  'daylight',
  'midnight',
  'blush',
  'forest',
  'purple',
  'magenta',
  'jones',
  'tealPink',
  'pinkTeal',
  'copper',
  'chestnut',
  'catppuccin',
  'dracula',
  'tokyoNight',
  'nord',
  'gruvbox',
  'oneDark',
  'daylight'
]) {
  api.apply(id, true);
  assert.equal(root.dataset.zdhTheme, id);
  assert.equal(styles.length, 1);
  assert.ok(styles[0].textContent.includes(context.zdhThemes.palettes[id].surface));
  assert.equal(publicComposer.dataset.zdhComposerMode, 'public');
  assert.equal(noteComposer.dataset.zdhComposerMode, 'internal');
}
assert.deepEqual(
  mergeParts.map((e) => e.dataset.zdhMergeStep),
  ['active', 'pending']
);
mergeStep = 2;
api.sync();
assert.deepEqual(
  mergeParts.map((e) => e.dataset.zdhMergeStep),
  ['active', 'active']
);
assert.equal(mergeNext.dataset.zdhMergeNext, 'true');
focusedTableCell = 3;
api.sync();
assert.deepEqual(
  tableCells.map((c) => c.dataset.zdhTableSelected),
  ['true', 'true', 'true', 'true', 'false']
);
publicComposer.button.textContent = 'Internal note';
api.sync();
assert.equal(publicComposer.dataset.zdhComposerMode, 'internal');
publicComposer.button.textContent = 'Public reply';
api.sync();
assert.equal(publicComposer.dataset.zdhComposerMode, 'public');
for (const args of [
  ['native', true],
  ['midnight', false],
  ['invalid', true]
]) {
  api.apply(...args);
  assert.equal(styles.length, 0);
  assert.equal(root.dataset.zdhTheme, undefined);
  assert.ok(mergeParts.every((e) => e.dataset.zdhMergeStep === undefined));
  assert.equal(mergeNext.dataset.zdhMergeNext, undefined);
  assert.ok(composers.every((c) => c.dataset.zdhComposerMode === undefined));
  assert.ok(tableCells.every((c) => c.dataset.zdhTableSelected === undefined));
}
api.apply('midnight', true);
media.matches = true;
media.changed();
assert.equal(styles.length, 0);
assert.equal(root.dataset.zdhTheme, undefined);
media.matches = false;
media.changed();
assert.equal(root.dataset.zdhTheme, 'midnight');
assert.equal(styles.length, 1);
assert.equal(publicComposer.draft, '<p>Existing public draft</p>');
assert.equal(noteComposer.draft, '<p>Existing private draft</p>');
console.log(
  'PASS: theme replacement, cached composer modes, native/Off cleanup, forced-colors restoration and draft preservation.'
);
