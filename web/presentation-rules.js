/* Functional labels and source-asset choices only. No new illustrated artwork. */
(() => {
  'use strict';
  const parcels = {
    normal:{asset:'block_yellow',label:'PARCEL',name:'Yellow delivery parcel'},
    fragile:{asset:'block_blue',label:'FRAGILE',name:'Blue fragile parcel'},
    bouncy:{asset:'block_yellow',label:'BOUNCY',name:'Bouncy parcel'},
    gift:{asset:'block_red',label:'GIFT',name:'Red gift parcel'}
  };
  function parcel(kind) { return parcels[kind] || parcels.normal; }
  function rule(level,x=0) {
    const rules=[];
    if(level.kind==='fragile')rules.push('FRAGILE · Land gently; hard landings reset the parcel.');
    if(level.kind==='bouncy')rules.push('BOUNCY · Hard landings drop the parcel. Pick it up again.');
    if(level.kind==='gift')rules.push('GIFT · Deliver the red heart-marked parcel.');
    if(level.kind==='wind')rules.push((x>570&&x<1350?'BREEZE ACTIVE →':'BREEZE ZONE AHEAD →')+' Pushes right between the route signs.');
    if(level.kind==='switch')rules.push('BRIDGE SWITCH · Step on the lever to start the moving bridge.');
    if(level.kind==='buddy')rules.push('MOUSE POST · Meet the mouse and follow the hearts.');
    if(level.belts?.length)rules.push('CONVEYORS · Arrow signs show each belt’s direction.');
    return rules.join(' ');
  }
  function routeFacts(level) {
    const facts=[];
    const gaps=Math.max(0,level.ground.length-1);
    if(gaps)facts.push(gaps+' '+(gaps===1?'gap':'gaps'));
    if(level.moving?.length)facts.push('Moving bridges');
    if(level.postGate)facts.push('Key gate');
    if(level.belts?.length)facts.push('Conveyors');
    if(level.kind==='fragile')facts.push('Fragile parcel');
    if(level.kind==='bouncy')facts.push('Bouncy parcel');
    if(level.kind==='wind')facts.push('Breeze zone');
    if(level.stop)facts.push('Two stops');
    return facts.slice(0,3).join(' · ') || 'Neighbourhood delivery';
  }
  window.ParcelPresentation = Object.freeze({parcel,rule,routeFacts,
    memoryAssets:['character_green_front','block_yellow','star','water_top','flag_green_a','character_purple_front'],
    challengeAssets:['block_blue','spring','heart','sign_right','lever_right','mouse_rest']});
})();
