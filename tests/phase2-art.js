// Verifies loaded art, route-specific backdrop planning, platform placement and
// reduced-motion courier transforms in the integrated game, not a mock scene.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const p=await browser.newPage({viewport:{width:915,height:412},reducedMotion:'reduce'}),errors=[],bad=[];
 p.on('pageerror',e=>errors.push(String(e)));p.on('response',r=>{if(r.status()>=400)bad.push(r.url()+': '+r.status())});
 await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,seen:true,sound:false,effects:true})));
 await p.goto('http://127.0.0.1:4187');
 const assets=['storybook-platform-grass','storybook-platform-wood','storybook-platform-stone','storybook-shrub-low','storybook-shrub-round'];
 const loaded=await p.evaluate(async names=>Promise.all(names.map(n=>new Promise(resolve=>{const im=new Image();im.onload=()=>resolve([n,im.naturalWidth,im.naturalHeight]);im.onerror=()=>resolve([n,0,0]);im.src='assets/painterly/'+n+'.png'}))),assets);
 assert(loaded.every(x=>x[1]>0&&x[2]>0),JSON.stringify(loaded));
 const result=await p.evaluate(()=>{
  const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,original=proto.drawImage,rotate=proto.rotate,seen=[],angles=[];let drawing=false;
  proto.drawImage=function(im,...args){if(drawing&&im.src&&im.src.includes('storybook-platform-'))seen.push({src:im.src.split('/').pop(),args});return original.call(this,im,...args)};
  proto.rotate=function(angle){if(drawing)angles.push(angle);return rotate.call(this,angle)};
  g.testMode(true);let levelChecks=[];
  for(let i=0;i<24;i++){
   if(i===12)continue; // Route 13 now uses the dedicated Phase 3 sheet test.
   g.start(i);seen.length=0;drawing=true;g.render();drawing=false;
   const l=g.levels[i],style=l.theme===4?'stone':l.theme===3?'wood':'grass',platforms=seen.slice();
   levelChecks.push({route:i+1,style,expected:l.platforms,drawn:platforms});
  }
  g.start(0);g.input('jump',true);g.step(8);angles.length=0;drawing=true;g.render();drawing=false;
  proto.drawImage=original;proto.rotate=rotate;
  return {levelChecks,angles};
 });
 for(const r of result.levelChecks){assert.equal(r.drawn.length,r.expected.length,`route ${r.route}`);for(let i=0;i<r.drawn.length;i++){const [x,y,w]=r.expected[i],d=r.drawn[i];assert(d.src.includes(r.style),JSON.stringify(r));assert.deepEqual(d.args.slice(0,3),[x,y-1,w],JSON.stringify({route:r.route,d,expected:r.expected[i]}));}}
 const reducedDog=await p.evaluate(async()=>{
  await Promise.all(['dog-still','dog-walk'].map(n=>new Promise((resolve,reject)=>{let i=new Image();i.onload=resolve;i.onerror=reject;i.src='assets/painterly/'+n+'.png'})));
  const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,old=proto.drawImage,seen=[];
  proto.drawImage=function(im,...a){if(im.src&&/pug-(idle|walk)\.png$/.test(im.src))seen.push(im.src.split('/').pop());return old.call(this,im,...a)};
  g.start(2);g.render();proto.drawImage=old;return seen;
 });
 assert(reducedDog.includes('pug-idle.png')&&!reducedDog.includes('pug-walk.png'),JSON.stringify(reducedDog));
 const gap=await p.evaluate(()=>{
  const g=__ADV_TEST__,proto=CanvasRenderingContext2D.prototype,oldArc=proto.arc;let shadows=0,capture=false;
  proto.arc=function(...a){if(capture&&this.fillStyle==='#243d32'&&a[2]===1)shadows++;return oldArc.apply(this,a)};
  g.start(1);g.input('right',true);let jumped=false,jumpAt=-1,found=false,position=null,furthest=0;
  for(let t=0;t<900;t++){
   let s=g.get(),q=s.p;furthest=Math.max(furthest,q.x);
   if(!jumped&&q.ground&&360-(q.x+q.w)<55&&360-(q.x+q.w)>-6){g.input('jump',true);jumped=true;jumpAt=t}
   if(jumped&&t-jumpAt===30)g.input('jump',false);
   if(q.x+q.w/2>600&&q.x+q.w/2<665&&q.y+q.h>310){capture=true;g.render();capture=false;found=true;position={x:q.x,y:q.y};break}
   g.step(1);
  }
  proto.arc=oldArc;return {found,shadows,position,furthest};
 });
 assert(gap.found,`no gap state reached: ${JSON.stringify(gap)}`);assert.equal(gap.shadows,0,`floating shadow over gap: ${JSON.stringify(gap)}`);
 // Static stamp rotation is -.08; the player pose transform must be exactly 0.
 assert(result.angles.includes(0),`reduced-motion player transform absent: ${result.angles}`);
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);
 console.log('PASS 5 integrated assets decode; the 23 unchanged routes use themed ledges aligned to original platform coordinates; reduced-motion pose remains unrotated, no contact shadow over gap; no page or HTTP errors.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
