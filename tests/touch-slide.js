// Real wall-clock rendering and browser touch events; the hook is read-only observation.
const {chromium}=require('playwright');const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:915,height:412},hasTouch:true,isMobile:true});const p=await context.newPage(),errors=[];
 p.on('pageerror',e=>errors.push(e.message)); await p.addInitScript(()=>localStorage.setItem('delivery-adventure-v1',JSON.stringify({unlocked:24,best:{},seen:true,sound:false})));
 await p.goto('http://127.0.0.1:4187');await p.tap('#advHome [data-action=play]');
 const cdp=await context.newCDPSession(p);const point=async(id,s)=>{const b=await p.locator(s).boundingBox();return {x:Math.round(b.x+b.width/2),y:Math.round(b.y+b.height/2),id}};
 const right=await point(1,'[data-control=right]'),left=await point(1,'[data-control=left]'),jump=await point(2,'[data-control=jump]');
 const get=()=>p.evaluate(()=>__ADV_TEST__.get().p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right]});await p.waitForTimeout(470);let a=await get();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[left]});await p.waitForTimeout(520);let b=await get();
 assert(b.x<a.x-20,`dragging across direction buttons did not reverse: ${a.x} -> ${b.x}`);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[right]});await p.waitForTimeout(240);let c=await get();
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[right,jump]});await p.waitForTimeout(140);let d=await get();
 assert(d.x>c.x+5,'right plus jump must continue moving');assert(d.y<c.y-10,'second finger must jump');
 await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await p.waitForTimeout(450);const e=await get();await p.waitForTimeout(350);const f=await get();
 assert(Math.abs(f.x-e.x)<2,`cancel left movement stuck: ${e.x} -> ${f.x}`);assert.deepEqual(errors,[]);
 console.log('PASS slide reversal, independent jump/movement, cancel and no page errors', {a:a.x,b:b.x,c:c.x,d:d.x});await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
