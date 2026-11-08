'use strict';
globalThis.zdTitleFormat = function (value) {
  // Deliberately checks structure only. Names need an authoritative field mapping later.
  const pieces = value.trim().split(' - ');
  return pieces.length >= 3 && pieces.every(piece => piece.trim().length > 0);
};
