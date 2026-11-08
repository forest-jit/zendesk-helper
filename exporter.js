'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.zdhExporter = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const scope = 'Visible content only; unloaded or collapsed comments may be absent.';
  const text = (node) => node?.textContent?.trim().replace(/\s+/g, ' ') || '';
  function sanitizeFilename(value) {
    return String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 96) || 'ticket';
  }
  function filename(ticket, format) {
    const extension = format === 'markdown' ? 'md' : 'json';
    return `${sanitizeFilename(ticket.ticketId || 'ticket')}-${sanitizeFilename(ticket.title)}.${extension}`;
  }
  function collect(doc, locationLike, workspace) {
    const active = workspace || [...doc.querySelectorAll('[data-test-id^="ticket-"][data-test-id$="-standard-layout"]')].find(node => node.getClientRects().length) || doc;
    const url = String(locationLike?.href || '');
    const ticketId = url.match(/\/tickets\/(\d+)/)?.[1] || text(doc.querySelector('[aria-label*="Ticket #"]')).match(/\d+/)?.[0] || '';
    const title = active.querySelector('input[data-test-id="omni-header-subject"], input[aria-label="Subject"]')?.value?.trim() || text(active.querySelector('h1'));
    const requester = active.querySelector('[data-test-id="ticket-system-field-requester-select"] input, input[aria-label="Requester"]')?.value?.trim() || '';
    const organization = text(active.querySelector('[data-test-id="organization_id-field-test-id"], [data-zdh-export-organization]') || doc.querySelector('[data-test-id="organization_id-field-test-id"], [data-zdh-export-organization]')).replace(/^Org\.\s*/i, '');
    const modeLabel = text(active.querySelector('[data-test-id="omnichannel-channel-switcher-button"], [aria-label="Public reply"], [aria-label="Internal note"], [data-zdh-mode]'));
    const statusLabel = text(active.querySelector('[data-test-id="ticket-fields-status-view"], [data-zdh-status]')) || 'Unknown';
    const comments = [...active.querySelectorAll('[data-zdh-export-comment], [data-test-id="conversation-log"] article')].map(comment => ({
      author: comment.getAttribute('data-author') || text(comment.querySelector('[data-zdh-author], h4, strong')),
      time: comment.getAttribute('data-time') || text(comment.querySelector('time, [data-zdh-time]')),
      visibility: comment.getAttribute('data-visibility') || 'unknown',
      body: text(comment.querySelector('[data-zdh-body], p, [role="document"]')) || text(comment)
    }));
    return { schemaVersion: 1, ticketId, sourceUrl: url, exportedAt: new Date().toISOString(), title, requester, organization, status: statusLabel.toLowerCase(), replyMode: globalThis.zdhWorkflow?.normalizeMode(modeLabel) || 'unknown', scope, comments };
  }
  function serialize(ticket, format) {
    if (format === 'json') return `${JSON.stringify(ticket, null, 2)}\n`;
    if (format !== 'markdown') throw new Error(`Unsupported export format: ${format}`);
    const lines = [`# ${ticket.title || `Ticket ${ticket.ticketId || ''}`}`.trim(), '', `- Ticket: ${ticket.ticketId || 'Unknown'}`, `- Source: ${ticket.sourceUrl || 'Unknown'}`, `- Exported: ${ticket.exportedAt}`, `- Requester: ${ticket.requester || 'Unknown'}`, `- Organization: ${ticket.organization || 'Unknown'}`, `- Status: ${ticket.status || 'Unknown'}`, `- Reply mode: ${ticket.replyMode || 'Unknown'}`, '', `> ${ticket.scope || scope}`, ''];
    if (!ticket.comments?.length) lines.push('## Visible comments', '', '_No visible comments were detected._', '');
    else {
      lines.push('## Visible comments', '');
      for (const comment of ticket.comments) lines.push(`### ${comment.author || 'Unknown author'}${comment.time ? ` — ${comment.time}` : ''}`, '', `Visibility: ${comment.visibility || 'unknown'}`, '', comment.body || '', '');
    }
    return `${lines.join('\n').trim()}\n`;
  }
  return { scope, sanitizeFilename, filename, collect, serialize };
});

