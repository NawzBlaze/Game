#!/usr/bin/env python3
"""Evidence inventory, not an assertion of complete human/code/art approval.
Runs read-only against source; writes only the requested report file.
"""
import argparse
import ast
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import struct
import subprocess
import wave

ROOT = Path(__file__).resolve().parents[1]


def collect():
    manifest = json.loads((ROOT / 'docs/release-assets.json').read_text())
    shipped = {a['file']: a for a in manifest['assets']}
    tree = ast.parse((ROOT / 'tools/build_release.py').read_text())
    runtime = next(ast.literal_eval(n.value) for n in tree.body if isinstance(n, ast.Assign)
                   and any(isinstance(t, ast.Name) and t.id == 'code' for t in n.targets))
    paths = subprocess.check_output(['git', 'ls-files', '-z', '--cached', '--others', '--exclude-standard'], cwd=ROOT).decode().split('\0')
    records, issues, duplicate = [], [], defaultdict(list)
    for rel in sorted(set(filter(None, paths))):
        if rel.startswith('docs/audits/') or rel == 'tools/audit_repository.py':
            continue  # The evidence must not recursively hash its own output.
        p = ROOT / rel
        if p.is_symlink() or not p.is_file():
            issues.append({'path': rel, 'issue': 'missing-or-symlink'})
            continue
        data = p.read_bytes()
        record = {'path': rel, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                  'coverage': 'inventory/hash only; no blanket manual approval'}
        asset_rel = rel.removeprefix('web/')
        if rel.startswith('web/assets/'):
            record['role'] = 'shipped-asset' if asset_rel in shipped else 'excluded-legacy-asset'
            duplicate[record['sha256']].append(rel)
            if asset_rel in shipped:
                meta = shipped[asset_rel]
                record.update(creator=meta['creator'], license=meta['license'], source=meta.get('mirror', meta.get('upstream')))
                record['manifestHashMatches'] = record['sha256'] == meta['sha256']
                if not record['manifestHashMatches']:
                    issues.append({'path': rel, 'issue': 'manifest-hash-mismatch'})
            if p.suffix.lower() == '.png':
                if data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
                    issues.append({'path': rel, 'issue': 'invalid-png-header'})
                else:
                    record['dimensions'] = list(struct.unpack('>II', data[16:24]))
            if p.suffix.lower() == '.ogg' and data[:4] != b'OggS':
                issues.append({'path': rel, 'issue': 'invalid-ogg-header'})
            if p.suffix.lower() == '.wav':
                try:
                    with wave.open(str(p)) as audio:
                        record['audio'] = {'channels': audio.getnchannels(), 'sampleRate': audio.getframerate(),
                                           'sampleBytes': audio.getsampwidth(), 'durationSeconds': round(audio.getnframes() / audio.getframerate(), 3)}
                except (wave.Error, EOFError) as error:
                    issues.append({'path': rel, 'issue': 'invalid-wave', 'detail': str(error)})
        elif rel.startswith('web/'):
            record['role'] = 'runtime-code' if asset_rel in runtime else 'excluded-web-source'
        elif rel.startswith('android/app/src/main/') or rel.endswith('.gradle'):
            record['role'] = 'android-source-or-build-config'
        elif rel.startswith('tools/'):
            record['role'] = 'tooling-review-required'  # Old art exporters are not executed.
        elif rel.startswith('tests/') or '/src/test/' in rel or '/src/androidTest/' in rel:
            record['role'] = 'test-or-test-evidence'
        else:
            record['role'] = 'documentation-or-project-config'
        if p.suffix == '.py':
            try:
                ast.parse(data, filename=rel)
                record['pythonSyntax'] = 'valid'
            except SyntaxError as error:
                record['pythonSyntax'] = 'invalid'
                issues.append({'path': rel, 'issue': 'python-syntax', 'line': error.lineno})
        records.append(record)
    present = {r['path'] for r in records}
    for rel in shipped:
        if 'web/' + rel not in present:
            issues.append({'path': 'web/' + rel, 'issue': 'missing-shipped-asset'})
    return {'scope': 'Complete file inventory and listed machine checks, NOT complete manual code/visual/audio/phone review',
            'version': json.loads((ROOT / 'package.json').read_text())['version'],
            'sourceHead': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
            'roles': dict(Counter(r['role'] for r in records)), 'fileCount': len(records),
            'shippedAssetCount': len(shipped), 'shippedAssetBytes': sum(r['bytes'] for r in records if r['role'] == 'shipped-asset'),
            'excludedLegacyBytes': sum(r['bytes'] for r in records if r['role'] == 'excluded-legacy-asset'),
            'issues': issues, 'byteIdenticalAssetGroups': [v for v in duplicate.values() if len(v) > 1],
            'files': records}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = collect()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: result[k] for k in ('version', 'fileCount', 'roles', 'shippedAssetCount', 'shippedAssetBytes', 'excludedLegacyBytes', 'issues')}, indent=2))
    return 1 if result['issues'] else 0


if __name__ == '__main__':
    raise SystemExit(main())
