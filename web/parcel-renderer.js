/* All illustrated pixels come from Kenney's unmodified New Platformer Pack.
 * No procedural scenery, hand-drawn icons, gradients, particles or generated art.
 * Renderer is deliberately read-only: game physics and saved IDs stay in adventure.js.
 */
(() => {
  'use strict';
  const root = 'assets/kenney/';
  const images = new Map();
  const failures = new Set();
  const colors = {pip: 'green', player: 'pink', adventurer: 'purple'};
  function asset(name) {
    if (!images.has(name)) {
      const img = new Image();
      img.addEventListener('error',()=>{failures.add(name);window.dispatchEvent(new Event('parcel-art-error'));});
      img.src = root + name + '.png';
      images.set(name, img);
    }
    return images.get(name);
  }
  function sprite(ctx, name, x, y, width, height, flip = false) {
    const img = asset(name);
    if (!img.complete || !img.naturalWidth) return;
    ctx.save();
    if (flip) { ctx.translate(x + width, y); ctx.scale(-1, 1); x = 0; y = 0; }
    const bounds = window.ParcelAssetBounds[name];
    if(bounds) { const [sx,sy,ex,ey] = bounds; ctx.drawImage(img,sx,sy,ex-sx,ey-sy,x,y,width,height); }
    else ctx.drawImage(img, x, y, width, height);
    ctx.restore();
  }
  function character(ctx, who, x, y, width, height, moving, frame, flip, jumping, look = {}) {
    const pose = jumping ? 'jump' : moving ? (Math.floor(frame / 2) % 2 ? 'walk_a' : 'walk_b') : 'idle';
    // Uniform size across all couriers: no stretched pig/human aspect ratios.
    const h = Math.min(height, 64), w = h * .8;
    sprite(ctx, 'character_' + (look.hat === 'cap' ? 'beige' : look.hat === 'flower' ? 'yellow' : colors[who] || 'green') + '_' + pose,
      x + (width - w) / 2, y + height - h, w, h, flip);
    // Keep courier identity visible even when a shared uniform colour is selected.
    if(look.hat && look.hat !== 'none') sprite(ctx,{pip:'gem_green',player:'gem_red',adventurer:'gem_blue'}[who]||'gem_green',x+width/2-5,y+height-h-12,10,10);
    if(look.bag && look.bag !== 'classic') sprite(ctx,look.bag==='mint'?'gem_green':'gem_red',x+width/2-5,y+height-h*.48,10,10);
  }
  function tileStrip(ctx, name, x, y, width, height, tileWidth = 48) {
    if (width <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, width, height); ctx.clip();
    for (let dx = 0; dx < width; dx += tileWidth) sprite(ctx, name, x + dx, y, tileWidth, height);
    ctx.restore();
  }
  function draw(ctx, s) {
    const {W, H, G, level, index, camera, p, clock, save, dogs, stamps, movers,
      bridgeActive, postGateOpen, checkpoint, hasParcel, midDelivered, parcelSpawnX,
      parcelBounce, ending, invulnerable, buddyMet, secretFound, reducedMotion} = s;
    ctx.clearRect(0, 0, W, H);
    sprite(ctx, 'background_solid_sky', 0, 0, W, H);
    const backgrounds = ['hills', 'trees', 'mushrooms', 'hills', 'trees'];
    const backdrop = 'background_color_' + backgrounds[level.theme];
    // Repeat complete authored panoramas; scenery scrolls slower than collision plane.
    const motion=save.effects!==false&&!reducedMotion;
    const cloudPan=(camera*.06+(motion?clock*4:0))%800;
    for(let x=-cloudPan;x<W;x+=800)sprite(ctx,'background_clouds',x,0,800,G+18);
    const pan = (camera * .18) % 800;
    // Authored panorama backgrounds have white skies. Multiply composites their
    // original white pixels over the authored cloud layer without editing either PNG.
    ctx.save();ctx.globalCompositeOperation='multiply';
    for (let x = -pan; x < W; x += 800) sprite(ctx, backdrop, x, 0, 800, G + 18);
    ctx.restore();
    // Leave a ground strip for the mobile thumb controls; collision coordinates stay unchanged.
    const floorOffset=s.floorOffset||0;
    ctx.save(); ctx.translate(-camera, -floorOffset);
    const terrain = ['grass', 'dirt', 'purple', 'sand', 'grass'][level.theme];
    const visible = (x, w = 80) => x + w > camera - 64 && x < camera + W + 64;
    if (level.theme === 3) {
      tileStrip(ctx, 'water', camera, G + 36, W, H - G - 36 + floorOffset);
      tileStrip(ctx, 'water_top', camera, G + 22, W, 32);
    }
    for (const [a, b] of level.ground) {
      const end = b === level.width ? b + 160 : b;
      const left = Math.max(a, Math.floor((camera - a) / 48) * 48 + a);
      const right = Math.min(end, camera + W + 48);
      ctx.save(); ctx.beginPath(); ctx.rect(a, G, end - a, H - G + floorOffset); ctx.clip();
      for (let x = left; x < right; x += 48) {
        const edge = x === a ? '_left' : x + 48 >= end ? '_right' : '';
        sprite(ctx, 'terrain_' + terrain + '_block_top' + edge, x, G, 48, 48);
        for (let y = G + 48; y < H + floorOffset; y += 48) sprite(ctx, 'terrain_' + terrain + '_block_center', x, y, 48, 48);
      }
      ctx.restore();
    }
    for (const [x, y, w] of level.platforms) if (visible(x, w)) tileStrip(ctx, 'bridge_logs', x, y, w, 24);
    for (const m of movers) if (bridgeActive && visible(m.x, m.w)) tileStrip(ctx, 'bridge', m.x, m.y, m.w, 24);
    for (const [x, w, direction] of level.belts || []) if (visible(x, w)) {
      tileStrip(ctx, 'conveyor', x, G - 8, w, 16, 32);
      sprite(ctx, 'sign_right', x+w/2-14, G-55, 28, 38, direction<0);
    }
    if(level.kind==='wind') for(const x of [570,1350]) if(visible(x)) {
      sprite(ctx,'sign_right',x,G-70,32,42);
      ctx.font='bold 11px Nunito, sans-serif';ctx.fillStyle='#283629';ctx.textAlign='center';
      ctx.fillText(x===570?'BREEZE →':'END BREEZE',x+16,G-78);
    }
    // Sparse foreground planting, always outside obstacle and objective bounds.
    for (let x = 110 + (index % 4) * 30, n = 0; x < level.width; x += 310, n++) {
      if (!visible(x)) continue;
      if (!level.ground.some(([a,b]) => x > a + 35 && x < b - 60)) continue;
      if (level.boxes.some(b => Math.abs(x-b) < 65) || Math.abs(x-level.checkpoint)<70) continue;
      sprite(ctx, level.theme === 2 ? 'mushroom_red' : n % 3 ? 'grass' : 'bush', x, G - 28, 40, 28);
    }
    for (const x of level.boxes) if (visible(x)) sprite(ctx, 'block_planks', x, G - 42, 42, 42);
    for(const x of level.springs)if(visible(x)){const extended=motion&&s.springPulse?.x===x&&clock-s.springPulse.time>=0&&clock-s.springPulse.time<.24;sprite(ctx,extended?'spring_out':'spring',x,G-(extended?40:22),42,extended?40:22)}
    if (level.postGate) {
      const g = level.postGate;
      if (!postGateOpen) {
        tileStrip(ctx, 'lock_yellow', g.gateX, G - 104, 18, 104, 18);
        sprite(ctx, 'key_yellow', g.switchX - 21, g.switchY - 12, 42, 24);
      }
    }
    sprite(ctx, checkpoint === 55 ? 'flag_off' : motion&&Math.floor(clock*4)%2?'flag_green_b':'flag_green_a', level.checkpoint, G - 64, 48, 64);
    function door(x, delivered) {
      sprite(ctx, delivered ? 'door_open' : 'door_closed', x, G - 48, 48, 48);
      sprite(ctx, delivered ? 'door_open_top' : 'door_closed_top', x, G - 96, 48, 48);
      sprite(ctx, 'sign_exit', x + 53, G - 45, 40, 45);
    }
    door(level.width - 84, ending > 0);
    if (level.stop) door(level.stop - 12, midDelivered);
    const parcel=window.ParcelPresentation.parcel(level.kind);
    if (!hasParcel && parcelSpawnX != null) {
      const y=G-36-(parcelBounce?Math.abs(Math.sin(parcelBounce*12))*16:0);
      sprite(ctx,parcel.asset,parcelSpawnX,y,36,36);
      if(level.kind==='gift')sprite(ctx,'heart',parcelSpawnX+11,y+10,14,14);
      if(level.kind==='bouncy')sprite(ctx,'spring',parcelSpawnX+8,y+18,20,12);
      ctx.font='bold 11px Nunito, sans-serif';ctx.fillStyle='#283629';ctx.textAlign='center';ctx.fillText(parcel.label,parcelSpawnX+18,y-9);
    }
    for (const stamp of stamps) if (!stamp.taken) sprite(ctx, 'star', stamp.x - 14,
      stamp.y - 14 + (save.effects === false || reducedMotion ? 0 : Math.sin(clock * 3 + stamp.x) * 2), 28, 28);
    if (level.kind === 'switch') sprite(ctx, bridgeActive ? 'lever_right' : 'lever_left', level.plateX || 330, G - 38, 40, 38);
    for (const dog of dogs) {
      if (!visible(dog.x)) continue;
      const pose = dog.calm > 0 || reducedMotion ? 'rest' : Math.floor(clock * 7) % 2 ? 'walk_a' : 'walk_b';
      sprite(ctx, 'mouse_' + pose, dog.x - 6, G - 34, 56, 34, dog.dir < 0);
      if (dog.calm > 0) sprite(ctx, 'heart', dog.x + 13, G - 54, 20, 20);
    }
    if (level.kind === 'buddy') { sprite(ctx, 'mouse_rest', 269, G - 34, 56, 34); sprite(ctx, 'heart', 290, G - 58, 20, 20); if(buddyMet && !secretFound) sprite(ctx, 'heart', 635, G - 72, 28, 28); }
    if (!s.hideCourier && !(invulnerable > 0 && save.effects !== false && !reducedMotion && Math.floor(invulnerable * 10) % 2)) {
      character(ctx, save.courier, p.x - 11, p.y + p.h - 62, p.w + 22, 62,
        motion && p.ground && Math.abs(p.vx) > 20 && ending <= 0, Math.floor(clock * 18), p.face < 0, !p.ground, save);
      if (hasParcel && ending <= 0) sprite(ctx, parcel.asset, p.x + (p.face > 0 ? 20 : -9), p.y + 28, 20, 20);
      if (ending > 0) {
        const raw=Math.max(0,Math.min(1,1-ending/1.15)),t=motion?raw*raw*(3-2*raw):raw;
        sprite(ctx, parcel.asset, p.x + 18 + (level.width - 51 - p.x - 18) * t,
          p.y + 30 + (G - 39 - p.y - 30) * t-(motion?Math.sin(t*Math.PI)*18:0), 20, 20);
      }
    }
    ctx.restore();
  }
  // Preload the entire renderer family before the first route is started.
  const names = ['background_solid_sky','background_color_hills','background_color_trees',
    'background_color_mushrooms','background_clouds','flag_green_b','spring_out','block_planks','bridge','bridge_logs','grass','bush',
    'mushroom_red','water','water_top','star','spring','heart','flag_off','flag_green_a',
    'door_closed','door_closed_top','door_open','door_open_top','sign_exit','key_yellow',
    'lock_yellow','lever_left','lever_right','block_blue','block_red','block_yellow','gem_green','gem_red','gem_blue','sign_right','conveyor','mouse_rest','mouse_walk_a','mouse_walk_b'];
  for (const t of ['grass','dirt','purple','sand']) for (const e of ['block_top','block_top_left','block_top_right','block_center']) names.push('terrain_' + t + '_' + e);
  for (const c of [...Object.values(colors),'beige','yellow']) for (const pose of ['idle','walk_a','walk_b','jump']) names.push('character_' + c + '_' + pose);
  names.forEach(name => { const img = asset(name); img.addEventListener('load', () => { if(names.every(n => asset(n).complete && asset(n).naturalWidth > 0)) window.dispatchEvent(new Event('parcel-art-ready')); }); });
  function preview(ctx,level,index) {
    const W=720,H=400,G=310;ctx.save();ctx.scale(ctx.canvas.width/W,ctx.canvas.height/H);
    draw(ctx,{W,H,G,level,index,camera:Math.max(0,Math.min(level.width-W,level.checkpoint-W/2)),p:{},clock:0,save:{effects:false},dogs:level.dogs.map(([x])=>({x,dir:1,calm:0})),stamps:level.stamps.map(([x,y])=>({x,y,taken:false})),movers:(level.moving||[]).map(([x,y,w])=>({x,y,w})),bridgeActive:level.kind!=='switch',postGateOpen:!level.postGate,checkpoint:55,hasParcel:false,midDelivered:false,parcelSpawnX:180,parcelBounce:0,ending:0,invulnerable:0,buddyMet:false,secretFound:false,reducedMotion:true,hideCourier:true});ctx.restore();
  }
  window.ParcelRenderer = {draw, preview, character, failures, ready: () => names.every(n => asset(n).complete && asset(n).naturalWidth > 0)};
})();
