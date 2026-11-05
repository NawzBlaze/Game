// Alternating-order controlled candidate comparison, browser software renderer only.
// Static Route 13 with simulation frozen; not a measurement of user-device FPS.
const {chromium}=require('playwright'),fs=require('fs'),crypto=require('crypto');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']}),runs=[];
for(let round=0;round<3;round++)for(const name of (round%2?['candidate','baseline']:['baseline','candidate'])){
 const p=await b.newPage({viewport:{width:915,height:412},deviceScaleFactor:1.25});
 await p.route('**/adventure.js',r=>r.fulfill({path:`evidence/final-ship/${name==='baseline'?'adventure-before-opt':'adventure-opt-candidate'}.js`,contentType:'text/javascript'}));
 await p.addInitScript(()=>{localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false,effects:false,courier:'pip'}));let n=7;Math.random=()=>((n=n*16807%2147483647)/2147483647)});
 await p.goto('http://127.0.0.1:4187/',{waitUntil:'networkidle'});await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12);__ADV_TEST__.step(30)});await p.waitForTimeout(200);
 const data=await p.evaluate(()=>{const g=window.__ADV_TEST__;g.render();const pixel=document.querySelector('#advCanvas').toDataURL();let a=[];for(let j=0;j<5;j++){let t=performance.now();for(let i=0;i<120;i++)g.render();a.push(performance.now()-t)}return {pixel,elapsed:a}});
 const hash=crypto.createHash('sha256').update(data.pixel).digest('hex');runs.push({round:round+1,name,hash,elapsedMsFor120Draws:data.elapsed});console.log(JSON.stringify(runs.at(-1)));await p.close();
}
await b.close();fs.writeFileSync('evidence/final-ship/render-ab.json',JSON.stringify({method:'3 alternating-order fresh headless Chromium contexts, static route 13, DPR 1.25, 5 x 120 synchronous canvas draws; no device FPS inference',runs},null,2));
if(new Set(runs.map(r=>r.hash)).size!==1)throw Error('pixel hash mismatch');
})().catch(e=>{console.error(e);process.exit(1)});
