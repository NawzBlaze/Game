# Game quality audit — fixes and reinspection

2026-11-06 · Android APK is the final product; browser captures below are QA tools only.

## Read this first

**Completed:** file census → baseline report → five code fixes with regression assertions → full automated retest → screenshot/asset review → release-metadata correction → inventory and release-gate recheck.

**Not completed:** a wholesale professional art redesign, exhaustive human review of every historical code line, physical-phone approval or a production release. This is a documented bounded improvement cycle, not an endless background loop. The game is safer and more accurately reported, but it is **not yet at the requested professional-quality finish**.

- [Detailed baseline and professional-feature gap matrix](01-baseline.md)
- [All 728 baseline files, hashes and classifications](01-baseline-inventory.json)
- [Reinspection inventory](02-reinspection-inventory.json)
- [Phone-screen review sheet](screen-review.png)
- Asset contact sheets: [1](asset-contact-1.png), [2](asset-contact-2.png), [3](asset-contact-3.png)

## 1. What actually changed

| Finding | Implemented change | Reinspection result |
|---|---|---|
| SAVE-01: older WebView save handling | Safe own-property helper replaces all three unsupported `Object.hasOwn` calls in save read/backup parse/restore. No save-schema change. | New test removes `Object.hasOwn` before loading the module: valid unlocks/stars remain, no false recovery notice, backup round-trip and later save succeed. Baseline reproduction returned unlock 1 instead of 8 and falsely created a recovery copy; corrected code preserves 8. |
| DATA-01: invalid earned honours | Reject ratings outside integer range 0–3 instead of converting 99 into 3. | Route and special records containing 99, -1, fractional/string values, NaN or Infinity earn no stars, completions or badges. Existing legitimate full-completion tests pass. |
| A11Y-01: unnamed Adventure dialogs | Every open binds the modal's accessible name to its current visible heading, with a generic fallback when none exists. | Browser role/name assertions pass for Settings and How to play, including nested navigation on 568×320 and 390×844. Not a substitute for physical TalkBack approval. |
| VIS-01: sliding courier in low-effects mode | Functional grounded walking no longer depends on decorative-extra-effects setting; OS reduced-motion still suppresses walk cycling. | Sprite-capture assertions observe original `character_green_walk_*` frames with extras off, and the idle pose with reduced motion. No artwork changed. |
| QA-01: hardcoded verification total | Expected result count derives from configured suites plus two preflight checks. | Full configured suite reports 23/23 successful results; no tests were removed. |
| REL-01: stale evidence | Native handoff and evidence now describe verified rc.2/code 101, correct size/hash/run/artifacts and 14 host tests. Approval version refreshed; approvals remain false and artifact binding remains unset. | Source-bound baseline and current modified payload are explicitly separated. Production gate remains blocked as intended. New native build of the fixes is still required. |

Changed runtime modules: `save-store.js`, `courier-mastery.js`, `parcel-renderer.js`, `adventure.js`. Added focused assertions to existing save, mastery and campaign suites. Added reproducible read-only inventory tool `tools/audit_repository.py`.

## 2. Test evidence

| Check | Observed result | Limitation |
|---|---|---|
| `npm test` with sandbox Chromium | **23/23 passed**, including lint/build and 21 test suites | Automated browser/engine checks, not physical gameplay approval |
| Android Python host tools | **14/14 passed** | Mocked/local tooling tests, not Android instrumentation |
| Source inventory | **728 baseline files**, zero reported inventory/hash/header/Python-syntax issues | Human review coverage is narrower and explicitly marked; audit evidence and the inventory tool itself are excluded from recursive hashing |
| Shipped assets | **161/161** hashes match allowlist | Integrity/provenance records, not independent legal counsel approval |
| Shipped PNG decode | **136/136** fully decoded, zero errors | Actual pixel decoding plus contact-sheet review; not every sprite inspected at native resolution |
| Phone captures | **16** captures, zero captured JS page errors and zero horizontal document overflow | 844×390 and 390×844 only; no claim of all screens/states/devices |
| `git diff --check` | Passed | Whitespace check only |
| Production release gate | **BLOCKED, expected** | Human, accessibility, rights, privacy, affected-phone crash, signed-update and supported-device approvals missing |

Current tested web-payload SHA-256: `6cd72ed3a60dc8520e2e9760f2024b7b092e1e66f76e731a1e9b432567864e95`. This is **not an APK hash**. Machine results are in `docs/LATEST_WEB_QA.json`, `screenshot-checks.json` and `image-decode-check.json`.

Reproduce:

```sh
python3 tools/audit_repository.py --output docs/audits/02-reinspection-inventory.json
npm test
python3 -m unittest discover -s tests -p 'test_android_*.py' -v
python3 tools/release_gate.py  # Expected failure until actual approvals exist
```

The sandbox test run additionally used `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH=/tmp/chromium` and `LD_LIBRARY_PATH="$PWD/.cache/chromium-libs/lib"`; other machines should use their installed Playwright browser. Contact sheets are QA derivatives of original images, not new game artwork and not added to the APK allowlist.

