#!/usr/bin/env python3
"""Verify that a built APK contains the exact same web files as the preview.

This checks file parity, not signing, installability, runtime behavior or safety.
"""
import argparse
import hashlib
import sys
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def compare(web: Path, apk: Path):
    files = {p.relative_to(web).as_posix(): p for p in web.rglob('*') if p.is_file()}
    missing, changed, extra = [], [], []
    with zipfile.ZipFile(apk) as archive:
        packaged = {n[len('assets/'):]: n for n in archive.namelist()
                    if n.startswith('assets/') and not n.endswith('/')}
        for name, path in sorted(files.items()):
            if name not in packaged:
                missing.append(name)
            elif hashlib.sha256(path.read_bytes()).digest() != hashlib.sha256(archive.read(packaged[name])).digest():
                changed.append(name)
        extra = sorted(set(packaged) - set(files))
    return len(files), missing, changed, extra


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('apk', type=Path, help='APK file to check (do not install an untrusted APK)')
    parser.add_argument('--web', type=Path, default=ROOT / 'web', help='web root')
    args = parser.parse_args()
    if not args.web.is_dir() or not (args.web / 'index.html').is_file():
        parser.error('Web root is missing or does not contain index.html')
    try:
        count, missing, changed, extra = compare(args.web, args.apk)
    except (OSError, zipfile.BadZipFile) as exc:
        print(f'ERROR: cannot read APK: {exc}', file=sys.stderr)
        return 2
    print(f'Compared {count} web files with {args.apk}')
    for label, items in [('Missing from APK', missing), ('Different bytes', changed), ('Extra APK assets', extra)]:
        if items:
            print(f'{label} ({len(items)}):')
            for item in items:
                print(f'  {item}')
    if missing or changed or extra:
        print('FAIL: web preview and APK assets do not match')
        return 1
    print('PASS: all APK web assets match the current web files byte-for-byte')
    print('Note: this does not test signing, installation, Android behavior, or game quality.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
