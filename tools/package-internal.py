#!/usr/bin/env python3
# Recoverable INTERNAL package only: preserve the 0.16.1 native dex/resources;
# replace web assets and patch binary manifest version. The result is unsigned.
from pathlib import Path
import struct,zipfile
root=Path('/home/user');base=root/'google_drive/Little-Parcel-Crew-0.16.1-Startup-Hotfix-TEST.apk';web=root/'little-parcel-crew-worlds/web';dst=root/'art-review-2026/internal-unsigned.apk'
with zipfile.ZipFile(base) as zin,zipfile.ZipFile(dst,'w',allowZip64=True) as zout:
 seen=set()
 for info in zin.infolist():
  n=info.filename
  if n in ('META-INF/CERT.SF','META-INF/CERT.RSA','META-INF/MANIFEST.MF'):continue
  data=zin.read(n)
  if n=='AndroidManifest.xml':
   d=bytearray(data);ids=[];pos=8;patched=0
   while pos<len(d):
    typ,hs,sz=struct.unpack_from('<HHI',d,pos)
    if not sz:raise ValueError('zero chunk')
    if typ==0x180: ids=list(struct.unpack_from('<%dI'%((sz-hs)//4),d,pos+hs))
    if typ==0x102:
     _,name,start,size,count,*_=struct.unpack_from('<IIHHHHHH',d,pos+16)
     for i in range(count):
      a=pos+16+start+i*size;ns,nm,raw,vsize,zero,dt,value=struct.unpack_from('<IIIHBBI',d,a)
      if nm<len(ids) and ids[nm]==0x0101021b:
       if value!=17 or dt!=16:raise ValueError('unexpected existing code')
       struct.pack_into('<I',d,a+16,18);patched+=1
    pos+=sz
   old='0.16.1-hotfix'.encode('utf-16le');new='0.17.0-review'.encode('utf-16le')
   if patched!=1 or d.count(old)!=1 or len(old)!=len(new):raise ValueError('manifest version mismatch')
   d=d.replace(old,new);data=bytes(d)
  elif n.startswith('assets/'):
   path=web/n[len('assets/'):]
   if path.is_file():data=path.read_bytes();seen.add(n)
  zout.writestr(info,data)
 for f in sorted(web.rglob('*')):
  if not f.is_file():continue
  n='assets/'+f.relative_to(web).as_posix()
  if n not in seen:
   info=zipfile.ZipInfo(n,(1981,1,1,1,1,0));info.compress_type=zipfile.ZIP_STORED if f.suffix.lower() in ('.png','.jpg','.ogg') else zipfile.ZIP_DEFLATED
   zout.writestr(info,f.read_bytes())
print('Unsigned internal APK',dst,dst.stat().st_size)
