#!/usr/bin/env python3
"""Prepare the credited sea, hill and autumn background layers (Pillow, NumPy)."""
from pathlib import Path
from PIL import Image,ImageEnhance
import numpy as np
root=Path(__file__).resolve().parents[1];out=root/'web/assets/painterly';sources=root/'tools/source-art'
im=Image.open(sources/'tigitalart/seaview_sea.png').convert('RGBA').crop((0,664,3840,1380)).resize((1920,358),Image.Resampling.LANCZOS)
a=im.getchannel('A');im=ImageEnhance.Color(im.convert('RGB')).enhance(.60);im=ImageEnhance.Brightness(im).enhance(1.18);im.putalpha(a);im.save(out/'harbour-sea.png',optimize=True)
im=Image.open(sources/'kalponic/mountain-1.png').convert('RGBA').crop((0,420,1920,760)).resize((1600,283),Image.Resampling.LANCZOS);im.save(out/'hill-mountains.png',optimize=True)
for src,dst in [('distant-trees','autumn-trees'),('distant-hills','autumn-hills')]:
 im=Image.open(out/(src+'.png')).convert('RGBA');alpha=im.getchannel('A');hsv=np.array(im.convert('RGB').convert('HSV'));m=(hsv[:,:,0]>=35)&(hsv[:,:,0]<=110)&(hsv[:,:,1]>30);hsv[:,:,0][m]=18+(hsv[:,:,0][m].astype('int')-35)//10;hsv[:,:,1][m]=np.minimum(255,(hsv[:,:,1][m].astype('int')*1.1)).astype('uint8');im=Image.fromarray(hsv,'HSV').convert('RGB').convert('RGBA');im.putalpha(alpha);im.save(out/(dst+'.png'),optimize=True)
