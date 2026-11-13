// Theme files contain a name and five colors, never ticket data or extension settings.
// Parsing validates the file before the Settings editor accepts it; importing does not apply it.
'use strict';
(function (root, factory) {
  const api = factory(
    typeof module === 'object' && module.exports ? require('./themes.js') : root.zdhThemes
  );
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhThemeFiles = api;
})(globalThis, function (themes) {
  const format = 'jones-it-zendesk-helper-theme';
  function entry(value) {
    if (
      !value ||
      typeof value.name !== 'string' ||
      !value.name.trim() ||
      value.name.trim().length > 60
    )
      throw Error('A theme needs a name of 1–60 characters.');
    themes.compile(value.palette, { quietSurfaces: true, adjustAttention: true });
    return {
      name: value.name.trim(),
      palette: Object.fromEntries(
        themes.roles.map((role) => [role, value.palette[role].toLowerCase()])
      )
    };
  }
  function serialize(value) {
    return JSON.stringify({ format, version: 1, ...entry(value) }, null, 2) + '\n';
  }
  function parse(text) {
    if (typeof text !== 'string' || text.length > 16384)
      throw Error('Choose a theme JSON file smaller than 16 KB.');
    let value;
    try {
      value = JSON.parse(text);
    } catch {
      throw Error('This file is not valid theme JSON.');
    }
    if (value?.format !== format || value.version !== 1)
      throw Error('Choose a Jones IT Zendesk Helper theme file.');
    return entry(value);
  }
  return { serialize, parse };
});
