import{data,largeData,record,demand,identity,hex,uint,safePath,sha}from'./permission-full-d1-data.mjs';
import{safeSourcePath}from'./permission-full-source-path.mjs';
// Bounded source metadata is a separate primitive channel from the 256KiB
// component models. It is not a custody/transport decoder or runtime evidence.
export function sourceIndex(identityJson,indexJson,expectedJson){const s=identity(data(identityJson)),expected=record(data(expectedJson),['sourceFingerprint','graphSha256','expectedSourceIndexSha256']);
 demand(expected.sourceFingerprint===s.sourceFingerprint&&expected.graphSha256===s.graphSha256&&hex(expected.expectedSourceIndexSha256)&&typeof indexJson==='string'&&indexJson.length<=8*1024**2&&Buffer.byteLength(indexJson)<=8*1024**2&&sha(indexJson)===expected.expectedSourceIndexSha256,'SOURCE');
 // The exact digest comes from the independently frozen producer/manifest,
 // before intake. Raw fingerprint alone cannot bind line/canonical metadata.
 const rows=largeData(indexJson);demand(Array.isArray(rows),'SOURCE');const index=new Map(),folded=new Set();for(const r of rows){record(r,['path','sha256','bytes','lines','canonicalGitBlobSha1']);demand(safeSourcePath(r.path)&&hex(r.sha256)&&uint(r.bytes)&&Number.isSafeInteger(r.lines)&&r.lines>=1&&r.lines<=r.bytes+1&&typeof r.canonicalGitBlobSha1==='string'&&/^[a-f0-9]{40}$/.test(r.canonicalGitBlobSha1)&&!folded.has(r.path.toLowerCase()),'SOURCE');folded.add(r.path.toLowerCase());index.set(r.path,r);}
 const canonical=[...rows].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0).map(({path,bytes,sha256})=>({path,bytes,sha256}));demand(sha(JSON.stringify(canonical))===s.sourceFingerprint,'SOURCE');demand(index.get('package-lock.json')?.sha256===s.lockSha256&&index.get('ci/permission-full-plan.json')?.sha256===s.recipeSha256,'SOURCE');return{sourceIdentity:s,index};}
