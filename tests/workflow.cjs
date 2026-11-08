const assert = require('node:assert/strict');

const workflow = require('../workflow.js');
const exporter = require('../exporter.js');

assert.equal(workflow.normalizeMode('Internal note'), 'internal');
assert.equal(workflow.normalizeMode('Public reply'), 'public');
assert.equal(workflow.normalizeMode('Something else'), 'unknown');
assert.deepEqual(workflow.canSave({ mode: 'internal', publicReviewed: false, status: 'pending', busy: false, nativeReady: true }), { allowed: true, reason: '' });
assert.deepEqual(workflow.canSave({ mode: 'public', publicReviewed: false, status: 'open', busy: false, nativeReady: true }), { allowed: false, reason: 'Review and confirm the public reply before saving.' });
assert.deepEqual(workflow.canSave({ mode: 'unknown', publicReviewed: true, status: 'open', busy: false, nativeReady: true }), { allowed: false, reason: 'Reply mode is unavailable.' });
assert.deepEqual(workflow.canSave({ mode: 'internal', publicReviewed: false, status: 'invalid', busy: false, nativeReady: true }), { allowed: false, reason: 'Choose a valid status.' });
assert.equal(workflow.submitLabel('pending'), 'Submit as Pending');
assert.equal(workflow.submitLabel('on-hold'), 'Submit as On-hold');
assert.equal(workflow.submitLabel('solved'), 'Submit as Solved');
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
  comments: [{ author: 'Forest Welch', time: 'Yesterday', visibility: 'public', body: 'Line one\nLine two' }]
};
const json = exporter.serialize(ticket, 'json');
assert.equal(JSON.parse(json).ticketId, '209871');
const markdown = exporter.serialize(ticket, 'markdown');
assert.match(markdown, /^# Jones IT - Forest Welch - TEST Wi-Fi connection issue/m);
assert.match(markdown, /Visible content only/);
assert.match(markdown, /Line one\nLine two/);
assert.equal(exporter.filename(ticket, 'json'), '209871-jones-it-forest-welch-test-wi-fi-connection-issue.json');
assert.equal(exporter.sanitizeFilename(' ..\/A:*?"<>| B  '), 'a-b');
assert.throws(() => exporter.serialize(ticket, 'html'), /Unsupported export format/);

console.log('PASS: workflow guards, status mapping, save lock, and local export serialization.');
