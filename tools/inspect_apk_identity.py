#!/usr/bin/env python3
"""Read-only APK/public-certificate inspection. No device access, install or private key use."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def inspect_apk(path, apksigner='apksigner', aapt2='aapt2'):
    path = Path(path)
    if path.is_symlink() or not path.is_file():
        raise ValueError('Select an existing local APK file, not a symlink.')
    signature = subprocess.run([apksigner, 'verify', '--verbose', '--print-certs', str(path)],
                               check=True, capture_output=True, text=True, timeout=60)
    certificates = re.findall(r'Signer #\d+ certificate SHA-256 digest: ([a-fA-F0-9]{64})', signature.stdout)
    if not certificates:
        raise ValueError('No verified public signing certificate was reported.')
    metadata = subprocess.run([aapt2, 'dump', 'badging', str(path)],
                              check=True, capture_output=True, text=True, timeout=60)
    package = re.search(r"^package: name='([^']+)' versionCode='(\d+)' versionName='([^']*)'", metadata.stdout, re.MULTILINE)
    if not package:
        raise ValueError('Could not read package/version metadata from this APK.')
    digest = hashlib.sha256()
    with path.open('rb') as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b''):
            digest.update(chunk)
    return {'package': package[1], 'versionCode': int(package[2]), 'versionName': package[3],
            'apkSha256': digest.hexdigest(), 'sizeBytes': path.stat().st_size,
            'signatureVerifiedBySdk': True,
            'certificateSha256': sorted({c.lower() for c in certificates}),
            'androidDebugCertificateDetected': 'android debug' in signature.stdout.lower()}


def compare(old, candidate):
    package = old['package'] == candidate['package']
    certificate = old['certificateSha256'] == candidate['certificateSha256']
    higher = candidate['versionCode'] > old['versionCode']
    return {'packageMatches': package, 'publicCertificatesMatch': certificate, 'candidateVersionCodeHigher': higher,
            'preliminaryIdentityMatch': package and certificate and higher,
            'compatibleUpdateProven': False,
            'explanation': 'A matching package/certificate and higher version are preliminary checks only. '
                           'They do not prove the old APK is actually installed, authorized signing rotation, '
                           'device/split compatibility, save retention or crash resolution. Do not install/clear/uninstall automatically.'}


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('old_apk', type=Path, help='Local old/test APK; do not upload it')
    parser.add_argument('--candidate', type=Path, help='Optional local candidate APK to compare')
    parser.add_argument('--apksigner', default='apksigner', help='Official Android SDK apksigner executable')
    parser.add_argument('--aapt2', default='aapt2', help='Official Android SDK aapt2 executable')
    args = parser.parse_args(argv)
    try:
        result = {'scope': 'Local file/public-certificate inspection only; no device or update approval',
                  'oldApk': inspect_apk(args.old_apk, args.apksigner, args.aapt2)}
        if args.candidate:
            result['candidateApk'] = inspect_apk(args.candidate, args.apksigner, args.aapt2)
            result['comparison'] = compare(result['oldApk'], result['candidateApk'])
        # No local paths, device serials, private keys or APK contents in the receipt.
        print(json.dumps(result, indent=2))
        return 2 if 'comparison' in result and not result['comparison']['preliminaryIdentityMatch'] else 0
    except (OSError, ValueError, subprocess.SubprocessError) as error:
        print('Inspection could not complete: ' + str(error) + '\nNo device/app state was changed.', file=sys.stderr)
        return 1


if __name__ == '__main__':
    raise SystemExit(main())
