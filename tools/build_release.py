#!/usr/bin/env python3
"""Reproducible, allowlisted web RC. Does not grant Android/legal/device approval."""
from pathlib import Path
import hashlib,json,re,shutil,zipfile
ROOT=Path(__file__).resolve().parent.parent
WEB=ROOT/'web'
OUT=ROOT/'dist'
version=json.loads((ROOT/'package.json').read_text())['version']
manifest=json.loads((ROOT/'docs/release-assets.json').read_text())
code=['index.html','style.css','adventure.css','dispatch.css','levels.js','game.js','adventure.js','route-experience.js','courier-mastery.js','parcel-campaign.js','parcel-renderer.js','presentation-rules.js','asset-bounds.js','compatibility.js','save-store.js','progress-panel.js','runtime-config.js','CREDITS.txt']
def digest(data):return hashlib.sha256(data).hexdigest()
files={}
def read(rel):
    p=WEB/rel
    if p.is_symlink() or not p.is_file() or WEB not in p.resolve().parents:raise SystemExit('Unsafe/missing source: '+rel)
    return p.read_bytes()
for asset in manifest['assets']:
    rel=asset['file']
    if not rel.startswith('assets/') or '..' in Path(rel).parts:raise SystemExit('Unsafe manifest path')
    data=read(rel)
    if digest(data)!=asset['sha256']:raise SystemExit('Asset integrity failure: '+rel)
    if asset['license'] not in ('CC0-1.0','OFL-1.1'):raise SystemExit('Unreviewed licence: '+rel)
    if rel in files:raise SystemExit('Duplicate asset: '+rel)
    files[rel]=data
for rel in code:
    data=read(rel)
    if any(old in data for old in [b'assets/painterly/',b'assets/classic-painted/',b'assets/neighborhood/',b'assets/phase4/',b'assets/audio-refresh/',b'assets/visual-rebuild/']):raise SystemExit('Legacy dependency: '+rel)
    files[rel]=data
files['runtime-config.js']=("window.ParcelConfig = Object.freeze("+json.dumps({'testHooks':False,'version':version},separators=(',',':'))+");\n").encode()
# All literal static asset/code dependencies must exist in the allowlist.
for rel,data in list(files.items()):
    if Path(rel).suffix not in ('.html','.css','.js'):continue
    text=data.decode()
    for dep in re.findall(r'''(?:src|href)=["']([^"']+)["']|url\(['"]?([^)'"\s]+)''',text):
        path=next(v for v in dep if v)
        if '${' in path or path.startswith(('data:','#','http:','https:')):continue
        if path.endswith('/') and any(f.startswith(path) for f in files):continue
        if path not in files:raise SystemExit('Missing static dependency: '+path+' in '+rel)
files['asset-manifest.json']=(json.dumps(manifest,indent=2)+'\n').encode()
policy="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'"
files['_headers']=("/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  Permissions-Policy: camera=(), microphone=(), geolocation=()\n  Content-Security-Policy: "+policy+"\n  Cache-Control: no-cache\n/assets/*\n  Cache-Control: public, max-age=3600, must-revalidate\n").encode()
checks={rel:digest(data) for rel,data in sorted(files.items())}
files['build-manifest.json']=(json.dumps({'version':version,'kind':'release-candidate','testHooks':False,'files':checks},indent=2)+'\n').encode()
# Write only after every input has passed validation. Never remove the repo root.
stage=OUT/'web'
if stage.exists():shutil.rmtree(stage)
for rel,data in sorted(files.items()):
    p=stage/rel;p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(data)
archive=OUT/f'little-parcel-crew-{version}.zip'
with zipfile.ZipFile(archive,'w',zipfile.ZIP_DEFLATED,compresslevel=9) as z:
    for rel,data in sorted(files.items()):
        info=zipfile.ZipInfo(rel,date_time=(2026,1,1,0,0,0));info.compress_type=zipfile.ZIP_DEFLATED;info.external_attr=0o100644<<16
        z.writestr(info,data)
with zipfile.ZipFile(archive) as z:
    assert z.testzip() is None
    assert len(z.namelist())==len(files)
    for rel,data in files.items():assert z.read(rel)==data
(OUT/'SHA256SUMS.txt').write_text(digest(archive.read_bytes())+'  '+archive.name+'\n')
print(f'Validated {len(manifest["assets"])} original licensed asset files; packaged {len(files)} files.')
print(f'{archive.relative_to(ROOT)} ({archive.stat().st_size:,} bytes)')
print('SHA-256:',digest(archive.read_bytes()))
print('WEB RELEASE CANDIDATE ONLY: physical-device, signing, human QA and owner approval still required.')
