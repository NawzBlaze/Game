# Mobile Android APK handoff — 0.20.0-rc.1 / code 21

The product target is **mobile Android APK**. Browser preview and static payload archives are development/verification tools, not desktop/web deliverables.

## Download the redesigned APK

**[Download mobile-apk-preview](https://github.com/NawzBlaze/Game/actions/runs/41984998840/artifacts/13395817085)** from [successful CI run 41984998840](https://github.com/NawzBlaze/Game/actions/runs/41984998840).

GitHub downloads an artifact ZIP. Extract and use **`little-parcel-crew-0.20.0-rc.1-preview.apk`**. This separate artifact contains the game APK, checksum, source commit and safety note—not the instrumentation APK or an unsigned APK that cannot be installed normally. GitHub login may be required; artifacts have 14-day retention.

APK SHA-256: `646beb90b51794b7211759c17a87d1a545c96811698c1f5e46ce5a37ee31a5a4`.

Verified source commit: `d2ca430d34b9d605936f2cd638a3a5551d952807` on `arena/fcb06d04-game`.

**This is a debug/test-signed preview APK, not a production-signed or store-approved release. Use a clean test device only. Do not uninstall, clear data, or overwrite the affected existing game to try this candidate.** App ID remains `com.onestepdelivery.game` for save/update continuity; debug signing is not proof of update compatibility.

## What changed

[Mobile redesign notes](MOBILE_REDESIGN.md): original freely licensed Kenney UI faces/control icons; mobile home, HUD, larger independent thumb controls, route/courier/special/scrapbook presentation, compact pause/settings/back navigation, and the same skin/phone-fit controls for Classic. Android launch/recovery colours and adaptive launcher resources match the new direction. No newly generated illustrated artwork was added. Existing save schemas and movement rules are retained.

## Verification completed

- **18/18** automated engine/UI checks, exact payload binding in `LATEST_WEB_QA.json`.
- Native debug/release APK and AAB builds, debug lint and simulated framework tests on APIs 29, 33 and 36 passed. The simulated tests include hardware Back being routed once per key pair.
- **Android 13/API 33 and Android 16/API 36:** both instrumentation tests passed on each disposable emulator.
- Native smoke test used system-injected touchscreen events to start, move, pause, open settings, press hardware Back, and resume. It checked on-screen home/pause actions, disabled test hooks, original local asset URL, hidden unsupported native backup entry and progress through Activity recreation.
- Renderer test deliberately crashed WebView, required explicit retry and verified retained localStorage origin/content.
- Exact debug/test APKs were hash-checked before emulator installation. The preview download is a renamed byte-for-byte copy of the tested debug APK.
- Each emulator evidence artifact contains `mobile-home.png`, `mobile-game.png`, `mobile-pause.png`, instrumentation results, provider details and logs from that clean emulator. These are QA screenshots, not game artwork. Local browser screenshots were inspected; native screenshot files are available in the run artifacts, not claimed locally inspected here.

Earlier native touch attempts failed because the app did not own input focus. The CI test OS now acknowledges Android's first-use immersive teaching prompt and wakes/unlocks the disposable emulator before testing. Tests synchronize WebView presentation and verify focus rather than falling back to scripted DOM clicks. The app does **not** change those system settings on a real phone. Earlier failures are not hidden or treated as passes.

Exact run/job/artifact metadata, archive digests and APK hash are in [android-ci-run.json](device-evidence/android-ci-run.json). The previous 0.19 evidence is preserved separately in [android-ci-run-0.19.json](device-evidence/android-ci-run-0.19.json).

## Still not established

- Comprehensive physical-phone play, touch/accessibility/audio/lifecycle review or zero-bug status.
- Diagnosis/fix verification for the historical Android 13 installation's crash.
- Native document backup/import support: unsupported entry points are hidden, not falsely marked implemented.
- Production signing, installed certificate/version/update compatibility, physical launcher-mask review, store assets/declarations, and human/owner approval.

Keep the affected phone untouched and use the [read-only diagnostic quick start](device-evidence/QUICK_START.md) for its existing failure. Use a separate clean test phone to review this APK. Do not upload private logs or signing secrets. No store submission or production approval was performed.

The sandbox cannot fetch GitHub's artifact blob host, so there is no local APK attachment; download directly through the link above. Build-only artifacts also include unsigned release APK/AAB files, but those are internal candidates, not the preview APK or a ready Play submission.
