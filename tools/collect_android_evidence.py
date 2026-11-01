#!/usr/bin/env python3
"""Read-only Android evidence collection. No installation, log clearing or app launch.

Uses only the Python standard library plus Google's adb. All output is PRIVATE.
The user opens the already-installed game manually once during live collection.
"""
import argparse
from datetime import datetime, timezone
import json
from pathlib import Path
import shutil
import subprocess
import sys

PACKAGE = 'com.onestepdelivery.game'
SNAPSHOT = [
    ('01-existing-logcat.txt', ['logcat','-d','-b','main','-b','system','-b','crash','-v','threadtime']),
    ('02-device-time.txt', ['shell','date']),
    ('03-manufacturer.txt', ['shell','getprop','ro.product.manufacturer']),
    ('04-model.txt', ['shell','getprop','ro.product.model']),
    ('05-android-version.txt', ['shell','getprop','ro.build.version.release']),
    ('06-sdk.txt', ['shell','getprop','ro.build.version.sdk']),
    ('07-webview-provider.txt', ['shell','dumpsys','webviewupdate']),
    ('08-installed-package.txt', ['shell','dumpsys','package',PACKAGE]),
    ('09-package-paths.txt', ['shell','pm','path',PACKAGE]),
    ('10-exit-info-before.txt', ['shell','dumpsys','activity','exit-info',PACKAGE]),
]
AFTER = [
    ('13-device-time-after.txt', ['shell','date']),
    ('14-exit-info-after.txt', ['shell','dumpsys','activity','exit-info',PACKAGE]),
]
SHARE_TEMPLATE = '''MINIMUM REDACTED EVIDENCE — fill in after reviewing the private originals

Phone manufacturer/model:
Android version:
Active WebView provider package/version:
Installed game version name/code:
Observed behaviour (closes, freezes, blank screen, or stays open):
Reproduction time as displayed on phone, including date/time zone:
Matching crash/exit reason if present (otherwise say none found):
Redacted contiguous log context ~30 seconds before/after reproduction:
  Keep complete exception / Caused by stacks and relevant PID/time context.
  Remove account names, messages, serials, unrelated apps and other private data.
Public installed signing-certificate SHA-256 (if independently available):
Capture errors or commands unsupported by this phone:

Do not send entire logs, APKs, private keys, passwords or device serials.
This template is not an automatic diagnosis or an automatic redaction tool.
'''


def authorized_devices(text):
    result = []
    for line in text.splitlines():
        fields = line.split()
        if len(fields) >= 2 and fields[1] == 'device':
            result.append(fields[0])
    return result


def select_device(text, requested=None):
    devices = authorized_devices(text)
    if requested:
        if requested not in devices:
            raise ValueError('The selected serial is not an authorized connected device.')
        return requested
    if len(devices) != 1:
        raise ValueError('Exactly one authorized device is required, or supply --serial. No app data was changed.')
    return devices[0]


