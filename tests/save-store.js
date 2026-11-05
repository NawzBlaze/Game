const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('web/save-store.js','utf8');
function environment(initial={},fail=null){const map=new Map(Object.entries(initial));const context={window:{},localStorage:{getItem:k=>map.get(k)??null,setItem:(k,v)=>{if(fail?.(k,v))throw Error('quota');map.set(k,v)},removeItem:k=>map.delete(k)}};vm.runInNewContext(source,context);return {store:context.window.ParcelSaves,map};}
const A='delivery-adventure-v1',C='one-step-delivery-v2';
for(const raw of ['null','[]','"hello"','{broken']){const {store,map}=environment({[A]:raw});assert.equal(store.read(A,{unlocked:1,best:{}}).unlocked,1);assert.equal(map.get('lpc-recovery:'+A),raw);store.write(A,{unlocked:2,best:{1:3}});assert.equal(map.get('lpc-recovery:'+A),raw);}
{
 const {store,map}=environment({[A]:JSON.stringify({unlocked:999,best:{1:3,2:99,3:'3'},courier:'pip',sound:'false',bonus:null})});
 const s=store.read(A,{sound:true});assert.equal(s.unlocked,24);assert.equal(s.best[1],3);assert.equal(s.best[2],undefined);assert.equal(s.sound,true);assert(map.has('lpc-recovery:'+A));
}
{
 const {store,map}=environment({[A]:'null'},k=>k.startsWith('lpc-recovery:'));store.read(A,{});assert.equal(store.write(A,{unlocked:2}),false);assert.equal(map.get(A),'null','never overwrite unrecoverable original');
}
{
 const {store,map}=environment({[A]:JSON.stringify({unlocked:8,best:{1:3},hat:'cap',bag:'mint'})});const before=map.get(A);
 assert.throws(()=>store.parseBackup('{bad'));assert.throws(()=>store.parseBackup(JSON.stringify({format:'other',version:1,saves:{}})));assert.equal(map.get(A),before);
 const roundtrip=store.parseBackup(JSON.stringify(store.snapshot()));store.restore(roundtrip);assert.equal(JSON.parse(map.get(A)).hat,'cap');assert(map.has('lpc-before-restore'));
}
{
 let failures=0;const oldA=JSON.stringify({unlocked:4,best:{1:2}}),oldC=JSON.stringify({unlocked:9,stars:{1:3}});
 const {store,map}=environment({[A]:oldA,[C]:oldC},k=>k===C&&++failures===1);
 assert.throws(()=>store.restore({[A]:{unlocked:20},[C]:{unlocked:30}}));assert.equal(map.get(A),oldA);assert.equal(map.get(C),oldC);
}
console.log('PASS save validation, corrupt originals, quota protection, backup roundtrip and failed-restore rollback.');
