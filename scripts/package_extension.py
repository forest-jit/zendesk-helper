#!/usr/bin/env python3
"""Build a source-only Chrome extension zip; exclude tickets, models and dev files."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
# Only runtime extensions below src/ can ship. Source notes and tooling stay outside.
RUNTIME_SUFFIXES = {'.js', '.css', '.html'}
DEVELOPMENT_FILES = ['scripts/process_ticket.py', 'docs/DISTRIBUTION.md', 'docs/DOCUMENTATION_HANDOFF.md']


def package(output, store=False):
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    version = manifest['version']
    if output.suffix != '.zip':
        raise ValueError('Choose a .zip output filename.')
    icons = [f'assets/icons/icon-{size}.png' for size in (16, 32, 48, 128)]
    runtime = [str(p.relative_to(ROOT)) for p in (ROOT / 'src').rglob('*') if p.is_file() and p.suffix in RUNTIME_SUFFIXES]
    files = ['manifest.json'] + sorted(runtime) + icons
    if not store:
        files += DEVELOPMENT_FILES
    for name in files:
        if not (ROOT / name).is_file():
            raise ValueError('Missing extension file: ' + name)
    output.parent.mkdir(parents=True, exist_ok=True)
    readme = f'''# Jones IT Zendesk Helper {version}

Unzip this folder, then open chrome://extensions in Chrome. Enable Developer mode,
choose Load unpacked, and select this folder. Refresh Zendesk once.

Open the toolbar popup. The On / Off switch controls the helper; other settings save
automatically. Help & feature guide explains every feature. You can also open src/guide/guide.html.

Set Zendesk itself to Light mode: profile picture > Appearance > Light mode.
Native Zendesk Dark mode is not supported yet. The helper’s own dark themes remain available.

Team install and updates: docs/DISTRIBUTION.md
Local AI and documentation review: docs/DOCUMENTATION_HANDOFF.md

The zip contains no ticket exports, account credentials, models or development dependencies.
Ollama is optional and installed separately; the local processor is scripts/process_ticket.py.
Organization policy may require approval before team rollout.
'''
    with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
        for name in sorted(files):
            archive.writestr(name, (ROOT / name).read_bytes())
        if not store:
            archive.writestr('README.md', readme)
    with zipfile.ZipFile(output) as archive:
        if archive.testzip() is not None:
            raise RuntimeError('The release zip failed its integrity check.')
        packaged = json.loads(archive.read('manifest.json'))
        if packaged['version'] != version:
            raise RuntimeError('Packaged manifest version differs.')
    digest = hashlib.sha256(output.read_bytes()).hexdigest()
    output.with_suffix('.sha256').write_text(digest + '  ' + output.name + '\n')
    print(f'{output} ({output.stat().st_size} bytes; {len(files) + (0 if store else 1)} files; store={store})')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--store', action='store_true', help='Package runtime files only for Chrome Web Store upload')
    args = parser.parse_args()
    package(args.output, store=args.store)
