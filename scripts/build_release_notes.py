#!/usr/bin/env python3
"""Turn one reviewed changelog entry into GitHub notes and store copy.

Never infer changes from commits or copy private bug reports into public notes.
Missing or duplicate version entries stop the release before publication.
"""
import argparse
from pathlib import Path
import re

from check_release_version import release_version

ROOT = Path(__file__).resolve().parents[1]


def entry_for_version(changelog, version):
    sections = list(re.finditer(r'^## ([^\n]+)$', changelog, re.MULTILINE))
    matches = [i for i, item in enumerate(sections)
               if item.group(1).split(' - ')[0].strip() == version]
    if len(matches) != 1:
        raise ValueError(f'CHANGELOG.md needs exactly one entry for {version}.')
    index = matches[0]
    end = sections[index + 1].start() if index + 1 < len(sections) else len(changelog)
    body = changelog[sections[index].end():end].strip()
    if not body or not re.search(r'^- \S', body, re.MULTILINE):
        raise ValueError(f'Add actual user-facing changes for {version} before tagging.')
    return body


def plain_text(markdown):
    text = re.sub(r'^#{1,6}\s+', '', markdown, flags=re.MULTILINE)
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'\1 (\2)', text)
    return text.replace('**', '').replace('`', '').strip()


def build(tag, output):
    version = release_version(tag)
    body = entry_for_version((ROOT / 'CHANGELOG.md').read_text(), version)
    record = (ROOT / 'CHROMEWEBSTORE.md').read_text()
    description = record.split('## Detailed description\n\n', 1)[1].split('\n## Developer information', 1)[0].strip()
    update = f"WHAT'S NEW IN {version}\n\n{plain_text(body)}\n"
    downloads = '''

## Downloads

- **store.zip:** extension files for Chrome Web Store upload.
- **development.zip:** includes the optional local AI processor and instructions.
- **sha256:** checksums for the matching ZIPs.

These files come from the tagged source after automated checks. A GitHub release does not submit an update to the Chrome Web Store or confirm that Google has approved it.
'''
    output.mkdir(parents=True, exist_ok=True)
    (output / 'release-notes.md').write_text(body + downloads)
    (output / 'store-update-notes.txt').write_text(update)
    (output / 'store-description.txt').write_text(description + '\n\n' + update)
    print(f'Built GitHub release notes and store copy for {version}.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--tag', required=True)
    parser.add_argument('--output-dir', type=Path, default=Path('dist'))
    args = parser.parse_args()
    try:
        build(args.tag, args.output_dir)
    except (ValueError, IndexError, OSError) as error:
        parser.exit(1, f'{error}\n')
