#!/usr/bin/env python3
"""Reject release tags that do not match all three version records.

Print only the validated version so Actions can safely use it in filenames.
This checks identity, not whether the extension is ready for users.
"""
import json
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]


def validate_tag(tag, versions):
    if not re.fullmatch(r'v(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)\.(?:0|[1-9][0-9]*)', tag):
        raise ValueError('Use a tag such as v0.7.7 (three numbers; no suffix or leading zero).')
    version = tag[1:]
    for name, value in versions.items():
        if value != version:
            raise ValueError(f'{tag} does not match {name}: {value!r}. Update versions before tagging.')
    return version


def release_version(tag):
    manifest = json.loads((ROOT / 'manifest.json').read_text())
    package = json.loads((ROOT / 'package.json').read_text())
    lock = json.loads((ROOT / 'package-lock.json').read_text())
    return validate_tag(tag, {
        'manifest.json': manifest.get('version'),
        'package.json': package.get('version'),
        'package-lock.json': lock.get('version'),
        'package-lock.json root package': lock.get('packages', {}).get('', {}).get('version'),
    })


if __name__ == '__main__':
    try:
        if len(sys.argv) != 2:
            raise ValueError('Usage: python3 scripts/check_release_version.py v0.7.7')
        print(release_version(sys.argv[1]))
    except (ValueError, OSError) as error:
        sys.exit(str(error))
