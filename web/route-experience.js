/* Original Kenney music is bundled locally. No downloads or telemetry at runtime. */
(() => {
  'use strict';
  const districts = [
    {name:'Garden District',track:'garden',title:'Farm Frolics',tip:'Start gently. Practise a second jump in the air to reach the higher stars.'},
    {name:'Market District',track:'market',title:'Italian Mom',tip:'Look before you leap. Springs give extra height; a second jump helps you land safely.'},
    {name:'Golden District',track:'golden',title:'Swinging Pants',tip:'Watch the mice before crossing. Say hello nearby to calm them, or jump over them.'},
    {name:'Harbour District',track:'harbour',title:'Night at the Beach',tip:'Wait for a moving platform to come to you. Striped belts can help or slow your run.'},
    {name:'Hilltop District',track:'hilltop',title:'Flowing Rocks',tip:'Use your air hop to correct a landing. Some routes have two parcels: follow the current objective.'}
  ].map(Object.freeze);
  const home = Object.freeze({track:'music',title:'Mishief Stroll',name:'The dispatch office'});
  const special = Object.freeze({track:'special',title:'Mission Plausible',name:'Special deliveries'});
  function district(index) {
    const route=Number.isInteger(index)?Math.max(0,Math.min(23,index)):0;
    return districts[route<12?Math.floor(route/4):route<18?3:4];
  }
  const studioTracks=Object.freeze({
    title:Object.freeze({title:'Retro Game Music Pack — Title Screen',file:'assets/studio-audio/title.wav'}),
    'round-1':Object.freeze({title:'Retro Game Music Pack — Level 1',file:'assets/studio-audio/round-1.wav'}),
    'round-2':Object.freeze({title:'Retro Game Music Pack — Level 2',file:'assets/studio-audio/round-2.wav'}),
    'round-3':Object.freeze({title:'Retro Game Music Pack — Level 3',file:'assets/studio-audio/round-3.wav'}),
    ending:Object.freeze({title:'Retro Game Music Pack — Ending',file:'assets/studio-audio/ending.wav'})
  });
  function soundtrack(screen,index,bonus,full=false,victory=false) {
    if(full){const key=victory?'ending':screen!=='game'?'title':bonus>=0?'round-3':({garden:'round-1',market:'round-2',golden:'round-3',harbour:'round-2',hilltop:'round-3'}[district(index).track]);return {...studioTracks[key],creator:'Juhani Junkala',loop:!victory}}

    const entry=screen==='game'?(bonus>=0?special:district(index)):home;
    return {...entry,file:'assets/release-audio/'+entry.track+'.ogg',creator:'Kenney',loop:true};
  }
  function advice(level) {
    const rules=[];
    if(level.postGate)rules.push('Find the key to open the gate before heading for the final door.');
    if(level.stop)rules.push('This is a two-stop route. Deliver the first parcel before collecting the next one.');
    if(level.moving?.length)rules.push('Moving platforms carry you. Watch a full cycle before committing to a jump.');
    if(level.belts?.length)rules.push('Striped belts change your ground speed. Jump to leave a belt.');
    if(level.springs?.length)rules.push('Springs launch you upward automatically. Save the air hop to adjust your landing.');
    if(level.dogs?.length)rules.push('Mice are neighbours, not enemies. Say hello nearby to calm them briefly.');
    if(level.kind==='wind')rules.push('Wind changes your movement in the air. Leave room to correct your landing.');
    if(level.kind==='fragile')rules.push('Land gently with the fragile parcel. A hard landing may send it back to the flag.');
    if(level.kind==='bouncy')rules.push('A hard landing can bounce the parcel away. Pick it up again before delivering.');
    if(level.kind==='switch')rules.push('Stand on the switch to activate the moving bridge.');
    if(level.kind==='buddy')rules.push('Say hello to your little companion and look for the secret along the route.');
    return rules;
  }
  window.ParcelExperience=Object.freeze({district,soundtrack,advice,studioTracks,districts:Object.freeze(districts)});
})();
