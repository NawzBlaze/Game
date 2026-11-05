# Mobile APK interface redesign — 0.20.0-rc.1

Product target: **Android mobile APK**, version code **21**. Browser previews and the static ZIP are internal WebView development/verification tools, not a desktop/web product release.

## Implemented

- Replaced the layered, conflicting Adventure presentation CSS with a single mobile design system: compact landscape home, source-image button faces, consistent navy/blue/green palette and larger labelled controls.
- Downloaded original Kenney **UI Pack 2.0** and **Mobile Controls 1.0** images and notices. Both licences explicitly allow commercial use under CC0. Source URLs, pinned commit and SHA-256 values are recorded in `mobile-ui-assets.json`; all 146 shipped asset/licence files are allowlisted and hash-validated by the builder. No AI-generated or newly drawn decorative artwork was added.
- The home screen's core actions fit 568×320 without scrolling when running with the Android bridge. Browser-only backup tooling is not exposed in the APK, because Android document import/export has not been implemented/verified.
- Consistent source-image skins cover Adventure and retained Classic puzzle UI. Classic delivery objects now use the same yellow parcel asset; its direction arrows use the downloaded control icon.
- Compact HUD and larger independent thumb controls. A read-only render offset leaves a ground strip so controls no longer cover the courier's feet. Collision coordinates, movement rules and save formats are unchanged.
- Pause now fits short landscape displays, with secondary actions in two columns. Nested Settings/Credits/Help return through the prior dialog on Android Back instead of unexpectedly resuming/exiting.
- Settings sound labels update correctly. Android credits no longer expose a blocked text-file navigation; original notices remain bundled.
- Native safe-area variables protect Adventure controls/header; Classic adds top-cutout padding. Android startup/recovery colours now match the game. The original Kenney launcher PNG is wrapped in standard Android adaptive/legacy icon resources, without drawing replacement artwork. Viewport-height fallbacks remain for older WebViews.
- Classic puzzle layout was compacted after screenshot review found its direction controls below the phone screen. Its movement buttons now share a horizontal row and fit 320×590 and 390×844 without scrolling to reach them.

## Regression evidence

`docs/LATEST_WEB_QA.json` records **18/18** fresh engine/UI checks against this exact 0.20 payload, including all main Adventure routes, all special deliveries, all-star checks, all 48 Classic puzzles, save handling, audio, touch and packaged-payload verification.

New mobile-specific checks cover 568×320, 844×390, 960×432 Adventure layouts and 320×590 / 390×844 Classic layouts: reachable buttons, 44px-or-larger actions, 60px-or-larger Adventure thumb controls, courier-foot clearance, simulated native cutouts, source-file hashes, and Android-style nested Back behavior.

The native instrumentation smoke test has been expanded to inject real touchscreen events into WebView, verify movement, exercise pause/settings/back, check on-screen menu bounds and preserve saves through Activity recreation. It also captures home/game/pause screenshots from each disposable emulator. Hardware Back is consumed once at the Activity boundary before WebView can also receive it; an additional simulated-framework regression checks one dispatch per Back pair. Native build/run results and artifact identities are tracked separately in `device-evidence/android-ci-run.json` and `ANDROID_BUILD_HANDOFF.md`.

Screenshot inspection in the local mobile preview covered Adventure home/game/route book/pause and Classic gameplay. Generated screenshots are QA output, not shipped game artwork. Native emulator screenshots are CI evidence, not a substitute for physical-phone inspection.

## Not claimed complete

This pass does not establish that every user-reported bug is fixed; specific remaining issues require reproduction/screenshots. Physical-phone testing, the historical installed Android 13 crash, production signing/update compatibility, native backup document handling, store assets, physical adaptive-icon inspection and independent play/accessibility/owner approvals remain outstanding. Existing approvals stay false. Debug APKs must not replace the affected installation.
