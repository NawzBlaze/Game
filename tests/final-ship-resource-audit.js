// Resource and runtime audit for the active build. Desktop + emulated touch; all 24 routes.
// Test hooks choose routes; this is automated Chromium, not a human/device test.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']}),result=[];
for(const [label,opts] of [['desktop',{viewport:{width:1280,height:720}}],['mobile-landscape',{viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2}],['mobile-portrait',{viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2}]]){
 const p=await b.newPage(opts),errors=[],bad=[],failed=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()])});p.on('requestfailed',r=>failed.push([r.url(),r.failure()?.errorText]));
 await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,3])),seen:true,sound:false,effects:true,courier:'pip'})));
 await p.goto(process.env.FINAL_AUDIT_URL||'http://127.0.0.1:4187/',{waitUntil:'networkidle'});await p.waitForTimeout(400);let count=0;
 for(let i=0;i<24;i++){await p.evaluate(i=>{let g=window.__ADV_TEST__;g.testMode(true);g.start(i);g.step(8);},i);await p.waitForTimeout(30);let state=await p.evaluate(()=>window.__ADV_TEST__.get());assert.equal(state.index,i);count++;}
 await p.waitForTimeout(300);let broken=await p.locator('img').evaluateAll(els=>els.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.currentSrc||x.src));
 let entry={label,count,errors,bad,failed,broken};result.push(entry);await p.close();
}
await b.close();fs.writeFileSync('evidence/final-ship/resources.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));assert(result.every(x=>!x.errors.length&&!x.bad.length&&!x.failed.length&&!x.broken.length),'resource audit failed');})().catch(e=>{console.error(e);process.exit(1)});
