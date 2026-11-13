// Received-message display only. Editors are deliberately excluded.
// Keep readable authored colors; mark measured contrast failures for themes/native.css to repair.
// Authored email layout stays intact; broad formatting flattening was removed.

'use strict';
// Display-only adaptation of received messages; never touches the composer or stored HTML.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhMessageDisplay = api;
})(globalThis, function () {
  let cache = new WeakMap(),
    paletteKey = null,
    settleTimer = null;
  const selector = '[data-test-id="omni-log-message-content"]';
  function rgb(value) {
    const m = String(value).match(/^rgba?\(([^)]+)\)$/);
    if (!m) return null;
    const p = m[1].split(/[ ,/]+/).map(Number);
    return p.length >= 3 && p.every(Number.isFinite) ? [p[0], p[1], p[2], p[3] ?? 1] : null;
  }
  function blend(top, bottom) {
    const a = top[3];
    return [0, 1, 2].map((i) => top[i] * a + bottom[i] * (1 - a)).concat(1);
  }
  function contrast(a, b) {
    const lum = (c) =>
      c
        .slice(0, 3)
        .map((v) => v / 255)
        .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
        .reduce((s, v, i) => s + v * [0.2126, 0.7152, 0.0722][i], 0);
    const x = lum(a),
      y = lum(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function readableInk(foreground, background, candidates) {
    if (!foreground || !background || contrast(blend(foreground, background), background) >= 4.5)
      return null;
    const readable = candidates.filter((c) => c.color && contrast(c.color, background) >= 4.5);
    return readable[0]?.role || null;
  }
  function background(node) {
    const layers = [];
    for (let e = node; e; e = e.parentElement) {
      const s = getComputedStyle(e);
      if (s.backgroundImage && s.backgroundImage !== 'none') return null;
      const c = rgb(s.backgroundColor);
      if (c) {
        layers.push(c);
        if (c[3] === 1) break;
      }
    }
    let color = [255, 255, 255, 1];
    for (const layer of layers.reverse()) color = blend(layer, color);
    return color;
  }
  function clearBody(body) {
    for (const e of [
      body,
      ...body.querySelectorAll('[data-zdh-readable-ink],[data-zdh-readable-small]')
    ]) {
      delete e.dataset.zdhReadableInk;
      delete e.dataset.zdhReadableSmall;
    }
  }
  function sync(scope) {
    const theme = scope.ownerDocument.documentElement.getAttribute('data-zdh-theme');
    const prefix =
      theme + '|' + (scope.ownerDocument.getElementById('zdh-theme-variables')?.textContent || '');
    if (paletteKey !== prefix) {
      paletteKey = prefix;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(() => {
        cache = new WeakMap();
        if (scope.isConnected) sync(scope);
      }, 450);
    }
    for (const body of scope.querySelectorAll(selector)) {
      if (body.closest('[contenteditable],[data-test-id="omnichannel-composer"]')) continue;
      const signature = prefix + '|' + body.innerHTML;
      if (cache.get(body) === signature) continue;
      clearBody(body);
      if (theme) {
        const vars = getComputedStyle(body.ownerDocument.documentElement);
        const candidates = ['text', 'page', 'surface'].map((role) => ({
          role,
          color: rgb(vars.getPropertyValue('--zdh-theme-' + role).trim())
        }));
        // Theme variables are hex in Chrome. Resolve them through a detached-free CSS color parser.
        for (const item of candidates)
          if (!item.color) {
            const hex = vars.getPropertyValue('--zdh-theme-' + item.role).trim();
            if (/^#[\da-f]{6}$/i.test(hex))
              item.color = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(1);
          }
        candidates.push(
          { role: 'dark', color: [0, 0, 0, 1] },
          { role: 'light', color: [255, 255, 255, 1] }
        );
        for (const e of [
          body,
          ...body.querySelectorAll(
            'p,div,span,font,a,li,td,th,h1,h2,h3,h4,h5,h6,b,strong,em,i,code,pre,small'
          )
        ]) {
          if (
            e.closest(
              '[data-zdh-image-preview],[data-zdh-email-disclosure],[data-zdh-email-controls]'
            ) ||
            ![...e.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
          )
            continue;
          const style = getComputedStyle(e),
            ink = readableInk(rgb(style.color), background(e), candidates);
          if (ink) e.dataset.zdhReadableInk = ink;
          if (parseFloat(style.fontSize) < 12) e.dataset.zdhReadableSmall = 'true';
        }
      }
      cache.set(body, prefix + '|' + body.innerHTML);
    }
  }
  function clear(doc = document) {
    for (const body of doc.querySelectorAll(selector)) clearBody(body);
    cache = new WeakMap();
    paletteKey = null;
    clearTimeout(settleTimer);
  }
  return { rgb, blend, contrast, readableInk, sync, clear };
});
