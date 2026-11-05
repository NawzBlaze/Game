# Premium-polish implementation — 0.22.0-rc.1 / Android code 23

## Implemented

- **11 earned courier honours:** first delivery; five district postmarks; all 24 routes; all 72 route-rating stars; six completed specials; six no-reset specials; a discovered secret on a completed special. Only real existing route progress counts. Each honour shows its requirement, progress and earned state using existing original Kenney sprites.
- **Scrapbook presentation:** a responsive honours collection plus the existing twelve story memories. Existing memory unlock rules and all saves remain intact.
- **Next dispatch:** the route book suggests a currently unlocked, uncompleted route first, then an optional replay for a better rating. A perfect-campaign message requires a genuinely completed 24-route round, not merely perfect early routes. The action starts the suggested route directly.
- **Completion feedback:** newly earned honours appear alongside personal-best and courier unlock feedback. Honours are derived rather than kept in another save ledger, so old saves, restored saves and gameplay cannot disagree about awards.
- **Mobile dialogs:** settings/help/credits have a persistent Back toolbar inside the scrollable card. Back preserves nested Settings/Pause navigation. Opening another dialog resets its scroll position; players are not stranded at the bottom of old content. Pause action layout is unchanged.
- **Loading fix:** the home parcel image now receives its saved-selection source once, rather than fetching an initial placeholder and aborting it immediately during startup. No failed-request assertion was weakened to mask this race.
- No generated illustrations, inflated assets, duplicate audio or runtime downloads were introduced. Existing creators' sprites are reused; UI layout is ordinary CSS/HTML.

## Verification performed

20/20 automated engine/UI checks passed for 0.22. Exact payload identity: `LATEST_WEB_QA.json`. New tests cover all eleven honours, complete/partial progress, secret/clean prerequisites, non-mutating calculations, next-route priority, two phone layouts, actual recommendation navigation, sticky Back after scrolling, nested Back and fresh dialog scroll position. Existing full campaign, all Adventure routes/specials, local/offline play, audio, safe-area/thumb controls and deterministic release packaging checks still pass.

Landscape honours and scrolled settings screenshots were inspected locally as internal QA, not supplied as game artwork or final product.

## Not established

This is a polish pass, **not** completion of the requested premium game. The 20 MB minimum / approximately 50 MB preferred content budget is still unmet; the 100 MB maximum remains enforced by Android build tooling. Environment/content/animation expansion remains future work, not a shipped claim.

The internal payload ZIP is not an APK. No 0.22 native Android build, emulator test, production signing, physical-phone review or store submission was performed in this pass. Existing `ANDROID_BUILD_HANDOFF.md` and Android evidence refer to the prior 0.21 candidate; do not relabel that APK as 0.22. The original affected Android 13 phone remains unverified. No owner/device approval flags were changed.
