// Capture matching intermediate positions by playing with the same inputs in each build.
// No teleports or direct writes to the game state; baseline and WIP use separate servers.
const {chromium}=require('playwright'),fs=require('fs');(async()=>{
 const stage=process.env.REBUILD_STAGE||'after',url=process.env.REBUILD_URL||'http://127.0.0.1:4187',out=`evidence/visual-rebuild/${stage}`;
 fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
 await p.addInitScript(()=>{let seed=1;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:{},seen:true,sound:false,effects:false,courier:'pip'}))});
 await p.goto(url);await p.waitForTimeout(1000);await p.evaluate(()=>__ADV_TEST__.testMode(true));const states=[];
 for(let i=0;i<24;i++){
  await p.evaluate(i=>__ADV_TEST__.start(i),i);if(stage==='baseline'&&i===12)await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());
  const state=await p.evaluate(i=>{let g=__ADV_TEST__,l=g.levels[i],last=-100,t=0;g.input('right',true);for(;t<3600;t++){
   let s=g.get(),q=s.p;if(s.dialog||q.x>=l.width*.48)break;
   const hit=l.boxes.some(x=>x-(q.x+q.w)<60&&x-(q.x+q.w)>-6&&q.y+q.h>268),gap=l.ground.some((seg,j)=>j<l.ground.length-1&&seg[1]-(q.x+q.w)<26&&seg[1]-(q.x+q.w)>-5),dog=s.dogs.some(d=>d.x-(q.x+q.w)<60&&d.x-(q.x+q.w)>-8),star=s.stamps.some(v=>!v.taken&&v.y<250&&v.x-(q.x+15)<80&&v.x-(q.x+15)>0),key=l.postGate&&!s.postGateOpen&&l.postGate.switchX-(q.x+15)<100&&l.postGate.switchX-(q.x+15)>0;
   if(q.ground&&t-last>35&&(hit||gap||dog||star||key)){g.input('jump',true);last=t}if(t-last===30)g.input('jump',false);g.step(2)
  }g.input('right',false);g.render();let s=g.get();return {route:i+1,x:s.p.x,y:s.p.y,dialog:s.dialog,t,threshold:l.width*.48,midDelivered:s.midDelivered}} ,i);
  states.push(state);await p.screenshot({path:`${out}/route-${String(i+1).padStart(2,'0')}-mid-915x412.png`});
 }
 fs.writeFileSync(`${out}/midpoint-states.json`,JSON.stringify(states,null,2));console.log(JSON.stringify(states));await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
