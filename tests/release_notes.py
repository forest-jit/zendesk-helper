"""Only the requested, reviewed version may become public release notes."""
import importlib.util
from pathlib import Path
import sys
import unittest

SCRIPTS = Path(__file__).resolve().parents[1] / 'scripts'
sys.path.insert(0, str(SCRIPTS))
spec = importlib.util.spec_from_file_location('release_notes', SCRIPTS / 'build_release_notes.py')
notes = importlib.util.module_from_spec(spec)
spec.loader.exec_module(notes)


class ReleaseNotesTests(unittest.TestCase):
    def test_other_versions_and_unreleased_stay_out(self):
        source = '# Changes\n\n## Unreleased\n\n- Not shipped.\n\n## 1.2.3 - 2026-11-12\n\n- Fixed draft recovery.\n\n## 1.2.2\n\n- Older fix.\n'
        self.assertEqual(notes.entry_for_version(source, '1.2.3'), '- Fixed draft recovery.')

    def test_missing_duplicate_and_empty_entry_fail(self):
        for source in ['## Unreleased\n\n- Work in progress.',
                       '## 1.2.3\n\n- First.\n\n## 1.2.3\n\n- Duplicate.',
                       '## 1.2.3\n\n']:
            with self.subTest(source=source), self.assertRaises(ValueError):
                notes.entry_for_version(source, '1.2.3')

    def test_store_copy_keeps_text_and_links_without_markdown(self):
        self.assertEqual(notes.plain_text('### Fixed\n\n- **Draft** in `notes`.\n[Details](https://example.com)'),
                         'Fixed\n\n- Draft in notes.\nDetails (https://example.com)')


if __name__ == '__main__':
    unittest.main()
