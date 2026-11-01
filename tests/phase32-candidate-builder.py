from pathlib import Path
s=Path('web/adventure.js').read_text();out=Path('evidence/phase32/candidates')
assert "function sliceReady(){return index===12&&bonusIndex<0&&sliceRequiredReady}" in s
hook="""function sliceReady(){return index===12&&bonusIndex<0&&sliceRequiredReady}
let phase32BackdropCanvas=null,phase32BackdropImage=null,phase32GroundCanvas=null,phase32GroundSignature='';
function phase32CachedBackdrop(){const im=sliceArt.backdrop;if(phase32BackdropImage!==im){const c=document.createElement('canvas');c.width=im.naturalWidth;c.height=im.naturalHeight;c.getContext('2d').drawImage(im,0,0);phase32BackdropCanvas=c;phase32BackdropImage=im}ctx.drawImage(phase32BackdropCanvas,-camera*.10,0,2100,G)}
function phase32GroundStrip(){const sig=['terrain-1','terrain-2','terrain-3'].map(n=>sliceArt[n].src).join('|');if(!phase32GroundCanvas||phase32GroundSignature!==sig){let c=document.createElement('canvas');c.width=384;c.height=90;let g=c.getContext('2d');for(let i=0;i<3;i++)g.drawImage(sliceArt['terrain-'+(i+1)],i*128,0,128,90);phase32GroundCanvas=c;phase32GroundSignature=sig}return phase32GroundCanvas}
"""
x=s.replace('function sliceReady(){return index===12&&bonusIndex<0&&sliceRequiredReady}',hook)
back="image(sliceArt.backdrop,-camera*.10,0,2100,G)"; ground="if(slice){const first=Math.max(0,Math.floor((camera-a)/128)),last=Math.min(Math.ceil((edge-a)/128),Math.ceil((camera+W-a)/128));for(let n=first;n<last;n++){const x=a+n*128;image(sliceArt['terrain-'+(n%3+1)],x,G,128,90)}}";newground="if(slice){const first=Math.max(0,Math.floor((camera-a)/384)),last=Math.min(Math.ceil((edge-a)/384),Math.ceil((camera+W-a)/384));for(let n=first;n<last;n++)ctx.drawImage(phase32GroundStrip(),a+n*384,G,384,90)}"
assert back in x and ground in x
for name,src in [('backdrop-cache',x.replace(back,'phase32CachedBackdrop()')),('ground-strip',x.replace(ground,newground)),('both-cached',x.replace(back,'phase32CachedBackdrop()').replace(ground,newground))]:
 (out/(name+'.js')).write_text(src)
