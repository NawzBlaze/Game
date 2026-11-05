#!/usr/bin/env python3
"""Crop/tint existing CC0 Glitch sprites; crop a CC-BY LudicArts flower.
Sources and adaptations in web/assets/painterly/ATTRIBUTION.txt.
"""
from pathlib import Path
from PIL import Image
import colorsys
out=Path(__file__).resolve().parent.parent/'web/assets/painterly'
src=Image.open(out/'pip-walk-sheet.png').convert('RGBA')
assert src.size==(696,192)
def brown(r,g,b):
 return r>35 and r>g*1.10 and g>b*1.12 and r>b*1.38

def recolour(im,bag,hat):
 im=im.copy();p=im.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=p[x,y];fx=x%87;fy=y%64
   isbag=13<=fx<46 and 18<=fy<51
   ishat=28<=fx<81 and fy<24
   target=({'mint':.45,'berry':.96}.get(bag) if isbag else (.58 if hat=='cap' and ishat else None))
   if a and target is not None and brown(r,g,b):
    hh,ss,vv=colorsys.rgb_to_hsv(r/255,g/255,b/255);ss=min(.62,max(.34,ss));r2,g2,b2=colorsys.hsv_to_rgb(target,ss,vv);p[x,y]=(round(r2*255),round(g2*255),round(b2*255),a)
 return im
for bag in ['classic','mint','berry']:
 for hat in ['original','cap']:
  sheet=recolour(src,bag,hat);sheet.save(out/f'pip-{bag}-{hat}-walk.png',optimize=True)
  sheet.crop((0,0,87,64)).save(out/f'pip-{bag}-{hat}-idle.png',optimize=True)
# Isolated pieces from the existing Glitch pig sprite, for the other couriers.
frame=src.crop((0,0,87,64))
def extract(rect):
 im=frame.crop(rect);p=im.load()
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=p[x,y]
   if not brown(r,g,b):p[x,y]=(0,0,0,0)
 return im.crop(im.getbbox())
cap=extract((28,1,81,23));pixels=cap.load()
for y in range(cap.height):
 for x in range(cap.width):
  r,g,b,a=pixels[x,y]
  if a:
   _,ss,vv=colorsys.rgb_to_hsv(r/255,g/255,b/255);rr,gg,bb=colorsys.hsv_to_rgb(.58,min(.62,max(.34,ss)),vv);pixels[x,y]=(round(rr*255),round(gg*255),round(bb*255),a)
cap.save(out/'glitch-hat.png',optimize=True)
bag=extract((14,19,44,50))
for n,hue in [('classic',None),('mint',.45),('berry',.96)]:
 im=bag.copy();p=im.load()
 if hue is not None:
  for y in range(im.height):
   for x in range(im.width):
    r,g,b,a=p[x,y]
    if a:
     _,ss,vv=colorsys.rgb_to_hsv(r/255,g/255,b/255);rr,gg,bb=colorsys.hsv_to_rgb(hue,min(.62,max(.34,ss)),vv);p[x,y]=(round(rr*255),round(gg*255),round(bb*255),a)
 im.save(out/f'glitch-bag-{n}.png',optimize=True)
flower=Image.open(Path(__file__).resolve().parent/'source-art/ludic/Object_1.png').convert('RGBA').crop((91,144,170,215));flower.thumbnail((70,70),Image.Resampling.LANCZOS);flower.save(out/'flower-pin.png',optimize=True)
