# 1.0.0-rc.2 — enforce the requested 20–100 MB Android size budget

The earlier 1.0.0-rc.1 APK was 2,771,465 bytes and did not meet the owner's explicit 20 MB minimum. That requirement was not satisfied by calling the game lightweight.

## Real content added

Five original composer-supplied recordings from Juhani Junkala's Retro Game Music Pack / 5 Action Chiptunes (CC0). The original author CC0 notice is bundled. Exact immutable source Git blob IDs, SHA-256 hashes, durations and byte counts are in `studio-soundtrack-assets.json` and the release manifest.

These are **original, unmodified 44.1 kHz, 16-bit stereo PCM WAV files**, not decompressed copies of our existing Ogg loops, resampled music, duplicated tracks, silent bytes or archive filler. Total source audio: 50,256,830 bytes, approximately 4 minutes 45 seconds. High-quality original recordings are larger than the short compressed loops they replace by default.

All five have live game uses:
- Title Screen: home/map/menu music.
- Level 1: Garden deliveries.
- Level 2: Market and Harbour deliveries.
- Level 3: Golden/Hilltop and optional special deliveries.
- Ending: one-shot completion music; next route restores normal looping music.

Only one reused music player is active. Files are not preloaded together; volume zero, mute, visibility/native pause and mode changes retain their stop behavior. Earlier Kenney music remains available through **Soundtrack: Cozy loops** in Adventure settings. The choice is validated/saved and does not change progress. Audio format/selection/lifecycle tests do not constitute an ear-quality or physical low-memory-phone performance review.

## Build floor, not just a maximum

`tools/check_android_size.py`, wired into finished debug APK and release APK/AAB tasks, now rejects **anything below 20,000,000 bytes or above 100,000,000 bytes**. Both exact boundaries pass; 19,999,999 and 100,000,001 fail. Instrumentation/test APKs are not the game and are not included in this size check. The actual finished game APK size and native test evidence must be recorded in `ANDROID_BUILD_HANDOFF.md`; the internal payload ZIP is not a substitute for measuring the APK.

23/23 engine/UI checks and 14/14 Android host tooling tests cover the build inputs and tooling. Studio tests verify upstream-original identity, region/menu/result routing, one-player reuse, saved Cozy selection and sequential real-browser decoding of all five WAVs. Native evidence must be checked for this exact candidate, not inherited from rc.1.

## Why the earlier build shrank

The audited builder (`tools/build_release.py`) includes only its explicit code/asset allowlist. Historic source folders, older scene families, legacy audio and unreviewed/retired visual work remain in the repository for traceability but are excluded from the APK. The game also uses the phone's existing WebView rather than shipping a separate browser engine. That explains the current smaller packaging design, but it does not prove the contents of the owner's reported old 27 MB APK without that binary. Nothing was moved to an online game server; required new audio remains bundled offline.

The new file-size floor does not establish production signing, phone play quality or store approval. Do not replace valid owner signing or physical-phone review with a byte count.
