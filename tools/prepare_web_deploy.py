#!/usr/bin/env python3
"""Compatibility entrypoint: always use the audited allowlist, never zip all web/."""
from pathlib import Path
import subprocess,sys,json,shutil
root=Path(__file__).resolve().parent.parent
subprocess.run([sys.executable,str(root/'tools/build_release.py')],check=True)
if len(sys.argv)>1:
    version=json.loads((root/'package.json').read_text())['version']
    dest=Path(sys.argv[1]).resolve();dest.parent.mkdir(parents=True,exist_ok=True)
    shutil.copyfile(root/'dist'/f'little-parcel-crew-{version}.zip',dest)
    print('Copied validated release candidate to',dest)
