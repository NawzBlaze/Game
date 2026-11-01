"""Regenerate dog animation frames from Audrey Vleugels' CC0 vector sheet; requires PyMuPDF."""
from pathlib import Path
from zipfile import ZipFile
import fitz as pymupdf
r=Path(__file__).resolve().parents[1]
with ZipFile(r/'asset-sources/neighborhood/audrey-doggy-graphics.zip') as z:source=z.read('Vector/Sheet.ai')
doc=pymupdf.open(stream=source,filetype='pdf');page=doc[0]
# Bounds on a 0.7-scale preview of the vector artboard.
for name,x0,x1 in [('dogBrown',382,437),('dogBrownBend',437,492),('dogBrownJump',492,548)]:
 clip=pymupdf.Rect(x0/.7,269/.7,x1/.7,321/.7)
 page.get_pixmap(matrix=pymupdf.Matrix(3,3),clip=clip,alpha=True).save(str(r/f'web/assets/adventure/{name}.png'))
