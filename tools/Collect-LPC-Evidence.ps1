# Little Parcel Crew: read-only Android diagnostics. Windows PowerShell 5.1+.
# Never clears logcat, installs/uninstalls, resets app data or changes settings.
param(
  [string]$Adb = '',
  [string]$ApkSigner = '',
  [string]$CandidateApk = ''
)
# Native tools can write diagnostics to stderr even when commands succeed.
# Record their exit codes rather than treating each stderr line as a fatal PowerShell error.
$ErrorActionPreference = 'Continue'
$pkg = 'com.onestepdelivery.game'
if (!$Adb) {
  $local = Join-Path $PSScriptRoot 'platform-tools\adb.exe'
  if (Test-Path -LiteralPath $local) { $Adb = $local }
  else { $cmd = Get-Command adb.exe -ErrorAction SilentlyContinue; if ($cmd) { $Adb = $cmd.Source } }
}
if (!$Adb -or !(Test-Path -LiteralPath $Adb)) { throw 'adb.exe not found. Extract Google platform-tools next to this script or pass -Adb with its full path.' }
Write-Host 'This reads device logs and APK files; it will NOT install, uninstall, clear logs or modify app data.'
Write-Host 'USB debugging must already be enabled. Unlock the phone and accept its USB debugging prompt if shown.'
& $Adb start-server | Out-Host
$listing = @(& $Adb devices -l)
$listing | ForEach-Object { Write-Host $_ }
$devices = @($listing | Where-Object { $_ -match '^\S+\s+device(?:\s|$)' } | ForEach-Object { ($_ -split '\s+')[0] })
if ($devices.Count -eq 0) { throw 'No authorized device detected. Check cable, phone authorization and adb devices; no app data was changed.' }
if ($devices.Count -gt 1) {
  Write-Host 'Multiple devices detected. Select the exact serial listed above.'
  $serial = Read-Host 'Device serial'
  if ($devices -notcontains $serial) { throw 'Selected serial was not in the authorized device list.' }
} else { $serial = $devices[0] }
$desktop = [Environment]::GetFolderPath('Desktop')
if (!$desktop) { $desktop = $env:USERPROFILE }
$out = Join-Path $desktop ('LPC-Device-Evidence-' + (Get-Date -Format 'yyyyMMdd-HHmmss'))
New-Item -ItemType Directory -Path $out -ErrorAction Stop | Out-Null
function Capture-Adb([string]$File, [string[]]$AdbArgs) {
  $full = Join-Path $out $File
  & $Adb -s $serial @AdbArgs *> $full
  $rc = $LASTEXITCODE
  Add-Content -LiteralPath (Join-Path $out 'capture-status.txt') -Value ("{0}: exit {1}" -f $File,$rc)
  if ($rc -ne 0) { Write-Warning "$File returned exit code $rc; see the file." }
}
"Computer capture start: $(Get-Date -Format o)`r`nSelected serial: $serial`r`nPackage: $pkg" | Set-Content -LiteralPath (Join-Path $out 'capture-status.txt')
# Capture the existing circular buffers FIRST; do not use logcat -c.
Capture-Adb '01-existing-logcat.txt' @('logcat','-d','-b','main','-b','system','-b','crash','-v','threadtime')
Capture-Adb '02-device-time.txt' @('shell','date')
Capture-Adb '03-device-properties.txt' @('shell','getprop')
Capture-Adb '04-webview-provider.txt' @('shell','dumpsys','webviewupdate')
Capture-Adb '05-installed-package.txt' @('shell','dumpsys','package',$pkg)
Capture-Adb '06-package-paths.txt' @('shell','pm','path',$pkg)
Capture-Adb '07-recent-exit-info.txt' @('shell','dumpsys','activity','exit-info',$pkg)
# Start live capture without clearing, restarting or launching the installed app.
$live = Join-Path $out '08-live-logcat.txt'
$errors = Join-Path $out '08-live-logcat-errors.txt'
$arguments = "-s $serial logcat -b main -b system -b crash -v threadtime"
$proc = Start-Process -FilePath $Adb -ArgumentList $arguments -RedirectStandardOutput $live -RedirectStandardError $errors -PassThru -NoNewWindow
Start-Sleep -Milliseconds 800
if ($proc.HasExited) { Write-Warning 'Live logcat exited before reproduction. Check 08-live-logcat-errors.txt; live capture may be incomplete.' }
try {
  Add-Content -LiteralPath (Join-Path $out 'capture-status.txt') -Value ("Live capture started, computer time: " + (Get-Date -Format o))
  Write-Host ''
  Write-Host 'Live capture is running. Open the ALREADY INSTALLED game normally on the phone once.'
  Write-Host 'Wait until it closes (or note what happened), then wait 10 seconds.'
  [void](Read-Host 'Press Enter here after that, or press Ctrl+C to stop')
  Add-Content -LiteralPath (Join-Path $out 'capture-status.txt') -Value ("User ended reproduction, computer time: " + (Get-Date -Format o))
} finally {
  if (!$proc.HasExited) { Stop-Process -Id $proc.Id -ErrorAction SilentlyContinue }
  $proc.WaitForExit()
}
Capture-Adb '09-device-time-after.txt' @('shell','date')
Capture-Adb '10-exit-info-after.txt' @('shell','dumpsys','activity','exit-info',$pkg)
$lines = @(Get-Content -LiteralPath (Join-Path $out '06-package-paths.txt') -ErrorAction SilentlyContinue | Where-Object { $_ -match '^package:/' })
$base = @($lines | Where-Object { $_ -match '/base\.apk\s*$' } | Select-Object -First 1)
if ($base.Count -eq 1) {
  $remote = ($base[0] -replace '^package:','').Trim()
  $localBase = Join-Path $out 'installed-base-PRIVATE.apk'
  & $Adb -s $serial pull $remote $localBase *> (Join-Path $out '11-pull-status.txt')
  if ($LASTEXITCODE -eq 0 -and (Test-Path -LiteralPath $localBase)) {
    Get-FileHash -Algorithm SHA256 -LiteralPath $localBase | Format-List | Out-String | Set-Content -LiteralPath (Join-Path $out '12-base-sha256.txt')
    Write-Host 'Installed base APK copied locally for signing inspection. Split APK paths remain recorded in 06-package-paths.txt.'
  } else { Write-Warning 'Could not read installed base APK; see 11-pull-status.txt. Do not change permissions or uninstall.' }
} else { Write-Warning 'Installed base APK path not found. Verify package name and installation; nothing was modified.' }
if (!$ApkSigner) {
  $sdk = $env:ANDROID_HOME
  if (!$sdk) { $sdk = $env:ANDROID_SDK_ROOT }
  if (!$sdk) { $sdk = Join-Path $env:LOCALAPPDATA 'Android\Sdk' }
  $buildTools = Join-Path $sdk 'build-tools'
  if (Test-Path -LiteralPath $buildTools) {
    $found = @(Get-ChildItem -LiteralPath $buildTools -Directory | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'apksigner.bat' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
    if ($found.Count) { $ApkSigner = $found[0] }
  }
}
if ($ApkSigner -and (Test-Path -LiteralPath $ApkSigner) -and $localBase -and (Test-Path -LiteralPath $localBase)) {
  & $ApkSigner verify --verbose --print-certs $localBase *> (Join-Path $out '13-installed-signature.txt')
  Add-Content -LiteralPath (Join-Path $out 'capture-status.txt') -Value ("Installed APK apksigner exit: " + $LASTEXITCODE)
  if ($CandidateApk) {
    if (Test-Path -LiteralPath $CandidateApk) {
      & $ApkSigner verify --verbose --print-certs $CandidateApk *> (Join-Path $out '14-candidate-signature.txt')
      Add-Content -LiteralPath (Join-Path $out 'capture-status.txt') -Value ("Candidate APK apksigner exit: " + $LASTEXITCODE)
      Get-FileHash -Algorithm SHA256 -LiteralPath $CandidateApk | Format-List | Out-String | Set-Content -LiteralPath (Join-Path $out '15-candidate-sha256.txt')
      Write-Host 'Compare every installed/candidate signing certificate and lineage, plus package and version. Do not infer installability from a filename.'
    } else { Write-Warning 'Candidate path does not exist; no comparison performed.' }
  }
  $aapt = Join-Path (Split-Path -Parent $ApkSigner) 'aapt.exe'
  if (Test-Path -LiteralPath $aapt) {
    & $aapt dump badging $localBase *> (Join-Path $out '16-installed-badging.txt')
    if ($CandidateApk -and (Test-Path -LiteralPath $CandidateApk)) { & $aapt dump badging $CandidateApk *> (Join-Path $out '17-candidate-badging.txt') }
  } else { Write-Warning 'aapt.exe not found beside apksigner. Check package/version in 05-installed-package.txt and inspect any candidate separately.' }
} else { Write-Warning 'apksigner or installed APK unavailable; certificate comparison NOT performed. See guide.' }
$pattern = 'FATAL EXCEPTION|AndroidRuntime|chromium|cr_.*|WebView|webview|RenderProcessGone|renderer|SIG[A-Z]+|Fatal signal|tombstone|com\.onestepdelivery\.game'
foreach ($file in @('01-existing-logcat.txt','08-live-logcat.txt')) {
  $inputFile = Join-Path $out $file
  if (Test-Path -LiteralPath $inputFile) {
    Select-String -LiteralPath $inputFile -Pattern $pattern -Context 3,20 | Out-String -Width 250 | Set-Content -LiteralPath (Join-Path $out ($file -replace '\.txt$','-possible-evidence.txt'))
  }
}
Write-Host "Finished: $out"
Write-Host 'PRIVATE: logs and APK may expose accounts, device IDs, installed apps and unrelated activity. Review/redact before sharing; keep original files private.'
Write-Host 'Do NOT send the APK, keystore, passwords or full logs in chat. See README for the minimum useful redacted evidence.'
