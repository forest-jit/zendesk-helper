// Quote cleanup is a display choice, not a content edit.
// Detect a supported boundary → add a disclosure → hide/show the original nodes.
// Uncertain forwards start open; unknown or quote-only content stays visible.

'use strict';
// Display-only disclosures. Source nodes remain in place for copy/export and native restoration.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhEmailThreads = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const selector = '.gmail_quote,.yahoo_quoted,blockquote[type="cite"]';
  const knownKinds = new Set(['gmail', 'yahoo', 'cite']);

  // Input records describe top-level quote candidates, not arbitrary text matches.
  // Keep this policy independent of the DOM so uncertainty can be tested directly.
  function classify({ outsideText = '', outsideMedia = false, candidates = [] } = {}) {
    const quotes = candidates.filter(
      (item) => knownKinds.has(item.kind) && (String(item.text || '').trim() || item.hasMedia)
    );
    if (!quotes.length)
      return { disposition: 'leave-visible', reason: 'no-explicit-quote', quotes: [] };
    if (!String(outsideText).trim() && !outsideMedia) {
      return { disposition: 'leave-visible', reason: 'quote-only-message', quotes };
    }
    // A detected wrapper is a candidate, never proof of duplicate content.
    return {
      disposition: 'review-candidates',
      reason: 'explicit-quote-with-outside-content',
      quotes
    };
  }

  function kind(node) {
    if (node.matches('.gmail_quote')) return 'gmail';
    if (node.matches('.yahoo_quoted')) return 'yahoo';
    return 'cite';
  }

  function analyze(body) {
    if (
      !body?.querySelectorAll ||
      body.matches('[contenteditable],textarea,input') ||
      body.closest('[contenteditable], [data-test-id="omnichannel-composer"]')
    ) {
      return {
        disposition: 'leave-visible',
        reason: 'not-a-readonly-message-body',
        candidates: []
      };
    }
    // Skip nested wrappers as separate controls: one outer candidate contains them.
    // The caller must pass the actual rendered comment body, never the whole ticket.
    const roots = [...body.querySelectorAll(selector)].filter((node) => {
      const parentQuote = node.parentElement?.closest(selector);
      return !parentQuote || !body.contains(parentQuote);
    });
    const records = roots.map((node, index) => ({
      index,
      kind: kind(node),
      text: node.textContent || '',
      hasMedia: Boolean(node.querySelector('img,video,audio,object,embed')),
      nestedQuotes: node.querySelectorAll(selector).length
    }));
    // Analyze a detached clone. Do not remove, reparent, mark, or restyle live nodes.
    const outside = body.cloneNode(true);
    outside.querySelectorAll(selector).forEach((node) => node.remove());
    outside.querySelectorAll('script,style,button').forEach((node) => node.remove());
    const result = classify({
      outsideText: outside.textContent || '',
      outsideMedia: Boolean(outside.querySelector('img,video,audio,object,embed')),
      candidates: records
    });
    return {
      ...result,
      candidates: result.quotes.map((record) => ({ ...record, node: roots[record.index] }))
    };
  }

  function forwardHeader(value) {
    return /^From\s*:[\s\S]{1,600}?Sent\s*:[\s\S]{1,300}?To\s*:[\s\S]{1,800}?Subject\s*:/i.test(
      String(value)
        .trim()
        .replace(/\u00a0/g, ' ')
    );
  }
  function parts(body) {
    const explicit = analyze(body);
    if (explicit.disposition === 'review-candidates')
      return { nodes: explicit.candidates.map((c) => c.node), collapsed: true, kind: 'explicit' };
    // A plain forward is ambiguous: offer collapse but leave it open initially.
    // Require the whole ordered header, not a phrase such as “On ... wrote”.
    for (const rule of body.querySelectorAll('hr')) {
      const parent = rule.parentElement,
        nodes = [...parent.children],
        index = nodes.indexOf(rule);
      const before = nodes
        .slice(0, index)
        .map((e) => e.textContent)
        .join(' ')
        .trim();
      const after = nodes
        .slice(index + 1, index + 6)
        .map((e) => e.textContent)
        .join(' ')
        .trim();
      if (!before || !forwardHeader(after)) continue;
      // Non-whitespace text siblings cannot be hidden with reversible attributes.
      const tail = [...parent.childNodes].slice([...parent.childNodes].indexOf(rule));
      if (tail.some((n) => n.nodeType === 3 && n.textContent.trim())) continue;
      return { nodes: nodes.slice(index), collapsed: false, kind: 'forward' };
    }
    // Native sanitization often strips cite/type classes. Recognize header-bearing
    // blockquotes for manual disclosure; ordinary quoted prose stays untouched.
    const quotes = [...body.querySelectorAll('blockquote')].filter(
      (q) => !q.parentElement.closest('blockquote')
    );
    if (quotes.length) {
      const copy = body.cloneNode(true);
      copy.querySelectorAll('blockquote').forEach((e) => e.remove());
      const outside = copy.textContent.trim();
      // Forward headers can surround an untyped blockquote whose first line is a greeting.
      if (
        outside &&
        (forwardHeader(outside) || quotes.some((q) => forwardHeader(q.textContent.trim())))
      )
        return { nodes: quotes, collapsed: false, kind: 'forward' };
    }
    return null;
  }
  let records = new Map();
  function restore(record) {
    record.button.remove();
    for (const node of record.nodes) delete node.dataset.zdhEmailHidden;
  }
  function sync(scope) {
    for (const [body, record] of records)
      if (!body.isConnected) {
        restore(record);
        records.delete(body);
      }
    for (const body of scope.querySelectorAll('[data-test-id="omni-log-message-content"]')) {
      if (body.closest('[contenteditable],[data-test-id="omnichannel-composer"]')) continue;
      const previous = records.get(body);
      if (previous && previous.button.isConnected && previous.nodes.every((n) => body.contains(n)))
        continue;
      if (previous) {
        restore(previous);
        records.delete(body);
      }
      const plan = parts(body);
      if (!plan?.nodes.length) continue;
      const button = body.ownerDocument.createElement('button');
      button.type = 'button';
      button.dataset.zdhEmailDisclosure = 'true';
      button.title =
        plan.kind === 'forward'
          ? 'Quoted history may contain inline replies. Review it before hiding.'
          : 'Show or hide the original quoted email content.';
      const record = { ...plan, button, expanded: !plan.collapsed };
      function paint() {
        button.textContent = record.expanded
          ? 'Hide quoted email history'
          : 'Show quoted email history';
        button.setAttribute('aria-expanded', String(record.expanded));
        for (const node of record.nodes) {
          if (record.expanded) delete node.dataset.zdhEmailHidden;
          else node.dataset.zdhEmailHidden = 'true';
        }
      }
      button.addEventListener('click', () => {
        record.expanded = !record.expanded;
        paint();
      });
      plan.nodes[0].insertAdjacentElement('beforebegin', button);
      records.set(body, record);
      paint();
    }
  }
  function clear() {
    for (const record of records.values()) restore(record);
    records = new Map();
  }
  return { classify, analyze, forwardHeader, parts, sync, clear };
});
