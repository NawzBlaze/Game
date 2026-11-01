from PIL import Image,ImageChops,ImageEnhance
from pathlib import Path
src=Path('/home/user/art-review-2026/groddle/groddle_png'); out=Path('/home/user/little-parcel-crew-worlds/web/assets/painterly')
# A centre crop removes rounded end caps. Crossfade the outer quarter into the
# opposite edge so that repeats do not produce obvious vertical joins.
def seamless(im,w,h):
 im=im.convert('RGBA'); iw,ih=im.size
 crop=im.crop((int(iw*.2),0,int(iw*.8),ih)).resize((w,h),Image.Resampling.LANCZOS)
 n=w//4; px=crop.load()
 for x in range(n):
  t=x/n
  for y in range(h):
   a=px[x,y]; b=px[w-n+x,y]
   mid=tuple(round((u+v)/2) for u,v in zip(a,b))
   px[x,y]=tuple(round(m*(1-t)+v*t) for m,v in zip(mid,a))
   px[w-n+x,y]=tuple(round(v*(1-t)+m*t) for m,v in zip(b,mid))
 return crop
soil=seamless(Image.open(src/'dirt_crosssection_short.png'),256,110)
grass=seamless(Image.open(src/'alakol_grass_top.png'),256,18)
for name,color in [('garden',(1,1,1)),('market',(.92,.91,.87)),('autumn',(1.04,.93,.79)),('harbour',(.86,.88,.86)),('hill',(.97,.96,.84))]:
 def tint(im):
  im=im.copy();r,g,b,a=im.split();r=r.point(lambda v:min(255,round(v*color[0])));g=g.point(lambda v:min(255,round(v*color[1])));b=b.point(lambda v:min(255,round(v*color[2])));return Image.merge('RGBA',(r,g,b,a))
 tint(soil).save(out/f'street-soil-{name}.png',optimize=True);tint(grass).save(out/f'street-top-{name}.png',optimize=True)
