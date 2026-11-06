# Owner-controlled Android production signing

The preview APK is debug/test signed. It is not a substitute for a production APK or Play bundle. The current version remains a release candidate; no approvals are implied by its name or build success.

## Signing identity must be established first

- **Existing published app/update:** use the legitimate signing/upload key and verify Play App Signing/authorized rotation lineage. Do not create an unrelated key or uninstall the existing app to bypass a mismatch. Compare installed package/version/certificate before testing an update.
- **First release:** the owner should create and securely back up a production/upload keystore using Android Studio's signed-release wizard or an equivalent owner-controlled process. A Play upload key and the app-signing certificate used on installed APKs may be different.

Never paste keystores, private keys, passwords or recovery codes into chat, source files or logs. Do not commit a keystore. This repository refuses release keystores inside the project tree.

Provide all four values through the owner's secure local environment or a correctly restricted CI secret mechanism:

- `LPC_RELEASE_STORE_FILE`: absolute path to the keystore outside the repository
- `LPC_RELEASE_STORE_PASSWORD`
- `LPC_RELEASE_KEY_ALIAS`
- `LPC_RELEASE_KEY_PASSWORD`

The existing candidate CI deliberately does not access signing secrets or publish to any store. It continues to produce an unsigned release APK/AAB and a separately labelled debug preview.

## Explicit production build command

From `android/`, in the secure configured environment:

```sh
./gradlew --no-daemon -PrequireReleaseSigning=true lintRelease verifyReleaseSize
```

`-PrequireReleaseSigning=true` fails immediately if signing is missing; incomplete signing configuration also fails. `verifyReleaseSize` builds the release APK and AAB and checks their finished sizes, including any configured signing. **Every finished game APK/AAB must be between 20,000,000 and 100,000,000 bytes (20–100 MB), inclusive**. Empty/missing artifacts fail. Do not pad the app to reach a desired size.

Outputs are under `android/app/build/outputs/apk/release/` and `android/app/build/outputs/bundle/release/`. Verify the actual APK with Android SDK `apksigner verify --verbose --print-certs`; verify the AAB signature and bundle/device compatibility separately. Google Play generally uses an AAB for new apps; an APK may be appropriate for other distribution channels.

## Before calling it final

Production signing alone does not establish release readiness. Test the exact signed artifact on physical phones, verify a compatible update preserves existing progress, resolve the historical affected Android 13 installation's crash, review accessibility/play feel/native audio and store assets/declarations, and obtain owner approval. Native backup file handling remains unsupported. Record real artifact-bound evidence; do not mark approvals true because an unsigned/debug emulator build passed.

This document provides the build path, not an assertion that production signing or store approval has happened.
