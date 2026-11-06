# 1.0.0-rc.1 — The Lantern Round

This is a **1.0 release candidate**, not a declaration that every bug is fixed or that the app is approved for production. Version numbers are not percentages; moving from 0.22 to a 1.0 candidate does not require 78 intermediate releases.

## Implemented campaign upgrade

- A connected lantern-festival story: 24 authored dispatch notes and earned neighbour replies across five chapters. The story follows invitations, supplies, a missing lantern lens, the harbour bell and a shared hilltop celebration. Replies are revealed from existing completed-route progress, not an unrelated save ledger.
- Chapter introductions and original creator panoramas; five direct district jumps; filters for all routes, unfinished unlocked deliveries and earned routes with stars left to improve. Cards show actual difficulty, mechanics, parcel purpose, ratings and recorded Express clears.
- **24 Express variants**, not 24 newly drawn level layouts: 1.4× mouse speed, 1.25× moving-bridge speed, shorter greeting calm/recovery windows, and all three stars required at the final door. Main-route geometry and jump controls are preserved. Express is optional, applies on the next main-route start and cannot change mid-run. Specials retain their own rules. Standard ratings/unlocks stay compatible; Express ratings have a separate bounded save record.
- Original Kenney animated flag frames, extended-spring feedback at actual launches, quicker authored walk cycles, cloud/panorama multiply compositing and eased parcel hand-off. Reduced-motion/effects preferences suppress decorative animation. No new drawn or AI-generated illustration was used.
- Three additional original, unmodified, CC0 chapter panoramas downloaded from an immutable Kenney mirror. Sources/hashes are in `v1-background-assets.json`, added to the release allowlist and credits. Original image bytes are preserved; blending/placement happen at runtime.
- Includes the earlier soundscape, independent audio levels, route field notes, safe nested Back navigation, 11 earned honours and next-dispatch recommendations.

## Verification

22/22 engine/UI checks passed. Full simulated-input clears cover all 24 Standard routes at three stars and all 24 Express variants at three stars. Express records survive reload; a missing-star Express run is refused at the final door. Tests also cover story coverage, district filters/navigation, sealed replies, immutable difficulty settings/level geometry, authored frame selection, reduced-motion poses, prior saves, all six specials, Classic's 48 puzzles, offline startup, phone layouts and deterministic payload integrity. Android host tooling: 13/13 tests pass.

Exact internal payload identity and per-check results: `LATEST_WEB_QA.json`. Map and gameplay images were inspected locally for layout/compositing, not treated as physical-device evidence. Native run 42054211954 also passed build/lint/simulated checks, finished APK/AAB size gates and both instrumentation tests on each API 33/36 emulator. Exact APK size: 2,771,465 bytes (2.77 MB). Native build identity and artifact hashes are recorded separately in `device-evidence/android-ci-run.json` and `ANDROID_BUILD_HANDOFF.md`. This does not establish physical-phone, signing or owner approval.

## Remaining release requirements

- The owner's requested **20 MB minimum / roughly 50 MB preferred** content target is **not met**. No padding, duplicated tracks or upconverted audio was added. The finished APK's actual size must be reported from its build. The 100,000,000-byte APK/AAB maximum remains enforced.
- Production signing identity and compatible installation/update path are not configured or approved. Do not publish a debug/test-signed candidate as a production release.
- Physical-phone play feel, animation/audio review, long-session/lifecycle performance, original affected Android 13 crash diagnosis and final owner/store approvals remain outstanding. Automated clears do not prove perfect difficulty or zero bugs.
- Native backup document handling remains unsupported. Do not uninstall/clear the affected old installation to work around signing or investigate its crash.

No human/device/legal/store approval flags were changed. See `RELEASE_SIGNING.md` for the secure owner-controlled production build path. Never paste signing keys or passwords into chat.
