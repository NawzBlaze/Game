import importlib.util
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location('size_gate', Path(__file__).resolve().parents[1] / 'tools/check_android_size.py')
size_gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(size_gate)


class SizeGateTests(unittest.TestCase):
    def test_finished_apk_and_bundle_under_limit(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'game.apk').write_bytes(b'APK size fixture')
            (root / 'game.aab').write_bytes(b'AAB size fixture')
            self.assertEqual(len(size_gate.check([root])), 2)

    def test_exact_limit_allowed_and_one_byte_over_rejected(self):
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'game.apk'
            with path.open('wb') as file:
                file.truncate(size_gate.MAX_BYTES)  # Sparse fixture, not a game binary.
            self.assertEqual(size_gate.check([path])[0][1], 100_000_000)
            with path.open('ab') as file:
                file.write(b'x')
            with self.assertRaises(ValueError):
                size_gate.check([path])

    def test_empty_missing_or_zero_byte_output_fails(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            for paths in [[], [root], [root / 'missing.apk']]:
                with self.subTest(paths=paths), self.assertRaises(ValueError):
                    size_gate.check(paths)
            (root / 'empty.apk').touch()
            with self.assertRaises(ValueError):
                size_gate.check([root])

    def test_symlink_is_not_a_release_artifact(self):
        with tempfile.TemporaryDirectory() as temp:
            root = Path(temp)
            (root / 'real.apk').write_bytes(b'test')
            (root / 'linked.apk').symlink_to(root / 'real.apk')
            with self.assertRaises(ValueError):
                size_gate.check([root])


if __name__ == '__main__':
    unittest.main()
