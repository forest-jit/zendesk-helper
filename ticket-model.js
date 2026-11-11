// Pure ticket helpers: title construction, draft-transfer decisions, copy formats and activity parsing.
// No browser mutation here. The matching adapters live in ticket-tools.js.

'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhTicketModel = api;
})(globalThis, function () {
  function identityTitle(value, { organization, requester } = {}) {
    if (!organization?.trim() || !requester?.trim()) return null;
    const clean = value.trim(),
      parts = clean.split(' - ').map((s) => s.trim());
    let issue = parts.length >= 3 ? parts.slice(2).join(' - ') : clean;
    // Collapse repeated company/requester prefixes, retaining every issue segment.
    const repeated = issue.split(' - ');
    while (
      repeated.length >= 3 &&
      repeated[0].toLowerCase() === organization.trim().toLowerCase() &&
      repeated[1].toLowerCase() === requester.trim().toLowerCase()
    )
      repeated.splice(0, 2);
    issue = repeated.join(' - ').trim();
    if (!issue) return null;
    return organization.trim() + ' - ' + requester.trim() + ' - ' + issue;
  }
  function transferDecision(source, destination, previous) {
    if (!source) return 'empty';
    if (source === destination) return 'same';
    if (!destination || destination === previous) return 'replace';
    return 'conflict';
  }
  function copyText({ id, title, url }, format) {
    const safeTitle = String(title || '')
      .replace(/[\r\n]+/g, ' ')
      .trim();
    if (format === 'number') return '#' + id;
    if (format === 'url') return url;
    if (format === 'markdown')
      return '[' + safeTitle.replace(/[\\\[\]]/g, '\\$&') + ' (#' + id + ')](' + url + ')';
    return '#' + id + ' · ' + safeTitle + '\n' + url;
  }
  function queueAllowed(s) {
    return !!(
      s.enabled &&
      s.interval >= 10 &&
      s.interval <= 60 &&
      /^\/agent\/filters\/\d+\/?$/.test(s.path) &&
      s.visible &&
      s.online &&
      !s.editing &&
      !s.selection &&
      !s.overlay &&
      !s.busy &&
      s.idleMs >= 5000
    );
  }
  function activity(labels = []) {
    const unique = [
      ...new Set(labels.map((s) => String(s).replace(/\s+/g, ' ').trim()).filter(Boolean))
    ];
    const editing = unique.filter(
      (s) => /\b(editing|typing|composing)\b/i.test(s) && !/^no\b/i.test(s)
    );
    if (editing.length) return { kind: 'editing', text: editing.join(' · ') };
    const viewing = unique.filter((s) => /\b(viewing|viewed|away)\b/i.test(s) && !/^no\b/i.test(s));
    if (viewing.length) return { kind: 'viewing', text: viewing.join(' · ') };
    return { kind: 'unknown', text: 'Activity not reported' };
  }
  return { identityTitle, transferDecision, copyText, queueAllowed, activity };
});
