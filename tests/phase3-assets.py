#!/usr/bin/env python3
"""Integrity and pixel-geometry checks for the original Phase 3 PNG family."""
from pathlib import Path
from PIL import Image
from hashlib import sha256
p=Path(__file__).resolve().parents[1]/'web/assets/phase3-harbour'
for name in ('pig','dog','player','adventurer'):
    im=Image.open(p/f'{name}-sheet.png').convert('RGBA')
    w,h=im.width//8,im.height//4
    assert im.width==w*8 and im.height==h*4
    for row in range(4):
        frames=[im.crop((f*w,row*h,(f+1)*w,(row+1)*h)) for f in range(8)]
        assert all(frame.getpixel((0,0))[3]==0 for frame in frames),(name,row,'transparency')
        distinct=len({sha256(frame.tobytes()).digest() for frame in frames})
        assert distinct>=4,(name,row,'duplicate frames',distinct)
        # Grounded rows should stay within 1.5 art units of their nominal foot position.
        if row in (0,1):
            bottoms=[frame.getchannel('A').getbbox()[3] for frame in frames]
            assert max(bottoms)-min(bottoms)<=3,(name,row,'foot drift',bottoms)
    print('PASS',name,'transparent 8×4 sheet; four distinct frames or more in each state; grounded foot stability')
for name in ('crate','terrain-1','terrain-2','terrain-3'):
    im=Image.open(p/f'{name}.png').convert('RGBA')
    assert im.getchannel('A').getbbox()[1]==0,(name,'top must meet collision plane')
bridge=Image.open(p/'bridge.png').convert('RGBA')
# Bridge drawn 3 world units above the plane at 24 world units high.
top=bridge.getchannel('A').getbbox()[1]*24/bridge.height-3
assert abs(top)<=3,('bridge top',top)
print('PASS terrain and crate collision tops; bridge top offset',round(top,2),'world units')

