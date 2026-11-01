const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const ctx=await browser.newContext({viewport:{width:320,height:590},hasTouch:true});
 const page=await ctx.newPage();let errors=[],bad=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:4187');await page.click('#advHome [data-action=classic]');await page.click('#playBtn');await page.click('[data-modal-action=close]');
 for(const b of await page.locator('.dpad button,.game-actions .icon-btn').all()){
   const rect=await b.boundingBox();assert.ok(rect.width>=44&&rect.height>=44,JSON.stringify(rect));assert.ok(rect.y+rect.height<=590,JSON.stringify(rect));
 }
 // Adjacent-cell tap, blocked move feedback, undo and save.
 await page.locator('[data-x="1"][data-y="4"]').click();assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,1);
 await page.click('#undoBtn');assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,0);
 await page.locator('[data-x="0"][data-y="3"]').click();assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,1);
 await page.reload();await page.click('#advHome [data-action=classic]');await page.click('#playBtn');assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,1);await page.click('#undoBtn');
 // Reduced motion preference works independently of OS setting and persists.
 await page.click('#gameHelpBtn');await page.locator('[data-modal-action="toggle-motion"]').click();assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).motion,false);await page.click('[data-modal-action=close]');
 await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.courier-sprite').evaluate(el=>el.getAnimations().length),0);
 await page.reload();await page.click('#advHome [data-action=classic]');assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).motion,false);await page.click('#playBtn');await page.click('#undoBtn');
 // Complete and replay: best moves, goal, and retry action are preserved.
 await page.evaluate(()=>{for(const d of ['right','right','right','right','right','up','up'])__GAME_TEST__.move(d)});await page.waitForTimeout(320);
 assert.equal(await page.locator('#classicResult [data-modal-action=retry]').count(),1);assert.match(await page.locator('#classicResult').innerText(),/Delivery complete/);assert.match(await page.locator('#goalCounter').getAttribute('aria-label'),/Three-star goal/);assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).bestMoves[1],7);
 await page.click('[data-modal-action=retry]');assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,0);
 await page.evaluate(()=>{for(const d of ['right','left','right','right','right','right','right','up','up'])__GAME_TEST__.move(d)});await page.waitForTimeout(320);assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).bestMoves[1],7);
 // Find a legal route to pickup with a dog and verify the transient pause notice.
 await page.evaluate(()=>__GAME_TEST__.startLevel(2));if(await page.locator('[data-modal-action=close]').count())await page.click('[data-modal-action=close]');
 const path=await page.evaluate(()=>{let g=__GAME_TEST__,l=g.levels[2],start=g.getState(),q=[{s:start,path:[]}],seen=new Set(),i=0;while(i<q.length){let {s,path}=q[i++];for(const d of ['up','right','down','left']){let r=g.transition(l,s,d,true);if(r.dead||r.invalid)continue;let route=[...path,d];if(r.picked)return route;let k=JSON.stringify([r.state.p,r.state.d,r.state.has]);if(!seen.has(k)){seen.add(k);q.push({s:r.state,path:route})}}}throw Error('no route to parcel')});
 await page.evaluate(path=>path.forEach(d=>__GAME_TEST__.move(d)),path);assert.ok((await page.locator('#boardSub').innerText()).includes('Dogs paused'));assert.equal(await page.locator('.pause-badge').count(),1);await page.waitForTimeout(980);assert.equal(await page.locator('.pause-badge').count(),0);
 assert.deepStrictEqual(errors,[]);assert.deepStrictEqual(bad,[]);await browser.close();console.log('Overhaul checks passed: 320×590 touch targets; tap/swipe; save/undo; motion preference; personal best, replay, dog-pause feedback; no page errors.');
})().catch(e=>{console.error(e);process.exit(1)});
