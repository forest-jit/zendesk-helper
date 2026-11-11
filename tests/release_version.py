"""Release identity must fail closed before ZIPs are attached to a version tag."""
import importlib.util
from pathlib import Path
import unittest

spec = importlib.util.spec_from_file_location(
    'release_version', Path(__file__).resolve().parents[1] / 'scripts/check_release_version.py')
release = importlib.util.module_from_spec(spec)
spec.loader.exec_module(release)


class ReleaseVersionTests(unittest.TestCase):
    def test_matching_release(self):
        self.assertEqual(release.validate_tag('v0.7.7', {'manifest': '0.7.7', 'lock': '0.7.7'}), '0.7.7')

    def test_stale_or_missing_record_rejects_release(self):
        for value in ['0.7.6', None]:
            with self.subTest(value=value), self.assertRaisesRegex(ValueError, 'does not match lock'):
                release.validate_tag('v0.7.7', {'manifest': '0.7.7', 'lock': value})

    def test_malformed_or_prerelease_tag_rejected(self):
        for tag in ['0.7.7', 'v00.7.7', 'v0.7.7-beta', 'v0.7', 'v0.7.7/extra', 'v0.7.7\n', 'v$(command)']:
            with self.subTest(tag=tag), self.assertRaises(ValueError):
                release.validate_tag(tag, {})


if __name__ == '__main__':
    unittest.main()
