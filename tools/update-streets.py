from pathlib import Path
p=Path('/home/user/little-parcel-crew-worlds/web/adventure.js');s=p.read_text()
old="'ground','platform',...['garden','market','autumn','harbour','hill']";new="'ground','platform','street-plane','street-acacia','street-wildflowers','street-roses','street-grass','street-earth','street-grass-top','street-platform',...['garden','market','autumn','harbour','hill']";assert old in s;s=s.replace(old,new)
anchor=' // Dwellings are non-colliding background scenery; collision geometry remains explicit.'
new=''' // A second depth layer uses the same illustration family as the buildings.
 // Route-specific spacing and scale keep silhouettes from forming a repeating row.
 for(let j=0;j<Math.ceil(level.width/410)+2;j++){
  let x=75+j*(330+(index%3)*37)+(index*61%150)-camera*.69;
  if(x < -230 || x > W+230)continue;
  const wide=(j+index)%3!==0, w=wide?198:140, h=wide?112:102;
  ctx.save();ctx.globalAlpha=level.theme===3?.67:.82;
  image(art[wide?'street-plane':'street-acacia'],x,G-h-10,w,h);ctx.restore();
 }
''' + anchor
assert anchor in s;s=s.replace(anchor,new)
old="for(let x=180+(index%4)*37, n=0;x<level.width;x+=310+(index%3)*58,n++){if(x-camera< -100||x-camera>W+100)continue;let safe=level.ground.some(([a,b])=>x>a+30&&x<b-90);if(safe){if((n+index)%3!==1)image(art.fence,x,G-25,76,27);if((n+index)%2===0)image(art.flowers,x+78,G-24,24,24)}}"
new="for(let x=160+(index%4)*37, n=0;x<level.width;x+=270+(index%3)*58,n++){if(x-camera< -120||x-camera>W+120)continue;let safe=level.ground.some(([a,b])=>x>a+30&&x<b-90);if(safe){if((n+index)%4===0)image(art.fence,x,G-25,70,25);else if((n+index)%4===1)image(art['street-roses'],x+20,G-32,26,33);else image(art['street-grass'],x+12,G-19,48,20);if((n+index)%3===0)image(art['street-wildflowers'],x+75,G-10,55,8)}}"
assert old in s;s=s.replace(old,new)
# Draw sourced Glitch earth and grass, matching the illustration style of the homes.
old="for(let x=a;x<edge;x+=128)image(art['ground-'+['garden','market','autumn','harbour','hill'][level.theme]],x,G,128,74)"
new="for(let x=a;x<edge;x+=128)image(art['street-earth'],x,G,128,80);for(let x=a;x<edge;x+=130)image(art['street-grass-top'],x,G-2,130,17)"
assert old in s;s=s.replace(old,new)
old="for(let n=x;n<x+w;n+=64)image(art['platform-'+['garden','market','autumn','harbour','hill'][level.theme]],n,y,64,38)"
new="image(art['street-earth'],x,y,w,30);image(art['street-platform'],x,y-2,w,10)"
assert old in s;s=s.replace(old,new)
p.write_text(s)
