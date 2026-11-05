/* New edition checks. Run against `npm start` with Playwright Chromium installed. */
const {chromium} = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
(async () => {
  const manifest = JSON.parse(fs.readFileSync('docs/kenney-assets.json'));
  for (const entry of manifest.assets) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync('web/' + entry.file)).digest('hex');
    assert.equal(hash, entry.sha256, entry.file + ' must remain unmodified');
    assert.equal(entry.license, 'CC0-1.0');
  }
  const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined, args: ['--no-sandbox']});
  try {
    for (const viewport of [{width:1280,height:800},{width:915,height:412},{width:568,height:320},{width:390,height:844},{width:320,height:590}]) {
      const page = await browser.newPage({viewport});
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      page.on('requestfailed', r => errors.push(r.url() + ': ' + r.failure().errorText));
      page.on('response', r => { if (r.status() >= 400) errors.push(r.status() + ': ' + r.url()); });
      await page.addInitScript(() => localStorage.setItem('delivery-adventure-v1', JSON.stringify({unlocked:24,best:{1:3,2:3,3:3,4:3,5:3,6:3},courier:'player',hat:'cap',bag:'mint',seen:true,sound:false})));
      await page.goto('http://127.0.0.1:4187');
      await page.waitForFunction(() => window.ParcelRenderer.ready());
      assert.equal(await page.locator('#advHome svg').count(),0,'no self-drawn home illustration');
      const mechanics=await page.evaluate(()=>{
        const canvas=document.createElement('canvas');canvas.width=720;canvas.height=400;const ctx=canvas.getContext('2d'),draw=ctx.drawImage;const seen=[];
        ctx.drawImage=function(image,...args){seen.push({asset:image.src.split('/').pop(),direction:Math.sign(ctx.getTransform().a)});return draw.call(this,image,...args)};
        const level={...__ADV_TEST__.levels[0],checkpoint:360,belts:[[100,80,1],[250,80,-1]]};
        ParcelRenderer.preview(ctx,level,0);ParcelRenderer.preview(ctx,{...level,kind:'fragile'},0);
        return {seen,normal:ParcelPresentation.parcel().asset,fragile:ParcelPresentation.parcel('fragile').asset,rule:ParcelPresentation.rule({kind:'wind'},700)};
      });
      assert.notEqual(mechanics.normal,'block_planks');assert.notEqual(mechanics.normal,mechanics.fragile);
      for(const direction of [-1,1])assert(mechanics.seen.some(s=>s.asset==='sign_right.png'&&s.direction===direction),'Belt signs must reflect both directions');
      assert(mechanics.seen.some(s=>s.asset==='block_blue.png'));assert(mechanics.rule.includes('ACTIVE'));

      for (const action of ['wardrobe','challenges','scrapbook','map']) {
        const savedBefore=await page.evaluate(()=>JSON.stringify(__ADV_TEST__.get().save));
        await page.click('#advHome [data-action=' + action + ']');
        if(action==='map'){
          assert.equal(await page.locator('[data-route-preview]').count(),24);
          assert.equal(await page.evaluate(()=>JSON.stringify(__ADV_TEST__.get().save)),savedBefore,'route thumbnails must not change progress');
          const unchanged=await page.evaluate(()=>{const g=__ADV_TEST__;g.testMode(true);const before=JSON.stringify(g.get());document.querySelectorAll('[data-route-preview]').forEach(c=>ParcelRenderer.preview(c.getContext('2d'),g.levels[Number(c.dataset.routePreview)],Number(c.dataset.routePreview)));return JSON.stringify(g.get())===before});
          assert(unchanged,'preview rendering must not mutate live gameplay');
        }
        assert.equal(await page.locator('#advApp').evaluate(e => e.scrollWidth <= e.clientWidth), true, action + ' horizontal overflow');
        await page.locator('.adv-screen:not(.adv-hidden) [data-action=home]').click();
      }
      const results = await page.evaluate(() => {
        const g = window.__ADV_TEST__; g.testMode(true);
        return g.levels.map((_,i) => { g.start(i); g.render(); const c=document.querySelector('#advCanvas'),v=document.querySelector('.adv-viewport');
          return {route:i+1,aspect:c.width/c.height,available:v.clientWidth/v.clientHeight}; });
      });
      for (const r of results) assert(Math.abs(r.aspect-r.available)<.03,'canvas should fit available play area: '+JSON.stringify(r));
      const controls = await page.locator('#advGame [data-control]').evaluateAll(nodes => nodes.map(e => {const r=e.getBoundingClientRect();return {width:r.width,height:r.height,bottom:r.bottom};}));
      for (const r of controls) assert(r.width>=44 && r.height>=44 && r.bottom<=viewport.height+1,JSON.stringify(r));
      const saved=await page.evaluate(()=>__ADV_TEST__.get().save);
      assert.equal(saved.hat,'cap','retired accessory selection is preserved');
      assert.equal(saved.bag,'mint');assert.equal(saved.courier,'player');assert.equal(saved.best[1],3);
      assert.deepEqual(errors,[]);
      console.log('PASS viewport',viewport.width+'x'+viewport.height,': menus, 24 route renders, controls, saves, resources');
      await page.close();
    }
    console.log('PASS',manifest.assets.length,'downloaded files match source hashes and CC0 manifest');
  } finally { await browser.close(); }
})().catch(e => {console.error(e); process.exitCode=1;});
