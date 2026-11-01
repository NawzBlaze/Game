# Android candidate build and emulator handoff

## Completed on 2026-11-01

[Successful GitHub Actions run 41323056033](https://github.com/NawzBlaze/Game/actions/runs/41323056033), source commit `2b125bfb90f83287abb8289f6575b99116a84957` on `arena/fcb06d04-game`:

- Native debug and unsigned release APK/AAB builds, debug lint, and Robolectric simulated framework tests (APIs 29, 33, 36) passed.
- Android 13/API 33 and Android 16/API 36 disposable emulators each passed both instrumentation tests.
- Tests exercised offline WebView startup, pause/resume, stored progress through Activity recreation, deliberate renderer death, explicit retry and preserved localStorage origin. These are targeted smoke/recovery checks, not comprehensive native gameplay, accessibility, audio or touch certification.
- Each emulator installed the exact debug/test APKs downloaded from the build job, after validating their candidate SHA-256 manifest. No existing installation was replaced.
- Nine Python host-only safety/collector tests also passed locally. These are not device tests.

Earlier attempts found SDK setup/PATH problems and a result-parser mismatch: pretty instrumentation output said `OK (2 tests)`, but the runner required a raw completion code. The final run explicitly requests raw output, checks both tests and the completion code, and all three jobs are green. No app crash fix was inferred from those harness failures.

## Download test candidates

On the run page, download **android-unsigned-and-debug-candidates** under Artifacts (14-day retention):

- `app-debug.apk`: test-signed installable APK, **clean spare devices only**.
- `app-debug-androidTest.apk`: test harness, not the game for normal use.
- `app-release-unsigned.apk`: unsigned release candidate; not normally installable as-is.
- `app-release.aab`: unsigned bundle; **not ready for Play upload**.
- `SHA256SUMS.txt`, `SOURCE_COMMIT.txt`, `WEB_SHA256SUMS.txt`, `READ_ME_FIRST.txt`.

Other artifacts hold build reports and API-specific instrumentation/logcat evidence from fresh emulators. Exact run/job/artifact metadata and archive digests are in [android-ci-run.json](device-evidence/android-ci-run.json). Archive digest is not an individual APK hash; use the bundled SHA manifest for APK hashes.

The sandbox cannot download GitHub's artifact blob host, so no local APK attachment is claimed. Download directly through GitHub. Do not redistribute or upload the debug APK as a production release.

## Physical-device next step

1. Keep the affected Android 13 installation untouched. **Do not uninstall, clear data, force an incompatible update or attempt a debug-key replacement.**
2. Use the [read-only diagnostic quick start](device-evidence/QUICK_START.md) on the original phone to capture its existing failure. Share only redacted context and the requested public device/package/provider/certificate metadata, never full private logs or signing secrets.
3. Use a separate clean test phone for the debug candidate. Confirm package `com.onestepdelivery.game` is not already installed. Record candidate hash, model, Android version and WebView version before testing.
4. Check Adventure and Classic startup, real touch/jump/hold inputs, background/resume, audio, navigation/back, rotation, text scale, route completion, cold restart and persisted progress. Record failures rather than marking all device approval complete.
5. Native credits and backup import/export remain unverified. The historical Android 13 crash must be diagnosed from the affected installation, not assumed fixed because renderer recovery passed in emulators.
6. Owner-controlled signing, installed-version/certificate/update compatibility, adaptive-icon/store assets, physical-device results and human release approvals remain necessary before internal store testing or production upload.

No Play upload, production signing, physical-phone test or production approval was performed.
