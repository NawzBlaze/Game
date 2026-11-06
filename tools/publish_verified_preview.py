#!/usr/bin/env python3
"""Manual-only publication of an already-tested, explicitly non-production APK."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess


def command(*args):
    return subprocess.check_output(list(args), text=True).strip()


def api(path):
    return json.loads(command('gh', 'api', path))


def validate_run(run, jobs, branch):
    if (run.get('conclusion') != 'success' or run.get('head_branch') != branch or
            run.get('path', '').split('@')[0] != '.github/workflows/android-build-device.yml'):
        raise ValueError('Only a successful native run on this session branch can be published.')
    required = {'build', 'emulator (33)', 'emulator (36)'}
    passed = {j['name'] for j in jobs if j.get('conclusion') == 'success'}
    if not required <= passed or any(j.get('conclusion') != 'success' for j in jobs):
        raise ValueError('Build and both emulator jobs must have succeeded.')
    if not re.fullmatch('[0-9a-f]{40}', run.get('head_sha', '')):
        raise ValueError('Invalid source SHA.')


def validate_files(folder, meta):
    filename = 'little-parcel-crew-' + meta['version'] + '-preview.apk'
    if not re.fullmatch(r'\d+\.\d+\.\d+-rc\.\d+', meta['version']):
        raise ValueError('This publisher only accepts explicitly labelled RC previews.')
    apk = folder / filename
    if apk.is_symlink() or not apk.is_file() or not 20_000_000 <= apk.stat().st_size <= 100_000_000:
        raise ValueError('Missing APK or finished APK outside 20–100 MB.')
    with apk.open('rb') as stream:
        digest = hashlib.file_digest(stream, 'sha256').hexdigest()
    expected = f'{digest}  {filename}'
    if (folder / 'SHA256SUMS.txt').read_text().strip() != expected:
        raise ValueError('Artifact checksum does not match APK bytes.')
    if digest != meta['apkSha256'] or apk.stat().st_size != meta['apkBytes']:
        raise ValueError('APK differs from the successful build annotations.')
    if (folder / 'SOURCE_COMMIT.txt').read_text().strip() != meta['source']:
        raise ValueError('Artifact source does not match the successful run.')
    return apk


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('action', choices=['validate', 'publish'])
    parser.add_argument('--run')
    parser.add_argument('--metadata', type=Path, required=True)
    parser.add_argument('--directory', type=Path)
    args = parser.parse_args()
    repo = os.environ['GITHUB_REPOSITORY']
    branch = os.environ['GITHUB_REF_NAME']
    if branch != 'arena/2ae7d624-game':
        raise ValueError('Publication must run on the fixed session branch.')
    if args.action == 'validate':
        if not re.fullmatch(r'\d+', args.run or ''):
            raise ValueError('Run ID must be numeric.')
        run = api(f'repos/{repo}/actions/runs/{args.run}')
        jobs = api(f'repos/{repo}/actions/runs/{args.run}/jobs?per_page=100')['jobs']
        validate_run(run, jobs, branch)
        source = run['head_sha']
        subprocess.run(['git', 'merge-base', '--is-ancestor', source, 'HEAD'], check=True)
        package = json.loads(command('git', 'show', source + ':package.json'))
        version = package['version']
        if not re.fullmatch(r'\d+\.\d+\.\d+-rc\.\d+', version):
            raise ValueError('Only RC previews can use this workflow.')
        build = next(j for j in jobs if j['name'] == 'build')
        annotations = api(build['check_run_url'] + '/annotations?per_page=100')
        sha_text = next(a['message'].strip() for a in annotations if a['title'] == 'Mobile preview APK SHA256')
        size = int(next(a['message'] for a in annotations if a['title'] == 'Mobile preview APK bytes'))
        match = re.fullmatch(r'([a-f0-9]{64})  little-parcel-crew-' + re.escape(version) + r'-preview\.apk', sha_text)
        if not match:
            raise ValueError('Build checksum annotation is missing or malformed.')
        args.metadata.write_text(json.dumps({'repository': repo, 'run': args.run, 'source': source,
                                            'version': version, 'apkSha256': match[1], 'apkBytes': size}, indent=2))
        print('Validated successful native build and both emulator jobs at', source)
    else:
        meta = json.loads(args.metadata.read_text())
        if meta['repository'] != repo:
            raise ValueError('Repository mismatch.')
        apk = validate_files(args.directory, meta)
        notes = args.directory / 'RELEASE_NOTES.md'
        notes.write_text(f'''# Little Parcel Crew {meta['version']} — test preview

**Pre-release, debug/test-signed APK. Not a finished production-approved release.**
Use a separate clean test device. Do not uninstall, clear data or overwrite the affected existing game.
Debug signing is not proof of safe upgrade compatibility; signing identities can differ between CI runs.

Offline Android game: 24 Adventure routes, 48 Classic puzzles, six specials, original licensed artwork/audio,
Android progress documents, compact route book, privacy/support and save/recovery fixes.

- Source: `{meta['source']}`
- Successful native build/API 33/API 36: https://github.com/{repo}/actions/runs/{meta['run']}
- APK bytes: {meta['apkBytes']:,}
- SHA-256: `{meta['apkSha256']}`

Download the APK below. SHA256SUMS.txt and SOURCE_COMMIT.txt bind this exact binary.
Production signing, affected-phone testing, actual document-provider round-trip and human visual/gameplay/accessibility approval remain open.
''')
        subprocess.run(['gh', 'release', 'create', 'v' + meta['version'], '--repo', repo,
                        '--target', meta['source'], '--prerelease', '--title',
                        'Little Parcel Crew ' + meta['version'] + ' — Test Preview',
                        '--notes-file', str(notes), str(apk), str(args.directory / 'SHA256SUMS.txt'),
                        str(args.directory / 'SOURCE_COMMIT.txt'), str(args.directory / 'READ_ME_FIRST.txt')], check=True)


if __name__ == '__main__':
    main()
