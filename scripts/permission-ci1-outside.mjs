import {lstatSync,readdirSync,realpathSync} from 'node:fs';
import {resolve,join,sep} from 'node:path';

// Unlike the light source counter, account for Git objects and link inodes.
// Only already-accounted roots may be reached through a symlink. No writes.
export function allocatedOutsideBytes(inputRoots){
  const roots=[...new Set(inputRoots.map(p=>realpathSync(resolve(p))))],seen=new Set();let bytes=0,entries=0;
  const inside=p=>roots.some(r=>p===r||p.startsWith(r+sep));
  function visit(p){
    const s=lstatSync(p,{bigint:true}),id=s.dev+':'+s.ino;if(seen.has(id))return;seen.add(id);
    if(++entries>250000)throw Error('BACKEND_OUTSIDE_ENTRY_BOUND');
    const n=process.platform==='win32'?Number(s.size):Number(s.blocks*512n);
    if(!Number.isSafeInteger(n)||n<0)throw Error('BACKEND_OUTSIDE_SIZE_REFUSED');bytes+=n;
    if(bytes>1024**3)throw Error('BACKEND_OUTSIDE_SIZE_BOUND');
    if(s.isSymbolicLink()){
      const target=realpathSync(p);if(!inside(target))throw Error('BACKEND_OUTSIDE_LINK_REFUSED');visit(target);
    }else if(s.isDirectory()){for(const name of readdirSync(p))visit(join(p,name));}
    else if(!s.isFile())throw Error('BACKEND_OUTSIDE_TYPE_REFUSED');
  }
  for(const p of roots)visit(p);return bytes;
}
