# Little Parcel Crew — Android crash evidence kit

**This is a diagnostic kit, not an APK or a crash fix. Do not install a new game build, uninstall the existing app, clear its storage/cache, clear logcat, or restart the phone merely for this collection.**

## What you need

- The original phone on which the already-installed game closes unexpectedly.
- Your own Windows, macOS or Linux computer and a USB data cable.
- Google's official SDK Platform-Tools: https://developer.android.com/tools/releases/platform-tools
- For the cross-platform collector: Python 3.9+ on the computer. Windows users without Python can use the included PowerShell alternative.

Download the correct official Platform-Tools archive, extract it beside the collector, and keep Google's `platform-tools` folder name. The kit does not include or download executables for you. Only enable USB debugging if you are comfortable doing so; unlock the phone and approve your computer's debugging prompt. This allows the computer to read sensitive device information. Revoke that computer's debugging authorization afterwards if desired, once evidence is safely collected.

Expected folder layout:

```text
LPC-Android-ReadOnly-Diagnostics/
  collect_android_evidence.py
  Collect-LPC-Evidence.ps1
  platform-tools/
    adb.exe                  # Windows
    adb                      # macOS/Linux
```

## Recommended: cross-platform collector (no APK copying)

Open a terminal in the extracted kit folder.

Windows, with Python installed:

```powershell
py -3 .\collect_android_evidence.py
```

macOS/Linux:

```sh
python3 ./collect_android_evidence.py
```

If Platform-Tools is elsewhere, add `--adb` with the full path to Google's adb executable. If several devices are connected, disconnect unrelated devices or specify `--serial` using the exact authorized device shown by `adb devices -l`. Keep serial numbers private. An unauthorized or offline device is rejected.

The collector:

1. Saves the existing circular log buffers **before** asking you to reproduce anything.
2. Records phone model/Android version, time, WebView provider, installed package information and available historical exit information.
3. Starts live log collection, then asks you to open the **already installed** game manually once.
4. After the game closes or stays open, wait ten seconds and press Enter on the computer.
5. Saves post-reproduction time/exit information. Stops only its own host-side logging process, not the game.

The private output directory is created in your computer's home folder as `LPC-PRIVATE-Evidence-<UTC timestamp>`. It will not overwrite an existing output directory. Capture failures/unsupported commands are recorded in `capture-status.json`; do not infer a result from a missing file. A nonzero exit can mean partial evidence; preserve what was captured.

To preserve only existing evidence without a reproduction prompt:

```sh
python3 ./collect_android_evidence.py --snapshot-only
```

On Windows substitute `py -3` for `python3` as above. Snapshot-only collection does not demonstrate a new reproduction. The Python collector does **not** copy APKs, inspect certificates, install/uninstall apps, clear logs or reset app data.

## Windows alternative: PowerShell and optional certificate inspection

Use `Windows-device-evidence-guide.md` with `Collect-LPC-Evidence.ps1`. Unlike the Python collector, the PowerShell procedure attempts to copy the installed base APK to a private local folder for optional public-certificate inspection. Do not share that APK. The guide explains SDK Build-Tools/apksigner and signing compatibility; no candidate installation is requested.

## Send back only the minimum redacted text

Open `SUMMARY-TO-SHARE.txt` in the private output directory and fill in:

- Manufacturer/model, Android version, active WebView provider package/version.
- Installed game version name/code.
- Exactly what happened and the phone-local time/date/time zone.
- A redacted contiguous block around that time, preserving full relevant `FATAL EXCEPTION` / `Caused by` stacks, native-signal or renderer/system-exit context if present. Include about 30 seconds before/after when available.
- Matching exit reason or explicitly say none found/unsupported.
- Public signing-certificate SHA-256 only if independently available; otherwise say unavailable.
- Any collector errors.

**Do not upload the whole evidence directory.** Logs can include unrelated apps, account names, device IDs, messages and other sensitive details. Review/redact locally while keeping exception and causal context intact. Do not send APKs, keystores, private keys, passwords or device serials.

If there is no crash output, say so. Collection is not diagnosis, and a renderer recovery handler is not proof of the historical crash cause.

## Verification limits

The Python collector has six host-only mocked safety/behaviour tests: explicit authorized-device selection, existing-log-first ordering, read-only ADB command scope, capture-error recording, interrupt cleanup and refusal to overwrite output. These passed in Linux, without a real ADB executable, Windows computer or phone. The PowerShell collector is inherited; its prior fake-ADB checks are described in its guide and were not rerun here. Neither result establishes Android reliability or a crash fix.

## Optional local APK identity inspection (no phone needed)

The kit also includes `inspect_apk_identity.py` and `APK_IDENTITY.md`. If you already have a local old/test APK, this separate helper uses official SDK `apksigner`/`aapt2` to report public package/version/certificate fingerprints without installing it or connecting to a phone. The original collector above is unchanged and still does not copy APKs or inspect certificates. Follow the identity guide; a preliminary match never proves update compatibility. Do not upload APKs, keys or whole diagnostic directories.