## 3. Visual reinspection: what still looks unfinished

### A. Genre/identity mismatch — high impact, still open

The contact sheets show coherent, original thick-outlined platformer sprites, but the couriers are visibly **space-helmet characters**. The game promises neighbourhood delivery. Yellow/blue/red blocks serve as parcels, while gems stand in for personalisation details. These are functional stand-ins, not a distinctive postal cast. Their creator provenance is a positive; their narrative fit remains weak.

**Replace next:** courier/parcel identity assets only when a freely redistributable original creator set fits the existing scale, outlines and animation requirements. Record source, licence and exact bytes before import. Do not generate substitute art or draw a CSS/SVG postal illustration. Do not introduce a random new pack just to say that assets were replaced.

**Acceptance:** a new player recognises the courier, parcel, recipient door, hazard and collectible from a real phone scene; one coherent visual language across home and play. Keep collision/visual bounds and all existing poses tested.

### B. Landscape menu density — medium impact, still open

At 844×390, route-book recommendation, chapter navigation and filters dominate the initial viewport; route cards require scrolling. Settings similarly requires substantial scrolling, though the persistent Back action remains reachable. The portrait home is orderly but the overall menu can feel like a utility dashboard rather than a strongly directed game interface.

**Improve next:** reduce route-book introductory duplication and consolidate secondary filter controls without shrinking touch targets or hiding progress context. Capture before/after at 568×320, 844×390 and enlarged text. Retain keyboard focus and Back paths.

### C. Home and world composition — medium impact, still open

Home uses a small number of large stock sprites over a simple rolling landscape. Gameplay is readable, but repeated compositions and generic blocks do not sell an inhabited neighbourhood. UI greys/blues/greens are reasonably consistent; the stronger problem is weak world identity and stock-scene repetition, not demonstrable AI-generated artwork.

**Improve next:** authored encounter rhythm, original creator-made postal/recipient props, better chapter-specific visual cues and a recipient/ending payoff. Preserve readability around thumb controls. A polished small game need not become 3D or add more megabytes.

### D. Validation gaps — release-blocking, still open

No subjective audio-listening sign-off, external new-player difficulty study, physical low-end memory/frame-pacing profile, TalkBack phone review or affected-installation crash diagnosis was produced here. No automated screenshot pass can certify these.

## 4. Asset disposition

The shipped allowlist contains **136 PNGs, 12 Ogg files, 5 WAVs, 7 notices/text files and 1 TTF**. All retain their original manifest hashes. This cycle did not replace, re-encode or add game artwork/audio. The original soundtrack and offline design remain intact.

The repository also contains **335 historical/excluded asset files (19.12 MB)**. They remain inventoried but are not shipped. Do not infer that historical AI-assisted experiments are current shipped visuals; do not run old exporters as a “cleanup.” Archival tools/tests need a later maintainability pass, not blind deletion.

## 5. APK and release status — no inherited approval

Last native-verified baseline:

- Source `3db86dcf2c7f1cfe107a398e7674671d88a55924`.
- Version 1.0.0-rc.2 / code 101.
- APK **53,032,215 bytes (53.03 MB)**, meeting the requested 20–100 MB range.
- SHA-256 `51c1a8118c20b85fb7e62292b4799b6e2053071e4a9b519f453c0cc2e7682022`.
- [Successful native run 42164619926](https://github.com/NawzBlaze/Game/actions/runs/42164619926), build/API 33/API 36 jobs passed.
- [Historical baseline APK artifact](https://github.com/NawzBlaze/Game/actions/runs/42164619926/artifacts/13478975457), debug/test signed, not a production-signed update.

**That download does not contain the audit fixes.** These changes have passed local engine/UI/host tests but require a fresh exact-source native build. Version numbers alone do not bind evidence; source and hashes do. Never uninstall or clear the affected existing phone installation merely to try the preview.

## 6. Next inspection/fix cycles, in priority order

1. **Release safety:** new candidate native CI; affected-phone read-only diagnosis; signed upgrade/save-retention test and supported-phone matrix. Do not submit to a store while gates are open.
2. **Visual identity slice:** one coherent licensed courier/parcel/recipient scene; compare phone screenshots before expanding it to the campaign. Art-direction review precedes replacing an entire pack.
3. **Menu refinement:** compact landscape route-book structure and text-scaling/contrast audit, followed by capture/regression checks.
4. **Player experience:** new-player route playtests, pacing/checkpoint tuning, audio listening and final-delivery payoff. Track observed problems, not guessed “professional” requirements.
5. **Maintainability:** incrementally unpack long runtime functions; clearly archive obsolete tools/tests; rerun the same tests after each change.

### Exit criteria

Reinspect each changed area and attach evidence; retain unresolved findings. “Everything perfect” or “no bugs” is not a valid exit claim. The completed fixes close specific reproducible defects, not the entire professional-quality backlog.
