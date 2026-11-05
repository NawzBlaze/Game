#!/usr/bin/env python3
"""Compose the launcher icon from the credited Glitch cottage, pig and parcel."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
base=Path(__file__).resolve().parents[1]; src=base/'web/assets/painterly'; im=Image.new('RGBA',(512,512),(196,226,216,255));d=ImageDraw.Draw(im)
# A quiet warm-green backdrop keeps the original game art legible at launcher size.
for y in range(512):
 t=y/511;d.line((0,y,511,y),fill=(round(195+23*t),round(225+6*t),round(218-28*t),255))
d.ellipse((-90,300,600,700), fill=(129,177,128,255));d.ellipse((-150,386,670,840),fill=(82,139,101,255))
def paste(name,box):
 x,y,w,h=box; art=Image.open(src/name).convert('RGBA');scale=min(w/art.width,h/art.height);art=art.resize((round(art.width*scale),round(art.height*scale)),Image.Resampling.LANCZOS);im.alpha_composite(art,(int(x+(w-art.width)/2),int(y+h-art.height)))
paste('cottage-stone.png',(143,30,305,342));paste('pip-idle.png',(15,260,282,206));paste('parcel.png',(293,332,130,115))
im.convert('RGB').save(base/'android/app/src/main/res/drawable/ic_launcher.png',optimize=True)
