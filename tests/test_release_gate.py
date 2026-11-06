"""Gate safety fixtures, never claims of human/device/signing approval."""
import copy
import importlib.util
from pathlib import Path
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('release_gate', ROOT / 'tools/release_gate.py')
gate = importlib.util.module_from_spec(spec)
spec.loader.exec_module(gate)


class ProductionGateTests(unittest.TestCase):
    def setUp(self):
        self.sha = 'a' * 64
        self.approval = {'version': '1.0.0', 'artifactSha256': self.sha}
        for scope, names in gate.REQUIRED.items():
            self.approval[scope] = {name: {'approved': True, 'evidence': 'FIXTURE ONLY'} for name in names}

    def check(self, approval=None, version='1.0.0', web=False):
        return gate.approval_blockers(self.approval if approval is None else approval, version, self.sha, web)

    def test_complete_stable_approval_fixture(self):
        self.assertEqual(self.check(), [])

    def test_empty_removed_or_malformed_approval_sections_fail_closed(self):
        for scope in gate.REQUIRED:
            for value in [{}, None, [], 'approved']:
                broken = copy.deepcopy(self.approval)
                broken[scope] = value
                self.assertTrue(self.check(broken))
            for name in gate.REQUIRED[scope]:
                broken = copy.deepcopy(self.approval)
                del broken[scope][name]
                self.assertTrue(self.check(broken))

    def test_truthy_or_missing_evidence_is_not_approval(self):
        for value in [1, 'true', False, None]:
            broken = copy.deepcopy(self.approval)
            broken['android']['signedUpdateCompatibility']['approved'] = value
            self.assertTrue(self.check(broken))
        for value in ['', '   ', [], True]:
            broken = copy.deepcopy(self.approval)
            broken['web']['humanPlaytest']['evidence'] = value
            self.assertTrue(self.check(broken))

    def test_prerelease_cannot_be_public_production(self):
        for version in ['1.0.0-rc.3', '1.0.0+test', 'v1.0.0', '01.0.0']:
            self.approval['version'] = version
            self.assertTrue(self.check(version=version))
        self.approval['version'] = '1.0.0-rc.3'
        self.assertEqual(self.check(version='1.0.0-rc.3', web=True), [])

    def test_stale_artifact_and_missing_signed_apk_fail(self):
        self.approval['artifactSha256'] = 'b' * 64
        self.assertTrue(self.check())
        with self.assertRaises(ValueError):
            gate.verify_apk(None, self.approval, ROOT / 'dist/web')
        with self.assertRaises(ValueError):
            gate.verify_apk(ROOT / 'missing-production.apk', self.approval, ROOT / 'dist/web')


if __name__ == '__main__':
    unittest.main()
