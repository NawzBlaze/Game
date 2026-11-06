# Android APK handoff — 1.0.0-rc.3 / code 102

> **New source:** rc.4 / code 103 adds [dispatch twists and character/world polish](DISPATCH_TWISTS.md). It has passed 26 local checks but needs its own native CI result. The rc.3 download below is historical and does not include these changes.

The final product target is an offline mobile **Android APK**, not a browser/desktop package.

## Verified test candidate

[Download the APK artifact ZIP](https://github.com/NawzBlaze/Game/actions/runs/42175617339/artifacts/13483102904) and extract `little-parcel-crew-1.0.0-rc.3-preview.apk`. GitHub login may be required; artifacts expire according to the run's retention policy.

| Item | Verified value |
|---|---|
| Native source | `286ecfe7d22d6df0e8a97ea715f957bef867c8f3` |
| Native run | [42175617339](https://github.com/NawzBlaze/Game/actions/runs/42175617339) |
| Build / API 33 / API 36 | All successful |
| Finished APK bytes | **53,039,043** — within 20–100 MB |
| APK SHA-256 | `80c96dd7cb7468481cae55a76c18b36d031a8443052259d1bf80e43a45c5d041` |
| Signing | Debug/test only — **not a production-signed update** |

Do **not** uninstall, clear data or overwrite the previously affected existing installation to try this APK. Use a separate clean test phone. The package ID remains `com.onestepdelivery.game`; a matching package ID does not establish certificate/update compatibility.

The sandbox cannot download GitHub's artifact blob host, so the APK is linked rather than attached locally. Ignore unsigned build artifacts when looking for an installable preview.

## Implemented and tested

- Safe original-origin WebView startup/recovery and offline package allowlisting.
- 24-route campaign, Express variants, six specials, Classic, letters, honours and original licensed soundtrack.
- Older-WebView save fix, truthful mastery ratings, accessible Adventure dialog names and low-effects walking correction.
- Native progress documents using the system picker, bounded UTF-8 I/O, confirmation-before-restore and pre-restore recovery.
- Landscape route-book side controls, optional chapter details and sticky backup Close action.
- In-game privacy/support and a stricter production gate that verifies actual signed APK/certificate/payload binding.

Local verification: **25/25** engine/UI/build checks, **14/14** Android host-tooling tests, **6/6** production-gate safety tests, zero known npm audit findings. Native CI additionally passed lint/JVM tests and two real WebView instrumentation tests on each API 33/36 emulator. The progress UI and hardware Back were exercised; **actual document-provider file round-trip is not claimed**.

The first rc.3 attempt failed an immediate progress-entry assertion before the final UI module was ready. It is recorded as a failure, not hidden. The amended test waits for that capability without removing the assertion, and the exact amended native run above passed.

## Evidence and unresolved public-release gates

- [Current native receipt](device-evidence/android-ci-run.json); [previous rc.2 receipt](device-evidence/android-ci-run-rc2.json).
- [Third inspection/fix report](audits/03-release-hardening.md).
- [Production signing and final APK gate](RELEASE_SIGNING.md).
- [Privacy information for publisher review](PRIVACY.md).

Public release still requires owner-controlled signing; first-release/update identity confirmation; compatible signed-update/save-retention evidence where applicable; physical affected-phone/performance/audio/accessibility tests; actual document-provider round-trip; human visual/gameplay approval and publisher/legal information. Art-direction concerns are still listed in the audit, not falsely marked resolved. `docs/release-approval.json` remains unapproved.

Keep the affected phone untouched and use the [read-only diagnostic quick start](device-evidence/QUICK_START.md). No production key was created or requested in chat, no gate was bypassed, and no public release/store submission was performed.
