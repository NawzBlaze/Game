# Little Parcel Crew · 1.0.0-rc.3

An offline delivery adventure with **24 Adventure routes, 48 Classic puzzles and six optional special deliveries**. This repository now includes the restored game, matching sourced artwork for both modes, save recovery, and an Android-first interface using original freely licensed game UI assets.

**Product target: mobile Android APK. Browser previews are development/test tooling, not a desktop/web product.** The 1.0 campaign candidate passes 25 engine/UI/build checks plus Android build/lint/simulated tests and two instrumentation tests on each of API 33/36 emulators. [Download and limits](docs/ANDROID_BUILD_HANDOFF.md). Production signing, physical-phone and owner approvals remain required. See [production readiness](docs/PRODUCTION_READINESS.md). A successful build is not permission to publish.

## Current release-hardening pass

rc.3 adds Android progress documents, compact landscape route-book controls, optional chapter details, a sticky backup exit and in-game privacy/support. The public-production gate rejects missing approvals, prerelease labels, debug/unsigned APKs and mismatched APK/certificate/payload fingerprints. Verified APK: **53,039,043 bytes**; native build and API 33/36 emulators passed. See [third inspection/fix report](docs/audits/03-release-hardening.md).

The owner currently reports uncertain signing history and no available phone test. A new read-only [APK identity helper](docs/device-evidence/APK_IDENTITY.md) supports local old-file/public-certificate inspection without installing or clearing anything. No production identity or physical approval is inferred from CI.

## Current 20–100 MB content-budget correction

The new candidate adds five original Juhani Junkala stereo PCM recordings used by menus, routes and delivery results, with the earlier Cozy loops selectable. Original source identities and author CC0 notice are bundled; no resampling, silent padding or duplicate recordings. The internal game package is approximately 52 MB; obtain the actual finished APK size and candidate identity from the handoff. Both finished APK and AAB must now be **20,000,000–100,000,000 bytes**, not just below 100 MB. **25/25 engine/UI checks and 14/14 Android host tooling tests pass.** [Content and size evidence](docs/STUDIO_SOUNDTRACK.md).

## 1.0 campaign release candidate

The Lantern Round connects all 24 main routes into five story chapters with 24 dispatches and earned replies. The map adds chapter jumps, route filters, difficulty labels and three newly downloaded original Kenney chapter panoramas. Optional Express variants require all three stars, with quicker neighbours and bridges; Standard geometry/progress and special-delivery rules are preserved. Animation now uses original flag/spring frames, faster walk cycles, cloud/panorama compositing and eased parcel hand-off, with reduced-motion support.

**25/25 current engine/UI/build checks pass**, including all 24 three-star Standard clears and all 24 Express clears. [Candidate scope and limits](docs/V1_RELEASE_CANDIDATE.md). This is not a stable/production-approved 1.0 release. The original rc.1 did not meet the requested minimum; rc.2 adds the real-content soundtrack and enforces the 20–100 MB budget. Native candidate verification must be recorded separately from the engine tests.

## Included earlier upgrades

Independent saved music/effects levels, seven original Kenney music tracks, optional district soundtrack switching, contextual route field notes/checklists, 11 progress-derived honours, next-dispatch recommendations and persistent nested-dialog Back controls. Earlier upgrade history: [0.21](docs/PROFESSIONAL_UPGRADE.md), [0.22](docs/PREMIUM_POLISH.md).

The finished-app budget remains **20 MB minimum, about 50 MB preferred, 100 MB maximum**. The previous rc.1 APK was **2,771,465 bytes (2.77 MB)** and did not meet that minimum. It is superseded by the studio-soundtrack candidate; see the current handoff for actual APK bytes. No filler, duplicated music or inflated files were added. Production signing and physical-phone/owner approval remain outstanding.

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
npm test                       # starts its own local servers; runs 25 serial engine/UI/build checks
npm run preview                # built RC: port 4188
npm run release:check          # fails until artifact-bound human + Android evidence exists
```

Do not run the self-managed verification while ports 4187/4188 are occupied. For already-running local previews, use `LPC_USE_EXISTING_SERVERS=1 npm test`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can select an external browser. CI installs Chromium and runs the same suite.

Outputs:
- `dist/little-parcel-crew-1.0.0-rc.3.zip`: internal WebView payload archive, not the mobile deliverable.
- `dist/SHA256SUMS.txt`: archive digest.
- `dist/qa-report.json`: fresh automated results, bound to the archive hash.
- `dist/web/build-manifest.json`: per-file build integrity record.
- `dist/web/asset-manifest.json`: exact source URLs, licences and SHA-256 values.

Use the built package, **not a ZIP of the entire source web/ directory**. The workbench retains historical assets for traceability; the release allowlist excludes them. `_headers` is for Cloudflare Pages-compatible static hosts; other hosts must apply equivalent security/cache settings. No public web deployment is performed by these commands. Android Gradle packages this payload into the APK; obtain mobile candidates from the Android CI artifact. See [the mobile redesign notes](docs/MOBILE_REDESIGN.md).

## Art, audio and customization

Both modes use original Kenney New Platformer Pack artwork. The full soundtrack is original Juhani Junkala recordings; optional Cozy music and effects are original Kenney Music Loops/Interface Sounds assets. Nunito comes from the Google Fonts repository. All 161 release asset/licence files have source hashes and bundled CC0/OFL notices. No replacement illustrated artwork was generated or drawn by this agent. Functional interface layout and code are AI-assisted.

Old hats/bags/cart selections retain their save IDs but now map to matching source-pack **uniforms, route badges and dispatch parcels**. Courier IDs and abilities remain unchanged. See [credits](web/CREDITS.txt) and [asset manifest](docs/release-assets.json). Source licensing is documented; final rights/production-method and title review still requires owner approval.

## Progress and recovery

Existing `delivery-adventure-v1` and `one-step-delivery-v2` keys are retained. Valid Classic in-progress sessions are preserved. Save schemas are validated, damaged originals are saved separately before repairs, and failed backup preservation blocks overwriting that original. Quota/blocked-storage failures are visible.

**Progress & backups** on Adventure home exports a local JSON file. Restore validates a selected file, previews affected modes, requires confirmation and keeps a pre-restore copy. Failed multi-key writes attempt rollback. Browser file export/import is tested. Android rc.3 implements scoped system-document export/import with bounded UTF-8 I/O; its native UI/Back and JVM stream/intent tests pass. Actual document-provider round-trip and physical-phone approval remain pending. Browser saves are origin-specific: moving to another domain requires a backup. Never clear an existing installation merely to diagnose it.

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

## Android release size and signing

Maximum finished APK/AAB size: **100,000,000 bytes (100 MB)**, enforced by Gradle `verifyDebugSize` / `verifyReleaseSize` and candidate CI. There is no minimum size and no padding. See [owner-controlled production signing](docs/RELEASE_SIGNING.md). An explicit `-PrequireReleaseSigning=true` production build fails if the owner has not securely configured the legitimate signing identity. Debug previews and unsigned candidates are not store-ready releases.
