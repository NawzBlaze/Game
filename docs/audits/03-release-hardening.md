# Public-release hardening — third inspection/fix pass

Date: 2026-11-06. Candidate: **1.0.0-rc.3 / Android code 102**.

This is implementation work toward a finished public release, not an approval shortcut. Earlier reports remain historical evidence; this report describes changes after audit commit `6fca7fb`.

## Closed implementation gaps

### Android progress portability

- Added a narrow `NativeProgress` bridge using Android Storage Access Framework `ACTION_CREATE_DOCUMENT` / `ACTION_OPEN_DOCUMENT`.
- No broad storage permission, Internet permission, persistent URI grant, account or upload.
- Backup import reads bounded UTF-8 on a background executor. Empty, malformed-UTF-8 and >2 MB files fail safely. Export checks actual UTF-8 byte size and reports write failures rather than claiming success.
- Native results are JSON-encoded into a DOM event, not interpolated as executable content. No file contents or document URIs are logged.
- Imported records pass the existing save validator and show a summary. **No restore until confirmation.** Existing transactional restore/pre-restore recovery remains in use.
- Cancellations, unavailable picker/provider, duplicate operations, closed panels and stale WebView results are handled. Process death while a picker is open does not restore automatically; reopen the progress panel and retry the operation.
- A sticky Close toolbar remains reachable even after scrolling long backup content.
- Hardware Back closes the progress panel before routing to game navigation or exiting the home screen.
- Older native hosts without the new bridge retain the hidden unsupported entry, rather than falling back to broken blob downloads.

### Landscape route-book density

- At short landscape sizes, route controls occupy a side column and actual route cards appear in the initial viewport.
- Chapter prose/art remains accessible through a native HTML disclosure, rather than consuming the initial route-list space.
- Portrait remains stacked. Touch targets and existing original artwork are preserved; no generated or replacement illustrations were added.

### Privacy, support and dependency hygiene

- Added a bundled **Privacy & support** screen reachable from Settings, describing local data, explicit document backups, cloud-provider caveat, deletion and diagnostic-sharing safety.
- Added [privacy information](../PRIVACY.md) for publisher review; store contact/legal review and publication URL are still owner tasks.
- Pinned a patched transitive `minimatch` override and reran lint/full verification. Both full `npm audit` and production-only audit report **zero known vulnerabilities** at this run. No npm dependencies are bundled as game runtime dependencies.

## Verification completed locally

- **25/25** engine/UI/build checks passed, including the new native-progress UI suite with bridge mocks.
- New browser tests at 568×320, 844×390 and 390×844 cover: native export payload; rejected malformed import; confirmation-before-write; pre-restore backup; script-like content as inert data; Back; late results; visible first-fold landscape routes; chapter disclosures; privacy dialog naming and no horizontal overflow.
- Existing browser export/import, all campaign routes/Express/specials, Classic, audio, offline and deterministic packaging tests still pass.
- **14/14** existing Android host-tooling tests passed. This count does not include new JVM tests until native CI runs them.
- Inventory: **161 shipped files**, all hashes unchanged; no inventory issues. New application code is recorded in [inventory](03-release-hardening-inventory.json).
- Added JVM tests for UTF-8 round-trip, exact byte boundary, oversized/empty/malformed files, write failure, document intent scoping, cancellation/retry and duplicate operations.
- Extended real WebView instrumentation to check native backup UI and hardware Back. Actual system document-provider round-trip and physical-phone approval remain distinct from these checks.

## Additional production-gate inspection

The former approval loop could overlook a removed/empty approval section. The gate now enumerates all mandatory approvals and rejects malformed/truthy flags or empty evidence. Full public-release checks also require a stable version and a real 20–100 MB owner-signed APK, verify its SDK signature/certificate and owner-approved APK hash, reject debug signing, and verify the embedded allowlisted payload against the locally tested build. Six Python safety tests run inside the 25-check suite, including temporary sparse ZIP fixtures with a mocked SDK verifier to exercise hash/certificate/payload rejection. These fixtures are not game assets or claims of real signing. No approval flags were enabled.

## Native verification status

Exact-source rc.3 native verification is complete for commit `286ecfe7d22d6df0e8a97ea715f957bef867c8f3`. The first rc.3 native run (42174758471) passed build/lint/JVM tests but failed its immediate backup-button presence assertion at startup. That check now waits for the last UI module rather than assuming renderer-image readiness implies progress-panel readiness; readiness diagnostics were added without removing the assertion. The amended candidate **passed** fresh run 42175617339: build/lint/JVM tests plus both API 33/36 emulator jobs. No old rc.2 native pass is inherited by this candidate. No production keystore was created, read or requested in chat.

## Public release still requires real evidence

1. Owner-controlled production signing and an existing-install certificate/version/save-retention upgrade test.
2. Diagnosis/retest on the previously affected phone; real low-end performance and lifecycle/audio checks.
3. External gameplay/art-direction/accessibility review. The current stock space-helmet courier identity and generic parcel stand-ins have **not** been replaced or falsely approved.
4. A real Android document-provider export/import round-trip, including cancellation/failure and keeping the existing installation intact.
5. Publisher contact, privacy/store declarations, listing screenshots and candidate-bound owner approval.

These are explicit release gates, not excuses to skip implementation. This pass closes portability, menu-density and information gaps; it does not manufacture physical or human evidence.

## Verified candidate handoff

- Native run: https://github.com/NawzBlaze/Game/actions/runs/42175617339 — all three jobs successful.
- APK: **53,039,043 bytes**; SHA-256 `80c96dd7cb7468481cae55a76c18b36d031a8443052259d1bf80e43a45c5d041`.
- Test-signed download: https://github.com/NawzBlaze/Game/actions/runs/42175617339/artifacts/13483102904 . This is not an owner-signed production update.
- Latest full local retest: **25/25**; Android host tooling **14/14**; gate safety **6/6**; full npm audit **zero known vulnerabilities**.
- Final QA captures: [small-landscape route book](rc3-screens/568-route-book.png), [landscape route book](rc3-screens/844-route-book.png), [backup panel](rc3-screens/568-progress.png). These are browser/native-bridge-mock captures, not physical-phone evidence.

The remaining blockers need real owner/device input, especially first-release-versus-update signing identity. No public release, merge, production approval or store submission was performed.
