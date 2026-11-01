#!/usr/bin/env python3
"""Create route-book postcard crops from actual review-phones.js game captures.

Requires the 915x412 real-browser route captures; visuals retain their existing
third-party attribution in web/ASSET_CREDITS.txt. The crop omits the HUD.
"""
from pathlib import Path
from PIL import Image
source=Path('/home/user/screenshot-review/our-build')
out=Path(__file__).resolve().parents[1]/'web/assets/route-views'
out.mkdir(parents=True,exist_ok=True)
# Landmark centres were reviewed against the 24 gameplay screenshots. Keep the
# focal landmark right of the card's text without using fabricated scenery.
landmarks=[210,205,210,240,370,600,350,735,290,520,390,210,
           360,200,780,255,180,775,225,650,205,180,700,450]
for n in range(1,25):
    # Route 13 uses a real capture of the creator-art renderer in the WIP rebuild.
    root=Path(__file__).resolve().parents[1]
    route13_capture=root/'evidence/visual-rebuild/after/route-13-915x412.png'
    image_path=route13_capture if n==13 and route13_capture.exists() else source/f'route-{n:02}.png'
    im=Image.open(image_path).convert('RGB')
    if im.size!=(915,412):
        raise ValueError(f'Unexpected screenshot dimensions for route {n}: {im.size}')
    x=100 if n==13 and route13_capture.exists() else max(0,min(615,landmarks[n-1]-220))
    im.crop((x,140,x+300,306)).resize((360,199),Image.Resampling.LANCZOS).save(out/f'route-{n:02}.jpg',quality=78,optimize=True)
print('Wrote 24 in-game postcard crops to',out)
