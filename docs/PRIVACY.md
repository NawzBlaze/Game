# Little Parcel Crew — privacy information

Updated: 6 November 2026. Applies to the offline Android application in this repository.

## Data used by the game

The game stores route progress, ratings, settings, customisation choices and recovery records locally in Android WebView storage. There are no game accounts, advertisements, analytics/tracking SDKs, in-app purchases, automatic uploads or developer-operated game servers. The Android manifest does not request Internet, camera, microphone, location or broad storage permission. Android system services may maintain their own diagnostics under the device's settings and policies.

## Optional backups

You can explicitly export a JSON progress backup through Android's system document picker. Only the document you choose is written. Import reads only your selected document, validates the supported backup format and shows a summary; progress is not replaced until you confirm. Files are limited to 2 MB. The app does not retain broad or persistent document access.

A selected cloud document provider may store or transfer the file under that provider's own policy. This is an explicit file operation, not a background game upload. Backups can contain original recovery records as well as progress; keep them private and review them before sharing. A pre-restore copy remains in app-local storage for recovery.

## Deletion and portability

Uninstalling the app or clearing its storage can erase local progress. Export and verify a backup first. Delete exported files using the document provider/file manager where you saved them; clearing the app does not delete those external copies. Android automatic application backup is disabled in the manifest.

## Support and diagnostics

The project issue tracker is https://github.com/NawzBlaze/Game/issues. Reports, attachments and comments posted there may be public and are handled by GitHub under its policies. Share only the minimum necessary information: device model, Android/WebView versions and reproduction steps. Do not post private progress files, personal information, signing material or unreviewed device logs. The game does not automatically submit diagnostics.

## Publication note

This is a factual implementation description, not legal advice or an assertion of store approval. The publishing owner must review its accuracy, supply any legally required publisher/contact information, and provide a stable public privacy-policy URL in the store listing before publication. The repository document and bundled in-game Privacy & support screen do not themselves complete that store process.
