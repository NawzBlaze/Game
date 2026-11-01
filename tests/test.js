const {chromium}=require('playwright');
const assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1});
 const errors=[]; page.on('pageerror',e=>errors.push(String(e)));
 await page.goto('http://127.0.0.1:4187/');await page.click('#advHome [data-action=classic]');
 await page.screenshot({path:'tests/home-mobile.png',fullPage:true});
 await page.locator('#playBtn').click();
 assert.equal(await page.locator('[data-modal-action=close]').count(),1); await page.locator('[data-modal-action=close]').click();
 assert.equal(await page.evaluate(()=>__GAME_TEST__.getScreen()),'game');
 assert.equal(await page.locator('.tile').count(),36);
 let dimensions=await page.locator('.tile').evaluateAll(nodes=>nodes.map(n=>{let b=n.getBoundingClientRect();return [b.width,b.height]}));for(let [w,h] of dimensions)assert.ok(Math.abs(w-h)<1,`non-square tile ${w} x ${h}`);
 await page.screenshot({path:'tests/game-mobile.png',fullPage:true});
 // An actual complete level, solved using the in-game hints, and tested for save/reload.
 let start=Date.now();let initial=await page.evaluate(()=>__GAME_TEST__.getState());
 await page.locator('#hintBtn').click();assert.equal(await page.locator('.tile.hint').count(),1);
 let direction=await page.evaluate(()=>__GAME_TEST__.findHint());await page.locator(`[data-direction="${direction}"]`).click();
 assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,1);
 await page.locator('#undoBtn').click();assert.deepStrictEqual(await page.evaluate(()=>__GAME_TEST__.getState()),initial);
 for(let i=0;i<7;i++){let d=await page.evaluate(()=>__GAME_TEST__.findHint());assert.ok(d);await page.locator(`[data-direction="${d}"]`).click();}
 await page.locator('[data-modal-action="next"]').waitFor({timeout:3000});
 assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).stars['1'],3);
 await page.reload();await page.click('#advHome [data-action=classic]');assert.equal((await page.evaluate(()=>__GAME_TEST__.getProgress())).unlocked,2);
 await page.locator('#levelsHomeBtn').click();assert.equal(await page.locator('.level-cell:not(:disabled)').count(),2);
 // Find and follow a losing path in a drone level; verify caught screen and undo.
 const route=await page.evaluate(()=>{let g=__GAME_TEST__,l=g.levels[2],q=[{s:{p:l.start,d:l.drones,has:false,moves:0,caught:false},path:[]}],seen=new Set();while(q.length){let n=q.shift();for(let d of ['up','right','down','left']){let r=g.transition(l,n.s,d);if(r.dead)return [...n.path,d];if(!r.invalid&&!r.won){let k=JSON.stringify([r.state.p,r.state.d,r.state.has]);if(!seen.has(k)){seen.add(k);q.push({s:r.state,path:[...n.path,d]})}}}}});
 await page.evaluate(()=>__GAME_TEST__.startLevel(2));await page.locator('[data-modal-action=close]').click();for(let d of route)await page.locator(`[data-direction="${d}"]`).click();await page.locator('[data-modal-action="undo"]').waitFor();await page.locator('[data-modal-action="undo"]').click();assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).caught,false);
 // Compare independently generated Python shortest distances to JS breadth-first search.
 const results=await page.evaluate(()=>{let g=__GAME_TEST__;return g.levels.map((l,idx)=>{let initial={p:l.start,d:l.drones,has:false,moves:0,caught:false},q=[initial],head=0,seen=new Set();function key(s){return JSON.stringify([s.p,s.d,s.has])}seen.add(key(initial));while(head<q.length){let s=q[head++];for(const d of ['up','right','down','left']){let r=g.transition(l,s,d,true);if(r.invalid||r.dead)continue;if(r.won)return {level:idx+1,optimal:l.optimal,js:r.state.moves,visited:head};let k=key(r.state);if(!seen.has(k)){seen.add(k);q.push(r.state)}}}return {level:idx+1,error:'unsolvable'}})});
 assert.equal(results.length,48);for(const r of results)assert.equal(r.js,r.optimal,JSON.stringify(r));
 console.log('All 48 JS shortest paths match Python solver:',results.map(r=>r.js).join(','));
 console.log('Caught/undo path:',route.join(','),'progress persistence OK');
 // Mobile and desktop overflow checks
 for(const size of [{width:320,height:640},{width:390,height:844},{width:1280,height:800}]){await page.setViewportSize(size);await page.evaluate(()=>__GAME_TEST__.startLevel(0));const layout=await page.evaluate(()=>({body:document.documentElement.scrollWidth,width:innerWidth,board:document.querySelector('#board').getBoundingClientRect().width}));assert.ok(layout.body<=layout.width,JSON.stringify(layout));assert.ok(layout.board>150);console.log('Layout',size,layout);}
 assert.deepStrictEqual(errors,[]);console.log('No page errors; elapsed',Date.now()-start,'ms');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
