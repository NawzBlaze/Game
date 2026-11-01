// Synthetic CSS safe areas approximate a notch/gesture region; this is not native Android testing.
const {chromium}=require('playwright'),assert=require('assert');
(async()=>{const b=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 for(const [w,h] of [[568,320],[640,360],[800,600],[844,390],[915,412],[1024,400]]){
  const p=await b.newPage({viewport:{width:w,height:h},hasTouch:true,isMobile:true});await p.goto('http://127.0.0.1:4187');
  await p.evaluate(()=>{let s=document.documentElement.style;s.setProperty('--native-safe-left','44px');s.setProperty('--native-safe-right','32px');s.setProperty('--native-safe-top','10px');s.setProperty('--native-safe-bottom','20px')});
  await p.tap('#advHome [data-action=play]');
  const data=await p.evaluate(()=>{const r=s=>{let a=document.querySelector(s).getBoundingClientRect();return {left:a.left,right:a.right,top:a.top,bottom:a.bottom,width:a.width,height:a.height}};return {l:r('[data-control=left]'),r:r('[data-control=right]'),j:r('[data-control=jump]'),pause:r('[data-action=pause]'),canvas:r('#advCanvas'),size:Number(document.querySelector('#advCanvas').dataset.worldWidth)}});
  assert(data.l.left>=44&&data.j.right<=w-32&&data.j.bottom<=h-20,'controls overlap simulated safe areas '+JSON.stringify(data));
  assert(data.pause.left>=44&&data.pause.top>=10,'pause overlaps safe area');assert(data.l.width>=48&&data.j.width>=48,'targets too small');
  assert(Math.abs(data.size-400*w/h)<=1,'world canvas ratio does not match viewport');console.log('PASS simulated safe viewport',w,h);await p.close();
 } await b.close();})().catch(e=>{console.error(e);process.exit(1)});
