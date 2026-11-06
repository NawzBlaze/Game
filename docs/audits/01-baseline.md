# Professional-quality audit — baseline

Date: 2026-11-06. Baseline source: `3db86dc`, version 1.0.0-rc.2.

## Verdict

**A functioning offline release candidate, not a proven production-quality finished game.** More content and a larger APK do not establish professional quality. The creator-made Kenney assets have traceable licences, but a stock platformer visual language, generic parcel/courier representation and repeated composition do not yet establish a distinctive postal world. “AI-looking” describes perceived inconsistency/generic presentation here; it is not evidence that the shipped artwork was AI-generated.

This report precedes the changes in this audit cycle. See [reinspection](02-reinspection.md) for actual outcomes, not assumed fixes.

## Coverage: what “every file” means

[Baseline inventory](01-baseline-inventory.json) records **all 728 tracked baseline files**, their sizes, SHA-256 hashes, roles and asset metadata. Counts: 18 allowlisted web runtime files; 10 Android/build files; 161 shipped assets/notices; 335 excluded legacy assets; 118 tests/evidence files; 41 tools; 3 excluded web files; 42 documentation/configuration files. Audit outputs are excluded from their own recursive inventory.

All 161 shipped files match their declared hashes. Shipped asset bytes: 53,012,369. Excluded historical assets: 19,123,328 bytes; these are **not extra APK content**. PNG headers/dimensions, Ogg headers, WAV metadata and Python syntax are machine checked by `tools/audit_repository.py`. Full regression tests also exercise original soundtrack decoding, offline assets, the campaign, controls, saves and release allowlisting.

**Not claimed:** a manual line-by-line review of every historical test/tool, a manual pixel-by-pixel review of every sprite, subjective listening approval, physical-phone performance certification, or proof of no bugs. The ledger explicitly labels this limitation on every record. Targeted code review covers save/recovery, mastery, renderer motion, dialog creation, compatibility guard, Android host lifecycle/navigation, audio routing, packaging and test runner. Automated coverage is not interchangeable with human review. Historical tools may contain generated-art workflows: they are not permission to run them or replace the current original assets.

## Confirmed findings and change plan

| ID | Priority | Finding and impact | Required action / acceptance |
|---|---|---|---|
| SAVE-01 | P1 | `save-store.js` calls `Object.hasOwn`, absent on Chromium/WebView before 93. The compatibility guard can admit earlier WebViews. Valid progress can take the damage/recovery path; backup validation fails. | Replace with safe own-property helper. In a VM without `Object.hasOwn`, preserve valid progress, avoid false recovery, and successfully parse/restore backup. |
| DATA-01 | P2 | Mastery clamps an invalid integer rating (99) to 3. It can award honours from invalid direct input, although normal saved data has a validator. | Reject values outside 0–3; test invalid route and special ratings, without mutating input. |
| A11Y-01 | P2 | Adventure dialog has a role but no accessible name. Visible heading alone does not programmatically name the dialog. | Bind dialog to the current heading on every open; check accessible role/name across settings, pause and help transitions. |
| VIS-01 | P2 | Disabling extra decorative effects also freezes the courier's grounded walk pose, while neighbours still animate. This makes motion look like sliding rather than walking. | Preserve functional walk animation when extras are off; retain the separate reduced-motion preference. Test both states using original sprite requests. |
| QA-01 | P2 | Verification success hardcodes exactly 23 results, making future additions misleading unless a second number is maintained. | Derive the expected count from the configured suite plus preflight checks; full suite must still fail for any failing check. |
| REL-01 | P1 release gate | Handoff/approval records still refer to older candidates. Successful rc.2 CI is not signed production or physical-device approval. | Clearly separate verified historical build from modified working tree; do not carry old approvals forward. |

Priority definitions: P1 = data/release risk; P2 = user-facing quality or maintainability; P3 = optional polish. No confirmed P0 is asserted from this review.

## Professional comparison and improvement/replacement/addition backlog

Reference bar: a polished small offline mobile platformer/puzzle game, **not** a requirement to copy a named commercial game or add accounts, ads, 3D graphics or inflated file size.

