#!/usr/bin/env python3
"""Prepare Classic board sprites from credited Glitch, styloo and LudicArts artwork."""
from PIL import Image,ImageEnhance
from pathlib import Path
base=Path(__file__).resolve().parents[1]/'web/assets'; art=base/'painterly';out=base/'classic-painted';out.mkdir(exist_ok=True)
pig=Image.open(art/'pip-classic-original-walk.png').convert('RGBA');dog=Image.open(art/'dog-walk.png').convert('RGBA')
for d in ['left','right','up','down']:
 for j,n in enumerate([0,4,8,14]):
  im=pig.crop(((n%8)*87,(n//8)*64,(n%8+1)*87,(n//8+1)*64));
  if d=='left':im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  im.save(out/f'person-{d}-{j}.png',optimize=True)
 for j,n in enumerate([0,6,12]):
  im=dog.crop((n*160,0,(n+1)*160,107));
  if d=='left':im=im.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
  im.save(out/f'dog-{d}-{j}.png',optimize=True)
# The original artist's door, cropped from the Glitch stone cottage.
im=Image.open(art/'cottage-stone.png').crop((125,207,298,452));im.thumbnail((130,190),Image.Resampling.LANCZOS);im.save(out/'door.png',optimize=True)
# Artist-authored LudicArts objects, saturation lowered to better match the board.
src=Path(__file__).resolve().parent/'source-art/ludic'
for num,name in [(14,'shrub'),(21,'tree'),(13,'autumn-bush'),(20,'autumn-tree')]:
 im=Image.open(src/f'Object_{num}.png').convert('RGBA');im=im.crop(im.getbbox());a=im.getchannel('A');col=ImageEnhance.Color(im.convert('RGB')).enhance(.7);col.putalpha(a);col.thumbnail((150,180),Image.Resampling.LANCZOS);col.save(out/(name+'.png'),optimize=True)
