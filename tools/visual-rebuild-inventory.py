#!/usr/bin/env python3
"""Inventory packaged assets without assuming that unverified files are cleared."""
from pathlib import Path
import csv,hashlib
from PIL import Image
root=Path('web/assets'); out=Path('evidence/visual-rebuild/asset-inventory.csv');out.parent.mkdir(parents=True,exist_ok=True)
with out.open('w',newline='') as f:
 w=csv.writer(f);w.writerow(['path','bytes','sha256','dimensions','audit_status'])
 for p in sorted(root.rglob('*')):
  if not p.is_file():continue
  try:
   with Image.open(p) as im:size=f'{im.width}x{im.height}'
  except Exception:size=''
  status='new font: verified OFL 1.1' if p.name=='Nunito.ttf' else ('OFL notice for new font' if p.name=='OFL.txt' and 'visual-rebuild' in p.parts else 'legacy: individual provenance/production audit needed')
  w.writerow([str(p),p.stat().st_size,hashlib.sha256(p.read_bytes()).hexdigest(),size,status])
print('Wrote',out)