| Area | Present | Gap / improve, replace, add or change | Priority and acceptance |
|---|---|---|---|
| Art direction | Original Kenney platformer/UI/control assets, Nunito font, licensed source ledger | **Improve:** establish one art bible: palette, stroke/shape language, camera scale, text hierarchy, lighting and allowed UI assets. **Replace:** generic postal stand-ins only with suitable original creator assets, never generated replacement illustrations. | P1 visual; approved phone captures of home, route, map, results and Classic must read as one product. |
| Identity | Delivery premise, chapters, letters and honours | **Add:** recognisable postal identity, recipient feedback and a clearer final-delivery payoff. Stock scenery alone is not a compelling world. | P2; player can identify recipient/objective and understand the campaign ending without developer explanation. |
| Composition | Multiple source panoramas and chapter routes | **Improve:** scene rhythm, foreground/background contrast, prop density and objective silhouettes. Repeated scenery/layout can still feel assembled. | P2; review every chapter at start/middle/end and every special on phone, not just menu screenshots. |
| Buttons and menus | Touch controls, UI hierarchy, back navigation, scrollable dialogs | **Improve:** spacing/density, consistent control states and icon meaning. Do not solve the user's concern with another mismatched button pack. | P1 visual; no clipped/overlapping text, reachable primary/Back actions at small landscape and enlarged text. Human aesthetic sign-off required. |
| Motion/feedback | Authored character frames, delivery animation, effects toggles | **Change:** separate essential motion from decorative effects (VIS-01). **Add later:** coherent pickup/hit/checkpoint feedback using existing creator assets. | P2; reduced motion remains respected; no input-blocking flourishes. |
| Content and pacing | 24 main routes, Express variants, six specials, Classic puzzles, optional stars | **Improve:** human difficulty curve, variety and checkpoint placement. Variant counts are not equivalent to wholly distinct levels. | P1 playtest; record completion times, retries, confusion and enjoyment from new players; tune against evidence. |
| Audio | Five full original composer WAVs, optional Cozy loops, effects/volume controls | **Improve:** human listening check for loudness, loop seams, chapter mood and effect masking. Large PCM files meet the user's size constraint but do not establish a better mix. | P2; headphone and phone-speaker checks, interruptions/background/resume on target devices. No ear approval claimed. |
| Progress/recovery | Validated local saves, corrupt-original preservation, browser backup | **Fix:** SAVE-01. **Add:** safe Android export/import or documented recovery path. Browser-only backup is not an Android backup feature. Adventure route progress is not full mid-run persistence. | P1; restore round-trip and existing-install upgrade tests without uninstall/clear-data. |
| Accessibility | Touch buttons, keyboard support, some ARIA, reduced motion | **Fix:** A11Y-01. **Improve:** TalkBack menu traversal, contrast/text scaling, alternate input and non-colour cues. | P1 validation; physical TalkBack/manual audit remains required; do not claim full game accessibility. |
| Engineering | Allowlisted offline package, automated campaign/UI checks, native emulator checks | **Improve:** long compressed runtime functions and historical tooling/test sprawl; prefer focused modules and documented active tests. | P2; incremental refactor with equivalence/regression tests, not a risky total rewrite. |
| Performance | Culling and existing performance tests | **Add evidence:** low-end physical-device frame pacing, memory, thermal/battery and cold-start budget; music decode memory as well as file bytes. | P1 release; repeatable device profiles, no extrapolation from desktop Chromium. |
| Reliability | Android lifecycle/back/navigation logic and API 33/36 emulators | **Add evidence:** original reported physical crash reproduction, Android minimum-supported/older WebView matrix, phone-call/audio interruption and process-death tests. | P1 release; retain data and complete repeated cold launches on actual hardware. |
| Release/operations | Build/size checks, credits, release gate, CI | **Change:** stale candidate metadata. **Add:** signed upgrade/install evidence, store screenshots/description, privacy/support information and owner approval. | P1; candidate-bound approvals, no secrets in repository/chat. |
| Player research | Developer/automated checks | **Add:** small external playtest and issue triage with captures, device model and steps. | P1 quality; testing must include people unfamiliar with the controls. |

## Safe implementation boundary

This cycle fixes confirmed, reproducible defects above, then reruns checks and writes a revised report. It does not invent new artwork, remove original assets, fabricate player approval, hide the remaining backlog or claim that an endless autonomous loop is running. Further visual replacement needs an actual licensed source and a coherent direction; blindly replacing all art again would repeat the mismatch problem.

## Historical native evidence

The unchanged baseline rc.2 APK is **53,032,215 bytes**, SHA-256 `51c1a8118c20b85fb7e62292b4799b6e2053071e4a9b519f453c0cc2e7682022`, from successful native run [42164619926](https://github.com/NawzBlaze/Game/actions/runs/42164619926), source `3db86dc`. Build and API 33/36 jobs passed. This proves the size gate for that APK, not native approval of subsequent changes. Production signing and physical-device approvals remain open.
