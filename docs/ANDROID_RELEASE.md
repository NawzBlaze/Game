# Android release: owner-controlled steps still required

No native build, original-crash verification or signed output was produced in this environment. Do not install this candidate over the affected app until compatibility is established. Do not uninstall the existing game or clear its data for diagnostics.

## 1. Diagnose safely

Start with [the diagnostic kit quick start](device-evidence/QUICK_START.md). A Python collector supports Windows/macOS/Linux without copying APKs; the PowerShell alternative below includes optional local certificate inspection. See [current triage status](device-evidence/ANDROID_TRIAGE_STATUS.md).

Use [the Windows evidence guide](device-evidence/Windows-device-evidence-guide.md) with `tools/Collect-LPC-Evidence.ps1` beside Google's extracted platform-tools directory. These are inherited evidence-collection tools; their original Linux/fake-ADB checks are documented in the guide. They have not been verified on Windows or your phone here.

Provide only redacted contiguous crash/exit context, phone model, Android/WebView provider and version, installed package/version and public certificate fingerprint. Keep full logs and copied APKs private. The renderer recovery screen does not identify the original crash cause.

## 2. Configure the legitimate build environment

Use an Android SDK 36/JDK-compatible Linux build environment with Python 3, Android build-tools, and the Gradle wrapper. `android/app/build.gradle` invokes the reproducible web builder and packages only `dist/web`, with test hooks disabled.

Signing reads these four environment variables together:

- `LPC_RELEASE_STORE_FILE`
- `LPC_RELEASE_STORE_PASSWORD`
- `LPC_RELEASE_KEY_ALIAS`
- `LPC_RELEASE_KEY_PASSWORD`

Set them through the owner's secure environment/CI-secret mechanism. The keystore must be outside the repository. Never paste keys/passwords into chat, source files or logs. Missing credentials leave builds unsigned; partial configuration fails.

From `android/`, run the appropriate Gradle release APK/bundle tasks only after the owner has established the correct signing identity. A Play upload key may differ from the actual app-signing key used on installed apps. Compare all relevant certificates/authorized rotation lineage and verify the installed version before deciding update eligibility. Candidate code 20 is not proof it exceeds the installed version.

## 3. Verify the actual artifact

Use Android SDK `apksigner verify --verbose --print-certs` for the APK, appropriate AAB signature verification and bundle/device validation for the bundle, then test the compatible update without clearing existing saves. A build task completing is not proof an output is signed or safe to install.

Verify the diagnosed fix on the original Android 13 phone and exercise the supported device/lifecycle matrix. Browser backup tools are not yet verified in the native wrapper. Record real artifact-bound evidence in `release-approval.json`; do not record approval just because desktop Chromium tests passed.
