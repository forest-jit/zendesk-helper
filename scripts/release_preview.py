#!/usr/bin/env python3
"""Loopback-only screenshot preview using actual popup/Settings code and synthetic preferences.

This is a release-artwork tool, not a Zendesk test or an extension runtime.
It serves a narrow allowlist, has no customer data, and never calls Chrome APIs.
"""
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path
from urllib.parse import urlparse, parse_qs

ROOT = Path(__file__).resolve().parents[1]
MOCK = '''<script>
const localPrefs={enabled:true,theme:'forest',customThemes:{},harvestTheme:false};
window.chrome={storage:{onChanged:{addListener:()=>{}},local:{get:async defaults=>({...defaults,...localPrefs}),set:async patch=>Object.assign(localPrefs,patch)},session:{get:async()=>({}),set:async()=>{},remove:async()=>{}}},permissions:{contains:async()=>false,request:async()=>false},runtime:{getManifest:()=>({version:'0.7.11'}),getURL:path=>'/'+path,sendMessage:async()=>({}),openOptionsPage:async()=>{location.href='/demo-settings.html';}},tabs:{query:async()=>[],sendMessage:async()=>({}),onRemoved:{addListener:()=>{}}}};
</script>'''

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        url = urlparse(self.path)
        if url.path == '/':
            content = '''<!doctype html><html lang="en"><meta charset="utf-8"><title>Jones IT Zendesk Helper release preview</title><style>body{margin:0;background:#edf3f5;color:#173e51;font-family:system-ui}main{display:grid;grid-template-columns:1fr 400px;gap:72px;padding:60px 88px;align-items:start}h1{font-size:40px;line-height:1.15;letter-spacing:-1px;margin:20px 0 20px;max-width:460px}p{font-size:19px;line-height:1.5;max-width:450px}ul{padding-left:22px;max-width:500px}li{font-size:17px;line-height:1.5;margin-bottom:14px}small{display:block;margin-top:24px;font-size:14px;line-height:1.6}iframe{width:380px;height:440px;border:1px solid #a3b5be;border-radius:12px;background:white;box-shadow:0 12px 32px #173e511a}a{color:#185d80}</style><main><section><h1 id="title">Tools and improvements for Zendesk.</h1><p id="copy">Conversation controls, reply shortcuts and ticket actions in the existing Zendesk interface.</p><ul id="features"><li><strong>Read long tickets:</strong> collapse older messages and quoted email; open image previews.</li><li><strong>Reply and save separately:</strong> switch public/private in one click; save fields without sending your draft.</li><li><strong>Reuse ticket details:</strong> copy links or export loaded messages and images.</li><li><strong>Adjust your workspace:</strong> choose a theme, match Harvest, and refresh ticket views while idle.</li></ul><small>For Jones IT Zendesk.<br>Settings preview with sample data.</small></section><iframe title="Extension popup demonstration" src="/demo-popup.html"></iframe></main></html>'''
            if parse_qs(url.query).get('view') == ['studio']:
                content = content.replace('Tools and improvements for Zendesk.', 'Create a theme.').replace('Conversation controls, reply shortcuts and ticket actions in the existing Zendesk interface.', 'Pick colors for the page, fields, text, buttons and internal notes. Check the preview before saving.')
                begin=content.index('<ul id="features">');end=content.index('</ul>',begin)+5
                content=content[:begin]+content[end:]
            body, mime = content.encode(), 'text/html'
        elif url.path in ('/demo-popup.html', '/demo-settings.html'):
            source = (ROOT/('src/settings/settings.html' if url.path == '/demo-settings.html' else 'src/popup/popup.html')).read_text()
            if url.path == '/demo-settings.html':
                source = source.replace('</body>', '<aside style="position:fixed;bottom:12px;left:24px;font:12px system-ui;color:var(--zdh-theme-muted)">Settings preview · sample palette</aside></body>')
            body, mime = source.replace('<html lang="en">', '<html lang="en">'+MOCK).encode(), 'text/html'
        else:
            allowed={
                '/shared/theme-controls.js': ('src/shared/theme-controls.js', 'text/javascript'),
                '/shared/theme-files.js': ('src/shared/theme-files.js', 'text/javascript'),
                '/popup/popup.css': ('src/popup/popup.css', 'text/css'),
                '/settings.css': ('src/settings/settings.css', 'text/css'),
                '/settings.js': ('src/settings/settings.js', 'text/javascript'),
                '/src/guide/guide.html': ('src/guide/guide.html', 'text/html'),
                '/src/guide/guide.css': ('src/guide/guide.css', 'text/css'),
                '/src/guide/guide.js': ('src/guide/guide.js', 'text/javascript'),
                '/src/shared/themes.js': ('src/shared/themes.js', 'text/javascript'),
                '/popup.css': ('src/popup/popup.css', 'text/css'),
                '/popup.js': ('src/popup/popup.js', 'text/javascript'),
                '/shared/themes.js': ('src/shared/themes.js', 'text/javascript'),
                '/guide.html': ('src/guide/guide.html', 'text/html'),
                '/guide/guide.html': ('src/guide/guide.html', 'text/html'),
                '/guide/guide.css': ('src/guide/guide.css', 'text/css'),
                '/guide/guide.js': ('src/guide/guide.js', 'text/javascript'),
                '/guide/privacy.html': ('src/guide/privacy.html', 'text/html'),
                '/guide.css': ('src/guide/guide.css', 'text/css'),
                '/guide.js': ('src/guide/guide.js', 'text/javascript'),
                '/privacy.html': ('src/guide/privacy.html', 'text/html')
            }
            if url.path not in allowed:
                self.send_error(404); return
            file, mime = allowed[url.path]
            body = (ROOT/file).read_bytes()
            if file == 'src/guide/guide.html':
                body = body.decode().replace('<html lang="en">', '<html lang="en">'+MOCK).encode()
        self.send_response(200)
        self.send_header('Content-Type', mime+'; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers();self.wfile.write(body)
    def log_message(self,*args): pass

if __name__ == '__main__':
    print('Release preview http://127.0.0.1:8768 (Ctrl+C to stop)', flush=True)
    HTTPServer(('127.0.0.1',8768),Handler).serve_forever()
