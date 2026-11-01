"""Prepare inspected CC0 Glitch source art for the phone-scale storybook pass.
Input: Glitch Environments PNG archive by Tiny Speck, CC0 1.0.
Source: https://opengameart.org/content/glitch-background-assets
"""
from pathlib import Path
from zipfile import ZipFile
from io import BytesIO
from PIL import Image
import argparse

parser = argparse.ArgumentParser()
parser.add_argument('archive', help='Glitch-Environments-PNGs.zip')
parser.add_argument('--output', default='web/assets/painterly')
a = parser.parse_args()
root=Path(a.output); root.mkdir(parents=True, exist_ok=True)
items = {
 'storybook-platform-grass.png':('glitch-groddle-pngs/groddle/floating_platform_grass_02_0.png',(612,252)),
 'storybook-platform-wood.png':('glitch-groddle-pngs/groddle/floating_platform_trunk_01_0.png',(442,160)),
 'storybook-platform-stone.png':('glitch-alpine-pngs/alpine_landscape/platform_horizontal_ledge_mountaineering_01a_al1_0.png',(618,205)),
 'storybook-shrub-low.png':('glitch-alpine-pngs/alpine_landscape/mountain_flora_01c_al1_0.png',(297,93)),
 'storybook-shrub-round.png':('glitch-alpine-pngs/alpine_landscape/mountain_flora_01g_al1_0.png',(153,69)),
}
with ZipFile(a.archive) as z:
 for out,(source,max_size) in items.items():
  im=Image.open(BytesIO(z.read(source))).convert('RGBA'); im.thumbnail(max_size,Image.Resampling.LANCZOS)
  im.save(root/out,optimize=True)
  print(out,im.size,source)
