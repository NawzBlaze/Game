# Release engineering handoff — 0.19.0-rc.1

## Decision

**Web release candidate is implemented and automated checks pass. Overall production gate is BLOCKED pending independent human/owner and Android-device evidence.** No production-signed release APK/AAB or app-store submission was created. Debug/unsigned Android candidates and emulator results are recorded in [the Android handoff](ANDROID_BUILD_HANDOFF.md). No monetary-quality/perfection claim is made.

This document supersedes unfinished Classic/customization/source-provenance items in the earlier `OVERHAUL_STATUS.md`, while preserving that report as historical evidence.

## Changes completed in this pass

- Replaced Classic's old character, dog, parcel, destination, obstacle and home imagery with the matching Kenney family. Replaced the old illustrated/procedural Classic CSS, hand-coded sound/lock SVGs and Adventure legacy CSS with functional interface layouts.
- Reintroduced earned customization: old cap/flower IDs map to source-pack sand/sunshine uniforms; bag IDs map to route badges; cart IDs map to dispatch-parcel colours. Their appearance is shared by gameplay and previews, with original source images unchanged. This is a deliberate remapping, not a claim that original hats/carts still appear.
- Downloaded fresh, directly traceable Kenney music/effects and Nunito/OFL font assets. The release manifest covers **121 files**; original notices ship alongside them. Active release code has no dependencies on old painterly/classic-painted/phase4/audio-refresh folders.
- Added shared save schema validation, bounded records/sessions, malformed-save preservation, quota protection and recovery notices. Added browser backup download, validated restore preview, explicit confirmation, pre-restore copy and rollback attempts.
- Hid the inactive game DOM from keyboard/screen-reader navigation, labelled Adventure's main landmark, improved modal focus return and added a visible artwork-load failure status. These improvements are not a complete accessibility certification.
- Added a source-only test-hook configuration; the built RC sets test hooks false. Browser checks verify `__GAME_TEST__` and `__ADV_TEST__` are absent in the actual built candidate.
- Added restrictive CSP, no network connections from the game, nosniff/referrer/permissions headers, and preview-host-safe serving. The CSP permits inline *styles* for existing dynamic functional layout, not inline scripts or eval. Arena framing remains allowed.
- Added a fail-closed release builder: exact code allowlist, asset licence/hash checks, static dependency checks, legacy-path exclusion, safe file checks, deterministic ZIP timestamps, readback verification and per-file manifests. The previous catch-all ZIP tool now delegates to this builder.
- Updated the Android Gradle source set to package the validated `dist/web` tree rather than all inherited assets. The pre-build invokes the web builder. Candidate app version is 0.19.0-rc.1/code 20; app ID is unchanged. **Subsequent CI build/lint/simulated tests and API 33/36 emulator instrumentation now pass; physical-device validation and production signing remain outstanding.**
- Added a serial verification runner, CI workflow, machine-readable QA output, and an approval gate that requires artifact-bound human/device evidence. No approvals were fabricated.

## Fresh automated coverage

The consolidated `npm test` run passed **17/17 checks**:

1. JavaScript lint.
2. Release build and source-asset integrity.
3. Save validation/recovery/quota/backup/rollback unit cases.
4. All 48 Classic solver paths, caught/undo/persistence and responsive board checks.
5. All 48 Classic routes played to completion, stars/unlocks and reload persistence.
6. HTTP and local-file startup.
7. All 24 Adventure completions, keyboard/pointer hold, jumping, pause, save/reload and Classic switching.
8. All 24 Adventure routes with all three collectibles via simulated physics controls.
9. All six special deliveries, bridge/buddy/secret, scrapbook, customization and saved selections.
10. Fragile/bouncy parcel mechanics.
11. Multi-pointer movement/jump.
12. Offline-file play, save reload and blocked-storage fallback.
13. Mocked audio pause/resume/mode-switch lifecycle.
14. Real browser decoding/play start for all six sourced audio files. This is **not listening by ear**.
15. Four landscape viewports, input sizes, canvas fitting and orientation bridge.
16. Five-viewport menus/24 route renders/control/save/resource checks.
17. Actual built RC: deterministic rebuild, complete file hashes, no exposed test APIs, CSP headers, 24 Adventure + 48 Classic UI route starts at three sizes, browser backup download, rejected invalid import, explicit-confirmation restore/reload and no captured console/page/resource errors.

