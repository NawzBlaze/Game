const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
 for(const asset of JSON.parse(fs.readFileSync('docs/soundtrack-assets.json')).assets){
  assert.equal(asset.license,'CC0-1.0');assert.equal(crypto.createHash('sha256').update(fs.readFileSync('web/'+asset.file)).digest('hex'),asset.sha256);
 }
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:844,height:390}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   window.__audios=[];window.Audio=class{constructor(src){this.src=src;this.paused=true;window.__audios.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}};
   if(!sessionStorage.getItem('experience-seeded')){sessionStorage.setItem('experience-seeded','yes');localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:{1:3},seen:true,sound:true}));}
  });
  await page.goto('http://127.0.0.1:4187');await page.waitForFunction(()=>ParcelRenderer.ready());
  await page.evaluate(()=>__ADV_TEST__.testMode(true));
  for(const [index,track] of [[0,'garden'],[4,'market'],[8,'golden'],[12,'harbour'],[18,'hilltop']]){
   await page.evaluate(i=>__ADV_TEST__.start(i),index);
   assert.equal(await page.evaluate(()=>__audios.find(a=>a.loop).src),`assets/release-audio/${track}.ogg`);
   assert.equal(await page.evaluate(()=>__audios.filter(a=>a.loop&&!a.paused).length),1,'only one music player');
  }
  await page.evaluate(()=>__ADV_TEST__.start(0,0));
  assert.equal(await page.evaluate(()=>__audios.find(a=>a.loop).src),'assets/release-audio/special.ogg');
  await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=settings]');
  await page.locator('#musicVolume').evaluate(e=>{e.value='0';e.dispatchEvent(new Event('input',{bubbles:true}))});await page.locator('#musicVolume').dispatchEvent('change');
  assert.equal(await page.evaluate(()=>__audios.find(a=>a.loop).paused),true,'zero music gain stops decoding');
  await page.locator('#effectsVolume').evaluate(e=>{e.value='35';e.dispatchEvent(new Event('input',{bubbles:true}))});await page.locator('#effectsVolume').dispatchEvent('change');
  assert.equal(await page.locator('#effectsVolumeValue').innerText(),'35%');
  await page.click('[data-action=district-music]');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('delivery-adventure-v1')));
  assert.equal(saved.musicVolume,0);assert.equal(saved.effectsVolume,35);assert.equal(saved.districtMusic,false);assert.equal(saved.best[1],3);
  await page.evaluate(()=>gameBack());await page.click('#advCard [data-action=help]');
  assert(await page.locator('.route-dossier').isVisible());assert.match(await page.locator('.route-dossier').innerText(),/Checkpoint|checkpoint/);
  await page.evaluate(()=>gameBack());await page.evaluate(()=>__ADV_TEST__.start(12));await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=help]');
  assert.match(await page.locator('.route-dossier').innerText(),/two-stop route/);
  await page.reload();const restored=await page.evaluate(()=>__ADV_TEST__.get().save);
  assert.equal(restored.musicVolume,0);assert.equal(restored.effectsVolume,35);assert.equal(restored.districtMusic,false);assert.equal(restored.unlocked,24);
  assert.deepEqual(errors,[]);
  console.log('PASS district/special music, single-player reuse, zero-gain pause, volume persistence, old progress preservation and contextual route guide.');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
