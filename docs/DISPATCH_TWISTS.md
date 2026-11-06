# Dispatch variety and character/world polish — rc.4 / Android code 103

## What changed

### Optional twists, not compulsory punishment

After the first two Standard routes, the route book offers:

- **Windshift:** the marked breeze zone reverses direction every four seconds. Signs and the live rule banner show the condition; players can time their crossing rather than only holding right.
- **Handle with care:** delicate cargo must survive gentle landings. This replay is offered only on flat, spring-free routes without moving bridges; unsuitable routes are visibly disabled instead of offering an unreviewed cargo combination.
- **Runaway cargo:** hard landings drop the parcel and require recovery before delivery.

Standard remains the default. Existing doors, switches, keys and route geometry are preserved. Specials ignore the selected twist and keep their own authored rules. A run's twist is fixed at start. The home dispatch and route-book recommendation select a suitable unlocked route, including when fragile cargo is selected.

Twist records are stored separately in validated `twistBest` maps, included in backup/restore. They do **not** unlock Standard routes, award Standard/Express stars, or grant campaign honours. The completion screen identifies a twist result and returns to route choice rather than accidentally starting a locked next campaign route. No timer, energy system, account, FOMO reward or network dependency was added.

### Characters with clearer identities

Courier cards now show personality, practical specialities, clearer selected state and a consistent portrait presentation:

- Pip: balanced all-rounder.
- Kit: stronger second jump.
- Alex: reduced conveyor drift.

These describe existing real abilities, not invented upgrades. Full character sprite replacement was **not** done in this pass; the original creator-made characters remain. A later coherent cast replacement still needs licensed source assets and visual review.

### A more inhabited world and clearer route book

Original Kenney sprites add recipients beside safe door locations, a delivery thank-you, fences, rocks and more planting variation. Placement avoids crate collisions, gaps and checkpoint space. These are visual additions, not invisible obstacles.

District headers, original-sprite navigation icons, route statuses, condition selection and per-twist record labels improve the map/route-book presentation. This remains a functional route book, not a newly illustrated overworld map.

**No generated art or self-drawn replacement illustration.** All illustrated pixels reuse unchanged original assets already recorded in the release manifest. The shipped asset allowlist remains 161 files/notices.

## Verification

- **26/26** complete local engine/UI/build checks passed for rc.4.
- New tests execute all three twist clears using actual movement/jump controls on route 1 at 844×390, 568×320 and 390×844, checking separate records and unchanged Standard progress.
- Pure tests check wind reversal/boundaries, immutable level definitions, cargo precedence and fragile eligibility.
- Regression tests check that a switch route still starts with its bridge inactive, Specials ignore the chosen twist, and Home starts an eligible cargo route instead of becoming a dead button.
- Save tests check bounded twist ratings, rejected invalid entries and backup round-trip.
- Existing 24-route Standard/Express campaigns, Classic, specials, offline/audio, native-progress mocks and deterministic packaging suites still pass.
- QA captures: `docs/audits/dispatch-update/` (browser screenshots, not physical-phone evidence).

**Limits:** these are not 72 complete twist-route playthroughs or physical-phone difficulty approval. Wind timing and cargo recovery still need human balancing. The character sprites have not been replaced; UI/identity, recipients and scenery received this first polish pass.

## APK/source binding

rc.4 / code 103 is a new candidate. Native CI must build and test this exact source; the earlier rc.3 APK does not contain these gameplay changes. No new public/stable release or production approval is implied. Signing history, phone-testing and GitHub rename/publication permission blockers remain as recorded in the previous handoff.
