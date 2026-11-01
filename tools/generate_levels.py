import json, random, collections
from pathlib import Path
N=6
D=[(0,-1),(1,0),(0,1),(-1,0)]
def move(walls,p,ds,has,pack,exit,dir):
 dx,dy=dir;x,y=p; np=(x+dx,y+dy)
 if not(0<=np[0]<N and 0<=np[1]<N) or np in walls:return None
 if np in ds:return None
 picked=not has and np==pack
 has=has or picked
 if picked:return (np,ds,has) # parcel pulse pauses all drones for this turn
 nd=list(ds)
 for i,(x,y) in enumerate(nd):
  ddx=np[0]-x;ddy=np[1]-y
  opts=[]
  if abs(ddx)>=abs(ddy):
   if ddx:opts.append((1 if ddx>0 else -1,0))
   if ddy:opts.append((0,1 if ddy>0 else -1))
  else:
   if ddy:opts.append((0,1 if ddy>0 else -1))
   if ddx:opts.append((1 if ddx>0 else -1,0))
  for a,b in opts:
   q=(x+a,y+b)
   if q not in walls and q not in nd and 0<=q[0]<N and 0<=q[1]<N:
    if q==np:return None
    nd[i]=q;break
 return (np,tuple(nd),has)
def solve(data):
 walls={tuple(x) for x in data['walls']}; pack=tuple(data['package']);end=tuple(data['exit'])
 initial=(tuple(data['start']),tuple(map(tuple,data['drones'])),False)
 queue=collections.deque([(initial,'')]);seen={initial}
 while queue:
  (p,ds,has),path=queue.popleft()
  if has and p==end:return path
  for i,d in enumerate(D):
   s=move(walls,p,ds,has,pack,end,d)
   if s and s not in seen:
    seen.add(s);queue.append((s,path+'URDL'[i]))
  if len(seen)>220000:return None
 return None

def mk(start,pack,exit,drones,walls,theme,name):
 ob={'width':N,'height':N,'start':start,'package':pack,'exit':exit,'drones':drones,'walls':walls,'name':name,'theme':theme}
 sol=solve(ob);ob['optimal']=len(sol) if sol else None;return ob,sol
# First boards introduce objectives before danger.
tutorial=[
 mk([0,4],[2,4],[5,2],[],[[1,2],[2,2],[3,2],[3,3]],'meadow','First delivery'),
 mk([0,5],[3,4],[5,0],[],[[1,1],[1,2],[1,3],[3,2],[4,2]],'meadow','A little detour'),
]
levels=[]
for o,s in tutorial:
 assert s;levels.append(o)
rng=random.Random(187723)
allcells=[(x,y) for y in range(N) for x in range(N)]
for idx in range(2,48):
 group=idx//12; targetmin=7+min(group,3)*2
 drones=1 if idx<21 else 2
 for attempt in range(20000):
  cells=allcells[:];rng.shuffle(cells)
  st,pa,ex=cells[:3]; dr=cells[3:3+drones]; wall_count=7+min(group,3)+(idx%2)
  walls=cells[3+drones:3+drones+wall_count]
  if abs(st[0]-pa[0])+abs(st[1]-pa[1])<2 or abs(pa[0]-ex[0])+abs(pa[1]-ex[1])<2:continue
  if any(abs(st[0]-d[0])+abs(st[1]-d[1])<2 for d in dr):continue
  names=['Morning rounds','The quiet block','Corner office','Waiting game','Little shortcut','Parcel patrol','Window shopping','Tea break','The long way','Crossed wires','A careful turn','Almost there','Two on duty','The busy block','Double take','Side streets','Near miss','The final mile','Cloudy corner','Last call','Night delivery','Home stretch']
  theme=['meadow','harbor','sunset','night'][min(idx//12,3)]
  o,s=mk(list(st),list(pa),list(ex),[list(d) for d in dr],[list(p) for p in walls],theme,names[(idx-2)%len(names)] + (' II' if idx>=24 else ''))
  if s and targetmin<=len(s)<=24 and len(s)>=(abs(st[0]-pa[0])+abs(st[1]-pa[1])+abs(pa[0]-ex[0])+abs(pa[1]-ex[1])):
   levels.append(o);break
 else:raise RuntimeError('failed level '+str(idx))
levels = levels[:2] + sorted(levels[2:21], key=lambda x: x['optimal']) + sorted(levels[21:], key=lambda x: x['optimal'])
for i, lv in enumerate(levels):
 lv['theme']=['meadow','harbor','sunset','night'][i//12]
 if lv['name']=='Two on duty': lv['name']='Market rounds'
print('created',len(levels),'shortest',[(x['name'],x['optimal'],len(x['drones'])) for x in levels])
Path(__file__).parents[1].joinpath('web','levels.js').write_text('window.LEVELS = '+json.dumps(levels,separators=(',',':'))+';\n')
