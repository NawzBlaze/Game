/* Serial release verification; CI owns its servers, local runs can opt into existing previews. */
const {spawn,spawnSync}=require('node:child_process');
const fs=require('node:fs');
const results=[],servers=[];
const tests=['save-store','release-gate','native-progress','test','full_campaign','startup','adventure','all-stars','special-deliveries','parcel-mechanics','multitouch','offline-storage','audio-lifecycle','audio-decode','route-experience','courier-mastery','campaign-edition','studio-soundtrack','express-campaign','landscape','presentation','mobile-ui','release'];
function run(name,command,args){
 console.log('\n=== '+name+' ===');
 const started=Date.now(),result=spawnSync(command,args,{encoding:'utf8',timeout:180000,env:process.env,maxBuffer:16*1024*1024});
 process.stdout.write(result.stdout||'');process.stderr.write(result.stderr||'');
 results.push({name,passed:result.status===0,durationMs:Date.now()-started,exitCode:result.status,error:result.error?.message||null});
 return result.status===0;
}
async function ready(port){
 const deadline=Date.now()+15000;
 while(Date.now()<deadline){
  if(servers.some(p=>p.exitCode!==null))throw new Error('Verification preview server exited');
  try{const r=await fetch('http://127.0.0.1:'+port);if(r.ok)return;}catch{}
  await new Promise(r=>setTimeout(r,100));
 }
 throw new Error('Preview did not start on '+port);
}
(async()=>{
 try{
  if(!run('Lint','npm',['run','lint'])||!run('Build allowlisted RC','python3',['tools/build_release.py']))throw Error('Preflight failed');
  if(process.env.LPC_USE_EXISTING_SERVERS!=='1'){
   servers.push(spawn('python3',['tools/serve.py','--directory','web','--port','4187'],{stdio:'ignore'}));
   servers.push(spawn('python3',['tools/serve.py','--directory','dist/web','--port','4188'],{stdio:'ignore'}));
  }
  await ready(4187);await ready(4188);

  for(const test of tests)run(test,'node',['tests/'+test+'.js']);
  if(results.some(r=>!r.passed))process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=1;}
 finally{
  for(const child of servers)child.kill('SIGTERM');
  fs.mkdirSync('dist',{recursive:true});
  fs.writeFileSync('dist/qa-report.json',JSON.stringify({version:require('../package.json').version,scope:'Automated web checks only; no device/signing/human approval',artifactSha256:fs.existsSync('dist/SHA256SUMS.txt')?fs.readFileSync('dist/SHA256SUMS.txt','utf8').split(/\s+/)[0]:null,passed:results.length===tests.length+2&&results.every(r=>r.passed),checks:results},null,2)+'\n');
  console.log('\n'+results.filter(r=>r.passed).length+'/'+results.length+' checks passed. Report: dist/qa-report.json');
 }
})();
