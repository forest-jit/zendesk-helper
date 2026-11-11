#!/usr/bin/env python3
"""Build static release pages from the policy source. No server or deployment is performed."""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'docs' / 'release' / 'site'
STYLE = '''body{margin:0;background:#f8f9f9;color:#293239;font:17px/1.65 system-ui,sans-serif}main{max-width:720px;margin:auto;padding:48px 24px 72px}h1{font-size:36px;line-height:1.2;margin:0 0 24px}h2{font-size:23px;line-height:1.3;margin:36px 0 12px}p,li{margin:0 0 16px}a{color:#185d80;text-underline-offset:3px}nav{display:flex;gap:24px;flex-wrap:wrap;margin-bottom:36px}code{overflow-wrap:anywhere}footer{margin-top:48px;font-size:14px}a:focus-visible{outline:2px solid #185d80;outline-offset:4px}@media(max-width:480px){main{padding:24px 20px}h1{font-size:30px}}'''


def page(title, content):
    return f'''<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{html.escape(title)}</title><style>{STYLE}</style></head><body><main><nav aria-label="Site"><a href="index.html">Jones IT Zendesk Helper</a><a href="privacy.html">Privacy</a><a href="support.html">Support</a></nav>{content}<footer>Independently developed. Not an official Zendesk or Harvest product.</footer></main></body></html>'''


def paragraphs(markdown):
    parts = []
    for block in markdown.strip().split('\n\n'):
        if block.startswith('# '): parts.append('<h1>' + html.escape(block[2:]) + '</h1>')
        elif block.startswith('## '): parts.append('<h2>' + html.escape(block[3:]) + '</h2>')
        else: parts.append('<p>' + re.sub(r'`([^`]+)`', r'<code>\1</code>', html.escape(block)).replace('  \n', '<br>') + '</p>')
    return '\n'.join(parts)


def main():
    SITE.mkdir(parents=True, exist_ok=True)
    policy = page('Jones IT Zendesk Helper privacy policy', paragraphs((ROOT / 'docs/release/PRIVACY.md').read_text()))
    (SITE / 'privacy.html').write_text(policy)
    # Local copy has guide links, so it also works when opened from the extension package.
    (ROOT / 'src/guide/privacy.html').write_text(policy.replace('href="index.html"', 'href="guide.html"').replace('href="support.html"', 'href="mailto:forest.r.welch@gmail.com"'))
    (SITE / 'index.html').write_text(page('Jones IT Zendesk Helper', '''<h1>Tools and improvements for Zendesk</h1><p>Jones IT Zendesk Helper is a collection of conversation controls, reply shortcuts and ticket actions for Jones IT Zendesk.</p><p>Private pilot for authorized Jones IT agents. Works only on itjones.zendesk.com agent pages. No store installation link is available until the private release is approved.</p><ul><li>Choose or create a theme.</li><li>Read compact conversations and supported quoted threads.</li><li>Save fields while preserving a reply draft.</li><li>Export ticket content locally for manual review.</li></ul><p>Activity badges depend on native Zendesk signals and are still being validated with multiple agents. Local AI processing is optional, separately run and requires review.</p><p><a href="privacy.html">How your information is handled</a> · <a href="support.html">Get help or report a problem</a></p>'''))
    (SITE / 'support.html').write_text(page('Jones IT Zendesk Helper support', '''<h1>Get help</h1><p>Contact <a href="mailto:forest.r.welch@gmail.com">forest.r.welch@gmail.com</a>.</p><p>Include the extension version, theme, action you took, expected result and browser version. Keep customer names, messages, attachments and raw exports out of the initial report. A redacted example is usually enough.</p><h2>If a draft needs recovery</h2><p>Do not send or retry an uncertain save. Keep the current draft. Use Save recovery copy when offered, then review the saved versions locally.</p><h2>Turn it off</h2><p>Use the toolbar popup's On / Off switch to return to native Zendesk. Settings and recovery copies are retained. Downloads remain on your computer until you delete them.</p>'''))
    print('Built public-site drafts and packaged privacy page; nothing deployed.')

if __name__ == '__main__':
    main()
