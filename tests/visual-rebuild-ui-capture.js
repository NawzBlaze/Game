// Capture existing screens in real Chromium, both baseline and WIP.
const {chromium}=require('playwright'),fs=require('fs');(async()=>{
 const stage=process.env.REBUILD_STAGE||'after',url=process.env.REBUILD_URL||'http://127.0.0.1:4187',out=`evidence/visual-rebuild/${stage}/ui`;fs.mkdirSync(out,{recursive:true});
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 for(const [w,h] of [[915,412],[390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h},isMobile:true,hasTouch:true});await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,3])),seen:true,sound:false,effects:false,courier:'pip'})));
  await p.goto(url);await p.waitForTimeout(800);const snap=async name=>{await p.waitForTimeout(400);await p.screenshot({path:`${out}/${name}-${w}x${h}.png`})};await snap('home');
  for(let [action,id] of [['map','Map'],['wardrobe','Wardrobe'],['challenges','Challenges'],['scrapbook','Scrapbook']]){await p.click(`#advHome [data-action=${action}]`);await snap(action);await p.click(`#adv${id} [data-action=home]`)}
  await p.click('#advHome [data-action=help]');await snap('help');await p.click('[data-action=close]');
  await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(0)});await p.click('#advGame [data-action=pause]');await snap('pause');await p.click('#advCard [data-action=resume]');
  const result=await p.evaluate(()=>{let g=__ADV_TEST__,l=g.levels[0],last=-100;g.input('right',true);for(let t=0;t<3600;t++){let s=g.get(),q=s.p;if(s.dialog==='win')return true;const hit=l.boxes.some(x=>x-(q.x+q.w)<60&&x-(q.x+q.w)>-6&&q.y+q.h>268),star=s.stamps.some(v=>!v.taken&&v.y<250&&v.x-(q.x+15)<100&&v.x-(q.x+15)>0);if(q.ground&&t-last>35&&(hit||star)){g.input('jump',true);last=t}if(t-last===30)g.input('jump',false);g.step(2)}return false});if(!result)throw Error('Route 1 completion scene was not reached');await snap('completion');await p.close();
 }
 await b.close();console.log(stage,'home, route book, wardrobe, special, scrapbook, help, pause, completion captured in two sizes');
})().catch(e=>{console.error(e);process.exit(1)});
