from pathlib import Path
from PIL import Image,ImageChops
for name in ['Pig','Pug']:
 src=Path('evidence/phase4/candidates')/('anim-'+name);out=Path('web/assets/phase4/animals');names=['idle']+[f'walk{i}' for i in range(8)]+[f'jump{i}' for i in range(8)];frames=[Image.open(src/(n+'.png')).convert('RGBA') for n in names];alpha=Image.new('L',frames[0].size,0)
 for f in frames:alpha=ImageChops.lighter(alpha,f.getchannel('A'))
 box=alpha.point(lambda v:255 if v>=3 else 0).getbbox();print(name,'fixed union crop',box)
 def convert(img):
  crop=img.crop(box);crop.thumbnail((238,174),Image.Resampling.LANCZOS);cell=Image.new('RGBA',(256,192));cell.alpha_composite(crop,((256-crop.width)//2,190-crop.height));return cell
 for action in ['idle','walk','jump']:
  count=1 if action=='idle' else 8; sheet=Image.new('RGBA',(256*count,192))
  for i in range(count):
   n='idle' if action=='idle' else f'{action}{i}';sheet.alpha_composite(convert(frames[names.index(n)]),(256*i,0))
  sheet.save(out/f'{name.lower()}-{action}.png',optimize=True)
