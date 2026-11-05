// Capture actual deterministic route gameplay frames at 568x320; no state teleportation.
const {chromium}=require('playwright'),fs=require('fs');
(async()=>{const out='evidence/phase3/motion-frames';fs.mkdirSync(out,{recursive:true});const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),p=await b.newPage({viewport:{width:568,height:320},isMobile:true,hasTouch:true});
await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false,effects:true})));await p.goto('http://127.0.0.1:4187');await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12)});await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());await p.screenshot({path:'evidence/phase3/after-pip-568.png'});
for(let frame=0;frame<135;frame++){
 await p.evaluate(frame=>{const g=__ADV_TEST__;if(frame===8)g.input('right',true);const s=g.get(),l=g.levels[12],q=s.p;let hit=l.boxes.some(x=>x-(q.x+q.w)<60&&x-(q.x+q.w)>-6&&q.y+q.h>268),dog=s.dogs.some(d=>d.x-(q.x+q.w)<60&&d.x-(q.x+q.w)>-8),star=s.stamps.some(v=>!v.taken&&v.y<250&&v.x-(q.x+15)<95&&v.x-(q.x+15)>0);if(q.ground&&(hit||dog||star)&&(!window.lastSliceJump||frame-window.lastSliceJump>12)){g.input('jump',true);window.lastSliceJump=frame}if(window.lastSliceJump&&frame-window.lastSliceJump===5)g.input('jump',false);g.step(6)},frame);
 await p.screenshot({path:`${out}/${String(frame).padStart(3,'0')}.png`});
}
console.log('Captured',135,'actual gameplay frames at 568×320');await b.close()})().catch(e=>{console.error(e);process.exit(1)});
