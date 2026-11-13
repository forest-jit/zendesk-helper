// Export path: collect visible ticket data → capture accessible image bytes → serialize.
// "Rendered" includes collapsed history, but not messages Zendesk has not loaded.
// The result is raw and may contain personal information. Scrubbing happens separately.

'use strict';
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.zdhExporter = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const scope =
    'All comments currently rendered in this ticket, including collapsed comments. Unloaded history and inaccessible media are not included.';
  const text = (node) => node?.textContent?.trim().replace(/\s+/g, ' ') || '';
  function sanitizeFilename(value) {
    return (
      String(value || '')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 96) || 'ticket'
    );
  }
  function filename(ticket, format) {
    const stamp = String(ticket.exportedAt || '')
      .replace(/[^0-9TZ]/g, '')
      .slice(0, 16);
    return `ticket-${sanitizeFilename(ticket.ticketId)}${stamp ? `-${stamp}` : ''}.${format === 'markdown' ? 'md' : 'raw.json'}`;
  }
  function bodyText(node) {
    if (!node) return '';
    const copy = node.cloneNode(true);
    copy
      .querySelectorAll(
        'script,style,button,[data-zdh-email-controls],[data-zdh-image-preview],[data-zdh-image-lightbox]'
      )
      .forEach((el) => el.remove());
    copy
      .querySelectorAll('br')
      .forEach((el) => el.replaceWith(copy.ownerDocument.createTextNode('\n')));
    copy
      .querySelectorAll('p,div,li,pre,blockquote,tr')
      .forEach((el) => el.append(copy.ownerDocument.createTextNode('\n')));
    return copy.textContent
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }
  function collect(doc, locationLike, workspace) {
    const active =
      workspace ||
      [...doc.querySelectorAll('[data-test-id^="ticket-"][data-test-id$="-standard-layout"]')].find(
        (node) => node.getClientRects().length
      ) ||
      doc;
    const url = String(locationLike?.href || '');
    const ticketId = url.match(/\/tickets\/(\d+)/)?.[1] || '';
    const title =
      active
        .querySelector('input[data-test-id="omni-header-subject"], input[aria-label="Subject"]')
        ?.value?.trim() || text(active.querySelector('h1'));
    const requester =
      text(
        active.querySelector(
          '[data-test-id="ticket-system-field-requester-select"] [data-garden-id="dropdowns.combobox.value"]'
        )
      ) ||
      active
        .querySelector(
          '[data-test-id="ticket-system-field-requester-select"] input, input[aria-label="Requester"]'
        )
        ?.value?.trim() ||
      text(
        [...doc.querySelectorAll('[data-test-id="tabs-nav-item-users"]')].find(
          (node) => node.getClientRects().length
        )
      );
    const organization =
      text(
        active.querySelector(
          '[data-test-id="organization_id-field-test-id"], [data-zdh-export-organization]'
        )
      ) ||
      text(
        [...doc.querySelectorAll('[data-test-id="tabs-nav-item-organizations"]')].find(
          (node) => node.getClientRects().length
        )
      ).replace(/^Org\.\s*/i, '');
    const modeLabel = text(
      active.querySelector('[data-test-id="omnichannel-channel-switcher-button"], [data-zdh-mode]')
    );
    const submitLabel = text(doc.querySelector('[data-test-id="submit_button-button"]'));
    const status =
      submitLabel
        .match(/Submit as\s+(.+)/i)?.[1]
        ?.trim()
        .toLowerCase() ||
      text(active.querySelector('[data-zdh-status]')) ||
      'unknown';
    const nodes = [
      ...active.querySelectorAll(
        '[data-test-id="omni-log-comment-item"], [data-zdh-export-comment], [data-test-id="conversation-log"] article'
      )
    ];
    const media = [];
    const comments = nodes.map((comment, index) => {
      const body =
        comment.querySelector(
          '[data-test-id="omni-log-message-content"], [data-zdh-body], [role="document"]'
        ) || comment;
      const origin = text(comment.querySelector('[data-test-id="omni-log-item-originated-from"]'));
      const mediaIds = [];
      for (const image of body.querySelectorAll('img')) {
        if (
          image.closest(
            '[data-zdh-image-preview],[data-zdh-image-lightbox],[data-test-id*="avatar"]'
          ) ||
          /avatar/i.test(image.alt || '')
        )
          continue;
        if (
          (image.naturalWidth || image.width) <= 64 &&
          (image.naturalHeight || image.height) <= 64
        )
          continue;
        const sourceUrl = image.currentSrc || image.src;
        if (!sourceUrl) continue;
        let item = media.find((entry) => entry.sourceUrl === sourceUrl);
        if (!item) {
          item = {
            id: `image-${String(media.length + 1).padStart(3, '0')}`,
            kind: 'image',
            sourceUrl,
            alt: image.alt || '',
            width: image.naturalWidth || null,
            height: image.naturalHeight || null,
            capture: 'reference-only'
          };
          media.push(item);
        }
        mediaIds.push(item.id);
      }
      const attachments = [...body.querySelectorAll('a[href]')]
        .filter((link) => /\/attachments\//.test(link.href) || link.hasAttribute('download'))
        .map((link) => ({
          name: link.getAttribute('download') || text(link),
          sourceUrl: link.href
        }));
      return {
        id:
          comment.getAttribute('data-comment-id') ||
          comment.getAttribute('data-event-id') ||
          `comment-${index + 1}`,
        author:
          comment.getAttribute('data-author') ||
          text(
            comment.querySelector(
              '[data-test-id="omni-log-comment-user-link"], [data-zdh-author], h4 a, h4 strong, strong'
            )
          ),
        time:
          comment.getAttribute('data-time') ||
          comment.querySelector('time')?.getAttribute('datetime') ||
          text(comment.querySelector('time,[data-zdh-time]')),
        visibility:
          comment.getAttribute('data-visibility') ||
          (comment.querySelector('[data-test-id="omni-log-internal-note-tag"]') ||
          /internal/i.test(origin)
            ? 'internal'
            : /web|email|public/i.test(origin)
              ? 'public'
              : 'unknown'),
        body: bodyText(body),
        mediaIds,
        attachments
      };
    });
    return {
      schemaVersion: 2,
      ticketId,
      sourceUrl: url,
      exportedAt: new Date().toISOString(),
      title,
      requester,
      organization,
      status,
      replyMode: globalThis.zdhWorkflow?.normalizeMode(modeLabel) || 'unknown',
      scope,
      privacy: { raw: true, locallyProcessed: false, reviewRequired: true },
      comments,
      media
    };
  }
  // Try already-loaded pixels, then a normal media request. Record inaccessible images honestly.
  async function captureMedia(ticket, workspace) {
    let totalBytes = 0;
    for (const item of ticket.media || []) {
      try {
        const image = [...workspace.querySelectorAll('img')].find(
          (node) =>
            (node.currentSrc || node.src) === item.sourceUrl &&
            !node.closest('[data-zdh-image-preview]')
        );
        if (image?.complete && image.naturalWidth) {
          try {
            const canvas = workspace.ownerDocument.createElement('canvas');
            canvas.width = image.naturalWidth;
            canvas.height = image.naturalHeight;
            canvas.getContext('2d').drawImage(image, 0, 0);
            const data = canvas.toDataURL('image/png');
            if (data.length < 14 * 1024 * 1024 && totalBytes + data.length < 55 * 1024 * 1024) {
              item.dataUrl = data;
              item.capture = 'embedded';
              totalBytes += data.length;
              continue;
            }
          } catch {
            /* Cross-origin images can still be available through ordinary fetch. */
          }
        }
        const source = new URL(item.sourceUrl, location.href);
        if (!['https:', 'blob:', 'data:'].includes(source.protocol))
          throw new Error('Unsupported media URL');
        const response = await fetch(source.href, {
          credentials: source.origin === location.origin ? 'same-origin' : 'omit',
          signal: AbortSignal.timeout(8000)
        });
        if (!response.ok) throw new Error(`Image response ${response.status}`);
        const blob = await response.blob();
        if (
          !blob.type.startsWith('image/') ||
          blob.size > 10 * 1024 * 1024 ||
          totalBytes + blob.size > 40 * 1024 * 1024
        )
          throw new Error('Image unavailable or export size limit');
        item.dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Image read failed'));
          reader.readAsDataURL(blob);
        });
        item.capture = 'embedded';
        totalBytes += blob.size;
      } catch {
        item.capture = 'reference-only';
        item.captureNote =
          'Image bytes could not be embedded. The local processor can use a matching local image file or attempt a public image download.';
      }
    }
    ticket.mediaSummary = {
      total: ticket.media?.length || 0,
      embedded: ticket.media?.filter((item) => item.capture === 'embedded').length || 0
    };
    return ticket;
  }
  function serialize(ticket, format) {
    if (format === 'json') return `${JSON.stringify(ticket, null, 2)}\n`;
    if (format !== 'markdown') throw new Error(`Unsupported export format: ${format}`);
    const lines = [
      `# ${ticket.title || `Ticket ${ticket.ticketId || ''}`}`.trim(),
      '',
      `- Ticket: ${ticket.ticketId || 'Unknown'}`,
      `- Source: ${ticket.sourceUrl || 'Unknown'}`,
      `- Exported: ${ticket.exportedAt}`,
      `- Requester: ${ticket.requester || 'Unknown'}`,
      `- Organization: ${ticket.organization || 'Unknown'}`,
      `- Status: ${ticket.status || 'Unknown'}`,
      `- Reply mode: ${ticket.replyMode || 'Unknown'}`,
      '',
      `> ${ticket.scope || scope}`,
      '',
      '## Comments',
      ''
    ];
    for (const comment of ticket.comments || [])
      lines.push(
        `### ${comment.author || 'Unknown author'}${comment.time ? ` — ${comment.time}` : ''}`,
        '',
        `Visibility: ${comment.visibility || 'unknown'}`,
        '',
        comment.body || '',
        ''
      );
    return `${lines.join('\n').trim()}\n`;
  }
  return { scope, sanitizeFilename, filename, collect, captureMedia, serialize };
});
