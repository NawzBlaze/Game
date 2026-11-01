const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
(async()=>{
 const sum=()=>fs.readFileSync('dist/SHA256SUMS.txt','utf8');const before=sum();execFileSync('python3',['tools/build_release.py']);assert.equal(sum(),before,'two builds must be byte-for-byte reproducible');
 const manifest=JSON.parse(fs.readFileSync('dist/web/build-manifest.json'));
 for(const [name,hash] of Object.entries(manifest.files)){assert.equal(crypto.createHash('sha256').update(fs.readFileSync('dist/web/'+name)).digest('hex'),hash,name);}
 assert(!fs.existsSync('dist/web/assets/painterly'));assert(!fs.existsSync('dist/web/assets/classic-painted'));
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 try{
  for(const viewport of [{width:1280,height:800},{width:568,height:320},{width:390,height:844}]){
   const page=await browser.newPage({viewport}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('requestfailed',r=>errors.push(r.url()));page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
   await page.addInitScript(()=>{if(sessionStorage.getItem('release-seeded'))return;sessionStorage.setItem('release-seeded','yes');localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false,best:{1:3}}));localStorage.setItem('one-step-delivery-v2',JSON.stringify({unlocked:48,introSeen:true,dogIntroSeen:true,sound:false,stars:{1:3}}));});
   const response=await page.goto('http://127.0.0.1:4188');assert.equal(response.headers()['x-content-type-options'],'nosniff');assert(response.headers()['content-security-policy'].includes("connect-src 'none'"));
   await page.waitForFunction(()=>ParcelRenderer.ready());assert.equal(await page.evaluate(()=>window.__ADV_TEST__===undefined&&window.__GAME_TEST__===undefined),true,'release must not expose test APIs');
   await page.click('#advHome [data-action=map]');
   for(let i=0;i<24;i++){
    await page.click('#advLevels [data-level="'+i+'"]');await page.waitForTimeout(20);
    await page.click('#advGame [data-action=pause]');await page.click('#advCard [data-action=map]');await page.click('#advCard [data-action=leave-confirm]');
   }
   await page.click('#advMap [data-action=home]');await page.click('[data-progress=open]');
   const [download]=await Promise.all([page.waitForEvent('download'),page.click('[data-progress=export]')]);const path=await download.path();assert.equal(JSON.parse(fs.readFileSync(path,'utf8')).format,'little-parcel-crew-backup');
   await page.setInputFiles('#progressFile',{name:'invalid.json',mimeType:'application/json',buffer:Buffer.from('{"unlocked":999}')});assert.equal(await page.locator('#confirmRestore').isVisible(),false);await page.waitForFunction(()=>document.querySelector('#progressStatus').textContent.includes('not a supported'));assert((await page.locator('#progressStatus').innerText()).includes('not a supported'));
   const valid=JSON.parse(fs.readFileSync(path,'utf8'));valid.saves['delivery-adventure-v1'].unlocked=6;
   await page.setInputFiles('#progressFile',{name:'valid.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(valid))});
   await page.locator('#confirmRestore').waitFor({state:'visible'});assert.equal(await page.locator('#confirmRestore').isVisible(),true);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('delivery-adventure-v1')).unlocked),24,'selecting file must not restore before confirmation');
   await Promise.all([page.waitForNavigation(),page.click('#confirmRestore')]);
   assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('delivery-adventure-v1')).unlocked),6);
   assert(await page.evaluate(()=>!!localStorage.getItem('lpc-before-restore')));
   await page.click('#advHome [data-action=classic]');await page.click('#levelsHomeBtn');
   for(let i=0;i<48;i++){
    await page.click('#chapters [data-level="'+i+'"]');if(await page.locator('#modalLayer:not(.hidden) [data-modal-action=close]').isVisible())await page.locator('#modalCard [data-modal-action=close]').click();
    assert.equal(await page.locator('#board .tile').count(),36);
    await page.click('#gameBackBtn');
   }
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.waitForTimeout(300);assert.deepEqual(errors,[]);await page.close();console.log('PASS built RC',viewport.width+'x'+viewport.height,': CSP, no hooks, 24+48 UI route starts, backup download, invalid import, confirmed restore/reload, resources.');
  }
 }finally{await browser.close();}
 console.log('PASS release file integrity, deterministic packaging and legacy-asset exclusion.');
})().catch(e=>{console.error(e);process.exitCode=1;});
