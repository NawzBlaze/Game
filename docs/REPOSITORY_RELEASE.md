# Repository rename and APK publication

Requested project/repository name: **Little Parcel Crew / Little-Parcel-Crew**.

## Completed

All current code is pushed to `arena/2ae7d624-game` in `NawzBlaze/Game`. The branch remains unchanged; PR 2 remains open. The game name/package metadata already identifies Little Parcel Crew.

Added a manual, guarded APK pre-release publisher to the existing Android workflow. It can reuse successful run `42175617339` without rebuilding or changing the tested APK. It requires a successful native build and both API 33/36 jobs, validates source ancestry, compares source/checksums/size against trusted build annotations and publishes only `-rc.N` versions as explicitly test-signed pre-releases. It does not access production keys. Four publication-guard unit tests pass.

## Blocked by GitHub integration permissions

Two actual operations returned **403 Resource not accessible by integration**:

1. Renaming `NawzBlaze/Game` to `Little-Parcel-Crew`.
2. Dispatching the APK publication workflow.

The repository has **not** been renamed. No GitHub Release or release-asset attachment has been created. Do not mistake pushed publication code or a successful CI artifact for a published Release.

## Owner actions (no passwords or keys in chat)

Using the owner's GitHub browser account, open repository Settings → General → Repository name and rename it to `Little-Parcel-Crew`. Alternatively, with the owner's already authenticated local GitHub CLI:

```sh
gh repo rename Little-Parcel-Crew --repo NawzBlaze/Game --yes
```

Then manually dispatch the existing Android workflow on the session branch. The CLI command after a successful rename is:

```sh
gh workflow run 403662018 \
  --repo NawzBlaze/Little-Parcel-Crew \
  --ref arena/2ae7d624-game \
  -f verified_run=42175617339
```

If the rename has not happened, use `--repo NawzBlaze/Game` instead. This requires the owner's Actions write permission. The workflow's publication job requires Contents write; it attaches the exact APK plus checksum, source and warning files. It will fail rather than overwrite an existing release/tag conflict. Inspect the workflow outcome and release assets before announcing a download.

The publisher derives the current repository from GitHub's runtime context, so it supports the renamed repository. Existing source URLs are intentionally not changed to a nonexistent repository. After the rename is verified, update current support/documentation links and the local remote URL; keep the fixed branch name unchanged.

## Tested APK identity

- Version: `1.0.0-rc.3`, code 102.
- Source: `286ecfe7d22d6df0e8a97ea715f957bef867c8f3`.
- Size: **53,039,043 bytes**.
- SHA-256: `80c96dd7cb7468481cae55a76c18b36d031a8443052259d1bf80e43a45c5d041`.
- Existing CI artifact (not a permanent release asset): https://github.com/NawzBlaze/Game/actions/runs/42175617339/artifacts/13483102904 . Artifact retention/login limits apply.

This is a debug/test-signed preview. The owner has reported uncertain signing history and no available phone test. The publisher therefore cannot turn it into a finished production release. It preserves explicit pre-release warnings and does not approve the production gate or publish to a store. Do not uninstall/clear/overwrite the affected existing installation.
