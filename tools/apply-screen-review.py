from pathlib import Path
p=Path('/home/user/little-parcel-crew-worlds/web/adventure.js')
s=p.read_text()
# Curated street compositions. Buildings are scenery only, with landmarks and spacing
# intentionally specific to a route; coordinates are world-space, not screen-space.
needle='const CHALLENGES=['
insert='''// Route-specific streets: hand-authored landmarks rather than one repeated strip.
// The neighbourhood has open green spaces as well as built-up streets.
const STREET_SCENES=[
 [[40,'cottage-thatch'],[420,'cottage-stone'],[1040,'treehouse']],
 [[60,'hobbit'],[450,'hobbit'],[1070,'cottage-stone']],
 [[0,'cottage-stone'],[520,'treehouse'],[1200,'cottage-thatch']],
 [[40,'treehouse'],[570,'hobbit'],[1260,'treehouse']],
 [[20,'cottage-wacky'],[300,'cottage-stone'],[700,'cottage-wacky'],[1320,'cottage-thatch']],
 [[40,'cottage-stone'],[340,'cottage-wacky'],[920,'cottage-stone'],[1460,'cottage-wacky']],
 [[0,'cottage-wacky'],[350,'cottage-wacky'],[760,'cottage-stone'],[1510,'cottage-wacky']],
 [[70,'cottage-thatch'],[510,'cottage-wacky'],[1170,'cottage-stone'],[1700,'hobbit']],
 [[40,'treehouse'],[650,'cottage-thatch'],[1390,'hobbit']],
 [[-10,'hobbit'],[470,'treehouse'],[1130,'treehouse'],[1660,'cottage-thatch']],
 [[40,'cottage-thatch'],[430,'cottage-stone'],[850,'cottage-wacky'],[1600,'treehouse']],
 [[20,'treehouse'],[700,'hobbit'],[1450,'treehouse'],[1940,'cottage-thatch']],
 [[30,'cottage-wacky'],[760,'cottage-stone'],[1500,'cottage-wacky']],
 [[70,'cottage-thatch'],[620,'cottage-wacky'],[1400,'cottage-stone']],
 [[30,'cottage-stone'],[500,'cottage-wacky'],[1200,'cottage-wacky'],[1740,'hobbit']],
 [[0,'cottage-wacky'],[740,'cottage-stone'],[1550,'cottage-thatch']],
 [[50,'cottage-stone'],[700,'cottage-wacky'],[1530,'cottage-wacky'],[1960,'hobbit']],
 [[60,'cottage-thatch'],[600,'cottage-stone'],[1300,'cottage-wacky'],[2000,'treehouse']],
 [[40,'treehouse'],[600,'cottage-thatch'],[1380,'hobbit']],
 [[10,'hobbit'],[490,'treehouse'],[1100,'cottage-thatch'],[1760,'treehouse']],
 [[30,'cottage-thatch'],[720,'hobbit'],[1460,'treehouse']],
 [[20,'treehouse'],[640,'cottage-thatch'],[1350,'hobbit'],[1840,'treehouse']],
 [[60,'hobbit'],[520,'cottage-thatch'],[1160,'treehouse'],[1850,'hobbit']],
 [[10,'cottage-thatch'],[500,'treehouse'],[1050,'cottage-stone'],[1670,'hobbit'],[2180,'cottage-wacky']]
];
// Parcel and weather rules belong to the main route as well as optional deliveries.
LEVELS[8].kind='wind';
LEVELS[10].kind='fragile';
LEVELS[14].kind='bouncy';
LEVELS[5].stop=350; LEVELS[5].secondParcel=430;
LEVELS[9].stop=335; LEVELS[9].secondParcel=420;
LEVELS[19].stop=345; LEVELS[19].secondParcel=430;
'''
assert needle in s;s=s.replace(needle,insert+needle,1)
old="for(let j=0;j<Math.ceil(level.width/260)+3;j++){let x=j*260-camera*.58-50;if(x< -200||x>W+200)continue;let name=dwellings[(j+level.theme)%dwellings.length],w=name==='hobbit'?155:148,h=name==='cottage-wacky'?168:name==='hobbit'?120:145;image(art[name],x,G-h+3,w,h)}"
new="for(const [worldX,name] of STREET_SCENES[index]){let x=worldX-camera*.76;if(x< -200||x>W+200)continue;let w=name==='hobbit'?150:140,h=name==='cottage-wacky'?153:name==='hobbit'?112:135;image(art[name],x,G-h+3,w,h)}"
assert old in s;s=s.replace(old,new)
old="for(let x=130;x<level.width;x+=260){if(x-camera< -100||x-camera>W+100)continue;let safe=level.ground.some(([a,b])=>x>a+30&&x<b-45);if(safe){image(art.fence,x,G-27,82,30);image(art.flowers,x+76,G-26,26,26)}}"
new="for(let x=180+(index%4)*37, n=0;x<level.width;x+=310+(index%3)*58,n++){if(x-camera< -100||x-camera>W+100)continue;let safe=level.ground.some(([a,b])=>x>a+30&&x<b-90);if(safe){if((n+index)%3!==1)image(art.fence,x,G-25,76,27);if((n+index)%2===0)image(art.flowers,x+78,G-24,24,24)}}"
assert old in s;s=s.replace(old,new)
# In-world collectibles with restrained postal badge rather than floating app tiles.
s=s.replace("rounded(0,0,30,32,5,'#fff8e4');rounded(3,3,24,26,3,'#edab67');ctx.fillStyle='#fff9e5';ctx.font='bold 17px system-ui';ctx.fillText('✉',5,22)","ctx.rotate(-.08);rounded(1,3,27,21,3,'#dfaa73');rounded(0,0,27,21,3,'#fff4d9');ctx.strokeStyle='#c9814d';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(3,4);ctx.lineTo(13.5,12);ctx.lineTo(24,4);ctx.stroke();ctx.fillStyle='#ca6e4b';ctx.beginPath();ctx.arc(22,4,2.5,0,7);ctx.fill()")
# Fewer system-like notices. The mission line already communicates pickup, delivery,
# air hops and checkpoint status; leave warnings and learning cues intact.
for a in ["message('Air hop!')", "message('Checkpoint reached!')", "message('Delivery for you!')", "message(level.stop&&!midDelivered?'Parcel ready! First neighbour ahead':'Parcel picked up! Find the door')"]:
 assert a in s;s=s.replace(a,'void 0')
