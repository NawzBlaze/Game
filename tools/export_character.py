"""Match Kenney's named Female PNG poses to SVG sheet cells and export at 4×."""
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
import cairosvg
from PIL import Image, ImageChops
r=Path(__file__).resolve().parents[1]
with ZipFile(r/'asset-sources/kenney-platformer-characters.zip') as z:
    original=Image.open(BytesIO(z.read('PNG/Female/female_tilesheet.png'))).convert('RGBA')
    vector=Image.open(BytesIO(cairosvg.svg2png(bytestring=z.read('Vector/female_vector.svg'),output_width=2880,output_height=1320))).convert('RGBA')
    for name in ['idle','jump','fall','hurt','cheer1','cheer2','walk1','walk2','skid']:
        target=Image.open(BytesIO(z.read(f'PNG/Female/Poses/female_{name}.png'))).convert('RGBA')
        found=[]
        for y in range(3):
            for x in range(9):
                if ImageChops.difference(target,original.crop((x*80,y*110,(x+1)*80,(y+1)*110))).getbbox() is None:found.append((x,y))
        assert len(found)==1,(name,found)
        x,y=found[0]; print(name,x,y)
        vector.crop((x*320,y*440,(x+1)*320,(y+1)*440)).save(r/f'web/assets/adventure/pip-{name}.png')
