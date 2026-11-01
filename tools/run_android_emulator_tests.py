#!/usr/bin/env python3
"""Install/test only a fresh CI emulator. Never an attached physical device."""
import argparse
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys


def select_emulator(devices):
    rows = [line.split() for line in devices.splitlines()[1:] if line.strip()]
    if len(rows) != 1 or len(rows[0]) < 2 or rows[0][1] != 'device' or not re.fullmatch(r'emulator-\d+', rows[0][0]):
        raise RuntimeError('Refusing installation: exactly one ready emulator, and no other devices, required')
    return rows[0][0]


def tests_passed(text):
    # adb/am may exit zero even when instrumentation fails. Inspect runner output.
    return bool(re.search(r'OK \(2 tests\)', text) and
                re.search(r'INSTRUMENTATION_CODE:\s*-1\b', text) and
                not re.search(r'FAILURES!!!|INSTRUMENTATION_FAILED|Process crashed|shortMsg=', text))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--candidates', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    report = {'scope': 'Disposable emulator only, debug candidate; not physical-device or release approval', 'passed': False}
    serial = None
    def run(cmd, timeout=120, check=True):
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
        if check and result.returncode:
            raise RuntimeError(f'{cmd[0]} failed ({result.returncode}): {result.stdout}\n{result.stderr}')
        return result
    def adb(*cmd, **kwargs):
        return run(['adb', '-s', serial, *cmd], **kwargs)
    try:
        serial = select_emulator(run(['adb', 'devices']).stdout)
        package = 'com.onestepdelivery.game'
        installed = adb('shell', 'pm', 'list', 'packages', package).stdout
        if any(line.startswith('package:') for line in installed.splitlines()):
            raise RuntimeError('Refusing to replace an existing installation; use a fresh emulator')
        checksums = {}
        for line in (args.candidates / 'SHA256SUMS.txt').read_text().splitlines():
            digest, name = line.split(maxsplit=1)
            name = name.lstrip('*')
            if Path(name).name != name:
                raise RuntimeError('Unsafe candidate path')
            data = (args.candidates / name).read_bytes()
            if hashlib.sha256(data).hexdigest() != digest:
                raise RuntimeError('Candidate hash mismatch: ' + name)
            checksums[name] = digest
        for name in ['app-debug.apk', 'app-debug-androidTest.apk']:
            if name not in checksums:
                raise RuntimeError('Missing verified APK: ' + name)
        report.update({'apkSha256': checksums['app-debug.apk'], 'testApkSha256': checksums['app-debug-androidTest.apk'],
                       'sourceCommit': (args.candidates / 'SOURCE_COMMIT.txt').read_text().strip(),
                       'api': adb('shell', 'getprop', 'ro.build.version.sdk').stdout.strip()})
        (args.output / 'webview-provider.txt').write_text(adb('shell', 'dumpsys', 'webviewupdate').stdout)
        adb('shell', 'svc', 'wifi', 'disable')
        adb('shell', 'svc', 'data', 'disable')
        adb('logcat', '-c')  # Only this disposable emulator's logs.
        adb('install', '-t', str(args.candidates / 'app-debug.apk'))
        adb('install', '-t', str(args.candidates / 'app-debug-androidTest.apk'))
        result = adb('shell', 'am', 'instrument', '-w', '-e', 'class',
                     'com.onestepdelivery.game.WebGameSmokeDeviceTest,com.onestepdelivery.game.RendererRecoveryDeviceTest',
                     package + '.test/androidx.test.runner.AndroidJUnitRunner', timeout=360, check=False)
        text = result.stdout + '\n' + result.stderr
        (args.output / 'instrumentation.txt').write_text(text)
        print(text)
        report['passed'] = result.returncode == 0 and tests_passed(text)
        if not report['passed']:
            raise RuntimeError('Instrumentation did not confirm both tests passed')
    except (RuntimeError, OSError, ValueError, subprocess.TimeoutExpired) as error:
        report['error'] = str(error)
        print(str(error), file=sys.stderr)
    finally:
        if serial:
            try:
                (args.output / 'emulator-logcat.txt').write_text(adb('logcat', '-d', timeout=30, check=False).stdout)
            except (OSError, subprocess.TimeoutExpired):
                pass
        (args.output / 'result.json').write_text(json.dumps(report, indent=2) + '\n')
    return 0 if report['passed'] else 1


if __name__ == '__main__':
    sys.exit(main())
