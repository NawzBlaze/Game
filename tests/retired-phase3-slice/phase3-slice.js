// Route 13 production-slice integration, animated rows, cosmetics and isolation.
const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs');
(async()=>{
 const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const files=fs.readdirSync('web/assets/phase3-harbour').filter(x=>x.endsWith('.png'));
 for(const courier of ['pip','player','adventurer']){
  let errors=[];const p=await b.newPage({viewport:{width:915,height:412}});p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`)});
  await p.addInitScript(c=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:Object.fromEntries(Array.from({length:24},(_,i)=>[i+1,3])),seen:true,sound:false,effects:true,courier:c,hat:'cap',bag:'mint'})),courier);await p.goto('http://127.0.0.1:4187');
  assert(!(await p.evaluate(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/phase3-harbour/')))),'slice assets must not be requested on the home screen');
  const decoded=await p.evaluate(async names=>Promise.all(names.map(name=>new Promise(resolve=>{let i=new Image();i.onload=()=>resolve([name,i.naturalWidth,i.naturalHeight]);i.onerror=()=>resolve([name,0,0]);i.src='assets/phase3-harbour/'+name}))),files);
  assert(decoded.every(x=>x[1]>0&&x[2]>0),JSON.stringify(decoded));
  await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12)});await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());
  const r=await p.evaluate(()=>{
   const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,old=proto.drawImage,seen=[];let recording=false;
   proto.drawImage=function(im,...args){if(recording&&im.src&&im.src.includes('/phase3-harbour/'))seen.push({name:im.src.split('/').pop(),args});return old.call(this,im,...args)};
   const snap=()=>{seen.length=0;recording=true;g.render();recording=false;return seen.slice()};
   g.testMode(true);g.start(12);let idle=snap();g.input('right',true);g.step(15);let walk=snap();g.input('jump',true);g.step(2);let jump=snap();g.input('jump',false);
   const l=g.levels[12],staticPlatform=idle.find(v=>v.name==='bridge.png'&&v.args[0]===l.platforms[0][0]);
   const mover=idle.find(v=>v.name==='bridge.png'&&v.args[0]===l.moving[0][0]);
   g.start(12);g.input('right',true);let last=-100,delivery=null,stamps=0,mid=false,won=false;
   for(let t=0;t<3600;t++){
    const s=g.get(),q=s.p;mid=mid||s.midDelivered;if(s.ending>0&&!delivery)delivery=snap();if(s.dialog==='win'){won=true;stamps=s.stamps.filter(x=>x.taken).length;break}
    let hit=l.boxes.some(x=>x-(q.x+q.w)<60&&x-(q.x+q.w)>-6&&q.y+q.h>268),dog=s.dogs.some(d=>d.x-(q.x+q.w)<60&&d.x-(q.x+q.w)>-8),star=s.stamps.some(v=>!v.taken&&v.y<250&&v.x-(q.x+15)<100&&v.x-(q.x+15)>0);
    if(q.ground&&t-last>35&&(hit||dog||star)){g.input('jump',true);last=t}if(t-last===30)g.input('jump',false);g.step(2);
   }
   g.start(11);let other=snap();g.start(12,4);let challenge=snap();proto.drawImage=old;
   return {idle,walk,jump,delivery,staticPlatform,mover,expected:l.platforms[0],moving:l.moving[0],won,stamps,mid,other,challenge};
  });
  const sprite=courier==='pip'?'pig':courier;
  const row=(draws,name)=>draws.filter(v=>v.name===name+'-sheet.png').map(v=>v.args[1]/v.args[3]);
  assert(row(r.idle,sprite).includes(0),`idle ${courier}`);assert(row(r.walk,sprite).includes(1),`walk ${courier}`);assert(row(r.jump,sprite).includes(2),`jump ${courier}`);assert(r.delivery&&row(r.delivery,sprite).includes(3),`delivery ${courier}`);
  assert(r.idle.some(v=>v.name===sprite+'-bag-mint.png')&&r.idle.some(v=>v.name===sprite+'-hat-cap.png'),`cosmetics ${courier}`);
  assert(r.idle.some(v=>v.name==='backdrop.png'));assert(r.staticPlatform&&r.mover,JSON.stringify(r));
  const [x,y,w]=r.expected;assert.deepEqual(r.staticPlatform.args.slice(0,3),[x,y-3,w]);const [mx,my,mw]=r.moving;assert.deepEqual(r.mover.args.slice(0,3),[mx,my-3,mw]);
  assert(r.won&&r.mid&&r.stamps===3,JSON.stringify({courier,won:r.won,mid:r.mid,stamps:r.stamps}));
  assert.equal(r.other.length,0,'other route must keep prior renderer');assert.equal(r.challenge.length,0,'reused optional challenge must keep prior renderer');assert.deepEqual(errors,[]);
  console.log('PASS slice',courier,files.length,'PNG assets decode, idle/walk/jump/delivery rows, cosmetics, bridge alignment, two stops and 3 stamps, route/challenge isolation');await p.close();
 }
 // System reduced motion retains game physics but draws the dog's still row.
 const p=await b.newPage({viewport:{width:915,height:412},reducedMotion:'reduce'});await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false})));await p.goto('http://127.0.0.1:4187');await p.evaluate(()=>{__ADV_TEST__.testMode(true);__ADV_TEST__.start(12)});await p.waitForFunction(()=>__ADV_TEST__.artSliceReady());
 const dogRows=await p.evaluate(()=>{const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,old=proto.drawImage,out=[];g.testMode(true);g.start(12);proto.drawImage=function(im,...a){if(im.src&&im.src.endsWith('/phase3-harbour/dog-sheet.png'))out.push(a[1]/a[3]);return old.call(this,im,...a)};g.step(60);proto.drawImage=old;return out});assert(dogRows.length&&dogRows.every(x=>x===0),JSON.stringify(dogRows));await p.close();
 console.log('PASS reduced-motion dog uses still row while movement remains active');await b.close();
})().catch(e=>{console.error(e);process.exit(1)});
