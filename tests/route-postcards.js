const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 for(const [w,h] of [[568,320],[915,412],[390,844]]){
  const p=await b.newPage({viewport:{width:w,height:h}}),errors=[];
  p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(r.url()+': '+r.status())});
  await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:3,best:{1:3,2:2},seen:true,sound:false})));
  await p.goto('http://127.0.0.1:4187');await p.click('#advHome [data-action=map]');
  assert.equal(await p.locator('.adv-level').count(),24);
  assert.equal(await p.locator('.adv-route-postcard').count(),24);
  assert(await p.locator('[data-level="2"]').isEnabled());assert(await p.locator('[data-level="3"]').isDisabled());
  assert.match(await p.locator('[data-level="0"]').getAttribute('aria-label'),/3 stars/);
  assert.match(await p.locator('[data-level="3"]').getAttribute('aria-label'),/locked/);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${w}x${h}`);
  const decoded=await p.evaluate(async()=>Promise.all(Array.from({length:24},(_,i)=>new Promise(resolve=>{let im=new Image();im.onload=()=>resolve(im.naturalWidth>0);im.onerror=()=>resolve(false);im.src=`assets/route-views/route-${String(i+1).padStart(2,'0')}.jpg`}))));
  assert(decoded.every(Boolean),JSON.stringify(decoded));assert.deepEqual(errors,[]);
  await p.close();console.log('PASS 24 route-specific postcards, accurate lock/stars and no overflow',w,h);
 }
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
