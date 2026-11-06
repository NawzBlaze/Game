/* Earned honours are derived from existing progress, never a second save ledger. */
(() => {
  'use strict';
  const districts=[['Garden District',1,4],['Market District',5,8],['Golden District',9,12],['Harbour District',13,18],['Hilltop District',19,24]];
  const rating=(map,key)=>Number.isInteger(map?.[key])&&map[key]>=0&&map[key]<=3?map[key]:0;
  function summary(save={}) {
    const completed=Array.from({length:24},(_,i)=>rating(save.best,i+1)).filter(n=>n>0).length;
    const stars=Array.from({length:24},(_,i)=>rating(save.best,i+1)).reduce((a,b)=>a+b,0);
    const specials=Array.from({length:6},(_,i)=>rating(save.bonus,i)).filter(n=>n>0).length;
    const clean=Array.from({length:6},(_,i)=>rating(save.bonus,i)>0&&save.clean?.[i]===true).filter(Boolean).length;
    const secrets=Array.from({length:6},(_,i)=>rating(save.bonus,i)>0&&save.secrets?.[i]===true).filter(Boolean).length;
    const badges=[
      {id:'first',name:'First-class start',detail:'Complete your first delivery',value:completed,target:1,asset:'block_yellow'},
      ...districts.map(([name,start,end],i)=>({id:'district-'+i,name:name+' postmark',detail:'Deliver every route in this district',value:Array.from({length:end-start+1},(_,j)=>rating(save.best,start+j)).filter(n=>n>0).length,target:end-start+1,asset:'flag_green_a'})),
      {id:'round',name:'The whole round',detail:'Complete all 24 neighbourhood routes',value:completed,target:24,asset:'character_green_front'},
      {id:'stars',name:'Star collector',detail:'Earn all 72 route-rating stars',value:stars,target:72,asset:'star'},
      {id:'specials',name:'Special service',detail:'Complete all six special deliveries',value:specials,target:6,asset:'heart'},
      {id:'clean',name:'Safe hands',detail:'Finish all six specials without a reset',value:clean,target:6,asset:'block_blue'},
      {id:'secret',name:'A little discovery',detail:'Find a secret on a completed special delivery',value:secrets,target:1,asset:'mouse_rest'}
    ].map(b=>Object.freeze({...b,value:Math.min(b.value,b.target),earned:b.value>=b.target}));
    return {completed,stars,specials,badges,earned:badges.filter(b=>b.earned).length};
  }
  function nextRoute(save={}) {
    const unlocked=Number.isInteger(save.unlocked)?Math.max(1,Math.min(24,save.unlocked)):1;
    for(let i=0;i<unlocked;i++)if(!rating(save.best,i+1))return {index:i,kind:'new',title:'A neighbour is waiting',detail:'Complete this delivery to keep your round moving.'};
    for(let i=0;i<unlocked;i++)if(rating(save.best,i+1)<3)return {index:i,kind:'mastery',title:'Make this route shine',detail:'Replay for optional stars. Your best rating can only improve.'};
    if(unlocked<24)return {index:unlocked-1,kind:'mastery',title:'Your next dispatch',detail:'Revisit your latest unlocked route. Your saved stars stay safe.'};
    return {index:null,kind:'complete',title:'A perfect neighbourhood round',detail:'All 24 routes have three stars. Visit Specials for a different kind of delivery.'};
  }
  window.ParcelMastery=Object.freeze({summary,nextRoute});
})();
