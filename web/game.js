(() => {
'use strict';
const $ = (s) => document.querySelector(s);
const LEVELS = window.LEVELS;
const DIRECTIONS = {up:[0,-1],right:[1,0],down:[0,1],left:[-1,0]};
const CHAPTERS = [
  {name:'Post Office' ,icon:'✿',sub:'CHAPTER 01',mood:'A quiet morning'},
  {name:'Market Street' ,icon:'⌁',sub:'CHAPTER 02',mood:'A gentle breeze'},
  {name:'Garden Blocks' ,icon:'☼',sub:'CHAPTER 03',mood:'The afternoon rounds'},
  {name:'Evening Route' ,icon:'☾',sub:'CHAPTER 04',mood:'A peaceful evening'}
];
const KEY = 'one-step-delivery-v2';
let progress = {unlocked:1, stars:{}, sound:true, introSeen:false, motion:true, bestMoves:{}, lookAhead:false};
progress=window.ParcelSaves.read(KEY,progress);
let modalFocusReturn=null, statusMessage='';
let facing='down', dogFacing=[], dogsPaused=false, previousCell=null;
function reducedMotion(){return progress.motion===false||window.matchMedia('(prefers-reduced-motion: reduce)').matches}
function applyMotion(){document.body.dataset.reducedMotion=String(progress.motion===false)}
let screen='home', levelIndex=0, state=null, history=[], modal='', hintCell=null, toastTimer=null, screenGeneration=0, motionStamp=0, moving=false;
const clone = x => JSON.parse(JSON.stringify(x));
function persist(){window.ParcelSaves.write(KEY,progress)}
function validSavedState(level,s){
 if(!s||!Array.isArray(s.p)||!Array.isArray(s.d)||s.d.length!==level.drones.length||typeof s.has!=='boolean'||!Number.isInteger(s.moves)||s.moves<0||s.caught)return false;
 const valid=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isInteger)&&!isWall(level,p);
 return valid(s.p)&&s.d.every(valid)&&!s.d.some(d=>same(d,s.p));
}
function saveSession(s=state,h=history){if(!s||!validSavedState(LEVELS[levelIndex],s))return;progress.session={level:levelIndex,state:clone(s),history:clone(h.slice(-100))};persist()}
function canResume(i){const session=progress.session;return !!session&&session.level===i&&Number.isInteger(i)&&i>=0&&i<LEVELS.length&&i<progress.unlocked&&validSavedState(LEVELS[i],session.state)}

const sfx={move:['assets/release-audio/click.ogg',.34],pickup:['assets/release-audio/pickup.ogg',.32],win:['assets/release-audio/win.ogg',.22],undo:['assets/release-audio/pickup.ogg',.22],error:['assets/release-audio/error.ogg',.24],tap:['assets/release-audio/click.ogg',.38]};
let music=null;const effectPool=new Map();
function stopClassicEffects(){for(const pool of effectPool.values())for(const a of pool){a.pause();try{a.currentTime=0}catch(e){}}}
function sound(type='move'){
 if(!progress.sound||document.hidden)return;
 try {if(!music){music=new Audio('assets/release-audio/music.ogg');music.loop=true;music.volume=.06;music.preload='none';document.addEventListener('visibilitychange',()=>{if(document.hidden){music.pause();stopClassicEffects()}else if(progress.sound&&document.querySelector('#advApp')?.classList.contains('adv-hidden'))music.play().catch(()=>{})})}if(music.paused)music.play().catch(()=>{});
  const spec=sfx[type]||sfx.tap;let pool=effectPool.get(type);if(!pool){pool=[];effectPool.set(type,pool)}let effect=pool.find(a=>a.paused||a.ended);if(!effect&&pool.length<3){effect=new Audio(spec[0]);effect.preload='auto';pool.push(effect)}if(!effect){effect=pool.shift();pool.push(effect);effect.pause()}effect.volume=spec[1];try{effect.currentTime=0}catch(e){}effect.play().catch(()=>{});
 }catch(e){}
}

function updateSound(){
 const icon=progress.sound?'♫':'♪';
 for(const id of ['soundIcon','gameSoundIcon','homeSoundIcon'])$('#'+id).innerHTML=icon;
 for(const id of ['soundBtn','gameSoundBtn','homeSoundBtn'])$('#'+id).setAttribute('aria-label',progress.sound?'Mute sound and music':'Turn on sound and music');
}
function toggleSound(){progress.sound=!progress.sound;persist();updateSound();if(progress.sound)sound('tap');else{if(music)music.pause();stopClassicEffects()}}
function showToast(msg){const el=$('#toast');el.textContent=msg;clearTimeout(toastTimer);if(screen==='game'){const short={'Your delivery has been restored.':'Progress restored','That way is blocked.':'That way is blocked','Parcel picked up! Mice pause for this turn.':'Mice paused on pickup','Parcel picked up! Next stop: the door.':'Parcel collected','No safe route from here. Try undo!':'Try undo for a safe route','Try the glowing tile':'Try the highlighted tile','Tap a neighbouring tile or swipe.':'Tap next tile or swipe'};statusMessage=short[msg]||msg;$('#boardSub').textContent=statusMessage;el.classList.remove('show')}else el.classList.add('show');toastTimer=setTimeout(()=>{el.classList.remove('show');statusMessage='';if(screen==='game')$('#boardSub').textContent=dogsPaused?'Mice paused for this turn':CHAPTERS[Math.floor(levelIndex/12)].mood},2200)}
function showScreen(name){statusMessage='';clearTimeout(toastTimer);$('#toast').classList.remove('show');screenGeneration++;screen=name;document.body.dataset.screen=name;['home','map','game'].forEach(n=>$('#'+n+'Screen').classList.toggle('hidden',n!==name));$('#modalLayer').classList.add('hidden');$('#classicResult').classList.add('hidden');document.body.dataset.result='false';$('#gameHelpBtn').disabled=false;$('#resetBtn').disabled=false;modal='';window.scrollTo(0,0);if(name==='home')$('#playLabel').textContent=(progress.unlocked>1||canResume(progress.session?.level))?'CONTINUE':'START GAME';if(name==='map')renderMap();}
function renderMap(){let html='';CHAPTERS.forEach((ch,ci)=>{let done=0,cells='';for(let i=ci*12;i<ci*12+12;i++){let unlocked=i<progress.unlocked,stars=progress.stars[i+1]||0;if(stars)done++;let cls=!unlocked?'locked':stars?'done':i===progress.unlocked-1?'current':'';cells+=`<button class="level-cell ${cls}" data-level="${i}" ${unlocked?'':'disabled'} aria-label="Level ${i+1}${unlocked?(stars?', '+stars+' stars':''):' locked'}">${unlocked?String(i+1).padStart(2,'0'):'Locked'}<small>${stars?'★'.repeat(stars):unlocked?'·':''}</small></button>`}html+=`<div class="chapter"><div class="chapter-head"><div class="chapter-icon">${ch.icon}</div><div class="chapter-title"><small>${ch.sub}</small>${ch.name}</div><span class="chapter-status">${done} / 12</span></div><div class="level-grid">${cells}</div></div>`});$('#chapters').innerHTML=html;$('#completedCount').textContent=Object.keys(progress.stars).length;}
function newState(level){return {p:[...level.start],d:level.drones.map(x=>[...x]),has:false,moves:0,caught:false}}
function startLevel(i){
 const saved=canResume(i)?progress.session:null;moving=false;dogsPaused=false;previousCell=null;motionStamp++;levelIndex=i;facing='down';dogFacing=[];
 state=saved?clone(saved.state):newState(LEVELS[i]);
 history=saved&&Array.isArray(saved.history)?saved.history.filter(s=>validSavedState(LEVELS[i],s)).slice(-100):[];
 hintCell=null;showScreen('game');updateGame();saveSession();
 if(!progress.introSeen){progress.introSeen=true;persist();help();}
 else if(i===2&&!progress.dogIntroSeen){progress.dogIntroSeen=true;persist();droneIntroduction();}
 else if(saved&&state.moves>0)showToast('Your delivery has been restored.');
}
function same(a,b){return a[0]===b[0]&&a[1]===b[1]}
function isWall(level,p){return p[0]<0||p[0]>=level.width||p[1]<0||p[1]>=level.height||level.walls.some(w=>same(w,p))}
// Exact move rules also used by the offline level solver.
function transition(level,input,dir,forSolver=false){
 const out=clone(input), [dx,dy]=DIRECTIONS[dir], next=[out.p[0]+dx,out.p[1]+dy];
 if(isWall(level,next))return {invalid:true};
 if(out.d.some(d=>same(d,next))){if(forSolver)return {dead:true};out.p=next;out.caught=true;out.moves++;return {state:out,dead:true}}
 out.p=next;let picked=!out.has&&same(next,level.package);out.has=out.has||picked;out.moves++;
 // Picking up the parcel sends a one-turn pulse that pauses all drones.
 if(picked)return {state:out,picked:true,won:same(out.p,level.exit)};
 for(let i=0;i<out.d.length;i++){
  const [x,y]=out.d[i],ddx=next[0]-x,ddy=next[1]-y,opts=[];
  if(Math.abs(ddx)>=Math.abs(ddy)){if(ddx)opts.push([Math.sign(ddx),0]);if(ddy)opts.push([0,Math.sign(ddy)]);}else{if(ddy)opts.push([0,Math.sign(ddy)]);if(ddx)opts.push([Math.sign(ddx),0]);}
  for(const [a,b] of opts){const q=[x+a,y+b];if(!isWall(level,q)&&!out.d.some(d=>same(d,q))){out.d[i]=q;if(same(q,next)){if(forSolver)return {dead:true};out.caught=true;return {state:out,dead:true,picked}}break;}}
 }
 return {state:out,picked,won:out.has&&same(out.p,level.exit)};
}
function move(dir){if(screen!=='game'||modal||!state||state.caught)return;statusMessage='';const before=clone(state),positions=capturePositions();const result=transition(LEVELS[levelIndex],state,dir);if(result.invalid){sound('error');bump(dir);showToast('That way is blocked.');return}history.push(clone(state));state=result.state;facing=dir;state.d.forEach((pos,i)=>{const old=before.d[i];if(pos[0]!==old[0])dogFacing[i]=pos[0]>old[0]?'right':'left';else if(pos[1]!==old[1])dogFacing[i]=pos[1]>old[1]?'down':'up'});hintCell=null;moving=true;dogsPaused=!!result.picked&&state.d.length>0;previousCell=[...before.p];const motion=++motionStamp;updateGame();animateMovement(before,state,positions);setTimeout(()=>{if(motion===motionStamp&&screen==='game'){moving=false;previousCell=null;updateGame()}},430);if(dogsPaused)setTimeout(()=>{if(motion===motionStamp&&screen==='game'){dogsPaused=false;updateGame()}},900);
 if(result.dead||result.won)saveSession(history[history.length-1],history.slice(0,-1));else saveSession();
 const generation=screenGeneration;
 if(result.dead){modal='pending';sound('error');setTimeout(()=>{if(generation===screenGeneration&&modal==='pending')showCaught()},260)}
 else if(result.won){modal='pending';sound('win');setTimeout(()=>{if(generation===screenGeneration&&modal==='pending')showWin()},260)}
 else if(result.picked){sound('pickup');showToast(state.d.length?'Parcel picked up! Mice pause for this turn.':'Parcel picked up! Next stop: the door.');const board=$('#board');board.classList.remove('pulse');void board.offsetWidth;board.classList.add('pulse')}
 else sound('move')
}
function undo(){if(!history.length)return;statusMessage='';const before=clone(state);state=history.pop();hintCell=null;moving=false;dogsPaused=false;previousCell=null;motionStamp++;closeModal();updateGame();animateMovement(before,state);saveSession();sound('undo')}
function confirmReset(){if(modal)return;sound('tap');openModal(`<div class="modal-illustration">↻</div><h3>Start this route again?</h3><p>Your moves on this delivery will be cleared.</p><button class="primary-btn" data-modal-action="retry">Restart route</button><button class="modal-secondary" data-modal-action="close">Keep playing</button>`,'help')}
function reset(){statusMessage='';state=newState(LEVELS[levelIndex]);history=[];hintCell=null;moving=false;dogsPaused=false;previousCell=null;motionStamp++;closeModal();updateGame();saveSession();sound('tap')}
function stateKey(s){return s.p.join(',')+'|'+s.d.map(x=>x.join(',')).join(';')+'|'+(s.has?'1':'0')}
function findHint(){
 let level=LEVELS[levelIndex],q=[{s:clone(state),first:null}],head=0,visited=new Set([stateKey(state)]);
 while(head<q.length && head<160000){let node=q[head++];for(const dir of ['up','right','down','left']){let res=transition(level,node.s,dir,true);if(res.invalid||res.dead)continue;let first=node.first||dir;if(res.won)return first;const k=stateKey(res.state);if(!visited.has(k)){visited.add(k);q.push({s:res.state,first})}}}
 return null;
}
function hint(){if(modal||screen!=='game')return;const dir=findHint();if(!dir){showToast('No safe route from here. Try undo!');sound('error');return}const [dx,dy]=DIRECTIONS[dir];hintCell=[state.p[0]+dx,state.p[1]+dy];updateGame();sound('pickup');showToast('Try the glowing tile');}
const parcelSvg=`<img class="pixel-object parcel-sprite" src="assets/kenney/block_planks.png" alt="Parcel">`;
const robotSvg=(carrying)=>`<img class="courier-sprite" src="assets/kenney/character_green_${moving&&!reducedMotion()?(state.moves%2?'walk_a':'walk_b'):'idle'}.png" alt="Pip the courier">${carrying?'<img class="carried-parcel" src="assets/kenney/block_planks.png" alt="Carrying parcel">':''}`;
const droneSvg=(index)=>`<img class="pixel-object drone-sprite" data-drone-index="${index}" src="assets/kenney/mouse_${moving&&!reducedMotion()?(state.moves%2?'walk_a':'walk_b'):'rest'}.png" alt="Mouse">${dogsPaused?'<span class="pause-badge" aria-hidden="true">✦</span>':''}`;
const exitSvg=`<img class="pixel-object door-sprite" src="assets/kenney/door_closed.png" alt="Drop-off door">`;
function updateGame(){
 const l=LEVELS[levelIndex],chapter=Math.floor(levelIndex/12),ch=CHAPTERS[chapter];document.body.dataset.chapter=String(chapter);$('#levelIndicator').textContent=`LEVEL ${String(levelIndex+1).padStart(2,'0')} / 48`;let parts=l.name.split(' ');$('#levelTitle').innerHTML=parts.length>1?`${parts.slice(0,-1).join(' ')} <em>${parts[parts.length-1]}.</em>`:l.name;$('#boardSub').textContent=statusMessage||(dogsPaused?'Mice paused for this turn':ch.mood);
 $('#instruction').textContent=levelIndex<2?'Help Pip pick up the parcel and bring it to the little doorstep.':'Pick up the parcel, then find the drop-off. Mice pause on pickup.';
 $('#missionText').textContent=modal==='win'?'Delivered!':state.has?'Deliver to the door':'Pick up the parcel';$('#missionIcon').innerHTML=`<img alt="" src="${state.has?'assets/kenney/door_closed.png':'assets/kenney/block_planks.png'}">`;$('#movesCount').textContent=String(state.moves).padStart(2,'0');$('#undoBtn').disabled=!history.length;$('#goalCounter').textContent=`★ ${l.optimal+2}`;$('#goalCounter').title=`Three stars: ${l.optimal+2} steps or fewer`;$('#goalCounter').setAttribute('aria-label',`Three-star goal: ${l.optimal+2} steps or fewer`);$('#lookBtn').setAttribute('aria-pressed',String(!!progress.lookAhead));$('#swipeNote').textContent=progress.lookAhead?'GREEN: SAFE · AMBER: CAUGHT':'TAP A TILE OR SWIPE';
 let html='';for(let y=0;y<l.height;y++){html+='<div class="board-row" role="row">';for(let x=0;x<l.width;x++){let p=[x,y], wall=isWall(l,p),robot=same(state.p,p),droneIndex=state.d.findIndex(d=>same(d,p)),drone=droneIndex>=0,parcel=!state.has&&same(l.package,p),exit=same(l.exit,p);let direction=Object.keys(DIRECTIONS).find(k=>DIRECTIONS[k][0]===x-state.p[0]&&DIRECTIONS[k][1]===y-state.p[1]);let preview=progress.lookAhead&&direction&&!wall?transition(l,state,direction,true):null;let unsafe=!!preview?.dead,safe=!!preview&&!preview.invalid&&!preview.dead;let classes=['tile',wall?'wall':'',unsafe?'preview-danger':'',safe?'preview-safe':'',wall?[['obstacle-bush','obstacle-tree'],['obstacle-teal','obstacle-tree'],['obstacle-bush','obstacle-teal'],['obstacle-autumn','obstacle-autumn-tree']][chapter][(x+3*y)%2]:'',previousCell&&same(previousCell,p)&&!exit?'trail':'',exit&&state.has?'active-exit':'',!wall&&!drone&&!robot&&Math.abs(x-state.p[0])+Math.abs(y-state.p[1])===1?'reachable':'',!wall&&!exit&&((x+2*y)%3===0)?'textured':'',exit?'exit':'',robot?'robot':'',drone?'drone-anim':'',hintCell&&same(hintCell,p)?'hint':'',robot&&state.caught?'caught':''].join(' ');let content=exit?exitSvg:'';if(unsafe)content+='<span class="danger-marker" aria-hidden="true">!</span>';if(robot||drone)content+='<span class="actor-shadow" aria-hidden="true"></span>';if(parcel)content+=parcelSvg;if(drone)content+=droneSvg(droneIndex);if(robot)content+=robotSvg(state.has);let label=`Row ${y+1}, column ${x+1}: ${wall?'obstacle':exit?'drop-off':'street'}${parcel?', parcel':''}${drone?', dog':''}${robot?', Pip'+(state.has?' carrying parcel':''):''}${unsafe?', next move would be caught':safe?', next move safe':''}`;html+=`<div class="${classes}" data-x="${x}" data-y="${y}" role="gridcell" aria-label="${label}">${content}</div>`}html+='</div>'}$('#board').innerHTML=html;
}
function capturePositions(){
 const board=$('#board');const rect=selector=>{const e=board.querySelector(selector);return e?e.getBoundingClientRect():null};
 return {courier:rect('.courier-sprite'),parcel:rect('.carried-parcel'),dogs:state?state.d.map((_,i)=>rect(`[data-drone-index="${i}"]`)):[]};
}
function animateMovement(before,after,previous={}){
 if(reducedMotion())return;
 const board=$('#board'),cell=board.querySelector('.tile');if(!cell)return;
 const gap=parseFloat(getComputedStyle(board).columnGap)||0,pitch=cell.getBoundingClientRect().width+gap;
 const animate=(el,a,b,old,delay=0)=>{if(!el||!el.animate||same(a,b))return;
  let current=el.getBoundingClientRect();let x=old?old.left-current.left:(a[0]-b[0])*pitch,y=old?old.top-current.top:(a[1]-b[1])*pitch;
  // Start at the current on-screen pose, so fast taps don't teleport an in-flight character.
  try{const animation=el.animate([
   {transform:`translate(${x}px,${y}px) scale(1.04,.96)`,offset:0},
   {transform:`translate(${x*.57}px,${y*.57-Math.min(4,pitch*.07)}px) scale(.97,1.03)`,offset:.48},
   {transform:'translate(0,0) scale(1.04,.96)',offset:.88},
   {transform:'translate(0,0) scale(1,1)',offset:1}
  ],{duration:230,delay,fill:'backwards',easing:'cubic-bezier(.22,.65,.3,1)'});animation.currentTime=0}catch(e){}
 };
 // Two walk frames and a settle, synchronized with the actual movement rather than a looping idle sprite.
 const stamp=motionStamp,person=board.querySelector('.courier-sprite'),direction=facing;
 if(person&&!same(before.p,after.p)){[2,3,0].forEach((frame,i)=>setTimeout(()=>{if(stamp===motionStamp&&person.isConnected)person.src=`assets/kenney/character_green_${frame===0?'idle':frame===2?'walk_a':'walk_b'}.png`;person.style.scale=direction==='left'?'-1 1':'1 1'},[65,135,220][i]))}
 after.d.forEach((d,i)=>{const dog=board.querySelector(`[data-drone-index="${i}"]`),direction=dogFacing[i]||'right';if(dog&&!same(before.d[i],d))[2,0].forEach((frame,j)=>setTimeout(()=>{if(stamp===motionStamp&&dog.isConnected)dog.src=`assets/kenney/mouse_${frame===0?'rest':'walk_a'}.png`;dog.style.scale=direction==='left'?'-1 1':'1 1'},[110,230][j]))});
 animate(board.querySelector('.courier-sprite'),before.p,after.p,previous.courier);
 animate(board.querySelector('.carried-parcel'),before.p,after.p,previous.parcel);
 after.d.forEach((d,i)=>animate(board.querySelector(`[data-drone-index="${i}"]`),before.d[i],d,previous.dogs?.[i],25));
}
function bump(dir){
 if(reducedMotion())return;const el=$('#board .courier-sprite');if(!el?.animate)return;
 const [x,y]=DIRECTIONS[dir];el.animate([{transform:'translate(0,0)'},{transform:`translate(${x*5}px,${y*5}px) scale(1.05,.95)`},{transform:'translate(0,0)'}],{duration:180,easing:'ease-out'});
}
function openModal(html,type){statusMessage='';clearTimeout(toastTimer);$('#toast').classList.remove('show');if(!modal)modalFocusReturn=document.activeElement;modal=type;const card=$('#modalCard');card.innerHTML=html;const heading=card.querySelector('h3');if(heading){heading.id='dialogTitle';$('#modalLayer').setAttribute('aria-labelledby','dialogTitle')}$('#modalLayer').classList.remove('hidden');card.scrollTop=0;card.focus({preventScroll:true});}
function closeModal(){$('#modalLayer').classList.add('hidden');$('#classicResult').classList.add('hidden');document.body.dataset.result='false';$('#gameHelpBtn').disabled=false;$('#resetBtn').disabled=false;modal='';const target=modalFocusReturn;modalFocusReturn=null;if(target&&target.isConnected&&target.getClientRects().length)target.focus({preventScroll:true});else if(screen==='game')$('#gameHelpBtn').focus({preventScroll:true});}
function inlineResult(type,html){modal=type;if(type==='win')$('#missionText').textContent='Delivered!';const result=$('#classicResult');result.innerHTML=html;result.classList.remove('hidden');document.body.dataset.result='true';$('#gameHelpBtn').disabled=true;$('#resetBtn').disabled=true;result.focus({preventScroll:true})}
function showCaught(){if(screen!=='game'||!state.caught)return;inlineResult('caught',`<div class="classic-result-copy"><b>Mouse caught up</b><small>Try a different turn.</small></div><button data-modal-action="undo">Undo move</button><button data-modal-action="retry">Restart</button>`)}
function showWin(){if(screen!=='game'||state.caught)return;const l=LEVELS[levelIndex],stars=state.moves<=l.optimal+2?3:state.moves<=l.optimal+7?2:1;const oldBest=progress.bestMoves[levelIndex+1];const isRecord=!Number.isInteger(oldBest)||state.moves<oldBest;progress.bestMoves[levelIndex+1]=isRecord?state.moves:oldBest;progress.stars[levelIndex+1]=Math.max(stars,progress.stars[levelIndex+1]||0);progress.unlocked=Math.max(progress.unlocked,Math.min(48,levelIndex+2));progress.session=null;persist();inlineResult('win',`<div class="classic-result-copy"><b>Delivery complete</b><small>${'★'.repeat(stars)}${'☆'.repeat(3-stars)} · ${state.moves} steps${isRecord?' · Personal best':''}</small></div><button data-modal-action="next">${levelIndex===47?'Routes':'Next →'}</button><button data-modal-action="retry">Replay</button>`)}

function droneIntroduction(){
 sound('tap');openModal(`<div class="modal-illustration"><img src="assets/kenney/mouse_rest.png" alt=""></div><h3>A curious neighbour!</h3><p>Curious mice follow Pip after every step. Use the trees and shrubs to keep a little distance.</p><div class="help-list"><b>Little trick:</b> Picking up the parcel distracts the mice for that turn.</div><button class="primary-btn" data-modal-action="close">Let's go!</button>`,'help');
}
function help(){if(modal)return;sound('tap');openModal(`<div class="modal-illustration">✦</div><h3>One step at a time.</h3><p>You're a little courier on a very important mission.</p><div class="help-list"><b>01.</b> Tap a neighbouring tile, swipe, or use the arrows to move.<br><b>02.</b> Pick up the blue parcel.<br><b>03.</b> Bring it to the highlighted doorstep.<br><b>04.</b> Mice follow Pip after each move. Picking up the parcel distracts them for that turn.<br><b>05.</b> Trees and shrubs block the way. Undo freely or ask for a hint.<br><b>06.</b> Tap <b>Look ahead</b> to see which neighbouring steps are safe now. Amber means a dog catches you on that turn.<details class="font-license"><summary>How mice choose a move</summary>They try the direction with the longer distance first; on a tie, horizontal comes first.</details><details class="font-license"><summary>Credits & licences</summary>Character, houses and parcel: Tiny Speck / Glitch (CC0), adapted; house remixes by Anarres and Bart. Mouse: styloo (CC0). Trees and bushes: Franco Giachetti / ludicarts.com (CC BY 3.0), adapted. Other art and sounds: Kenney (CC0). Music: MintoMouse (CC0). Sources: opengameart.org/content/glitch-sprite-assets-huge-collection; opengameart.org/content/house-exteriors-from-glitch; styloo.itch.io/dog2d; opengameart.org/content/handpainted-platform-tileset; creativecommons.org/licenses/by/3.0/; opengameart.org/content/cozy-puzzle-in-game-3. Licence texts are bundled with the game.</details><button class="motion-toggle" data-modal-action="toggle-motion" aria-pressed="${progress.motion!==false}">Motion effects: ${progress.motion===false?'Off':'On'}</button><small class="motion-note">Your device’s reduced-motion setting also applies.</small></div><button class="primary-btn" data-modal-action="close">Got it!</button>`,'help')}
$('#playBtn').onclick=()=>{sound('tap');startLevel(canResume(progress.session?.level)?progress.session.level:Math.min(progress.unlocked-1,47))};$('#levelsHomeBtn').onclick=()=>{sound('tap');showScreen('map')};$('#brandBtn').onclick=()=>{sound('tap');showScreen('home')};$('#mapBackBtn').onclick=()=>showScreen('home');$('#gameBackBtn').onclick=()=>showScreen('map');$('#soundBtn').onclick=toggleSound;$('#gameSoundBtn').onclick=toggleSound;$('#helpBtn').onclick=help;$('#gameHelpBtn').onclick=help;$('#homeHelpBtn').onclick=help;$('#homeSoundBtn').onclick=toggleSound;$('#resetBtn').onclick=confirmReset;$('#undoBtn').onclick=undo;$('#hintBtn').onclick=hint;$('#lookBtn').onclick=()=>{progress.lookAhead=!progress.lookAhead;persist();sound('tap');updateGame()};
$('#chapters').onclick=e=>{const b=e.target.closest('[data-level]');if(b&&!b.disabled){sound('tap');startLevel(Number(b.dataset.level))}};
$('.dpad').onclick=e=>{const b=e.target.closest('[data-direction]');if(b)move(b.dataset.direction)};
function modalActions(e){if(e.target.id==='modalLayer'&&modal==='help')closeModal();const b=e.target.closest('[data-modal-action]');if(!b)return;const a=b.dataset.modalAction;if(a==='toggle-motion'){progress.motion=progress.motion===false;persist();applyMotion();b.textContent='Motion effects: '+(progress.motion?'On':'Off');b.setAttribute('aria-pressed',String(progress.motion));if(screen==='game')updateGame()}else if(a==='undo')undo();else if(a==='retry')reset();else if(a==='close')closeModal();else if(a==='levels')showScreen('map');else if(a==='next'){if(levelIndex===47)showScreen('map');else startLevel(levelIndex+1)}}
$('#modalLayer').onclick=modalActions;$('#classicResult').onclick=modalActions;
let pointer=null;const board=$('#board');board.addEventListener('pointerdown',e=>{if(modal)return;const tile=e.target.closest('.tile');pointer={x:e.clientX,y:e.clientY,tile:tile?{x:Number(tile.dataset.x),y:Number(tile.dataset.y)}:null};board.setPointerCapture?.(e.pointerId)});board.addEventListener('pointerup',e=>{if(!pointer)return;let x=e.clientX-pointer.x,y=e.clientY-pointer.y,tile=pointer.tile;pointer=null;if(Math.max(Math.abs(x),Math.abs(y))<18){if(!tile||!state)return;const dx=tile.x-state.p[0],dy=tile.y-state.p[1];if(Math.abs(dx)+Math.abs(dy)===1)move(dx?dx>0?'right':'left':dy>0?'down':'up');else if(dx||dy)showToast('Tap a neighbouring tile or swipe.');return}move(Math.abs(x)>Math.abs(y)?(x>0?'right':'left'):(y>0?'down':'up'))});board.addEventListener('pointercancel',()=>pointer=null);
document.addEventListener('keydown',e=>{if(window.__ADVENTURE_ACTIVE__?.())return;if(e.key==='Tab'&&modal&&!['win','caught'].includes(modal)){const card=$('#modalCard'),items=[...card.querySelectorAll('button,summary,a[href]')].filter(el=>el.getClientRects().length);if(items.length){if(e.shiftKey&&(document.activeElement===items[0]||document.activeElement===card)){e.preventDefault();items[items.length-1].focus()}else if(!e.shiftKey&&document.activeElement===items[items.length-1]){e.preventDefault();items[0].focus()}}}const keys={ArrowUp:'up',w:'up',W:'up',ArrowDown:'down',s:'down',S:'down',ArrowLeft:'left',a:'left',A:'left',ArrowRight:'right',d:'right',D:'right'};if(keys[e.key]&&screen==='game'&&!modal){e.preventDefault();move(keys[e.key])}else if(e.key==='Escape'){window.gameBack()}else if((e.key==='z'||e.key==='Z')&&screen==='game'&&!modal)undo()});
window.pauseGameAudio=()=>{if(music)music.pause();stopClassicEffects()};
window.resumeGameAudio=()=>{if(music&&progress.sound&&!document.hidden)music.play().catch(()=>{})};
window.gameBack=()=>{if(modal){if(modal==='help')closeModal();else if(modal==='caught')undo();else showScreen('map')}else if(screen==='game')showScreen('map');else if(screen==='map')showScreen('home');else return false;return true};
// Small explicit test API: it never changes game state except where named.
if(window.ParcelConfig.testHooks)window.__GAME_TEST__={getState:()=>clone(state),getProgress:()=>clone(progress),getScreen:()=>screen,startLevel,move,findHint,transition,reset,levels:LEVELS};
applyMotion();updateSound();showScreen('home');
})();
