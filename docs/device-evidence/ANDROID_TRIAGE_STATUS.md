# Android validation step — started, not device-verified

## Completed in this step

- Inspected the reconstructed candidate wrapper, manifest, Gradle configuration and existing Robolectric/device-test source.
- Confirmed this environment has no Java or ADB executable available. No phone can be accessed here and no native build/test or original-crash reproduction was run.
- Added a standard-library cross-platform evidence collector that does not copy APKs or invoke install, uninstall, clear, force-stop, reboot or app-launch commands. It preserves existing logs before any manual reproduction.
- Six host-only mocked tests passed: authorized device selection; existing-log-first/read-only command scope; unsupported-command reporting; interrupt cleanup; no-device refusal; existing-directory refusal. Python compilation checks also passed.
- An actual invocation without ADB failed safely before creating a device-evidence directory. This is an environment check, not a device test.
- Packaged only public scripts, instructions, share-back template and checksums into `LPC-Android-ReadOnly-Diagnostics.zip`. No APK, phone log, SDK binary, keystore or credentials are in the kit.
- Added a manual GitHub Actions workflow for SDK setup, compile/lint and simulated tests at APIs 29/33/36. It is **defined but not executed**; it requires the source/workflow to be pushed and an owner-triggered run. It installs no app, uses no signing secrets and uploads only test/lint reports, not APKs.
- Replaced the inherited Android launcher PNG with the unmodified Kenney `character_green_front.png` already documented in the release source manifest. This removes an unreviewed inherited image; it is not a completed adaptive-icon design or a native-build validation. Exact source equality is recorded in `android-source-review.json`.

## Static review observations — not crash findings

- Candidate app ID remains `com.onestepdelivery.game`; its asset origin remains `file:///android_asset/index.html`, avoiding a deliberate save-origin migration.
- The wrapper has renderer recovery and catches selected lifecycle failures. Neither establishes the original Android 13 crash cause.
- Navigation permits only the local index page. The browser credits text link and progress file operations need an explicit native UX decision/implementation and device tests; desktop browser behaviour cannot be assumed inside WebView.
- Console error forwarding is still unconditional despite a diagnostic-only comment. Production logging/privacy behaviour should be reviewed in a native-tested change, not treated as the historical crash cause.
- The current launcher remains a single drawable PNG; adaptive-icon/store presentation is still a separate review item.
- The build source set points at the validated `dist/web` allowlist. This was inspected in source, not compiled here.

## What is blocked

The historical installed app's crash/exit logs, phone/WebView details and public signing metadata have not been supplied. **Crash cause remains unknown, no targeted crash fix is claimed, and Android production approvals remain false.** The installed binary may differ from the reconstructed candidate source inspected here.

The web candidate was rebuilt and its SHA-256 is unchanged from the persisted 17/17 web QA record. The full web suite was not rerun in this diagnostic-only step. No inference about Android stability follows from that hash match.

## Next owner action

Use `QUICK_START.md` and the diagnostic kit on your own computer with the original affected phone. Run the collector without installing anything over the existing game. Review the private output locally and provide only the minimum redacted text in `SUMMARY-TO-SHARE.txt`.

If no original affected phone is available, say so: the original crash gate cannot be verified, and the next practical alternative is a clearly labelled test plan on available supported hardware—not a claim that the historical issue is fixed.
