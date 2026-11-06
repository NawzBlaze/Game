/* Local progress tools. Android uses user-selected SAF documents; no upload or storage permission. */
(() => {
  'use strict';
  const nativeFiles = !!(window.NativeProgress && typeof window.NativeProgress.exportBackup === 'function' && typeof window.NativeProgress.importBackup === 'function');
  const panel = document.createElement('dialog');
  panel.id = 'progressPanel';
  panel.setAttribute('aria-labelledby', 'progressTitle');
  panel.innerHTML = '<div class="progress-toolbar"><strong>LOCAL PROGRESS</strong><button type="button" data-progress="close">Close</button></div><h2 id="progressTitle">Your progress</h2><p>Progress is stored on this device, not in an online account. Export a backup before changing devices or clearing app data.</p><p id="progressStatus" role="status" aria-live="polite"></p><button type="button" data-progress="export">Export progress backup</button><button type="button" data-progress="import" hidden>Choose a backup to restore</button><label id="progressFileLabel" for="progressFile">Restore from a backup file</label><input id="progressFile" type="file" accept="application/json,.json"><p id="restoreSummary"></p><button type="button" id="confirmRestore" hidden>Replace progress with this backup</button><p class="progress-note">Restore replaces progress only after confirmation. A pre-restore copy is kept locally. Keep exported files private: they contain your progress and recovery records.</p>';
  document.body.appendChild(panel);
  const status = panel.querySelector('#progressStatus'), confirm = panel.querySelector('#confirmRestore');
  const fileInput = panel.querySelector('#progressFile'), summary = panel.querySelector('#restoreSummary');
  let pending = null, returnFocus = null;

  function clearSelection() {
    pending = null;
    confirm.hidden = true;
    fileInput.value = '';
    summary.textContent = '';
  }
  function selectBackup(text) {
    clearSelection();
    try {
      pending = window.ParcelSaves.parseBackup(text);
      const a = pending['delivery-adventure-v1'], c = pending['one-step-delivery-v2'];
      summary.textContent = 'Selected backup: ' + [a ? 'Adventure route ' + a.unlocked : null, c ? 'Classic route ' + c.unlocked : null].filter(Boolean).join('; ') + '. This will replace existing progress for these modes.';
      status.textContent = 'Check the progress above. Nothing is replaced until you confirm.';
      confirm.hidden = false;
    } catch {
      status.textContent = 'This file is not a supported progress backup. Your existing progress has not changed.';
    }
  }
  function download() {
    const payload = JSON.stringify(window.ParcelSaves.snapshot(), null, 2);
    if (new Blob([payload]).size > 2000000) throw new Error('Oversized backup');
    if (nativeFiles) {
      status.textContent = 'Choose where to save your backup in the system file picker.';
      window.NativeProgress.exportBackup(payload);
      return;
    }
    const url = URL.createObjectURL(new Blob([payload], {type: 'application/json'}));
    const a = document.createElement('a'); a.href = url; a.download = 'little-parcel-crew-progress.json'; a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status.textContent = 'Backup download requested. Check your downloads before deleting any browser data.';
  }
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-progress]');
    if (!button) return;
    try {
      if (button.dataset.progress === 'open') {
        returnFocus = button;
        window.pauseGameAudio?.();
        clearSelection();
        status.textContent = [...window.ParcelSaves.notices].join(' ');
        panel.showModal();
      } else if (button.dataset.progress === 'close') panel.close();
      else if (button.dataset.progress === 'export') download();
      else if (button.dataset.progress === 'import' && nativeFiles) {
        clearSelection();
        status.textContent = 'Choose a progress backup. You will review it before restoring.';
        window.NativeProgress.importBackup();
      }
    } catch {
      status.textContent = 'Storage or file export is unavailable, or the backup exceeds 2 MB. Do not clear this device’s data.';
    }
  });
  panel.addEventListener('close', () => { clearSelection(); returnFocus?.focus(); });
  fileInput.addEventListener('change', async event => {
    const file = event.target.files[0];
    clearSelection(); status.textContent = '';
    if (!file) return;
    if (file.size > 2000000) {
      status.textContent = 'Backup must be smaller than 2 MB. Your existing progress has not changed.';
      return;
    }
    try { selectBackup(await file.text()); }
    catch { status.textContent = 'Could not read this file. Your existing progress has not changed.'; }
  });
  if (nativeFiles) {
    fileInput.hidden = true;
    panel.querySelector('#progressFileLabel').hidden = true;
    panel.querySelector('[data-progress=import]').hidden = false;
    window.addEventListener('parcel-native-progress', event => {
      // Ignore delayed document results if the player has closed the panel.
      if (!panel.open || !event.detail || typeof event.detail.text !== 'string') return;
      if (event.detail.kind === 'import') selectBackup(event.detail.text);
      else status.textContent = event.detail.text;
    });
  }
  confirm.addEventListener('click', () => {
    if (!pending) return;
    try { window.ParcelSaves.restore(pending); location.reload(); }
    catch { status.textContent = 'Restore could not complete. Existing progress was retained or preserved in a local recovery copy. Do not clear app data.'; }
  });
  const previousBack = window.gameBack;
  window.gameBack = () => {
    if (panel.open) { panel.close(); return true; }
    return previousBack?.() ?? false;
  };
  // Older native hosts without the document bridge keep the unsupported entry hidden.
  if (window.NativeOrientation && !nativeFiles) return;
  const home = document.querySelector('#advHome .adv-home-actions');
  const button = document.createElement('button');
  button.className = 'adv-plain'; button.dataset.progress = 'open'; button.textContent = 'Progress & backups';
  home.appendChild(button);
})();
