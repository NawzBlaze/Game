const {chromium}=require('playwright'),assert=require('assert'),path=require('path');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});let p=await b.newPage({viewport:{width:915,height:412}});
 await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,3])),seen:true,sound:false,effects:true})));
 await p.goto('http://127.0.0.1:4187');await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12)});await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());
 const checks=await p.evaluate(async()=>{
  const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,old=proto.drawImage,out=[];let seen=[];
  proto.drawImage=function(im,...a){if(im.src&&im.src.includes('/phase3-harbour/'))seen.push(im.src.split('/').pop());return old.call(this,im,...a)};
  for(const [id,sprite] of [['pip','pig'],['player','player'],['adventurer','adventurer']])for(const hat of ['none','cap','flower'])for(const bag of ['classic','mint','berry']){
   document.querySelector('#advHome [data-action=wardrobe]').click();document.querySelector(`[data-courier="${id}"]`).click();document.querySelector(`[data-hat="${hat}"]`).click();document.querySelector(`[data-bag="${bag}"]`).click();g.start(12);let deadline=performance.now()+5000;while(!g.artSliceReady()&&performance.now()<deadline)await new Promise(r=>setTimeout(r,10));if(!g.artSliceReady())throw new Error('Selected cosmetic failed to load');seen=[];g.render();const save=g.get().save;
   out.push({id,hat,bag,ok:save.courier===id&&save.hat===hat&&save.bag===bag&&seen.includes(`${sprite}-sheet.png`)&&seen.includes(`${sprite}-hat-${hat}.png`)&&seen.includes(`${sprite}-bag-${bag}.png`)});
  }
  proto.drawImage=old;return out;
 });assert.equal(checks.length,27);assert(checks.every(x=>x.ok),JSON.stringify(checks));console.log('PASS 27 courier × hat × bag combinations use their own slice assets and preserve selections');await p.close();
 // Open the actual shipped files without HTTP/network, and wait for the slice assets.
 p=await b.newPage({viewport:{width:915,height:412}});let external=[];p.on('request',r=>{if(!r.url().startsWith('file:')&&!r.url().startsWith('data:'))external.push(r.url())});await p.goto('file://'+path.resolve('web/index.html'));await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12)});await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());assert.deepEqual(external,[]);assert.equal(await p.evaluate(()=>__ADV_TEST__.get().index),12);console.log('PASS route 13 custom assets decode from local file with no network requests');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
