const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),vm=require('node:vm');
const context={window:{}};vm.runInNewContext(fs.readFileSync('web/parcel-campaign.js','utf8'),context);const campaign=context.window.ParcelCampaign;
assert.equal(campaign.letters.length,24);assert.equal(campaign.chapters.length,5);
assert.equal(new Set(campaign.letters.map(l=>l.parcel)).size,24);
for(let i=0;i<24;i++){const letter=campaign.letter(i);assert.equal(letter.index,i);assert(letter.request.length>55&&letter.receipt.length>55);const c=campaign.chapter(i);assert(i>=c.start&&i<c.end)}
for(const asset of JSON.parse(fs.readFileSync('docs/v1-background-assets.json')).assets){assert.equal(asset.license,'CC0-1.0');assert.equal(crypto.createHash('sha256').update(fs.readFileSync('web/'+asset.file)).digest('hex'),asset.sha256)}
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await b.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{if(!sessionStorage.getItem('campaign-seeded')){sessionStorage.setItem('campaign-seeded','yes');localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:{1:3,2:1,4:2},seen:true,sound:false}))}});
  await page.goto('http://127.0.0.1:4187');await page.waitForFunction(()=>ParcelRenderer.ready());await page.evaluate(()=>__ADV_TEST__.testMode(true));
  const original=await page.evaluate(()=>JSON.stringify(__ADV_TEST__.levels));
  await page.click('#advHome [data-action=map]');assert.equal(await page.locator('[data-route-preview]').count(),24);assert.equal(await page.locator('.chapter-presentation').count(),5);
  await page.click('[data-map-filter=new]');assert.equal(await page.locator('[data-route-preview]').count(),21);
  await page.click('[data-map-filter=stars]');assert.equal(await page.locator('[data-route-preview]').count(),2);assert.match(await page.locator('#mapFilterStatus').innerText(),/2 routes/);
  await page.click('[data-chapter="2"]');assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Golden District');
  await page.click('[data-map-filter=all]');await page.click('#advMap [data-action=home]');await page.click('#advHome [data-action=scrapbook]');
  assert.equal(await page.locator('.campaign-letter').count(),24);assert.match(await page.locator('.campaign-letter').nth(0).innerText(),/Reply received/);
  await page.locator('.campaign-letter').nth(2).locator('summary').click();assert.match(await page.locator('.campaign-letter').nth(2).innerText(),/Complete this route to reveal/);
  await page.evaluate(()=>gameBack());await page.click('#advHome [data-action=settings]');await page.click('[data-action=express]');await page.click('[data-action=dialog-back]');
  await page.evaluate(()=>__ADV_TEST__.start(12));assert.equal(await page.evaluate(()=>__ADV_TEST__.get().runExpress),true);
  assert(Math.abs(await page.evaluate(()=>__ADV_TEST__.get().movers[0].speed)-1.375)<.00001);
  await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=settings]');await page.click('[data-action=express]');
  assert.equal(await page.evaluate(()=>__ADV_TEST__.get().runExpress),true,'settings cannot change the current run rules');
  await page.evaluate(()=>__ADV_TEST__.start(12));assert.equal(await page.evaluate(()=>__ADV_TEST__.get().runExpress),false);
  assert.equal(await page.evaluate(()=>JSON.stringify(__ADV_TEST__.levels)),original,'difficulty must never mutate shared level geometry');
  const animations=await page.evaluate(()=>{
   const c=document.createElement('canvas');c.width=720;c.height=400;const ctx=c.getContext('2d'),original=ctx.drawImage,seen=[];
   ctx.drawImage=function(image,...args){seen.push(image.src.split('/').pop());return original.call(this,image,...args)};
   const state={W:720,H:400,G:310,index:4,level:{...__ADV_TEST__.levels[4],springs:[100]},camera:0,p:{x:55,y:256,w:30,h:54,vx:0,ground:true,face:1},clock:.3,save:{effects:true,courier:'pip'},dogs:[],stamps:[],movers:[],bridgeActive:true,postGateOpen:true,checkpoint:200,hasParcel:false,midDelivered:false,parcelSpawnX:180,parcelBounce:0,ending:0,invulnerable:0,buddyMet:false,secretFound:false,reducedMotion:false,springPulse:{x:100,time:.2}};
   ParcelRenderer.draw(ctx,state);const moving=seen.slice();seen.length=0;ParcelRenderer.draw(ctx,{...state,reducedMotion:true});return {moving,reduced:seen};
  });
  assert(animations.moving.includes('flag_green_b.png'));assert(animations.moving.includes('spring_out.png'));assert(animations.moving.includes('background_clouds.png'));
  assert(!animations.reduced.includes('flag_green_b.png'));assert(!animations.reduced.includes('spring_out.png'));
  await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=settings]');await page.click('[data-action=express]');
  const incomplete=await page.evaluate(()=>{
   const g=__ADV_TEST__;g.start(0);g.input('right',true);let last=-100;
   for(let t=0;t<1200;t++){const s=g.get(),p=s.p,l=g.levels[0];const box=l.boxes.some(x=>x-(p.x+p.w)<60&&x-(p.x+p.w)>-6&&p.y+p.h>268);if(p.ground&&t-last>36&&box){g.input('jump',true);last=t}if(t-last===30)g.input('jump',false);g.step(2)}
   const state=g.get();return {x:state.p.x,stars:state.stamps.filter(s=>s.taken).length,hasParcel:state.hasParcel,ending:state.ending,dialog:state.dialog};
  });
  assert(incomplete.x>1200&&incomplete.stars<3&&incomplete.hasParcel,JSON.stringify(incomplete));assert.equal(incomplete.ending,0,'Express door must not accept a missing-star run');assert.notEqual(incomplete.dialog,'win');
  assert.deepEqual(errors,[]);
  console.log('PASS 24 connected dispatches, 5 chapters, creator asset hashes, map filters/jumps, sealed replies, immutable Express run settings and authored animation/reduced-motion poses.');
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
