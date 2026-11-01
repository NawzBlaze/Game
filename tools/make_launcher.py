"""Recreate launcher icon by composing credited CC0 sprites; requires Pillow."""
from PIL import Image, ImageDraw
from pathlib import Path
r=Path(__file__).resolve().parents[1];a=r/'web/assets/adventure';S=1024
im=Image.new('RGBA',(S,S),'#b6e2df');d=ImageDraw.Draw(im)
# Clean landscape rather than tiny detailed buildings, designed to read at launcher size.
d.ellipse((-240,355,1260,1370),fill='#aad1ad');d.ellipse((-210,585,1220,1450),fill='#e6ca92')
d.ellipse((760,100,866,206),fill='#fff4d0')
def paste(name,box):
 img=Image.open(name).convert('RGBA');img=img.crop(img.getbbox());scale=min(box[2]/img.width,box[3]/img.height);img=img.resize((round(img.width*scale),round(img.height*scale)),Image.Resampling.LANCZOS);im.alpha_composite(img,(box[0]+(box[2]-img.width)//2,box[1]+box[3]-img.height))
paste(a/'pip-idle.png',(150,220,415,600))
paste(a/'dogBrown.png',(570,515,260,300))
paste(r/'web/assets/neighborhood/parcel.png',(447,662,165,165))
d=ImageDraw.Draw(im);d.rounded_rectangle((17,17,S-17,S-17),radius=175,outline='#fff8e9',width=18)
im.resize((512,512),Image.Resampling.LANCZOS).convert('RGB').save(r/'android/app/src/main/res/drawable/ic_launcher.png')
