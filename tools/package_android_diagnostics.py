#!/usr/bin/env python3
"""Package only public collector code/instructions; never package device outputs."""
from pathlib import Path
import hashlib
import importlib.util
from zipfile import ZipFile, ZipInfo, ZIP_DEFLATED

root=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('collector',root/'tools/collect_android_evidence.py')
collector=importlib.util.module_from_spec(spec)
spec.loader.exec_module(collector)
files={
    'README.md':(root/'docs/device-evidence/QUICK_START.md').read_bytes(),
    'collect_android_evidence.py':(root/'tools/collect_android_evidence.py').read_bytes(),
    'Collect-LPC-Evidence.ps1':(root/'tools/Collect-LPC-Evidence.ps1').read_bytes(),
    'Windows-device-evidence-guide.md':(root/'docs/device-evidence/Windows-device-evidence-guide.md').read_bytes(),
    'inspect_apk_identity.py':(root/'tools/inspect_apk_identity.py').read_bytes(),
    'APK_IDENTITY.md':(root/'docs/device-evidence/APK_IDENTITY.md').read_bytes(),
    'SUMMARY-TO-SHARE.txt':collector.SHARE_TEMPLATE.encode('utf-8'),
}
files['CHECKSUMS.txt']=''.join(hashlib.sha256(data).hexdigest()+'  '+name+'\n' for name,data in sorted(files.items())).encode()
output=root/'dist/LPC-Android-ReadOnly-Diagnostics.zip'
output.parent.mkdir(parents=True,exist_ok=True)
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=9) as archive:
    for name,data in sorted(files.items()):
        info=ZipInfo(name,date_time=(2026,1,1,0,0,0));info.compress_type=ZIP_DEFLATED;info.external_attr=0o100644<<16
        archive.writestr(info,data)
with ZipFile(output) as archive:
    assert archive.testzip() is None
    assert set(archive.namelist())==set(files)
    for name,data in files.items():assert archive.read(name)==data
print('Read-only diagnostic kit:',output)
print('Contains only',len(files),'public scripts/instructions/checksums; no APK, SDK binary, phone logs or credentials.')
print('SHA-256:',hashlib.sha256(output.read_bytes()).hexdigest())
