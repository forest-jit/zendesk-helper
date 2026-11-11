#!/usr/bin/env python3
"""Validate the local store ZIP and artwork. This is not a Google review or legal certification."""
import argparse
import hashlib
import json
import struct
import zipfile
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]


def png_size(data):
    if data[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('Expected a PNG file')
    return struct.unpack('>II', data[16:24])


def check(package):
    manifest = json.loads((ROOT/'manifest.json').read_text())
    with zipfile.ZipFile(package) as archive:
        assert archive.testzip() is None, 'Corrupt ZIP'
        files = set(archive.namelist())
        assert json.loads(archive.read('manifest.json')) == manifest
        assert not any(name.startswith(('docs/', 'scripts/', 'tests/', 'node_modules/')) for name in files)
        assert not any(name.endswith(('.raw.json', '.mhtml', '.har')) for name in files)
        assert manifest['host_permissions'] == ['https://itjones.zendesk.com/agent/*']
        assert set(manifest['permissions']) == {'storage', 'downloads'}
        assert len(manifest['description']) <= 132
        referenced = ['privacy.html', manifest['action']['default_popup'], manifest['background']['service_worker']]
        for entry in manifest['content_scripts']:
            referenced += entry.get('js', []) + entry.get('css', [])
        for size, name in manifest['icons'].items():
            assert png_size(archive.read(name)) == (int(size), int(size))
            referenced.append(name)
        assert set(referenced) <= files, 'Manifest references missing files'
        assert b'href="privacy.html"' in archive.read('guide.html')
    for name in ['screenshot-1-overview-1280x800.jpg','screenshot-2-studio-1280x800.jpg','screenshot-3-guide-1280x800.jpg']:
        with Image.open(ROOT/'docs/release'/name) as image:
            assert image.format == 'JPEG' and image.size == (1280,800)
    assert png_size((ROOT/'docs/release/small-promo-440x280.png').read_bytes()) == (440,280)
    checksum = package.with_suffix('.sha256').read_text().split()[0]
    assert hashlib.sha256(package.read_bytes()).hexdigest() == checksum
    print(f'PASS: store ZIP {manifest["version"]}, references, limited permissions, icon sizes, screenshots and checksum.')
    print('External steps remain: publisher/account decision, policy hosting, reviewer access, certifications and submission.')

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('package', type=Path)
    check(parser.parse_args().package)
