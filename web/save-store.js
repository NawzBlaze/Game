/* Local-only save validation and recovery. Never silently discard damaged originals. */
(() => {
  'use strict';
  const owns = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
  const keys = ['delivery-adventure-v1','one-step-delivery-v2'];
  const blocked = new Set();
  const notices = new Set();
  const object = x => !!x && typeof x === 'object' && !Array.isArray(x);
  function record(value, maxKey, maxValue, boolean = false, zeroBased = false) {
    if (!object(value)) return {};
    const out = {};
    for (const [key, entry] of Object.entries(value)) {
      if (!/^\d+$/.test(key)) continue;
      const n = Number(key);
      if (!Number.isInteger(n) || n < (zeroBased ? 0 : 1) || n > maxKey) continue;
      if (boolean && typeof entry === 'boolean') out[n] = entry;
      else if (!boolean && Number.isInteger(entry) && entry >= 0 && entry <= maxValue) out[n] = entry;
    }
    return out;
  }
  function validate(key, value) {
    if (!keys.includes(key) || !object(value)) throw new Error('Invalid save object');
    const adventure = key === keys[0], out = {};
    out.unlocked = Number.isInteger(value.unlocked) ? Math.max(1, Math.min(adventure ? 24 : 48,value.unlocked)) : 1;
    for (const name of adventure ? ['sound','seen','autoRun','effects','districtMusic','fullSoundtrack','express'] : ['sound','introSeen','dogIntroSeen','motion','lookAhead']) {
      if (typeof value[name] === 'boolean') out[name] = value[name];
    }
    if (adventure) {
      for(const name of ['musicVolume','effectsVolume']){if(Number.isFinite(value[name]))out[name]=Math.max(0,Math.min(100,Math.round(value[name])))}
      out.best = record(value.best,24,3);
      out.expressBest = record(value.expressBest,24,3);
      out.bonus = record(value.bonus,5,3,false,true);
      out.clean = record(value.clean,5,1,true,true);
      out.secrets = record(value.secrets,5,1,true,true);
      for (const [name,allowed] of Object.entries({courier:['pip','player','adventurer'],hat:['none','cap','flower'],bag:['classic','mint','berry'],cart:['sunny','mint','berry']})) {
        if (allowed.includes(value[name])) out[name] = value[name];
      }
    } else {
      out.stars = record(value.stars,48,3);
      out.bestMoves = record(value.bestMoves,48,1000000);
      // Retain in-progress Classic games only with bounded structural data.
      // The game's level-aware validSavedState performs the final collision checks.
      const session = value.session;
      const state = s => object(s) && Array.isArray(s.p) && s.p.length===2 && s.p.every(Number.isInteger) &&
        Array.isArray(s.d) && s.d.length<=36 && s.d.every(d=>Array.isArray(d)&&d.length===2&&d.every(Number.isInteger)) &&
        typeof s.has==='boolean' && Number.isInteger(s.moves) && s.moves>=0 && s.moves<=1000000 && !s.caught;
      if (object(session) && Number.isInteger(session.level) && session.level>=0 && session.level<48 && state(session.state)) {
        out.session={level:session.level,state:session.state,history:Array.isArray(session.history)?session.history.slice(-100).filter(state):[]};
      }
    }
    return out;
  }
  function preserve(key, raw) {
    try {
      // Keep the first original until the owner explicitly exports/removes it.
      const backup = 'lpc-recovery:' + key;
      if (localStorage.getItem(backup) === null) localStorage.setItem(backup,raw);
      notices.add('A damaged save was recovered. Its original is preserved in the progress backup.');
    } catch {
      blocked.add(key);
      notices.add('Save recovery could not preserve the original. Automatic saving is disabled to avoid overwriting it.');
    }
  }
  function read(key, defaults) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return {...defaults};
      try {
        if (raw.length>1000000) throw new Error('Oversized save');
        const parsed = JSON.parse(raw), clean = validate(key,parsed);
        // Unknown fields are ignored, but preserve the raw input if validation repairs it.
        if (!object(parsed) || Object.keys(clean).some(k => owns(parsed,k) && JSON.stringify(clean[k])!==JSON.stringify(parsed[k]))) preserve(key,raw);
        return {...defaults,...clean};
      } catch { preserve(key,raw); return {...defaults}; }
    } catch {
      notices.add('Storage is unavailable. Progress will only last for this session.');
      blocked.add(key); return {...defaults};
    }
  }
  function write(key, value) {
    if (blocked.has(key)) return false;
    try { localStorage.setItem(key,JSON.stringify(validate(key,value))); return true; }
    catch { notices.add('Progress could not be saved. Export a backup before closing.'); return false; }
  }
  function snapshot() {
    const saves={}, recovery={};
    for (const key of keys) {
      const raw=localStorage.getItem(key);
      if(raw!==null) { try{saves[key]=validate(key,JSON.parse(raw));}catch{/* Damaged originals travel separately. */} }
      const old=localStorage.getItem('lpc-recovery:'+key);if(old!==null)recovery[key]=old;
    }
    return {format:'little-parcel-crew-backup',version:1,saves,recovery};
  }
  function parseBackup(text) {
    if (typeof text!=='string'||text.length>2000000) throw new Error('Backup must be smaller than 2 MB.');
    const backup=JSON.parse(text);
    if(!object(backup)||backup.format!=='little-parcel-crew-backup'||backup.version!==1||!object(backup.saves)) throw new Error('This is not a supported Little Parcel Crew backup.');
    const saves={};
    for(const key of keys) if(owns(backup.saves,key)) saves[key]=validate(key,backup.saves[key]);
    if(!Object.keys(saves).length)throw new Error('This backup contains no game progress.');
    return saves;
  }
  function restore(saves) {
    const old = {};
    // Validate every record before any write; preserve existing progress first.
    const clean = {};
    for(const key of keys)if(owns(saves,key))clean[key]=validate(key,saves[key]);
    for(const key of Object.keys(clean))old[key]=localStorage.getItem(key);
    localStorage.setItem('lpc-before-restore',JSON.stringify(snapshot()));
    try { for(const key of Object.keys(clean))localStorage.setItem(key,JSON.stringify(clean[key])); }
    catch (e) {
      for(const [key,raw] of Object.entries(old)) { try { if(raw===null)localStorage.removeItem(key);else localStorage.setItem(key,raw); } catch { /* Original remains in lpc-before-restore. */ } }
      throw e;
    }
  }
  window.ParcelSaves = {read,write,validate,snapshot,parseBackup,restore,notices,canWrite:key=>!blocked.has(key)};
})();
