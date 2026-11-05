# Little Parcel Crew · 0.20.0-rc.1

An offline delivery adventure with **24 Adventure routes, 48 Classic puzzles and six optional special deliveries**. This repository now includes the restored game, matching sourced artwork for both modes, save recovery, and an Android-first interface using original freely licensed game UI assets.

**Product target: mobile Android APK. Browser previews are development/test tooling, not a desktop/web product.** The 0.20 redesign passes 18 engine/UI checks plus Android build/lint/simulated tests and two instrumentation tests on each of API 33/36 emulators. [Download and limits](docs/ANDROID_BUILD_HANDOFF.md). Production signing, physical-phone and owner approvals remain required. See [production readiness](docs/PRODUCTION_READINESS.md). A successful build is not permission to publish.

## Develop and play

```sh
npm ci
npx playwright install chromium  # once, for browser tests
npm start                      # source workbench: port 4187
```

The server binds to `0.0.0.0`, accepts Arena preview hosts, and uses relative asset URLs. There is no game backend, account, advertising or analytics service.

## Build and verify

```sh
npm run build                  # audited allowlist → dist/web and deterministic ZIP
npm test                       # starts its own local servers; runs 18 serial engine/UI checks
npm run preview                # built RC: port 4188
npm run release:check          # fails until artifact-bound human + Android evidence exists
```

Do not run the self-managed verification while ports 4187/4188 are occupied. For already-running local previews, use `LPC_USE_EXISTING_SERVERS=1 npm test`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an external browser. CI installs Chromium and runs the same suite.

Outputs:
- `dist/little-parcel-crew-0.20.0-rc.1.zip`: internal WebView payload archive, not the mobile deliverable.
- `dist/SHA256SUMS.txt`: archive digest.
- `dist/qa-report.json`: fresh automated results, bound to the archive hash.
- `dist/web/build-manifest.json`: per-file build integrity record.
- `dist/web/asset-manifest.json`: exact source URLs, licences and SHA-256 values.

Use the built package, **not a ZIP of the entire source web/ directory**. The workbench retains historical assets for traceability; the release allowlist excludes them. `_headers` is for Cloudflare Pages-compatible static hosts; other hosts must apply equivalent security/cache settings. No public web deployment is performed by these commands. Android Gradle packages this payload into the APK; obtain mobile candidates from the Android CI artifact. See [the mobile redesign notes](docs/MOBILE_REDESIGN.md).

## Art, audio and customization

Both modes use original Kenney New Platformer Pack artwork. Music and effects are fresh Kenney Music Loops/Interface Sounds downloads. Nunito comes from the Google Fonts repository. All 146 release asset/licence files have source hashes and bundled CC0/OFL notices. No replacement illustrated artwork was generated or drawn by this agent. Functional interface layout and code are AI-assisted.

Old hats/bags/cart selections retain their save IDs but now map to matching source-pack **uniforms, route badges and dispatch parcels**. Courier IDs and abilities remain unchanged. See [credits](web/CREDITS.txt) and [asset manifest](docs/release-assets.json). Source licensing is documented; final rights/production-method and title review still requires owner approval.

## Progress and recovery

Existing `delivery-adventure-v1` and `one-step-delivery-v2` keys are retained. Valid Classic in-progress sessions are preserved. Save schemas are validated, damaged originals are saved separately before repairs, and failed backup preservation blocks overwriting that original. Quota/blocked-storage failures are visible.

**Progress & backups** on Adventure home exports a local JSON file. Restore validates a selected file, previews affected modes, requires confirmation and keeps a pre-restore copy. Failed multi-key writes attempt rollback. Browser file export/import is tested; native Android file picking/download is not verified. Browser saves are origin-specific: moving to another domain requires a backup. Never clear an existing installation merely to diagnose it.

## Android diagnostic next step

Download the separately packaged **read-only diagnostic kit**, not an APK:

```sh
npm run test:android-evidence
npm run diagnostics:package
```

The kit is `dist/LPC-Android-ReadOnly-Diagnostics.zip`. Follow [the quick start](docs/device-evidence/QUICK_START.md) on your own computer with the original affected phone. Do not reinstall the game, clear its data or upload full logs. The Python collector has six mocked host tests; it has not been verified on a real phone or Windows. Current [triage status](docs/device-evidence/ANDROID_TRIAGE_STATUS.md) records the limits.

Android CI has now built debug and unsigned release candidates and passed instrumentation on disposable Android 13/API 33 and Android 16/API 36 emulators. See [the recorded run and artifact identities](docs/device-evidence/android-ci-run.json) and [Android handoff](docs/ANDROID_BUILD_HANDOFF.md). No physical phone or production signing was used.

## Android

`android/` is the reconstructed native WebView wrapper, not Capacitor. The original Android 13 crash is not diagnosed here. Java, Android SDK and a physical phone are unavailable locally; the native build and emulator checks ran on GitHub Actions instead. Release APK/AAB outputs are unsigned and not store-ready.

On a configured Linux build machine, the Gradle pre-build runs the allowlisted web builder and packages **dist/web**, with test hooks disabled. App ID stays `com.onestepdelivery.game`; candidate version code is 20. Release signing uses owner-controlled environment variables, with the keystore outside the repository. Verify installed certificate/version compatibility before any update. Do not send signing secrets in chat.

Historical notes: [initial overhaul](docs/OVERHAUL_STATUS.md), superseded where noted by [current readiness](docs/PRODUCTION_READINESS.md).
