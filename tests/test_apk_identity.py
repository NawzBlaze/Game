"""Read-only identity logic with mocked SDK tools, NOT real signing/phone evidence."""
import contextlib
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('apk_identity', ROOT / 'tools/inspect_apk_identity.py')
identity = importlib.util.module_from_spec(spec)
spec.loader.exec_module(identity)
CERT = 'a' * 64


class ApkIdentityTests(unittest.TestCase):
    def test_inspection_only_invokes_read_only_sdk_commands_and_receipt_omits_paths(self):
        calls = []
        def sdk(command, **kwargs):
            calls.append(command)
            self.assertTrue(kwargs['check'])
            text = 'Signer #1 certificate SHA-256 digest: ' + CERT if command[1] == 'verify' else "package: name='com.onestepdelivery.game' versionCode='102' versionName='1.0.0-rc.3'"
            return subprocess.CompletedProcess(command, 0, text, '')
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'private-local-name.apk'
            path.write_bytes(b'not-an-apk: SDK is mocked in this fixture')
            with patch.object(identity.subprocess, 'run', side_effect=sdk):
                output = io.StringIO()
                with contextlib.redirect_stdout(output):
                    self.assertEqual(identity.main([str(path)]), 0)
                receipt = json.loads(output.getvalue())
            self.assertEqual(receipt['oldApk']['certificateSha256'], [CERT])
            self.assertEqual(receipt['oldApk']['versionCode'], 102)
            self.assertNotIn(temp, output.getvalue())
            self.assertNotIn(path.name, output.getvalue())
            self.assertEqual(len(calls), 2)
            self.assertEqual(calls[0][1:4], ['verify', '--verbose', '--print-certs'])
            self.assertEqual(calls[1][1:3], ['dump', 'badging'])

    def test_matching_identity_never_claims_compatible_update_proven(self):
        old = {'package': 'game', 'certificateSha256': [CERT], 'versionCode': 100}
        result = identity.compare(old, {**old, 'versionCode': 102})
        self.assertTrue(result['preliminaryIdentityMatch'])
        self.assertFalse(result['compatibleUpdateProven'])
        for candidate in [{**old, 'package': 'other'}, {**old, 'certificateSha256': ['b'*64]}, old, {**old, 'versionCode': 99}]:
            self.assertFalse(identity.compare(old, candidate)['preliminaryIdentityMatch'])

    def test_missing_files_tools_and_invalid_sdk_output_fail_without_receipt(self):
        with self.assertRaises(ValueError):
            identity.inspect_apk(ROOT / 'missing-apk.apk')
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / 'fixture.apk'
            path.write_bytes(b'fixture')
            with patch.object(identity.subprocess, 'run', side_effect=FileNotFoundError('SDK missing')):
                with self.assertRaises(FileNotFoundError):
                    identity.inspect_apk(path)
            with patch.object(identity.subprocess, 'run', return_value=subprocess.CompletedProcess([], 0, 'unrecognized output', '')):
                with self.assertRaises(ValueError):
                    identity.inspect_apk(path)
            with patch.object(identity.subprocess, 'run', side_effect=subprocess.CalledProcessError(1, 'apksigner')):
                with self.assertRaises(subprocess.CalledProcessError):
                    identity.inspect_apk(path)

    def test_different_preview_certificates_do_not_establish_new_production_identity(self):
        old = {'package': 'game', 'certificateSha256': ['a'*64], 'versionCode': 101}
        new = {**old, 'certificateSha256': ['b'*64], 'versionCode': 102}
        self.assertFalse(identity.compare(old, new)['preliminaryIdentityMatch'])


if __name__ == '__main__':
    unittest.main()
