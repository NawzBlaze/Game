# Little Parcel Crew — Windows device evidence (no uninstall, no reset)

The crash cause is **unknown**. No phone was connected in the build environment. This is a collection procedure, not a fix. Do not install any diagnostic APK or update while its compatibility is unknown. Do not uninstall the game, clear its storage/cache, clear logcat, or restart the phone merely for diagnostics. Logs are circular and may already have overwritten the original crash; the script saves the existing buffers before reproducing once.

## 1. Prepare on your own Windows computer

1. Download Google's official **SDK Platform-Tools for Windows** from https://developer.android.com/tools/releases/platform-tools and extract it. Put the included `Collect-LPC-Evidence.ps1` next to the extracted `platform-tools` folder. The result should be `some-folder\Collect-LPC-Evidence.ps1` and `some-folder\platform-tools\adb.exe`.
2. For certificate verification, use Android Studio's SDK Manager to install Android SDK Build-Tools. The script looks for `apksigner.bat` under your Android SDK. Android Studio's bundled Java or a compatible JDK must be available to it. This is optional for log collection. The tool documentation is https://developer.android.com/tools/apksigner.
3. Enable developer options/USB debugging only if you are comfortable doing so. Connect the **original affected Android 13 phone** by USB, unlock it, and approve the computer's RSA debugging prompt. This does not install the game. Make sure nobody else is using the phone during collection.
4. Open PowerShell in the folder containing the script and run:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Collect-LPC-Evidence.ps1
```

The execution-policy override applies to this process only. If the tool cannot find adb, supply `-Adb "C:\full\path\platform-tools\adb.exe"`. If more than one authorized device is attached, select the original device serial exactly. If the phone is `unauthorized`, approve its prompt and run again. If no phone is listed, try the USB cable/driver and `platform-tools\adb.exe devices -l`; do not change the game.

5. The script first saves the existing main/system/crash log buffers, then device time, properties, provider, installed package information and historical exit information. It starts a **live log** and prompts you. Open the existing installed game normally **once**, wait until it closes or stays open, wait 10 seconds, then press Enter on the computer. It does not launch the app for you or clear any logs. Live logging includes pre-existing entries as well as new ones. Note the phone's displayed time and precisely what you observed. Logcat's threadtime format uses the device clock; the additional time files supply the date and offset.
6. The script records all installed APK paths and tries to copy the installed `base.apk` to the private local evidence folder, without modifying the phone or its app. The base is sufficient to inspect its signer in typical cases; split paths are recorded but are **not** copied. It tries `apksigner verify --verbose --print-certs` on the base and optional candidate, and `aapt dump badging` if available. When any command fails, see `capture-status.txt` and the corresponding output; do not infer a result.
7. The folder appears on your Desktop as `LPC-Device-Evidence-<timestamp>`. Logs contain unrelated apps, account names, device IDs, Wi-Fi details, paths and potentially private messages. APKs can be proprietary. Keep originals local and private. Review the evidence, redact unrelated sensitive data without deleting exception/stack context, and share **only** the minimal redacted text below. Do not send the APK, keystore, private key, passwords, account credentials, or entire logs in chat.

## 2. What to send back

- Manufacturer and model, Android version, active WebView provider **package and version** from `04-webview-provider.txt`, and the game's installed package/version name/version code from `05-installed-package.txt` (redact serial numbers, user IDs and unrelated data).
- What happened and the device-local reproduction time. A redacted contiguous block from `01-existing-logcat.txt` and/or `08-live-logcat.txt` covering approximately 30 seconds before and after that time, including complete `FATAL EXCEPTION`/`Caused by` stacks, `Fatal signal`/tombstone references, renderer exit, low-memory kill or system messages if present. The `*-possible-evidence.txt` files are convenience leads and may omit necessary causal context; check the originals. If there is no crash output, say so rather than guessing.
- In `13-installed-signature.txt`, only the **public** certificate SHA-256 digest(s), signature verification outcome and whether a signer/rotation lineage is reported. Certificate fingerprints are not private keys, though they identify the signing entity. If unavailable, state why.
- If `07-recent-exit-info.txt` or `10-exit-info-after.txt` has a matching process/time/reason, include that redacted context. If empty or unsupported, state that.

## 3. Checking an owner-provided candidate (optional; no installation)

Only after obtaining an actual candidate from its legitimate owner, run the same command with its path. No signing secrets are passed:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\Collect-LPC-Evidence.ps1 -CandidateApk "C:\private\candidate.apk"
```

The script repeats log collection and requests one reproduction. To compare without repeating, invoke the same Android SDK `apksigner.bat` manually on the already-copied base and candidate, and `aapt.exe dump badging` on each. Check `13-installed-signature.txt` and `14-candidate-signature.txt` or the manually generated output; compare **all** signers, signing schemes and any authorized rotation lineage, and inspect application ID/version with aapt and installed package information. A simple SHA match is useful evidence but is not by itself a complete proof of update eligibility on every Android version. A candidate's version code must normally be higher; store/device policies and signing lineage also matter. An unsigned candidate will fail verification. Do not install, uninstall, downgrade or overwrite anything until compatibility is independently established and the owner authorizes testing.

## 4. Interpreting the result

A Java exception, native fatal signal, WebView renderer death, low-memory kill and ordinary process stop require different investigations. Capture the full surrounding sequence and correlate process, PID, timestamps and version. `LPCDiagnostic` appears only if the relevant diagnostic build is already installed; do not expect it in the original older app. An existing recovery handler is a mitigation, not evidence of the original cause. If logs were overwritten, preserve what remains and reproduce once as above; do not claim a cause from a filtered one-line message.

The PowerShell script was syntax-checked and exercised with a **fake** ADB fixture in a Linux PowerShell environment. It has not been run on Windows or on your physical phone; if a Windows command fails, preserve the error and report it without changing the installed app.
