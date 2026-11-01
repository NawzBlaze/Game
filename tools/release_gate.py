#!/usr/bin/env python3
"""Fail closed until automation AND artifact-bound human/device evidence exist."""
from pathlib import Path
import json,subprocess,sys
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(root/'tools/build_release.py')],check=True)
qa_path=root/'dist/qa-report.json'
qa=json.loads(qa_path.read_text()) if qa_path.exists() else {}
approval=json.loads((root/'docs/release-approval.json').read_text())
version=json.loads((root/'package.json').read_text())['version']
sha=(root/'dist/SHA256SUMS.txt').read_text().split()[0]
blockers=[]
if qa.get('passed') is not True or qa.get('version')!=version or qa.get('artifactSha256')!=sha:blockers.append('Run the complete automated verification against this exact artifact.')
if approval.get('version')!=version or approval.get('artifactSha256')!=sha:blockers.append('Human approvals are not bound to this exact release artifact.')
scopes=['web'] if '--web' in sys.argv else ['web','android']
for scope in scopes:
    for name,item in approval[scope].items():
        if item.get('approved') is not True or not item.get('evidence','').strip():blockers.append(scope+': '+name)
if blockers:
    print('\nPRODUCTION GATE: BLOCKED')
    for item in blockers:print(' -',item)
    raise SystemExit(1)
print('Recorded approvals and automated checks satisfy the '+','.join(scopes)+' gate.')
print('This process checks evidence records, not their truth; owner authorization is still required before publishing.')
