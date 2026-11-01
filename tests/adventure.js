const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH||undefined,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:320,height:590},hasTouch:true});const page=await context.newPage();const errors=[],bad=[];page.on('pageerror',e=>errors.push(String(e)));page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});
 await page.goto('http://127.0.0.1:4187');await page.click('#advHome [data-action=play]');assert(await page.locator('#advTutorial').isVisible());await page.click('[data-action=skip-tutorial]');
 const sizes=await page.locator('#advGame [data-control]').evaluateAll(a=>a.map(e=>{const b=e.getBoundingClientRect();return {w:b.width,h:b.height,bottom:b.bottom}}));for(const r of sizes){assert(r.w>=44&&r.h>=44&&r.bottom<=590,JSON.stringify(r))}
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 // Real keyboard input starts movement, jump rises, pause stops simulation and clears held input.
 let x=(await page.evaluate(()=>__ADV_TEST__.get())).p.x;await page.keyboard.down('ArrowRight');await page.waitForTimeout(500);let now=await page.evaluate(()=>__ADV_TEST__.get());assert(now.p.x>x+30);await page.keyboard.down('Space');await page.waitForTimeout(160);let jumping=await page.evaluate(()=>__ADV_TEST__.get());assert(jumping.p.y<now.p.y-10);await page.keyboard.up('Space');await page.keyboard.up('ArrowRight');await page.click('#advGame [data-action=pause]');let paused=await page.evaluate(()=>__ADV_TEST__.get());await page.waitForTimeout(300);assert.equal((await page.evaluate(()=>__ADV_TEST__.get())).p.x,paused.p.x);await page.click('#advCard [data-action=resume]');
 // Actual pointer-hold on a touch-sized movement button.
 let before=(await page.evaluate(()=>__ADV_TEST__.get())).p.x;const button=await page.locator('[data-control=right]').boundingBox();await page.mouse.move(button.x+button.width/2,button.y+button.height/2);await page.mouse.down();await page.waitForTimeout(350);await page.mouse.up();assert((await page.evaluate(()=>__ADV_TEST__.get())).p.x>before+15);
 // Execute actual physics controls, without teleportation, until every route wins.
 let results=await page.evaluate(()=>{let g=__ADV_TEST__;g.testMode(true);let out=[];for(let i=0;i<g.levels.length;i++){g.start(i);document.querySelector('#advCard [data-action=close]')?.click();g.input('right',true);let t=0,lastJump=-100,prevX=55,resets=0;
  for(;t<3600;t++){let s=g.get();if(s.dialog==='win')break;let l=g.levels[i],p=s.p;if(p.x<prevX-150)resets++;prevX=p.x;let box=l.boxes.some(x=>x-(p.x+p.w)<60&&x-(p.x+p.w)>-6&&p.y+p.h>268);let gap=l.ground.some((seg,j)=>j<l.ground.length-1&&seg[1]-(p.x+p.w)<26&&seg[1]-(p.x+p.w)>-5);let dog=s.dogs.some(d=>d.x-(p.x+p.w)<60&&d.x-(p.x+p.w)>-8);let key=l.postGate&&!s.postGateOpen&&l.postGate.switchX-(p.x+15)<100&&l.postGate.switchX-(p.x+15)>0;if(p.ground&&t-lastJump>36&&(box||gap||dog||key)){g.input('jump',true);lastJump=t}if(t-lastJump===30)g.input('jump',false);g.step(2)}let s=g.get();out.push({level:i+1,won:s.dialog==='win',stamps:s.stamps.filter(x=>x.taken).length,resets});}return out});
 assert.equal(results.length,24);for(const r of results)assert(r.won,JSON.stringify(r));assert(results.filter(r=>r.stamps===3).length>=5);let save=await page.evaluate(()=>__ADV_TEST__.get().save);assert.equal(save.unlocked,24);assert.equal(Object.keys(save.best).length,24);
 assert.equal(await page.locator('#advResultHeading').innerText(),'THE WHOLE ROUND, DELIVERED');
 assert.equal(await page.locator('#advResultRating img').count(),3);
 for(const viewport of [{width:320,height:590},{width:568,height:320},{width:915,height:412}]){
  await page.setViewportSize(viewport);
  const buttons=await page.locator('#advResult button').evaluateAll(nodes=>nodes.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,w:r.width,h:r.height}}));
  assert.equal(buttons.length,3);
  for(const r of buttons)assert(r.x>=0&&r.y>=0&&r.right<=viewport.width&&r.bottom<=viewport.height&&r.w>=44&&r.h>=44,'Completion actions must remain visible: '+JSON.stringify({viewport,r}));
 }
 await page.click('#advResult [data-action=restart]');
 assert.equal((await page.evaluate(()=>__ADV_TEST__.get())).index,23,'Replay keeps the same route');
 assert.equal((await page.evaluate(()=>__ADV_TEST__.get())).dialog,'');
 await page.setViewportSize({width:320,height:590});
 await page.reload();assert.equal((await page.evaluate(()=>__ADV_TEST__.get().save)).unlocked,24);await page.click('#advHome [data-action=map]');assert.equal(await page.locator('#advLevels [data-level]:not(:disabled)').count(),24);
 // Classic mode has the same save key and remains playable, and can return to adventure.
 await page.click('#advMap [data-action=home]');await page.click('#advHome [data-action=classic]');await page.click('#playBtn');if(await page.locator('[data-modal-action=close]').count())await page.click('[data-modal-action=close]');await page.keyboard.press('ArrowRight');assert.equal((await page.evaluate(()=>__GAME_TEST__.getState())).moves,1);await page.evaluate(()=>window.gameBack());await page.evaluate(()=>window.gameBack());await page.click('button:has-text("← New adventure")');assert.equal(await page.locator('#advHome').isVisible(),true);
 assert.deepEqual(errors,[]);assert.deepEqual(bad,[]);console.log('Adventure: all 24 routes completed with physics controls:',results);console.log('Touch-size targets, mouse hold, keyboard/jump, pause, save/reload and classic mode passed; no errors/missing assets.');await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
