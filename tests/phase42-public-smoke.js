// External-URL browser smoke, independent contexts; does not claim real-device testing.
const { chromium, devices } = require('playwright');
const fs=require('fs');
(async()=>{
 const url=process.env.PUBLIC_URL;if(!url)throw Error('PUBLIC_URL required');
 const b=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const results=[];
 for(const [name,opt] of [['desktop',{viewport:{width:1280,height:720}}],['mobile',{...devices['Galaxy S9+']} ]]){
   const ctx=await b.newContext({...opt,ignoreHTTPSErrors:false}),p=await ctx.newPage(),errors=[],bad=[],fail=[];
   p.on('pageerror',e=>errors.push(e.message));p.on('crash',()=>errors.push('renderer crashed'));
   p.on('response',r=>{if(r.status()>=400)bad.push([r.status(),r.url()])});
   p.on('requestfailed',r=>fail.push([r.url(),r.failure()?.errorText]));
   const response=await p.goto(url,{waitUntil:'networkidle',timeout:90000});
   await p.waitForSelector('#advHome:not(.adv-hidden)',{timeout:30000});
   const home=await p.locator('#advHome h1').innerText();
   await p.locator('#advHome [data-action=map]').click();await p.waitForSelector('#advMap:not(.adv-hidden)');
   const routeCount=await p.locator('#advMap [data-level]').count();
   await p.locator('#advMap [data-action=home]').click();await p.locator('#advHome [data-action=play]').click();
   await p.waitForSelector('#advGame:not(.adv-hidden)');
   const before=await p.evaluate(()=>__ADV_TEST__.get().p.x);
   if(name==='mobile') {const right=p.locator('#advGame [data-control=right]');if(await right.count()) {const bb=await right.boundingBox(),cdp=await ctx.newCDPSession(p),x=bb.x+bb.width/2,y=bb.y+bb.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});await p.waitForTimeout(900);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();}else{await p.keyboard.down('ArrowRight');await p.waitForTimeout(900);await p.keyboard.up('ArrowRight');}}
   else{await p.keyboard.down('ArrowRight');await p.waitForTimeout(900);await p.keyboard.up('ArrowRight');}
   const after=await p.evaluate(()=>__ADV_TEST__.get().p.x);
   await p.locator('#advGame [data-action=pause]').click();await p.waitForSelector('#advCard [data-action=resume]');
   await p.locator('#advCard [data-action=resume]').click();
   const sw=await p.evaluate(async()=>('serviceWorker' in navigator?(await navigator.serviceWorker.getRegistrations()).length:null));
   await p.screenshot({path:`evidence/phase42/public-${name}.png`});
   results.push({name,status:response.status(),home,routeCount,before,after,serviceWorkers:sw,errors,bad,fail});
   await ctx.close();
 }
 await b.close();fs.writeFileSync('evidence/phase42/public-smoke.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
 if(results.some(r=>r.status!==200||r.routeCount!==24||r.after<=r.before||r.errors.length||r.bad.length||r.fail.length))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1});
