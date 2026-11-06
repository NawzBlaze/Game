// Run the Python production-gate safety fixtures as part of the authoritative suite.
const {execFileSync}=require('node:child_process');
process.stdout.write(execFileSync('python3',['-m','unittest','discover','-s','tests','-p','test_release_gate.py','-v'],{encoding:'utf8',stdio:['ignore','pipe','inherit']}));
process.stdout.write(execFileSync('python3',['-m','unittest','discover','-s','tests','-p','test_apk_identity.py','-v'],{encoding:'utf8',stdio:['ignore','pipe','inherit']}));
console.log('PASS read-only APK identity guards; release gate rejects missing approval sections, truthy flags, empty evidence, stale hashes, prerelease versions and missing signed APKs.');
