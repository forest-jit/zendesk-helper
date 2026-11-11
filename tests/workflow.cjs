const assert = require('node:assert/strict');

const workflow = require('../src/tickets/workflow.js');
const exporter = require('../src/export/exporter.js');

assert.equal(workflow.normalizeMode('Internal note'), 'internal');
assert.equal(workflow.normalizeMode('Public reply'), 'public');
assert.equal(workflow.normalizeMode('Something else'), 'unknown');
assert.deepEqual(
  workflow.canSave({
    mode: 'internal',
    publicReviewed: false,
    status: 'pending',
    busy: false,
    nativeReady: true
  }),
  { allowed: true, reason: '' }
);
assert.deepEqual(
  workflow.canSave({
    mode: 'public',
    publicReviewed: false,
    status: 'open',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Review and confirm the public reply before saving.' }
);
assert.deepEqual(
  workflow.canSave({
    mode: 'unknown',
    publicReviewed: true,
    status: 'open',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Reply mode is unavailable.' }
);
assert.deepEqual(
  workflow.canSave({
    mode: 'internal',
    publicReviewed: false,
    status: 'invalid',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Choose a valid status.' }
);
assert.equal(workflow.submitLabel('pending'), 'Submit as Pending');
assert.equal(workflow.submitLabel('on-hold'), 'Submit as On-hold');
assert.equal(workflow.submitLabel('solved'), 'Submit as Solved');
assert.equal(workflow.composerHasContent(''), false);
assert.equal(workflow.composerHasContent(' \u00a0\u200b<br><p> </p>'), false);
assert.equal(workflow.composerHasContent('<p>Reply body</p>'), true);
assert.deepEqual(
  workflow.canSend({
    mode: 'internal',
    publicReviewed: false,
    composerContent: '<p>Private update</p>',
    busy: false,
    nativeReady: true
  }),
  { allowed: true, reason: '' }
);
assert.deepEqual(
  workflow.canSend({
    mode: 'public',
    publicReviewed: false,
    composerContent: 'Customer update',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Review and confirm the public reply before sending.' }
);
assert.deepEqual(
  workflow.canSend({
    mode: 'public',
    publicReviewed: true,
    composerContent: 'Customer update',
    busy: false,
    nativeReady: true
  }),
  { allowed: true, reason: '' }
);
assert.deepEqual(
  workflow.canSend({
    mode: 'internal',
    publicReviewed: false,
    composerContent: '<br>',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Write a reply or note before sending.' }
);
assert.deepEqual(
  workflow.canSend({
    mode: 'internal',
    publicReviewed: false,
    composerContent: 'Update',
    busy: false,
    nativeReady: false
  }),
  { allowed: false, reason: 'Zendesk send controls are unavailable.' }
);
assert.deepEqual(
  workflow.canSaveProperties({
    composerContent: '',
    status: 'pending',
    busy: false,
    nativeReady: true,
    dirty: true
  }),
  { allowed: true, reason: '' }
);
assert.deepEqual(
  workflow.canSaveProperties({
    composerContent: '<p>Unsent draft</p>',
    status: 'open',
    busy: false,
    nativeReady: true
  }),
  {
    allowed: false,
    reason: 'The draft cannot be held safely by this editor. Nothing will be submitted.'
  }
);
assert.deepEqual(
  workflow.canSaveProperties({
    composerContent: '',
    status: 'invalid',
    busy: false,
    nativeReady: true
  }),
  { allowed: false, reason: 'Choose a valid status.' }
);
assert.deepEqual(
  workflow.canSaveProperties({
    composerContent: '',
    status: 'open',
    busy: false,
    nativeReady: false
  }),
  { allowed: false, reason: 'Zendesk save controls are unavailable.' }
);
const lock = workflow.createSaveLock();
assert.equal(lock.acquire(), true);
assert.equal(lock.acquire(), false);
lock.release();
assert.equal(lock.acquire(), true);

const ticket = {
  schemaVersion: 1,
  ticketId: '209871',
  sourceUrl: 'https://itjones.zendesk.com/agent/tickets/209871',
  exportedAt: '2026-11-08T20:30:00.000Z',
  title: 'Jones IT - Forest Welch - TEST Wi-Fi connection issue',
  requester: 'Forest Welch',
  organization: 'Jones IT',
  status: 'open',
  replyMode: 'internal',
  scope: 'Visible content only; unloaded or collapsed comments may be absent.',
  comments: [
    { author: 'Forest Welch', time: 'Yesterday', visibility: 'public', body: 'Line one\nLine two' }
  ]
};
const json = exporter.serialize(ticket, 'json');
assert.equal(JSON.parse(json).ticketId, '209871');
const markdown = exporter.serialize(ticket, 'markdown');
assert.match(markdown, /^# Jones IT - Forest Welch - TEST Wi-Fi connection issue/m);
assert.match(markdown, /Visible content only/);
assert.match(markdown, /Line one\nLine two/);
assert.match(exporter.filename(ticket, 'json'), /^ticket-209871-[0-9TZ]+\.raw\.json$/);
assert.equal(exporter.filename(ticket, 'json').includes('forest'), false);
assert.equal(exporter.sanitizeFilename(' ..\/A:*?"<>| B  '), 'a-b');
assert.throws(() => exporter.serialize(ticket, 'html'), /Unsupported export format/);

console.log('PASS: workflow guards, status mapping, save lock, and local export serialization.');

assert.deepEqual(
  workflow.canSaveProperties({
    composerContent: '',
    status: 'pending',
    busy: false,
    nativeReady: true,
    dirty: false
  }),
  { allowed: false, reason: 'No property changes to save.' }
);

// Route the shortcut by focus; repeated keys are consumed without a second action.
const commandEnter = { key: 'Enter', metaKey: true };
assert.equal(workflow.shortcutAction({ ...commandEnter, inComposer: true }), 'send');
assert.equal(workflow.shortcutAction({ ...commandEnter, inProperties: true }), 'save');
assert.equal(
  workflow.shortcutAction({ ...commandEnter, inProperties: true, repeat: true }),
  'consume'
);
assert.equal(
  workflow.shortcutAction({ ...commandEnter, inProperties: true, inComposer: true }),
  'send'
);
assert.equal(workflow.shortcutAction({ ...commandEnter }), null);
assert.equal(
  workflow.shortcutAction({ ...commandEnter, inComposer: true, repeat: true }),
  'consume'
);
assert.equal(
  workflow.shortcutAction({ ...commandEnter, inComposer: true, isComposing: true }),
  null
);
assert.equal(workflow.shortcutAction({ ...commandEnter, inComposer: true, ctrlKey: true }), null);
assert.equal(workflow.shortcutAction({ key: 'Enter', inComposer: true }), null);

// Another draft may keep the tab marked modified after a successful property save.
assert.equal(
  workflow.saveAcknowledged({
    nativeReady: true,
    nativeBusy: false,
    sawBusy: true,
    tabModified: true,
    hasError: false
  }),
  true
);
assert.equal(
  workflow.saveAcknowledged({
    nativeReady: true,
    nativeBusy: true,
    sawBusy: true,
    tabModified: true,
    hasError: false
  }),
  false
);
assert.equal(
  workflow.saveAcknowledged({
    nativeReady: true,
    nativeBusy: false,
    sawBusy: false,
    tabModified: true,
    hasError: false
  }),
  false
);
assert.equal(
  workflow.saveAcknowledged({
    nativeReady: true,
    nativeBusy: false,
    sawBusy: true,
    tabModified: true,
    hasError: true
  }),
  false
);
assert.equal(
  workflow.saveAcknowledged({
    nativeReady: false,
    nativeBusy: false,
    sawBusy: true,
    tabModified: false,
    hasError: false
  }),
  false
);

assert.equal(
  workflow.canSaveProperties({
    composerContent: '<p>Keep my draft</p>',
    status: 'pending',
    busy: false,
    nativeReady: true,
    dirty: true,
    draftSafe: true
  }).allowed,
  true
);

assert.equal(workflow.composerHasContent('<p><img src="image.png"></p>'), true);
assert.equal(
  workflow.canSaveProperties({
    composerContent: '<p>Draft</p>',
    status: 'pending',
    busy: true,
    nativeReady: true,
    dirty: true,
    draftSafe: true
  }).allowed,
  false
);

// Offline wording and unconfirmed native receipts must not retire the recovery copy.
assert.equal(workflow.saveFailure('Your browser is offline so the ticket was not saved.'), true);
assert.equal(workflow.saveFailure('Ticket has been updated.'), false);
assert.equal(
  workflow.draftRecoveryAction({
    currentHtml: '',
    backupHtml: 'draft',
    phase: 'submitted',
    nativeBusy: true
  }),
  'wait'
);
assert.equal(
  workflow.draftRecoveryAction({
    currentHtml: '',
    backupHtml: 'draft',
    phase: 'submitted',
    nativeBusy: false
  }),
  'restore'
);
assert.equal(
  workflow.draftRecoveryAction({
    currentHtml: 'draft',
    backupHtml: 'draft',
    phase: 'uncertain',
    nativeBusy: false
  }),
  'retain'
);
assert.equal(
  workflow.draftRecoveryAction({
    currentHtml: 'newer',
    backupHtml: 'draft',
    phase: 'uncertain',
    nativeBusy: false
  }),
  'conflict'
);
assert.equal(
  workflow.draftRecoveryAction({
    currentHtml: 'draft',
    backupHtml: 'draft',
    phase: 'settled',
    nativeBusy: false
  }),
  'retire'
);

// Native Ticket Code saves can normalize tags after acknowledgement; fresh user edits win.
const settle = {
  settling: { until: 1500, editVersion: 2 },
  now: 1000,
  editVersion: 2,
  nativeBusy: false,
  statusMatches: true
};
assert.equal(workflow.shouldRebaseProperties(settle), true);
assert.equal(workflow.shouldRebaseProperties({ ...settle, editVersion: 3 }), false);
assert.equal(workflow.shouldRebaseProperties({ ...settle, now: 1600 }), false);
assert.equal(workflow.shouldRebaseProperties({ ...settle, nativeBusy: true }), false);
assert.equal(workflow.shouldRebaseProperties({ ...settle, statusMatches: false }), false);
