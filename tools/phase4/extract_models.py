from pathlib import Path
import json,zipfile
root=Path('asset-sources/phase4')
configs=[('/tmp/lpc-nature.zip','glTF/',root/'nature', ['CommonTree_1','CommonTree_3','Pine_1','Bush_Common','Bush_Common_Flowers','Grass_Common_Tall','Flower_3_Group','Rock_Medium_1']),('/tmp/lpc-village.zip','Medieval Village MegaKit[Standard]/glTF/',root/'village',['Prop_Crate'])]
for path,prefix,dest,names in configs:
 z=zipfile.ZipFile(path);(dest/'gltf').mkdir(parents=True,exist_ok=True)
 for name in names:
  fn=prefix+name+'.gltf';data=z.read(fn); (dest/'gltf'/(name+'.gltf')).write_bytes(data);model=json.loads(data)
  for item in model.get('images',[])+model.get('buffers',[]):
   uri=item.get('uri','')
   if uri and not uri.startswith('data:'):
    target=dest/'gltf'/uri;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(prefix+uri))
 for n in z.namelist():
  if n.endswith('License_Standard.txt'):(dest/'LICENSE.txt').write_bytes(z.read(n));break
 print(dest,'models:',names)
