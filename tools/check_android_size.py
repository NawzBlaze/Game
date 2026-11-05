#!/usr/bin/env python3
"""Enforce the user's 100 MB ceiling on finished Android APK/AAB files.
Size verification does not establish signing, safety, or store readiness.
"""
import argparse
from pathlib import Path
import sys

MAX_BYTES = 100_000_000  # Decimal MB; stricter than 100 MiB.


def check(paths):
    found = []
    for value in paths:
        root = Path(value)
        if root.is_symlink() or not root.exists():
            raise ValueError(f'Missing or unsafe artifact path: {root}')
        candidates = [root] if root.is_file() else sorted(root.rglob('*'))
        group = [p for p in candidates if p.suffix.lower() in ('.apk', '.aab')]
        if not group:
            raise ValueError(f'No APK/AAB artifacts found in {root}')
        for path in group:
            if path.is_symlink() or not path.is_file():
                raise ValueError(f'Unsafe artifact: {path}')
            size = path.stat().st_size
            if size <= 0 or size > MAX_BYTES:
                raise ValueError(f'{path}: {size:,} bytes; must be 1–{MAX_BYTES:,} bytes')
            found.append((path, size))
    if not found:
        raise ValueError('No artifacts supplied')
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('paths', nargs='+', type=Path)
    args = parser.parse_args()
    try:
        for path, size in check(args.paths):
            print(f'PASS {path}: {size:,} bytes ({size / 1_000_000:.2f} MB), maximum 100 MB')
    except (ValueError, OSError) as error:
        print(f'Android size gate FAILED: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
