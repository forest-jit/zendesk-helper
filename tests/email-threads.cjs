'use strict';
const assert = require('node:assert/strict');
const { classify, analyze, forwardHeader } = require('../email-threads.js');

// These are detector policy checks, not claims of Zendesk layout acceptance.
assert.equal(
  classify({ outsideText: 'On Tuesday, somebody wrote: please restart.' }).reason,
  'no-explicit-quote',
  'ordinary wording must not be treated as quoted history'
);
assert.equal(
  classify({ candidates: [{ kind: 'cite', text: 'The entire message' }] }).reason,
  'quote-only-message',
  'a quote-only message must remain visible'
);
assert.equal(
  classify({
    outsideText: 'New response',
    candidates: [{ kind: 'unknown', text: 'From: someone\nSubject: example' }]
  }).reason,
  'no-explicit-quote',
  'unverified Outlook/header patterns remain visible'
);
const mixed = classify({
  outsideText: 'New answer',
  candidates: [
    { kind: 'gmail', text: 'Earlier reply', nestedQuotes: 3 },
    { kind: 'cite', text: '   ' }
  ]
});
assert.equal(mixed.disposition, 'review-candidates');
assert.equal(mixed.quotes.length, 1, 'ignore empty wrappers');
assert.equal(mixed.quotes[0].nestedQuotes, 3, 'retain nested-quote metadata');
assert.equal(
  classify({ outsideMedia: true, candidates: [{ kind: 'yahoo', text: 'Old reply' }] }).disposition,
  'review-candidates',
  'an image-only new response counts as outside content'
);
assert.equal(
  classify({ candidates: [{ kind: 'cite', hasMedia: true }] }).reason,
  'quote-only-message',
  'media-only quoted content is not discarded'
);
const source = { outsideText: 'New', candidates: [{ kind: 'gmail', text: 'Original' }] };
const before = JSON.stringify(source);
classify(source);
assert.equal(JSON.stringify(source), before, 'analysis must not mutate source records');
assert.equal(analyze(null).reason, 'not-a-readonly-message-body');
const composer = {
  querySelectorAll() {
    throw new Error('must not inspect editor');
  },
  matches: () => true
};
assert.equal(analyze(composer).reason, 'not-a-readonly-message-body');
assert.ok(
  forwardHeader('From: Example Sender Sent: Wednesday To: Support Cc: Team Subject: Re: Example')
);
assert.ok(!forwardHeader('From: a log file; this is new content without email headers'));
assert.ok(!forwardHeader('On Wednesday somebody wrote: a new answer'));
console.log('PASS: email disclosure detection and ambiguous-forward policy.');