Normal Playwright browser download was blocked by this environment's network allowlist; a temporary npm-distributed Chromium and bundled libraries supplied the headless browser. CI uses normal Playwright installation. All results are browser automation, not phone/human QA.

The first consolidated run exposed a regression: the initial blocked-storage warning was hidden because the new store's blocked state was not propagated to Adventure. This was fixed by querying write availability; the original blocked-storage assertion then passed, followed by a fresh full 17/17 run. The assertion was not removed.

Earlier historical visual tests that assume old art composition are not all included in this current regression set. Updated audio and landscape assertions retain their behavioural requirements, but point at the new source files and reserved play surface instead of the old overlay layout.

## What ships versus what remains in source

The release ZIP is approximately **0.95 MB**, versus roughly 20 MB of inherited web source assets. It contains only the new allowlist and notices. The development workbench still retains obsolete source assets; they are not in the release tree or Android's new asset source set. Do not distribute the whole workbench.

All imported files match documented originals and carry CC0/OFL notices. This establishes recorded provenance and licence evidence, not independent proof of every creator's production method, worldwide legal clearance, or trademark approval. Owner review remains a release gate.

## Required external evidence — cannot be claimed from this sandbox

### Web
- Independent human playtest and visual approval, including postal identity, character changes, special-mechanic clarity and target-screen readability.
- Accessibility review using keyboard and relevant assistive technology, contrast checks and target-browser testing.
- Review exact asset notices/source evidence, no-AI restrictions, title/publisher naming and any applicable platform/legal obligations.
- Final privacy/contact information and the chosen host's access-log/cookie practices. The game itself contains no account/analytics/ad SDK, but that is not a universal privacy-law certification.
- Owner-authorized stable deployment and checks at its final origin. Progress is origin-specific; keep backups during migration.

### Android
- Redacted original Android 13 crash/exit logs, actual phone model, WebView provider/version and installed app version. Diagnose the cause and verify a targeted fix on the affected phone. The existing renderer-recovery handler is not evidence of the cause or a fix.
- Installed **public** signing-certificate fingerprint, owner-managed compatible release signing, version-code/update-eligibility checks and verification of actual signed artifacts. Never place keys/passwords in chat or the repository.
- Supported-device matrix: cold launch, background/resume, orientation, audio focus, interruptions, long sessions, touch/accessibility, performance and update-with-save-preservation.
- Native file export/import requires separate implementation or explicit product acceptance; browser backup tooling is not claimed to work in the current WebView wrapper.

## Approval process

`docs/release-approval.json` deliberately contains no approvals. Reviewers should record only genuine sign-off and references to redacted evidence, tied to the exact archive SHA-256. Do not commit private logs or signing material.

Run `npm run release:check` for the combined web/Android gate, or `python3 tools/release_gate.py --web` for web-only readiness. Both are expected to fail until their respective evidence exists. An automated gate can check that evidence is recorded; it cannot determine whether a human sign-off is truthful. Publishing still requires owner authorization.

## Final run record

The self-managed runner was also exercised with no pre-existing servers. Its final 17/17 result, exact archive hash and durations are recorded in `LATEST_WEB_QA.json`. A new restore UI test initially raced asynchronous `File.text()` completion on the portrait viewport; it was corrected to wait for the confirmation control before asserting. No application behaviour was changed to manufacture that pass. The final run includes successful confirmed restore/reload at all three built-RC viewports.

The production gate was run and correctly failed only on unrecorded human/owner/device evidence; automated QA matches the current archive. See `ANDROID_RELEASE.md` for the remaining native process.
