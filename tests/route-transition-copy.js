const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await b.newPage({viewport:{width:915,height:412}});
 await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false})));
 await p.goto('http://127.0.0.1:4187');
 await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(10)});
 assert((await p.locator('#advMessage').innerText()).includes('Fragile'));
 await p.evaluate(()=>__ADV_TEST__.start(11));
 assert.equal(await p.locator('#advMessage').textContent(),'');
 assert.equal(await p.locator('#advMessage').evaluate(e=>getComputedStyle(e).visibility),'hidden');
 for (const [width,height] of [[568,320],[640,360],[915,412]]){
   await p.setViewportSize({width,height});
   for(let i=0;i<24;i++){
     let hud=await p.evaluate(i=>{
       __ADV_TEST__.start(i);const title=document.querySelector('#advTitle'),titleBox=document.querySelector('.adv-game-title').getBoundingClientRect(),stamps=document.querySelector('#advStamps').getBoundingClientRect();
       return {title:title.textContent,visible:title.scrollWidth<=title.clientWidth,clear:titleBox.right<=stamps.left};
     },i);
     assert(hud.visible&&hud.clear,`${width} route ${i+1}: ${JSON.stringify(hud)}`);
   }
 }
 console.log('PASS stale route message hidden; all 24 titles fit at 568, 640 and 915px');
 await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