s=s.replace("message('First delivery done! Next parcel ahead')","message('Next stop →',1400)")
s=s.replace("'Nice work, courier.'","'Delivered'")
s=s.replace("'02 / DELIVERY':'01 / PICKUP'","'DELIVER':'PICK UP'")
s=s.replace("'AIR HOP READY':'HOP USED'","'TAP AGAIN':'WAIT'")
s=s.replace("<span>JUMP ↑</span><small id=\"hopReady\">AIR HOP READY</small>","<span>JUMP</span><small id=\"hopReady\">TAP AGAIN</small>")
s=s.replace('Little parcels. Big adventures.','A delivery adventure.')
s=s.replace('<span class="adv-sticker">LITTLE PARCEL CREW ✦</span>','')
s=s.replace('Your deliveries.</h2><p>Choose a route. Collect stamps for extra stars.','Choose a route.</h2><p>Pick a delivery and explore the neighbourhood.')
s=s.replace('THE ROUTE BOOK','DELIVERIES')
# Tell the player about special rules when entering the affected route, not
# by surprising them after a fall.
old="else if(i===13)message('Striped belts move you along!');}"
new="else if(i===13)message('Striped belts move you along!');else if(level.kind==='wind')message('Wind picks up along this route',3200);else if(level.kind==='fragile')message('Fragile parcel: land gently',3200);else if(level.kind==='bouncy')message('Bouncy parcel: watch your landings',3200);}"
assert old in s;s=s.replace(old,new)
p.write_text(s)
print('patched',p)
