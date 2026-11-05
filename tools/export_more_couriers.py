"""Regenerate optional couriers from Kenney's CC0 vector art. Requires CairoSVG and Pillow."""
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
import cairosvg
from PIL import Image,ImageChops
root=Path(__file__).resolve().parents[1]
with ZipFile(root/'asset-sources/kenney-platformer-characters.zip') as z:
 for folder,name in [('Player','player'),('Adventurer','adventurer')]:
  sheet=Image.open(BytesIO(z.read(f'PNG/{folder}/{name}_tilesheet.png'))).convert('RGBA')
  svg=z.read(f'Vector/{name}_vector.svg'); hi=Image.open(BytesIO(cairosvg.svg2png(bytestring=svg,output_width=2880,output_height=1320))).convert('RGBA')
  for pose in ['idle','walk1','walk2','jump','fall','hurt','cheer1','cheer2','skid','talk']:
   im=Image.open(BytesIO(z.read(f'PNG/{folder}/Poses/{name}_{pose}.png'))).convert('RGBA')
   found=False
   for y in range(3):
    for x in range(9):
     if ImageChops.difference(im,sheet.crop((x*80,y*110,(x+1)*80,(y+1)*110))).getbbox() is None:
      hi.crop((x*320,y*440,(x+1)*320,(y+1)*440)).save(root/f'web/assets/adventure/{name}-{pose}.png');found=True
   assert found,(name,pose)
