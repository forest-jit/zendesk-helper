// Theme pipeline: five base colors → readable derived tokens → CSS variables.
// Start with palettes, then compileTheme. No network requests or ticket edits happen here.

'use strict';
// Shared five-color palettes and semantic tokens for the page and popup.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.zdhThemes = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  const roles = Object.freeze(['page', 'surface', 'text', 'accent', 'attention']);
  const palettes = Object.freeze({
    daylight: Object.freeze({
      page: '#f8f9f9',
      surface: '#ffffff',
      text: '#293239',
      accent: '#1f73b7',
      attention: '#ac5918'
    }),
    blush: Object.freeze({
      page: '#fff0f5',
      surface: '#ffffff',
      text: '#522e38',
      accent: '#b9375e',
      attention: '#8a2846'
    }),
    forest: Object.freeze({
      page: '#101e18',
      surface: '#1b3025',
      text: '#e8f2e9',
      accent: '#91c99c',
      attention: '#d5c384'
    }),
    purple: Object.freeze({
      page: '#21142f',
      surface: '#322046',
      text: '#f5edff',
      accent: '#c8a4f0',
      attention: '#eba0c8'
    }),
    magenta: Object.freeze({
      page: '#2b1026',
      surface: '#431a3b',
      text: '#fff0fa',
      accent: '#f19bd2',
      attention: '#e9b1f5'
    }),
    tealPink: Object.freeze({
      page: '#edf5f4',
      surface: '#fff7fb',
      text: '#254549',
      accent: '#e12885',
      attention: '#137a7f'
    }),
    pinkTeal: Object.freeze({
      page: '#fdf0f6',
      surface: '#f2faf9',
      text: '#3e2941',
      accent: '#137a7f',
      attention: '#e12885'
    }),
    jones: Object.freeze({
      page: '#080f14',
      surface: '#101c25',
      text: '#ffffff',
      accent: '#2c7da0',
      attention: '#e05a26'
    }),
    midnight: Object.freeze({
      page: '#15191f',
      surface: '#202832',
      text: '#edf2f7',
      accent: '#80bfff',
      attention: '#f1b35e'
    }),
    copper: Object.freeze({
      page: '#fff4e8',
      surface: '#fffbf7',
      text: '#40271d',
      accent: '#7f2b0a',
      attention: '#9c3d2d'
    }),
    chestnut: Object.freeze({
      page: '#24130e',
      surface: '#351c14',
      text: '#f8e9df',
      accent: '#df9c7b',
      attention: '#e9bc83'
    }),
    catppuccin: Object.freeze({
      page: '#1e1e2e',
      surface: '#313244',
      text: '#cdd6f4',
      accent: '#cba6f7',
      attention: '#fab387'
    }),
    dracula: Object.freeze({
      page: '#282a36',
      surface: '#44475a',
      text: '#f8f8f2',
      accent: '#bd93f9',
      attention: '#ff79c6'
    }),
    tokyoNight: Object.freeze({
      page: '#1a1b26',
      surface: '#292e42',
      text: '#c0caf5',
      accent: '#7aa2f7',
      attention: '#f7768e'
    }),
    nord: Object.freeze({
      page: '#2e3440',
      surface: '#3b4252',
      text: '#eceff4',
      accent: '#88c0d0',
      attention: '#ebcb8b'
    }),
    gruvbox: Object.freeze({
      page: '#282828',
      surface: '#3c3836',
      text: '#ebdbb2',
      accent: '#fabd2f',
      attention: '#fe8019'
    }),
    oneDark: Object.freeze({
      page: '#282c34',
      surface: '#21252b',
      text: '#abb2bf',
      accent: '#61afef',
      attention: '#e5c07b'
    })
  });
  let customThemes = {};
  let previewPalette = null;
  function setCustomThemes(entries = {}) {
    customThemes = {};
    for (const [id, entry] of Object.entries(
      entries && typeof entries === 'object' ? entries : {}
    ).slice(0, 32)) {
      if (!/^custom-[a-z0-9-]{1,64}$/.test(id) || id === 'custom-preview') continue;
      try {
        compile(entry.palette, { quietSurfaces: true, adjustAttention: true });
        customThemes[id] = Object.freeze({ ...entry.palette });
      } catch {}
    }
  }
  function resolve(id) {
    return id === 'custom-preview' ? previewPalette : palettes[id] || customThemes[id];
  }
  function setPreview(palette) {
    compile(palette, { quietSurfaces: true, adjustAttention: true });
    previewPalette = Object.freeze({ ...palette });
  }
  function systemTheme(id) {
    return id === 'system'
      ? typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches
        ? 'midnight'
        : 'daylight'
      : id;
  }
  function rgb(hex) {
    return hex
      .slice(1)
      .match(/../g)
      .map((v) => parseInt(v, 16));
  }
  function mix(a, b, weight) {
    const x = rgb(a),
      y = rgb(b);
    return (
      '#' +
      x
        .map((v, i) =>
          Math.round(v * (1 - weight) + y[i] * weight)
            .toString(16)
            .padStart(2, '0')
        )
        .join('')
    );
  }
  function luminance(hex) {
    return rgb(hex)
      .map((v) => {
        v /= 255;
        return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      })
      .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
  }
  function contrast(a, b) {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  }
  function readable(color, background, text, minimum) {
    for (let i = 0; i <= 100; i++) {
      const candidate = mix(color, text, i / 100);
      if (
        (Array.isArray(background) ? background : [background]).every(
          (bg) => contrast(candidate, bg) >= minimum
        )
      )
        return candidate;
    }
    throw new Error('Palette cannot provide sufficient contrast.');
  }
  function compile(
    palette,
    { chromaticSurfaces = false, adjustAttention = false, quietSurfaces = false } = {}
  ) {
    if (
      !palette ||
      Object.keys(palette).sort().join() !== [...roles].sort().join() ||
      roles.some((key) => !/^#[0-9a-f]{6}$/i.test(palette[key]))
    )
      throw new Error('A theme requires exactly five six-digit hex colors: ' + roles.join(', '));
    const p = palette;
    // Neutral luminance endpoints are derived label inks, not extra palette roles.
    const candidates = quietSurfaces
      ? [p.page, p.surface, p.text, '#000000', '#ffffff']
      : [p.page, p.surface, p.text];
    for (const background of [p.page, p.surface]) {
      if (contrast(p.text, background) < 4.5)
        throw new Error('Text must contrast at least 4.5:1 against page and surface.');
    }
    // Zendesk shares one foreground across several emphasis backgrounds.
    let emphasis = candidates
      .map((color) => ({
        color,
        ratio: Math.min(...[p.accent, p.attention].map((bg) => contrast(color, bg)))
      }))
      .sort((a, b) => b.ratio - a.ratio)[0];
    if (emphasis.ratio < 4.5 && adjustAttention)
      emphasis = candidates
        .map((color) => ({ color, ratio: contrast(color, p.accent) }))
        .sort((a, b) => b.ratio - a.ratio)[0];
    if (emphasis.ratio < 4.5)
      throw new Error('Accent and attention backgrounds need a common readable foreground.');
    // Keep brand colors exact; only the emphasis fill may need a darker derived shade.
    const emphasisTarget = [...candidates].sort(
      (a, b) => contrast(b, emphasis.color) - contrast(a, emphasis.color)
    )[0];
    const attentionEmphasis = readable(p.attention, emphasis.color, emphasisTarget, 4.5);
    const onText = [...candidates].sort((a, b) => contrast(b, p.text) - contrast(a, p.text))[0];
    // Chromatic washes retain the accent hue without carrying dark pigment into pale fills.
    const channels = rgb(p.accent),
      low = Math.min(...channels),
      range = Math.max(...channels) - low;
    const tint =
      chromaticSurfaces && range
        ? '#' +
          channels
            .map((v) =>
              Math.round(((v - low) / range) * 255)
                .toString(16)
                .padStart(2, '0')
            )
            .join('')
        : p.text;
    const note = chromaticSurfaces
      ? mix(p.surface, tint, quietSurfaces ? 0.06 : 0.075)
      : mix(p.surface, p.attention, 0.12);
    const selected = mix(
      p.surface,
      chromaticSurfaces ? tint : p.accent,
      quietSurfaces ? 0.08 : 0.12
    );
    const hover = mix(p.surface, tint, quietSurfaces ? 0.025 : chromaticSurfaces ? 0.045 : 0.07);
    const textSurfaces = [p.page, p.surface, hover, note, selected];
    const controlSurfaces = [p.page, p.surface];
    const shade = [p.page, p.surface, p.text].sort((a, b) => luminance(a) - luminance(b))[0];
    const t = {
      page: p.page,
      surface: p.surface,
      text: p.text,
      accent: p.accent,
      attention: p.attention,
      attentionEmphasis,
      muted: readable(mix(p.surface, p.text, 0.6), textSurfaces, p.text, 4.5),
      border: mix(p.surface, chromaticSurfaces ? tint : p.text, quietSurfaces ? 0.1 : 0.18),
      controlBorder: readable(
        mix(p.surface, chromaticSurfaces ? p.accent : p.text, 0.45),
        controlSurfaces,
        chromaticSurfaces ? p.accent : p.text,
        3
      ),
      hover,
      selected,
      selectedText: readable(p.accent, selected, p.text, 4.5),
      link: readable(p.accent, textSurfaces, p.text, 4.5),
      focus: readable(p.accent, controlSurfaces, p.text, 3),
      onEmphasis: emphasis.color,
      onText,
      note,
      noteText: readable(p.text, note, p.text, 4.5),
      attentionText: readable(p.attention, note, p.text, 4.5),
      scrim: `rgb(${rgb(shade).join(' ')} / 75%)`,
      shadow: `rgb(${rgb(shade).join(' ')} / 18%)`
    };
    const variables = Object.fromEntries(
      Object.entries(t).map(([key, value]) => [
        '--zdh-theme-' + key.replace(/[A-Z]/g, (c) => '-' + c.toLowerCase()),
        value
      ])
    );
    variables['--zdh-theme-input-border'] = '1px solid ' + t.controlBorder;
    variables['--zdh-theme-chevron'] =
      `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='${encodeURIComponent(t.muted)}' d='M12.688 5.61a.5.5 0 01.69.718l-.066.062-5 4a.5.5 0 01-.542.054l-.082-.054-5-4a.5.5 0 01.55-.83l.074.05L8 9.359l4.688-3.75z'/%3E%3C/svg%3E")`;
    // These names were observed on the real Zendesk ticket, 2026-11-09.
    const groups = {
      page: ['--background-recessed', '--background-sidepanel', '--background-subtle'],
      surface: ['--background-default', '--background-raised'],
      text: ['--foreground-default'],
      muted: ['--foreground-subtle', '--foreground-disabled', '--background-disabled'],
      border: ['--border-default', '--border-disabled', '--border-subtle'],
      controlBorder: ['--border-emphasis'],
      accent: ['--background-primaryEmphasis', '--background-emphasis', '--border-primaryEmphasis'],
      link: ['--foreground-primary'],
      onEmphasis: ['--foreground-onEmphasis'],
      note: ['--background-warning', '--background-danger'],
      attentionEmphasis: [
        '--background-warningEmphasis',
        '--background-dangerEmphasis',
        '--border-warningEmphasis',
        '--border-dangerEmphasis'
      ],
      attentionText: [
        '--foreground-warning',
        '--foreground-warningEmphasis',
        '--foreground-danger',
        '--foreground-dangerEmphasis'
      ],
      selected: ['--background-success'],
      selectedText: ['--foreground-success', '--foreground-successEmphasis'],
      hover: ['--border-success', '--border-warning', '--border-danger']
    };
    for (const [token, names] of Object.entries(groups))
      for (const name of names) variables[name] = t[token];
    variables['--background-successEmphasis'] = t.accent;
    variables['--border-successEmphasis'] = t.accent;
    for (const status of [
      'Closed',
      'Default',
      'Hold',
      'New',
      'Open',
      'Pending',
      'Solved',
      'Suspended'
    ]) {
      const emphasized = ['New', 'Open', 'Pending'].includes(status);
      variables['--background-status' + status] = emphasized ? t.accent : t.hover;
      variables['--foreground-status' + status] = emphasized ? t.onEmphasis : t.text;
    }
    const editor = {
      surface: ['base-background', 'input-background', 'panel-background', 'toolbar-background'],
      page: ['base-foreground', 'input-disabled-background'],
      text: ['base-text', 'text', 'input-text'],
      muted: ['input-disabled-text'],
      controlBorder: [
        'base-border',
        'input-border',
        'input-disabled-border',
        'panel-border',
        'toolbar-border'
      ],
      accent: [
        'base-action',
        'base-active',
        'base-active-focus',
        'base-focus',
        'button-action-background',
        'button-action-active-background',
        'button-action-hover-background',
        'button-action-disabled-background',
        'button-save'
      ],
      attention: ['base-error', 'input-error-border', 'button-cancel'],
      focus: ['focus-border', 'focus-outer-shadow', 'focus-disabled-shadow'],
      note: ['focus-error-shadow'],
      hover: [
        'button-default-active-background',
        'button-default-hover-background',
        'button-on-disabled-background'
      ],
      selected: [
        'button-on-background',
        'button-on-active-background',
        'button-on-hover-background'
      ],
      selectedText: ['button-on-color'],
      onEmphasis: ['button-action-text'],
      onText: ['tooltip-text']
    };
    for (const [token, names] of Object.entries(editor))
      for (const name of names) variables['--ck-color-' + name] = t[token];
    // Tooltip background is paired with text directly; neutral emphasis can differ from accent.
    variables['--ck-color-tooltip-background'] = t.text;
    variables['--color-scheme'] = luminance(p.surface) < 0.18 ? 'dark' : 'light';
    return { tokens: t, variables };
  }
  function compileTheme(id) {
    id = systemTheme(id);
    if (!palettes[id]) return compile(resolve(id), { quietSurfaces: true, adjustAttention: true });
    return compile(palettes[id], {
      chromaticSurfaces: ['copper', 'blush', 'tealPink', 'pinkTeal'].includes(id),
      adjustAttention: ['jones', 'tealPink', 'pinkTeal'].includes(id),
      quietSurfaces: ['tealPink', 'pinkTeal'].includes(id)
    });
  }
  return Object.freeze({
    roles,
    palettes,
    compile,
    compileTheme,
    contrast,
    resolve,
    setCustomThemes,
    setPreview,
    systemTheme
  });
});
