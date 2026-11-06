const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
(async()=>{
 const manifest=JSON.parse(fs.readFileSync('docs/studio-soundtrack-assets.json'));
 for(const asset of manifest.assets){const data=fs.readFileSync('web/'+asset.file);assert.equal(asset.license,'CC0-1.0');assert.equal(crypto.createHash('sha256').update(data).digest('hex'),asset.sha256);assert.equal(crypto.createHash('sha1').update(Buffer.concat([Buffer.from(`blob ${data.length}\0`),data])).digest('hex'),asset.gitBlob,'original upstream bytes, not upconverted padding')}
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  const page=await b.newPage({viewport:{width:844,height:390}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.__audios=[];window.Audio=class{constructor(src){this.src=src;this.paused=true;window.__audios.push(this)}play(){this.paused=false;return Promise.resolve()}pause(){this.paused=true}};if(!sessionStorage.getItem('studio-seeded')){sessionStorage.setItem('studio-seeded','yes');localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:{1:3},seen:true,sound:true}))}});
  await page.goto('http://127.0.0.1:4187');await page.waitForFunction(()=>ParcelRenderer.ready());await page.click('#advHome [data-action=play]');await page.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(0)});
  assert.equal(await page.evaluate(()=>__audios.find(a=>a.src.includes('studio-audio')).src),'assets/studio-audio/round-1.wav');
  for(const [index,file] of [[4,'round-2'],[8,'round-3'],[12,'round-2'],[18,'round-3']]){await page.evaluate(i=>__ADV_TEST__.start(i),index);assert.equal(await page.evaluate(()=>__audios.find(a=>a.src.includes('studio-audio')).src),`assets/studio-audio/${file}.wav`)}
  assert.equal(await page.evaluate(()=>__audios.filter(a=>a.src.includes('studio-audio')).length),1,'one reused music player, not five concurrent WAV decoders');
  const selection=await page.evaluate(()=>({title:ParcelExperience.soundtrack('home',0,-1,true).file,ending:ParcelExperience.soundtrack('game',23,-1,true,true)}));assert.equal(selection.title,'assets/studio-audio/title.wav');assert.equal(selection.ending.file,'assets/studio-audio/ending.wav');assert.equal(selection.ending.loop,false);
  await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=settings]');await page.click('[data-action=studio-music]');
  assert.match(await page.locator('#soundtrackSelection').innerText(),/Kenney/);assert.equal(await page.evaluate(()=>__audios.filter(a=>!a.paused&&a.src.includes('studio-audio')).length),0);
  await page.reload();assert.equal(await page.evaluate(()=>__ADV_TEST__.get().save.fullSoundtrack),false,'old-music preference survives reload');assert.equal(await page.evaluate(()=>__ADV_TEST__.get().save.best[1]),3);
  await page.close();
  // Actual browser decoding, sequentially. Release each large media resource before the next.
  const decoder=await b.newPage();await decoder.goto('http://127.0.0.1:4187');const results=await decoder.evaluate(async()=>{const out=[];for(const name of ['title','round-1','round-2','round-3','ending']){const a=new Audio('assets/studio-audio/'+name+'.wav');a.volume=0;try{await a.play();out.push({name,ok:true,duration:a.duration})}catch(e){out.push({name,ok:false,error:String(e)})}finally{a.pause();a.removeAttribute('src');a.load()}}return out});assert(results.every(r=>r.ok&&r.duration>10),JSON.stringify(results));console.log('PASS exact original WAV provenance, stage routing, one-player reuse, saved Cozy option and real sequential WAV decoding:',JSON.stringify(results));assert.deepEqual(errors,[]);
 }finally{await b.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
