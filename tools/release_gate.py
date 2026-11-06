#!/usr/bin/env python3
"""Fail closed on missing approvals, prerelease versions and unverified production APKs."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys
import zipfile

ROOT = Path(__file__).resolve().parent.parent
REQUIRED = {
    'web': ('humanPlaytest', 'accessibilityReview', 'assetRightsReview', 'privacyAndTitleReview'),
    'android': ('crashFixOnAffectedPhone', 'signedUpdateCompatibility', 'supportedDeviceMatrix'),
}


def approval_blockers(approval, version, sha, web_only=False):
    if not isinstance(approval, dict):
        return ['Approval record is missing or malformed.']
    blockers = []
    if approval.get('version') != version or approval.get('artifactSha256') != sha:
        blockers.append('Human approvals are not bound to this exact engine artifact.')
    if not web_only and not re.fullmatch(r'(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)', version):
        blockers.append('Public production release requires a stable version, not a prerelease label.')
    for scope in ('web',) if web_only else ('web', 'android'):
        records = approval.get(scope)
        for name in REQUIRED[scope]:
            item = records.get(name) if isinstance(records, dict) else None
            if (not isinstance(item, dict) or item.get('approved') is not True or
                    not isinstance(item.get('evidence'), str) or not item['evidence'].strip()):
                blockers.append(scope + ': ' + name)
    return blockers


def verify_apk(apk, approval, payload, signer='apksigner'):
    """Check real output bytes, payload and SDK signature; never inspect private keys."""
    if not isinstance(approval, dict):
        raise ValueError('Malformed approval record.')
    if apk is None or apk.is_symlink() or not apk.is_file():
        raise ValueError('Provide the exact owner-signed production APK with --apk; no symlinks.')
    if not 20_000_000 <= apk.stat().st_size <= 100_000_000:
        raise ValueError('Finished APK must be between 20 and 100 MB.')
    with apk.open('rb') as stream:
        sha = hashlib.file_digest(stream, 'sha256').hexdigest()
    if sha != approval.get('androidArtifactSha256'):
        raise ValueError('Android approvals are not bound to this exact APK hash.')
    result = subprocess.run([signer, 'verify', '--verbose', '--print-certs', str(apk)],
                            capture_output=True, text=True, check=True, timeout=60)
    certificates = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([0-9a-fA-F]{64})', result.stdout)
    if len(certificates) != 1 or certificates[0].lower() != str(approval.get('androidSigningCertificateSha256', '')).lower():
        raise ValueError('APK signing certificate does not match the owner-approved certificate.')
    if 'android debug' in result.stdout.lower():
        raise ValueError('Debug/test signing cannot pass the production gate.')
    expected = json.loads((payload / 'build-manifest.json').read_text())
    with zipfile.ZipFile(apk) as archive:
        names = archive.namelist()
        if len(names) != len(set(names)):
            raise ValueError('APK contains duplicate ZIP entries.')
        manifest_bytes = (payload / 'build-manifest.json').read_bytes()
        if (archive.getinfo('assets/build-manifest.json').file_size != len(manifest_bytes) or
                archive.read('assets/build-manifest.json') != manifest_bytes):
            raise ValueError('APK is not bound to the current tested engine payload.')
        assets = {n for n in names if n.startswith('assets/') and not n.endswith('/')}
        required = {'assets/' + n for n in expected['files']} | {'assets/build-manifest.json'}
        if assets != required:
            raise ValueError('APK has missing or extra game assets.')
        for name, digest in expected['files'].items():
            info = archive.getinfo('assets/' + name)
            local = payload / name
            if info.file_size != local.stat().st_size:
                raise ValueError('APK payload size differs: ' + name)
            with archive.open(info) as stream:
                if hashlib.file_digest(stream, 'sha256').hexdigest() != digest:
                    raise ValueError('APK payload hash differs: ' + name)
    return sha


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--web', action='store_true', help='Internal web evidence only, NOT public Android approval')
    parser.add_argument('--apk', type=Path)
    parser.add_argument('--apksigner', default='apksigner', help='Android SDK apksigner executable')
    args = parser.parse_args()
    subprocess.run([sys.executable, str(ROOT / 'tools/build_release.py')], check=True)
    blockers = []
    try:
        version = json.loads((ROOT / 'package.json').read_text())['version']
        qa = json.loads((ROOT / 'dist/qa-report.json').read_text())
        sha = (ROOT / 'dist/SHA256SUMS.txt').read_text().split()[0]
        approval = json.loads((ROOT / 'docs/release-approval.json').read_text())
        if qa.get('passed') is not True or qa.get('version') != version or qa.get('artifactSha256') != sha:
            blockers.append('Run complete automated verification against this exact engine artifact.')
        checks = qa.get('checks', [])
        if not isinstance(checks, list) or not checks or any(not isinstance(c, dict) or c.get('passed') is not True for c in checks):
            blockers.append('Automated check records are missing or contain failures.')
        blockers += approval_blockers(approval, version, sha, args.web)
        if not args.web:
            try:
                verify_apk(args.apk, approval, ROOT / 'dist/web', args.apksigner)
            except (ValueError, OSError, KeyError, subprocess.SubprocessError, zipfile.BadZipFile) as error:
                blockers.append('Signed APK verification: ' + str(error))
    except (OSError, ValueError, KeyError, TypeError) as error:
        blockers.append('Release evidence missing or malformed: ' + str(error))
    if blockers:
        print('\nPRODUCTION GATE: BLOCKED')
        for item in blockers:
            print(' -', item)
        return 1
    print('WEB EVIDENCE ONLY: not an Android release approval.' if args.web else 'Recorded approvals, tested payload and signed APK satisfy the production evidence gate.')
    print('Evidence records still require truthful human/owner authorization; no publication was performed.')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
