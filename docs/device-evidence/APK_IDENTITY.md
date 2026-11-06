# Signing history unknown — safe next step

The owner reported on 2026-11-06 that only an old/test APK may exist, signing history is uncertain, and phone testing is not currently possible. **Do not create an unrelated production key and call it an update. Do not uninstall/clear the affected installation.** No old APK was present in this checkout and no GitHub Releases were listed during this check. That does not prove the app was never distributed elsewhere.

## If you already have an old APK file on your computer

No phone connection is needed for this step. Use your own local copy; do not upload the APK, private keys or keystore to chat. Install official Android SDK Build-Tools on your computer, then run:

```sh
python3 tools/inspect_apk_identity.py /private/path/old-game.apk \
  --apksigner /path/to/Android/sdk/build-tools/36.0.0/apksigner \
  --aapt2 /path/to/Android/sdk/build-tools/36.0.0/aapt2
```

Inside the diagnostic ZIP, the script is at the ZIP root, not inside `tools/`. On Windows the SDK tools normally have `.bat`/`.exe` suffixes; use their full paths, or follow the existing [PowerShell guide](Windows-device-evidence-guide.md) for public-certificate inspection. The new Python helper has mocked host tests, not an actual Windows/SDK certification.

The helper runs only SDK signature verification and badging inspection; it hashes the local file. It does not install/launch an APK, connect to a device, read private keys or change app data. The JSON receipt contains package/version, APK SHA-256 and public certificate digests, not local file paths or device serials.

Optional preliminary comparison:

```sh
python3 tools/inspect_apk_identity.py /private/path/old-game.apk \
  --candidate /private/path/candidate.apk \
  --apksigner /path/to/apksigner --aapt2 /path/to/aapt2
```

A comparison mismatch exits with code 2. Missing tools, invalid APK/signature or unreadable metadata exit with code 1. Successful inspection exits with code 0. A failed inspection does not produce a fabricated certificate.

**Even a match is not update approval.** A matching package/certificate and higher version code do not prove that this old file is the installed version, ABI/split compatibility, authorized signing-key rotation, save retention or crash resolution. The receipt deliberately always says `compatibleUpdateProven: false`. Different certificates may require an authorized rotation/Play-signing review, not a random replacement key. CI debug keys may differ between runs and are not an owner-controlled production identity.

## When the original phone is available

1. Use the [read-only evidence kit](QUICK_START.md) to record the installed package/version, WebView provider and original crash context. Do not install the new preview on top of it merely to investigate.
2. Establish the installed public certificate using the existing PowerShell/SDK procedure or another owner-controlled read-only inspection.
3. Compare actual installed identity with the legitimate production/update signing identity. Check Play App Signing separately if applicable; upload certificates and installed-app certificates may differ.
4. Only after the signing path and recovery plan are established should a compatible upgrade be tested without uninstalling or clearing data.
5. On a separate clean test device, exercise the exact candidate: cold launches, controls, pause/Back, background/resume, volume/audio interruption, full routes and specials, TalkBack menus, text scaling, frame pacing and native document export/import/cancel/error. Retain actual observations and candidate hashes, not blanket approval.

## What can be shared safely

After reviewing the receipt, share only the public package/version/APK/certificate fingerprints necessary to establish identity, plus minimal redacted crash text if available. No phone is required to inspect a local old APK; if neither old APK nor phone is available, signing history remains unknown. Do not mark the release gate approved in that situation.
