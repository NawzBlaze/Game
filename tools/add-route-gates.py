from pathlib import Path
p=Path('/home/user/little-parcel-crew-worlds/web/adventure.js');s=p.read_text()
anchor="LEVELS[19].stop=345; LEVELS[19].secondParcel=430;"
add="""LEVELS[19].stop=345; LEVELS[19].secondParcel=430;
// Raised post switches add a route-finding choice: find the switch or make
// the more demanding high hop over the gate. Coordinates are explicit.
LEVELS[4].postGate={switchX:675,switchY:180,gateX:850};
LEVELS[10].postGate={switchX:745,switchY:175,gateX:980};
LEVELS[17].postGate={switchX:1160,switchY:175,gateX:1320};"""
assert anchor in s;s=s.replace(anchor,add)
anchor='parcelBounce=0,bridgeActive=true,buddyMet=false'
assert anchor in s;s=s.replace(anchor,'parcelBounce=0,postGateOpen=true,bridgeActive=true,buddyMet=false')
anchor='index=i;level=bonus<0?LEVELS[i]:'
assert anchor in s;s=s.replace(anchor,'index=i;level=bonus<0?LEVELS[i]:')
anchor="if(bonus===0)level.platforms.push"
assert anchor in s;s=s.replace(anchor,"postGateOpen=bonus>=0||!level.postGate;if(bonus===0)level.platforms.push")
anchor="else if(i===4)message('Springboards give a bigger jump!');"
assert anchor in s;s=s.replace(anchor,"else if(i===4)message('Touch the bell to open the gate',3200);")
anchor=" const near=dogs.some"
insert=" if(level.postGate&&!postGateOpen&&p.x>level.postGate.gateX-225){set('#advMission','Find the bell switch');set('#advPhase','GATE')}\n"
assert anchor in s;s=s.replace(anchor,insert+anchor,1)
anchor=' // Solid parcel crates: horizontal sides and jumpable top.'
insert=''' // Closed post gate: collide with the visible barrier. A sufficiently high
 // jump can clear it; otherwise the bell switch opens the route permanently.
 if(level.postGate&&!postGateOpen){const x=level.postGate.gateX,top=G-104;
  if(p.y+p.h>top+1&&p.y<G&&p.x+p.w>x&&p.x<x+18){
   if(p.vx>0&&oldX+p.w<=x+2){p.x=x-p.w;p.vx=0}
   else if(p.vx<0&&oldX>=x+16){p.x=x+18;p.vx=0}
  }
 }
'''+anchor
assert anchor in s;s=s.replace(anchor,insert)
anchor=" for(const x of level.boxes){const y=G-42;if(p.x+p.w>x&&p.x<x+42&&oldBottom<=y+1&&p.y+p.h>=y)floor=Math.min(floor,y)}"
insert=anchor+"\n if(level.postGate&&!postGateOpen){let x=level.postGate.gateX,y=G-104;if(p.x+p.w>x&&p.x<x+18&&oldBottom<=y+1&&p.y+p.h>=y)floor=Math.min(floor,y)}"
assert anchor in s;s=s.replace(anchor,insert)
anchor=" for(const s of stamps)if(!s.taken&&Math.abs((p.x+15)-s.x)<25"
insert=""" if(level.postGate&&!postGateOpen&&Math.abs((p.x+15)-level.postGate.switchX)<28&&Math.abs((p.y+25)-level.postGate.switchY)<38){postGateOpen=true;burst(level.postGate.switchX,level.postGate.switchY,'#f2c36c',9);sound('pickup');message('Gate open',1100)}
"""+anchor
assert anchor in s;s=s.replace(anchor,insert)
anchor=" image(art.notice,level.checkpoint,G-63,45,63);"
insert=""" if(level.postGate){const g=level.postGate;
  if(!postGateOpen){ctx.fillStyle='#70513a';ctx.fillRect(g.gateX,G-104,18,104);ctx.fillStyle='#edc887';ctx.fillRect(g.gateX-3,G-96,24,7);ctx.fillRect(g.gateX-3,G-56,24,7);
   ctx.save();ctx.translate(g.switchX,g.switchY-9);rounded(-13,-13,26,26,8,'#f7cb69');ctx.fillStyle='#6e4b35';ctx.font='bold 16px system-ui';ctx.textAlign='center';ctx.fillText('✦',0,6);ctx.restore();
  }else{ctx.globalAlpha=.5;ctx.fillStyle='#785a41';ctx.fillRect(g.gateX,G-18,18,18);ctx.globalAlpha=1}
 }
"""+anchor
assert anchor in s;s=s.replace(anchor,insert)
anchor='ending,doubleAvailable,bonusIndex,runResets,bridgeActive,buddyMet'
assert anchor in s;s=s.replace(anchor,'ending,doubleAvailable,bonusIndex,runResets,postGateOpen,bridgeActive,buddyMet')
p.write_text(s)
