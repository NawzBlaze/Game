# Professional mobile upgrade — implementation status

## Owner's target

A richer, detailed, entirely local/offline mobile game, with at least 20 MB of meaningful packaged content, approximately 50 MB preferred, and no finished APK/AAB over 100,000,000 bytes. Original freely licensed creator artwork/audio only; ordinary interface styling is allowed. File padding, duplicated recordings and inflating compressed assets are not quality improvements.

## First implemented batch: 0.21.0-rc.1 / Android code 22

- Five districts now select distinct original Kenney Music Loops tracks; optional specials have their own music. The dispatch office retains its existing track. One reused music player prevents overlapping district tracks and avoids preloading an entire soundtrack into RAM.
- Adventure settings offer independent live music/effect levels, a district soundtrack switch and an accurate selected-track label. Zero music volume pauses the player. Master mute and native/visibility pauses remain in effect. All recordings stay bundled offline.
- Volume/soundtrack preferences are validated, bounded and saved using the existing safe local save store. Legacy saves acquire defaults without losing routes, ratings, unlocks or customization. Backup/restore validation includes the new preferences.
- In-route Help now includes a contextual field guide: district advice, parcel/star/checkpoint checklist, and tips based on actual route mechanics (keys, two-stop deliveries, moving platforms, belts, springs, mice and special-parcel rules). Notes do not replace or obscure play controls.
- The route book shows delivered/total and earned/possible stars for each district.
- Six additional unmodified original Ogg recordings are traced to immutable upstream Git blobs and verified by SHA-256. Existing CC0 notices are bundled; credits updated. No generated illustration was introduced.
- Workflow branch filters now include active Arena branches rather than only an earlier branch name.

## Verification

19/19 serial engine/UI checks pass, including a new regression for district/special track selection, single-player reuse, zero-volume pause, persisted independent gains and soundtrack preferences, old-progress preservation and contextual route notes. Real browser decoders started all twelve bundled audio files; this is format validation, not an ear-quality review. Existing all-route, special-mechanic, mobile safe-area/controls, offline, release integrity and audio-mode switching checks still pass. Android host tooling: 13/13 tests pass.

`LATEST_WEB_QA.json` binds the engine checks to this version's actual payload. The 0.21 Android build/lint/simulated tests and two instrumentation tests on each API 33/36 emulator passed in run 41993357076. The exact test APK is 2,750,353 bytes; hashes and source binding are in `device-evidence/android-ci-run-0.21.json`. Historical 0.20 evidence is preserved separately. No physical-phone or production approval is implied.

## Not complete / do not call this final

This batch adds about 1.66 MB of real audio content. The new 20 MB minimum and preferred 50 MB content target are **not met**. Android APK size must be measured from its finished build, not inferred from the internal web ZIP.

Further work: broader level/environment variety, richer creator-made animation/scene details, better feedback and longer curated sound beds, followed by performance and long-session phone play. These are planned, not implemented features. Reaching a byte count alone is not a completion test.

No production key, owner approval, physical-phone approval or store submission was supplied or performed. The historical Android 13 phone's original crash is still unverified; do not clear/uninstall that installation to try a preview. Native backup file handling remains unsupported. The 100 MB artifact ceiling and explicit owner-signing guard remain unchanged. Human/device evidence must never be marked approved from automated tests.
