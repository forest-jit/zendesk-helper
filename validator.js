// Pure title validation: explain a malformed title without saving or guessing identities.
// Native field writes, when enabled, belong to ticket-tools.js.

'use strict';
globalThis.zdTitleReview = function (value, identity = {}) {
  const pieces = value
    .trim()
    .split(' - ')
    .map((piece) => piece.trim());
  const structural = pieces.length >= 3 && pieces.every(Boolean);
  if (!structural) return { valid: false, kind: 'format', suggestion: null };

  const same = (left, right) =>
    left && right && left.localeCompare(right, undefined, { sensitivity: 'base' }) === 0;
  const duplicatedIdentity =
    pieces.length === 5 &&
    same(pieces[0], identity.organization) &&
    same(pieces[1], identity.requester);
  if (duplicatedIdentity) {
    return {
      valid: false,
      kind: 'duplicate-identity',
      suggestion: [...pieces.slice(0, 2), ...pieces.slice(4)].join(' - ')
    };
  }

  return { valid: true, kind: 'valid', suggestion: null };
};

globalThis.zdTitleFormat = function (value) {
  return globalThis.zdTitleReview(value).valid;
};
