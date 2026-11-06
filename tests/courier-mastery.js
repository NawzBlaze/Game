const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {chromium}=require('playwright');
const context={window:{}};vm.runInNewContext(fs.readFileSync('web/courier-mastery.js','utf8'),context);const mastery=context.window.ParcelMastery;
assert.equal(mastery.summary().earned,0);
for(const invalid of [99,-1,3.5,'3',NaN,Infinity]){const bad=mastery.summary({best:{1:invalid},bonus:{0:invalid},clean:{0:true},secrets:{0:true}});assert.equal(bad.stars,0);assert.equal(bad.completed,0);assert.equal(bad.specials,0);assert.equal(bad.earned,0);}
assert.equal(mastery.nextRoute().index,0);
assert.notEqual(mastery.nextRoute({unlocked:1,best:{1:3}}).kind,'complete','partial unlocked progress is not a perfect campaign');
assert.equal(mastery.summary({best:{1:3,99:3,2:NaN}}).stars,3,'only genuine bounded route ratings count');
assert.equal(mastery.summary({clean:{0:true},secrets:{0:true}}).earned,0,'clean and secret badges need a completed special');
const full={unlocked:24,best:Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,3])),bonus:Object.fromEntries(Array.from({length:6},(_,i)=>[i,3])),clean:Object.fromEntries(Array.from({length:6},(_,i)=>[i,true])),secrets:{5:true}};
const before=JSON.stringify(full);assert.equal(mastery.summary(full).earned,11);assert.equal(mastery.nextRoute(full).kind,'complete');assert.equal(JSON.stringify(full),before,'derived honours must never mutate progress');
assert.equal(mastery.nextRoute({unlocked:3,best:{1:1}}).index,1,'new unlocked deliveries take priority over optional mastery');
assert.equal(mastery.nextRoute({unlocked:24,best:{...full.best,12:2}}).index,11);
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:568,height:320},{width:390,height:844}]){
   const p=await b.newPage({viewport}),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.addInitScript(()=>{localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:5,best:{1:3,2:1,3:2,4:1},sound:false,seen:true}));});
   await p.goto('http://127.0.0.1:4187');await p.waitForFunction(()=>ParcelRenderer.ready());
   await p.click('#advHome [data-action=scrapbook]');assert.equal(await p.locator('.honour-card').count(),11);assert.equal(await p.locator('.honour-card.earned').count(),2);assert.equal(await p.locator('.story-card').count(),12);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await p.evaluate(()=>gameBack());await p.click('#advHome [data-action=map]');assert.equal(await p.locator('#advDispatchGoal [data-level="4"]').count(),1);await p.click('#advDispatchGoal button');
   assert.equal(await p.evaluate(()=>__ADV_TEST__.get().index),4);
   await p.click('#advGame [data-action=pause]');await p.click('#advCard [data-action=settings]');assert.equal(await p.getByRole('dialog',{name:'Settings',exact:true}).count(),1);
   await p.evaluate(()=>{document.querySelector('#advCard').scrollTop=10000});
   const r=await p.locator('[data-action=dialog-back]').boundingBox();assert(r.y>=0&&r.y+r.height<=viewport.height,'sticky Back remains reachable after scrolling');
   await p.click('[data-action=dialog-back]');assert.equal(await p.locator('#advCard').getAttribute('data-dialog'),'pause');
   await p.click('#advCard [data-action=help]');assert.equal(await p.getByRole('dialog',{name:'How to play',exact:true}).count(),1);assert.equal(await p.locator('#advCard').evaluate(e=>e.scrollTop),0,'new content opens at the top, not stale settings scroll');
   await p.click('[data-action=dialog-back]');assert.equal(await p.locator('#advCard').getAttribute('data-dialog'),'pause');
   assert.deepEqual(errors,[]);await p.close();
  }
  console.log('PASS 11 derived honours, truthful rating bounds, completion prerequisites, next-delivery recommendations, phone layout and persistent nested-dialog Back.');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
