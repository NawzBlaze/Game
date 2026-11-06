# Mobile Android APK handoff — 1.0.0-rc.2 / code 101

The product target is **mobile Android APK**. Browser preview and static payload archives are development/verification tools, not desktop/web deliverables.

> **Source binding:** the download below is the verified `3db86dc` baseline, not the later audit fixes. See [audit reinspection](audits/02-reinspection.md). A fresh native build is required for those changes.

## Download the redesigned APK

**[Download mobile-apk-preview](https://github.com/NawzBlaze/Game/actions/runs/42164619926/artifacts/13478975457)** from [successful CI run 42164619926](https://github.com/NawzBlaze/Game/actions/runs/42164619926).

GitHub downloads an artifact ZIP. Extract and use **`little-parcel-crew-1.0.0-rc.2-preview.apk`**. This separate artifact contains the game APK, checksum, source commit and safety note—not the instrumentation APK or an unsigned APK that cannot be installed normally. GitHub login may be required; artifacts have 14-day retention.

Finished APK size: **53,032,215 bytes (53.03 MB)**. CI now checks every finished APK/AAB against a strict **20,000,000–100,000,000-byte range**. Production signing must be owner-controlled; see [release signing instructions](RELEASE_SIGNING.md).

APK SHA-256: `51c1a8118c20b85fb7e62292b4799b6e2053071e4a9b519f453c0cc2e7682022`.

Verified source commit: `3db86dcf2c7f1cfe107a398e7674671d88a55924` on `arena/2ae7d624-game`.

**This is a debug/test-signed preview APK, not a production-signed or store-approved release. Use a clean test device only. Do not uninstall, clear data, or overwrite the affected existing game to try this candidate.** App ID remains `com.onestepdelivery.game` for save/update continuity; debug signing is not proof of update compatibility.

## What changed

[1.0 campaign candidate](V1_RELEASE_CANDIDATE.md): 24 connected letters and replies, five story chapters, improved chapter map/filtering, three original creator panoramas, 24 optional Express variants, authored sprite-animation improvements, and the earlier soundtrack/mixer/earned-honour upgrades. **The content-size requirement is met by rc.2 with five original composer recordings. This remains a release candidate, not a production-approved release.**

[Mobile redesign notes](MOBILE_REDESIGN.md): original freely licensed Kenney UI faces/control icons; mobile home, HUD, larger independent thumb controls, route/courier/special/scrapbook presentation, compact pause/settings/back navigation, and the same skin/phone-fit controls for Classic. Android launch/recovery colours and adaptive launcher resources match the new direction. No newly generated illustrated artwork was added. Existing save schemas and movement rules are retained.

## Verification completed

- **14/14** Android host tooling tests, including exact 20 MB/100 MB acceptance, under/over-limit rejection and missing/empty/symlink output rejection; finished debug/release APK and AAB size gates passed.
- **23/23** automated engine/UI checks for the verified baseline payload; its hash is recorded in `device-evidence/android-ci-run.json`. `LATEST_WEB_QA.json` now describes the newer, locally tested audit payload, not this historical APK. Includes all 24 three-star Standard and all 24 three-star Express engine clears; the emulator smoke tests do not claim full-campaign phone play.
- Native debug/release APK and AAB builds, debug lint and simulated framework tests on APIs 29, 33 and 36 passed. The simulated tests include hardware Back being routed once per key pair.
- **Android 13/API 33 and Android 16/API 36:** both instrumentation tests passed on each disposable emulator.
- Native smoke test used system-injected touchscreen events to start, move, pause, open settings, press hardware Back, and resume. It checked on-screen home/pause actions, disabled test hooks, original local asset URL, hidden unsupported native backup entry and progress through Activity recreation.
- Renderer test deliberately crashed WebView, required explicit retry and verified retained localStorage origin/content.
- Exact debug/test APKs were hash-checked before emulator installation. The preview download is a renamed byte-for-byte copy of the tested debug APK.
- Each emulator evidence artifact contains `mobile-home.png`, `mobile-game.png`, `mobile-pause.png`, instrumentation results, provider details and logs from that clean emulator. These are QA screenshots, not game artwork. Local browser screenshots were inspected; native screenshot files are available in the run artifacts, not claimed locally inspected here.

Earlier native touch attempts failed because the app did not own input focus. The CI test OS now acknowledges Android's first-use immersive teaching prompt and wakes/unlocks the disposable emulator before testing. Tests synchronize WebView presentation and verify focus rather than falling back to scripted DOM clicks. The app does **not** change those system settings on a real phone. Earlier failures are not hidden or treated as passes.

Exact run/job/artifact metadata, archive digests and APK hash are in [android-ci-run.json](device-evidence/android-ci-run.json). Previous 0.21 evidence is preserved in [android-ci-run-0.21.json](device-evidence/android-ci-run-0.21.json). Previous 0.20 evidence is preserved in [android-ci-run-0.20.json](device-evidence/android-ci-run-0.20.json). The previous 0.19 evidence is preserved separately in [android-ci-run-0.19.json](device-evidence/android-ci-run-0.19.json).

## Still not established

- Comprehensive physical-phone play, touch/accessibility/audio/lifecycle review or zero-bug status.
- Diagnosis/fix verification for the historical Android 13 installation's crash.
- Native document backup/import support: unsupported entry points are hidden, not falsely marked implemented.
- Production signing, installed certificate/version/update compatibility, physical launcher-mask review, store assets/declarations, and human/owner approval.

Keep the affected phone untouched and use the [read-only diagnostic quick start](device-evidence/QUICK_START.md) for its existing failure. Use a separate clean test phone to review this APK. Do not upload private logs or signing secrets. No store submission or production approval was performed.

The sandbox cannot fetch GitHub's artifact blob host, so there is no local APK attachment; download directly through the link above. Build-only artifacts also include unsigned release APK/AAB files, but those are internal candidates, not the preview APK or a ready Play submission.
