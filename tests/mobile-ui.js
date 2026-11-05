/* Mobile APK UI contract, exercised in Chromium with the native bridge present. */
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
(async()=>{
  const manifest=JSON.parse(fs.readFileSync('docs/mobile-ui-assets.json'));
  for(const asset of manifest.assets){assert.equal(asset.license,'CC0-1.0');assert.equal(crypto.createHash('sha256').update(fs.readFileSync('web/'+asset.file)).digest('hex'),asset.sha256);}
  const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
  try{
    for(const viewport of [{width:568,height:320},{width:844,height:390},{width:960,height:432}]){
      const page=await browser.newPage({viewport,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{window.NativeOrientation={setMode(){}};localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:1,best:{},seen:true,sound:false}));});
      await page.goto('http://127.0.0.1:4187');await page.waitForFunction(()=>ParcelRenderer.ready());
      assert.equal(await page.locator('#advHome [data-progress=open]').count(),0,'unimplemented native file export must not be advertised');
      const homeButtons=await page.locator('#advHome button:visible').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}}));
      for(const r of homeButtons)assert(r.x>=0&&r.y>=0&&r.right<=viewport.width+1&&r.bottom<=viewport.height+1&&r.w>=44&&r.h>=44,'APK home button outside viewport '+JSON.stringify({viewport,r}));
      await page.click('#advHome [data-action=settings]');
      await page.click('#advCard [data-action=sound]');assert.match(await page.locator('#advCard [data-action=sound]').innerText(),/on/);
      await page.evaluate(()=>gameBack());assert(await page.locator('#advDialog').isHidden(),'Android back closes home settings');
      await page.click('#advHome [data-action=play]');await page.evaluate(()=>__ADV_TEST__.testMode(true));
      const feet=await page.evaluate(()=>{const s=__ADV_TEST__.get(),r=document.querySelector('#advCanvas').getBoundingClientRect();return r.y+(s.p.y+s.p.h-48)/400*r.height});
      for(const control of await page.locator('[data-control]').all()){const r=await control.boundingBox();assert(r.y>=feet-1,'thumb controls obscure courier feet');assert(r.width>=60&&r.height>=60);}
      await page.click('#advGame [data-action=pause]');
      for(const button of await page.locator('#advCard button').all()){const r=await button.boundingBox();assert(r.y>=0&&r.y+r.height<=viewport.height+1,'pause action clipped');}
      await page.click('#advCard [data-action=settings]');await page.click('#advCard [data-action=credits]');
      assert.equal(await page.locator('#advCard a[href="CREDITS.txt"]').count(),0,'no blocked native text-file navigation');
      await page.evaluate(()=>gameBack());assert.equal(await page.locator('#advCard').getAttribute('data-dialog'),'settings');
      await page.evaluate(()=>gameBack());assert.equal(await page.locator('#advCard').getAttribute('data-dialog'),'pause');
      await page.click('#advCard [data-action=resume]');assert(await page.locator('#advDialog').isHidden());
      await page.evaluate(()=>{document.documentElement.style.setProperty('--native-safe-left','44px');document.documentElement.style.setProperty('--native-safe-right','24px')});
      const controls=await page.locator('[data-control]').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,right:r.right}}));
      for(const r of controls)assert(r.x>=44&&r.right<=viewport.width-24+1,'controls ignore native cutout insets');
      assert.deepEqual(errors,[]);console.log('PASS mobile APK UI',viewport.width+'x'+viewport.height,': sourced skins, reachable menus, native back stack, thumb clearance, cutouts');await page.close();
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
