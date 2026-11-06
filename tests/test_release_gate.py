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

# Sparse 20 MB ZIP fixtures below are temporary test inputs, NOT game assets/APKs.
# The SDK signature command is mocked: these tests do not claim real APK signing.
class SignedApkGateTests(unittest.TestCase):
    def test_signature_payload_and_owner_bindings(self):
        import hashlib
        import json
        import tempfile
        import types
        import zipfile
        from unittest.mock import patch
        certificate = 'c' * 64
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            payload = folder / 'payload'
            payload.mkdir()
            (payload / 'index.html').write_bytes(b'demo')
            (payload / 'build-manifest.json').write_text(json.dumps({'version': '1.0.0', 'files': {'index.html': hashlib.sha256(b'demo').hexdigest()}}))
            apk = folder / 'fixture.apk'
            def create(content=b'demo', extra=False):
                with apk.open('wb') as stream:
                    stream.truncate(20_000_000)
                with zipfile.ZipFile(apk, 'a') as archive:
                    archive.writestr('assets/build-manifest.json', (payload / 'build-manifest.json').read_bytes())
                    archive.writestr('assets/index.html', content)
                    if extra:
                        archive.writestr('assets/unapproved.js', 'bad')
                with apk.open('rb') as stream:
                    sha = hashlib.file_digest(stream, 'sha256').hexdigest()
                return {'androidArtifactSha256': sha, 'androidSigningCertificateSha256': certificate}
            output = types.SimpleNamespace(stdout='Signer #1 certificate SHA-256 digest: ' + certificate)
            with patch.object(gate.subprocess, 'run', return_value=output):
                approval = create()
                self.assertEqual(gate.verify_apk(apk, approval, payload), approval['androidArtifactSha256'])
                approval['androidArtifactSha256'] = 'f' * 64
                with self.assertRaisesRegex(ValueError, 'exact APK hash'):
                    gate.verify_apk(apk, approval, payload)
                approval = create()
                approval['androidSigningCertificateSha256'] = 'd' * 64
                with self.assertRaisesRegex(ValueError, 'certificate'):
                    gate.verify_apk(apk, approval, payload)
                approval = create(content=b'evil')
                with self.assertRaisesRegex(ValueError, 'payload hash'):
                    gate.verify_apk(apk, approval, payload)
                approval = create(extra=True)
                with self.assertRaisesRegex(ValueError, 'extra game assets'):
                    gate.verify_apk(apk, approval, payload)
            approval = create()
            debug = types.SimpleNamespace(stdout=output.stdout + '\nSigner #1 certificate DN: CN=Android Debug')
            with patch.object(gate.subprocess, 'run', return_value=debug):
                with self.assertRaisesRegex(ValueError, 'Debug/test'):
                    gate.verify_apk(apk, approval, payload)
            with patch.object(gate.subprocess, 'run', side_effect=gate.subprocess.CalledProcessError(1, 'apksigner')):
                with self.assertRaises(gate.subprocess.CalledProcessError):
                    gate.verify_apk(apk, approval, payload)


if __name__ == '__main__':
    unittest.main()
