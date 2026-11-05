/* Browser-local progress tools. No upload, accounts, analytics or server calls. */
(() => {
  'use strict';
  const panel=document.createElement('dialog');panel.id='progressPanel';
  panel.setAttribute('aria-labelledby','progressTitle');
  panel.innerHTML='<h2 id="progressTitle">Your progress</h2><p>Progress is stored on this browser or device, not in an online account. Export a backup before changing devices or clearing browser data.</p><p id="progressStatus" role="status" aria-live="polite"></p><button type="button" data-progress="export">Export progress backup</button><label for="progressFile">Restore from a backup file</label><input id="progressFile" type="file" accept="application/json,.json"><p id="restoreSummary"></p><button type="button" id="confirmRestore" hidden>Replace progress with this backup</button><button type="button" data-progress="close">Close</button><p class="progress-note">Restore replaces progress only after confirmation. A pre-restore copy is kept locally. Browser file export/import is not verified in the Android wrapper.</p>';
  document.body.appendChild(panel);
  const status=panel.querySelector('#progressStatus'),confirm=panel.querySelector('#confirmRestore');
  let pending=null,returnFocus=null;
  function download() {
    const payload=JSON.stringify(window.ParcelSaves.snapshot(),null,2);
    const url=URL.createObjectURL(new Blob([payload],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='little-parcel-crew-progress.json';a.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    status.textContent='Backup download requested. Check your downloads before deleting any browser data.';
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-progress]');if(!button)return;
    try {
      if(button.dataset.progress==='open') {
        returnFocus=button;window.pauseGameAudio?.();pending=null;confirm.hidden=true;
        panel.querySelector('#progressFile').value='';panel.querySelector('#restoreSummary').textContent='';
        status.textContent=[...window.ParcelSaves.notices].join(' ');panel.showModal();
      } else if(button.dataset.progress==='close')panel.close();
      else if(button.dataset.progress==='export')download();
    } catch {status.textContent='Storage or file export is unavailable. Do not clear this device’s data.';}
  });
  panel.addEventListener('close',()=>returnFocus?.focus());
  panel.querySelector('#progressFile').addEventListener('change',async event=>{
    pending=null;confirm.hidden=true;status.textContent='';
    const file=event.target.files[0];if(!file)return;
    try {
      if(file.size>2000000)throw new Error('Backup must be smaller than 2 MB.');
      pending=window.ParcelSaves.parseBackup(await file.text());
      const a=pending['delivery-adventure-v1'],c=pending['one-step-delivery-v2'];
      panel.querySelector('#restoreSummary').textContent='Selected backup: '+[a?'Adventure route '+a.unlocked:null,c?'Classic route '+c.unlocked:null].filter(Boolean).join('; ')+'. This will replace existing progress for these modes.';
      confirm.hidden=false;
    } catch {status.textContent='This file is not a supported progress backup. Your existing progress has not changed.';}
  });
  confirm.addEventListener('click',()=>{
    if(!pending)return;
    try { window.ParcelSaves.restore(pending);location.reload(); }
    catch {status.textContent='Restore could not complete. Existing progress was retained or preserved in a local recovery copy. Do not clear browser data.';}
  });
  // Browser tooling is development-only until Android file handling is implemented.
  if(window.NativeOrientation)return;
  const home=document.querySelector('#advHome .adv-home-actions');
  const button=document.createElement('button');button.className='adv-plain';button.dataset.progress='open';button.textContent='Progress & backups';home.appendChild(button);
})();
