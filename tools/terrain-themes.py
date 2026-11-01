from PIL import Image
from pathlib import Path
import colorsys
p=Path(__file__).resolve().parents[1]/'web/assets/painterly'
# Adaptations of LudicArts CC-BY 3.0 ground/platform: all textures retained;
# selectively tint the fluorescent grass, leaving the original earth detail intact.
variants={'garden':(0.285,.68,.87),'market':(.255,.57,.82),'autumn':(.105,.62,.82),'harbour':(.27,.46,.78),'hill':(.22,.56,.84)}
for name in ('ground','platform'):
 original=Image.open(p/(name+'.png')).convert('RGBA')
 for theme,(hue,sat,val) in variants.items():
  img=original.copy(); pixels=img.load()
  for y in range(img.height):
   for x in range(img.width):
    r,g,b,a=pixels[x,y]
    if a==0: continue
    h,s,v=colorsys.rgb_to_hsv(r/255,g/255,b/255)
    if .16<h<.36 and s>.25 and g>r and g>b:
     # Fade the tint into brown rocks; do not affect transparent pixels.
     strength=min(1.0,max(0.0,(s-.25)*4))
     nr,ng,nb=colorsys.hsv_to_rgb(hue,s*sat,min(1,v*val))
     pixels[x,y]=(round(r*(1-strength)+nr*255*strength),round(g*(1-strength)+ng*255*strength),round(b*(1-strength)+nb*255*strength),a)
  img.save(p/f'{name}-{theme}.png',optimize=True)
