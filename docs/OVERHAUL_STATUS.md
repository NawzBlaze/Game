# Adventure art overhaul — 2026-11-01

**Historical first-pass report. Superseded by [PRODUCTION_READINESS.md](PRODUCTION_READINESS.md) for current Classic, customization, packaging and test status.**

## Source and constraint

Restored the `little-parcel-crew` source from `LPC-final-ship-BLOCKED-handoff.zip` in the owner's Google Drive. The repository previously contained only a README. Preserved the Android wrapper, Classic game, test suite and historical tools. No signing secrets were introduced and no Drive files were overwritten.

The owner's constraint is downloaded, free creator-made artwork, not generated or self-drawn replacement illustration. The replacement renderer uses unmodified Kenney New Platformer Pack 1.1 Double-resolution PNGs from the `eturner58/game-assets` mirror. The immutable commit, per-file URLs, SHA-256 values and original CC0 notice are recorded in `kenney-assets.json` and `web/assets/kenney/License.txt`. Kenney's upstream pack page is https://kenney.nl/assets/new-platformer-pack. No endorsement is implied. A licence notice is not an independent audit of every creator's production process.

UI work is functional layout, typography, text, borders and control states; it does not introduce new illustrated scenery, SVG icons, textures or generated artwork. Existing Nunito font remains bundled with its OFL notice. Legacy art/audio has not received new blanket clearance.

## Implemented

- Restored playable source into the tracked repository.
- Downloaded 94 PNGs plus original licence, with a complete 95-file hash manifest.
- Replaced the active Adventure canvas renderer, rather than placing a new skin over the old artwork. Removed old painterly/KayKit/Quaternius preload code and the disabled Harbour-specific renderer from `adventure.js`.
- Introduced a read-only, separate `parcel-renderer.js`; route physics, collision layouts, save keys and courier abilities stay in the original gameplay module.
- Matching terrain, background panoramas, flags, animated courier poses, animated mouse neighbours, bridges, crates, stars, gates, switches and destination doors across all 24 routes.
- Replaced home collage and stale route-book screenshot art with source pack assets. Removed the hand-drawn SVG brand mark from Adventure home.
- Reworked Adventure home, route book, courier selection, challenges, scrapbook, HUD, controls and dialogs around a restrained functional interface.
- Removed old procedural illustration/effect drawing from the active renderer. Existing particle simulation remains invisible; it can be removed in a separate gameplay cleanup.
- Canvas sizing follows the actual viewport through ResizeObserver; controls no longer steal/crop the play surface on small landscape screens.
- Asset alpha-bound metadata removes transparent character padding at draw time. Source images are unchanged.
- Preserved accessory save values. Old accessory options are intentionally withheld rather than claiming that incompatible old art matches the new family.
- Added five-viewport presentation/resource/save/asset-integrity checks.

## Fresh verification in this environment

Chromium was supplied using a temporary npm-hosted `@sparticuz/chromium` installation because the normal Playwright browser CDN is not reachable here. Browser libraries were extracted locally. This is headless browser verification, not Android device testing.

| Check | Result |
| --- | --- |
| `npm run lint` | Passed |
| `tests/presentation.js` | Passed at 1280x800, 915x412, 568x320, 390x844, 320x590; all 24 route renders, menu navigation, resource loading, control sizes, old saved selections and 95 asset hashes |
| `tests/adventure.js` | Passed: all 24 route completions, keyboard/jump/pointer-hold/pause, save/reload, Classic smoke check, no captured errors/missing assets |
| `tests/all-stars.js` | Passed: all 24 routes completed with all three collectibles via simulated controls |
| `tests/multitouch.js` | Passed |
| `tests/startup.js` | Passed HTTP and offline-file startup |
| `tests/parcel-mechanics.js` | Passed fragile/bouncy parcel behaviour |
| `tests/offline-storage.js` | Passed local-file play/save reload and blocked-storage fallback |
| `tests/special-deliveries.js` | All six challenge gameplay completions succeeded, including buddy/secret; script then FAILED waiting for the deliberately withheld old `data-hat=cap` selector. This legacy cosmetics assertion has NOT been rewritten to manufacture a pass. |

Reviewed fresh screenshots of desktop home, portrait home/game and small-landscape gameplay. This is not independent human quality approval. Other historical tests, including old visual/cosmetics expectations, were not all rerun and must not be described as a passing full suite.

## Remaining work and release gates

1. Owner approval of the new art direction. This pass changes the couriers into the matching Kenney character family and dogs into mice; it is not an illustrated crocodile/pig overhaul. Collectible art is a star while legacy gameplay text still calls them stamps. Destination doors/flags replace the old mailbox/neighbour arrangement. No claim of $100,000 art quality or perfection is made.
2. Human level/readability review, more distinctive route compositions, richer sourced postal identity, and proper visual treatments for wind/fragile/gift mechanics. These are coherent foundations, not final world-building.
3. Find matching, permitted accessory artwork or agree on retiring/replacing the old customization feature. Keep its stored data intact throughout.
4. Classic remains the old edition. It and unused-but-bundled legacy images require separate replacement/removal and rights review before distribution. The static server exposes the whole candidate tree; it is a development preview, not a cleared distribution package.
5. Complete font/audio/remaining-asset provenance and required notices. No blanket no-AI certification is claimed for inherited content.
6. Trace and fix the original Android 13 crash on the affected device, verify signing/update compatibility without clearing saves, and perform real device lifecycle, performance, touch and accessibility tests.
7. Run the full relevant regression suite against the final accepted art, complete privacy/store review, create verified signed artifacts and use an owner-authorized production host.

No physical device was connected, no APK installed, no keystore created and no production distribution attempted in this iteration.