class Collector:
    def __init__(self, adb, serial, output, runner=None):
        self.adb, self.serial, self.output, self.runner = adb, serial, Path(output), runner or subprocess.run
        self.status = []

    def command(self, args):
        return [self.adb, '-s', self.serial, *args]

    def capture(self, name, args):
        item = {'file': name, 'args': args, 'computerUtc': datetime.now(timezone.utc).isoformat()}
        try:
            result = self.runner(self.command(args), capture_output=True, text=True,
                                 encoding='utf-8', errors='replace', timeout=30, check=False)
            (self.output/name).write_text(result.stdout+'\n--- stderr ---\n'+result.stderr, encoding='utf-8')
            item['exitCode'] = result.returncode
        except (OSError, subprocess.TimeoutExpired) as error:
            item['error'] = type(error).__name__
            (self.output/name).write_text('Capture failed: '+str(error), encoding='utf-8')
        self.status.append(item)
        self.write_status()

    def write_status(self):
        # Serial is intentionally not copied into this index; raw logs may still contain it.
        (self.output/'capture-status.json').write_text(json.dumps({
            'package': PACKAGE, 'scope': 'read-only evidence; no diagnosis', 'commands': self.status
        }, indent=2)+'\n', encoding='utf-8')

    def snapshot(self):
        for name, args in SNAPSHOT:
            self.capture(name, args)
        (self.output/'SUMMARY-TO-SHARE.txt').write_text(SHARE_TEMPLATE, encoding='utf-8')

    def live(self, prompt=input, launcher=None):
        launcher = launcher or subprocess.Popen
        with (self.output/'11-live-logcat.txt').open('w', encoding='utf-8') as stdout, \
                (self.output/'11-live-logcat-errors.txt').open('w', encoding='utf-8') as stderr:
            process = launcher(self.command(['logcat','-b','main','-b','system','-b','crash','-v','threadtime']),
                               stdout=stdout, stderr=stderr)
            try:
                if process.poll() is not None:
                    raise RuntimeError('Live logcat exited early. Preserve the errors; do not change the installed app.')
                start = datetime.now(timezone.utc).isoformat()
                print('Open the ALREADY INSTALLED game manually ONCE. Wait for its outcome, then 10 seconds.')
                prompt('Press Enter here when done. Do not clear logs or restart the phone. ')
                (self.output/'12-reproduction-window.txt').write_text(
                    'Computer UTC start: '+start+'\nComputer UTC end: '+datetime.now(timezone.utc).isoformat()+
                    '\nRecord the phone-local observation time in SUMMARY-TO-SHARE.txt.\n', encoding='utf-8')
            finally:
                # Stop only this host-side logcat process. Never stop the app or device.
                if process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                    except subprocess.TimeoutExpired:
                        process.kill()
                        process.wait(timeout=5)
        for name, args in AFTER:
            self.capture(name, args)


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--adb', help='Path to the official adb executable (default: adjacent platform-tools or PATH)')
    parser.add_argument('--serial', help='Select an authorized device when more than one is connected; keep serial private')
    parser.add_argument('--output', help='New private output directory; must not already exist')
    parser.add_argument('--snapshot-only', action='store_true', help='Capture existing evidence only; no reproduction prompt')
    args = parser.parse_args(argv)
    executable = 'adb.exe' if sys.platform == 'win32' else 'adb'
    adjacent = Path(__file__).resolve().parent/'platform-tools'/executable
    adb = args.adb or (str(adjacent) if adjacent.is_file() else shutil.which(executable))
    if not adb:
        parser.error('adb not found. Extract official Google platform-tools beside this script, or use --adb.')
    try:
        listing = subprocess.run([adb, 'devices', '-l'], capture_output=True, text=True,
                                 encoding='utf-8', errors='replace', timeout=20, check=False)
        if listing.returncode != 0:
            raise ValueError('adb devices failed. Check the local SDK/cable/authorization; no game changes were requested.')
        serial = select_device(listing.stdout, args.serial)
        output = Path(args.output) if args.output else Path.home()/('LPC-PRIVATE-Evidence-'+datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ'))
        output.mkdir(parents=True, exist_ok=False)
        collector = Collector(adb, serial, output)
        print('PRIVATE evidence directory:', output)
        print('Read-only capture: no APK copying, installs, uninstalls, log clearing or automatic app launch.')
        collector.snapshot()
        if not args.snapshot_only:
            collector.live()
        print('Done. Read SUMMARY-TO-SHARE.txt and review/redact originals locally before sharing anything.')
        print('Do NOT upload the whole directory. Collection does not prove a crash cause or a fix.')
        if any(item.get('exitCode') != 0 for item in collector.status):
            print('Some captures failed or are unsupported. Preserve capture-status.json and report the errors.')
            return 2
        return 0
    except (ValueError, OSError, subprocess.TimeoutExpired, RuntimeError) as error:
        print('Collection stopped:', error, file=sys.stderr)
        return 1
    except KeyboardInterrupt:
        print('\nStopped. Preserve existing evidence; the game was not modified.', file=sys.stderr)
        return 130


if __name__ == '__main__':
    raise SystemExit(main())
