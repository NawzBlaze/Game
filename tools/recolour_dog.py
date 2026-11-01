"""Warm recolour of Audrey Vleugels' CC0 dog frames, to match courier palette."""
from PIL import Image
from pathlib import Path
r=Path(__file__).resolve().parents[1]
for src in (r/'asset-sources/derived-dog').glob('dogBrown*.png'):
 im=Image.open(src).convert('RGBA')
 data=[]
 for red,green,blue,alpha in im.getdata():
  if alpha and 7<=red<=35 and green<5 and blue<5: data.append((150+min(red,30),76+min(red,30)//2,45+min(red,30)//2,alpha))
  elif alpha and 180<=red<=220 and 180<=green<=220 and 150<=blue<=190: data.append((246,215,171,alpha))
  else: data.append((red,green,blue,alpha))
 im.putdata(data);im.save(r/'web/assets/adventure'/src.name)
