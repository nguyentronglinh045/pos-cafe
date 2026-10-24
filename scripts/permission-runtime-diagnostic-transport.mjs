const refuse=()=>{throw Error('RUNTIME_DIAGNOSTIC_TRANSPORT_REFUSED');};
export function finiteDiagnosticFacts(facts,safe){
 if(!facts||typeof facts!=='object'||Array.isArray(facts)||typeof safe!=='function')refuse();
 return Object.fromEntries(Object.entries(facts).filter(([k,v])=>safe(k,v)));
}
export function diagnosticMarker(prefix,facts,safe){
 if(!['T04_FAILURE_FACTS','SERVICE_FAILURE_FACTS'].includes(prefix)
  ||!Object.entries(facts).every(([k,v])=>safe(k,v)))refuse();
 const text=prefix+' '+JSON.stringify(facts);if(Buffer.byteLength(text)>1024**2)refuse();return text;
}
export function parseDiagnosticMarker(prefix,text,safe){
 if(typeof text!=='string'||Buffer.byteLength(text)>1024**2)return{};
 const rows=text.split(/\r?\n/).filter(x=>x.startsWith(prefix+' '));if(rows.length!==1)return{};
 try{const p=JSON.parse(rows[0].slice(prefix.length+1));
  if(!p||typeof p!=='object'||Array.isArray(p)||!Object.entries(p).every(([k,v])=>safe(k,v)))return{};return p;
 }catch{return{};}
}
// The collector preserves only the finite diagnostic subset of safe backend
// envelopes. It never copies private runner reports, logs or error messages.
export function collectRuntimeDiagnosticFacts(records,prefix,safe){
 if(!Array.isArray(records)||records.length>10000||!['t04','service'].includes(prefix))refuse();
 const result=[];
 for(const record of records){const facts=record?.failure?.facts??record?.facts;if(!facts)continue;
  const rows=Object.entries(facts).filter(([k])=>k.startsWith(prefix));if(!rows.length)continue;
  if(!rows.every(([k,v])=>safe(k,v)))refuse();result.push(Object.fromEntries(rows));
 }
 return result;
}
