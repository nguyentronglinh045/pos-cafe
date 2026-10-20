import CONTRACT from '../tests/permissions/full-oracle-contracts.json' with {type:'json'};
import{data,checked,result,record,demand,str,hex,uint,identity,safePath,freeze}from'./permission-full-d1-data.mjs';
export const ORACLE_CONTRACT=freeze(CONTRACT);
const equalSet=(a,b)=>Array.isArray(a)&&Array.isArray(b)&&a.every(v=>typeof v==='string')&&new Set(a).size===a.length&&JSON.stringify([...a].sort())===JSON.stringify([...b].sort());
const body=(input,keys)=>{const x=record(data(input),['sourceIdentity',...keys]);identity(x.sourceIdentity);return x;};
const match=(x,oracle)=>result('MATCH',{sourceFingerprint:x.sourceIdentity.sourceFingerprint,oracle,observation:'SUPPLIED_DECLARATION_NOT_AUTHENTICATED'});
const rows=(v,keys,ids=[])=>{demand(Array.isArray(v));for(const r of v){record(r,keys);for(const k of ids)demand(str(r[k]));}return v;};

export function checkGateControls(input){return checked(()=>{const x=body(input,['controls','appShellVisible','cacheVisible','protectedRequests','ttlBefore','ttlAfter','appliedGeneration','currentGeneration']);
 demand(equalSet(x.controls,['required-pin-form','logout','change-store'])&&x.appShellVisible===false&&x.cacheVisible===false&&x.protectedRequests===0,'ORACLE');
 demand(uint(x.ttlBefore)&&x.ttlBefore===x.ttlAfter&&str(x.currentGeneration)&&(x.appliedGeneration===null||x.appliedGeneration===x.currentGeneration),'ORACLE');
 return match(x,'TC-PIN-02.no-skip-control');});}
export function checkRestrictedSurface(input){return checked(()=>{const x=body(input,['restricted','metadata','prelogin','protectedDenials']);demand(Array.isArray(x.restricted)&&Array.isArray(x.metadata)&&Array.isArray(x.prelogin)&&Array.isArray(x.protectedDenials));
 rows(x.restricted,['name','payloadKeys','projectionKeys','authorityExposed','businessEffects'],['name']);rows(x.metadata,['name','projectionKeys','tenantScoped','authorityExposed','effects'],['name']);rows(x.prelogin,['name','restrictedCredentialAuthorizes','normalAuthorityExposed','standaloneSeedBypass'],['name']);
 demand(equalSet(x.restricted.map(r=>r.name),Object.keys(CONTRACT.restrictedOperations)),'ORACLE');
 for(const r of x.restricted){record(r,['name','payloadKeys','projectionKeys','authorityExposed','businessEffects']);const wanted=CONTRACT.restrictedOperations[r.name];demand(wanted&&equalSet(r.payloadKeys,wanted.payload)&&equalSet(r.projectionKeys,wanted.projection)&&r.authorityExposed===false&&r.businessEffects===0,'ORACLE');}
 demand(equalSet(x.metadata.map(r=>r.name),Object.keys(CONTRACT.publicMetadata)),'ORACLE');
 for(const r of x.metadata){record(r,['name','projectionKeys','tenantScoped','authorityExposed','effects']);demand(equalSet(r.projectionKeys,CONTRACT.publicMetadata[r.name])&&r.tenantScoped===['permission_get_store_session','permission_list_roster'].includes(r.name)&&r.authorityExposed===false&&r.effects===0,'ORACLE');}
 demand(equalSet(x.prelogin.map(r=>r.name),CONTRACT.preloginLifecycle),'ORACLE');for(const r of x.prelogin){record(r,['name','restrictedCredentialAuthorizes','normalAuthorityExposed','standaloneSeedBypass']);demand(r.restrictedCredentialAuthorizes===false&&r.normalAuthorityExposed===false&&r.standaloneSeedBypass===false,'ORACLE');}
 demand(x.protectedDenials.length>0,'ORACLE');for(const r of x.protectedDenials){record(r,['route','code','bodyExposed','businessEffects']);demand(str(r.route)&&r.code==='PIN_CHANGE_REQUIRED'&&r.bodyExposed===false&&r.businessEffects===0,'ORACLE');}
 return match(x,'TC-PIN-03.exact-three-allowed-routes');});}
export function checkErrorContexts(input){return checked(()=>{const x=body(input,['rows']);demand(Array.isArray(x.rows)&&x.rows.length===CONTRACT.messages.length,'ORACLE');
 rows(x.rows,['id','code','trigger','message','businessBefore','businessAfter','clientAutoWrites','secretPersisted','rawBackendText'],['id']);
 demand(equalSet(x.rows.map(r=>r.id),CONTRACT.messages.map(r=>r.id)),'ORACLE');
 for(const r of x.rows){record(r,['id','code','trigger','message','businessBefore','businessAfter','clientAutoWrites','secretPersisted','rawBackendText']);const wanted=CONTRACT.messages.find(e=>e.id===r.id);
  demand(wanted&&r.code===wanted.code&&r.trigger===wanted.trigger&&r.message===wanted.message&&hex(r.businessBefore)&&hex(r.businessAfter)&&r.clientAutoWrites===0&&r.secretPersisted===false&&r.rawBackendText===false,'ORACLE');
  if(wanted.statePolicy==='UNCHANGED')demand(r.businessBefore===r.businessAfter,'ORACLE');
 }
 return match(x,'TC-PIN-05/11/18 exact error triggers/messages/denied state and uncertain ACK no auto replay');});}
export function checkKeyPersistence(input){return checked(()=>{const x=body(input,['sites','markerBefore','markerAfter','reloadRecoveredKey','networkReplayCount']);rows(x.sites,['site','containsKey'],['site']);demand(equalSet(x.sites.map(r=>r.site),CONTRACT.keySites),'ORACLE');
 for(const r of x.sites){record(r,['site','containsKey']);demand(r.containsKey===false,'ORACLE');}demand(hex(x.markerBefore)&&x.markerBefore===x.markerAfter&&x.reloadRecoveredKey===false&&x.networkReplayCount===0,'ORACLE');return match(x,'TC-PIN-12.no-persistence-URL-log-or-marker');});}
export function checkMacAuditProjection(input){return checked(()=>{const x=body(input,['rows']);demand(Array.isArray(x.rows),'ORACLE');const expected=CONTRACT.operations.flatMap(op=>CONTRACT.outcomes.map(outcome=>op+'/'+outcome));
 rows(x.rows,['operation','outcome','registrySecretKind','secretPayloadPresent','registryPlainSecret','unkeyedPinHash','auditKeys','receiptAuthority','signalAuthority','rawSecretCaptured'],['operation','outcome']);
 demand(equalSet(x.rows.map(r=>r.operation+'/'+r.outcome),expected),'ORACLE');for(const r of x.rows){record(r,['operation','outcome','registrySecretKind','secretPayloadPresent','registryPlainSecret','unkeyedPinHash','auditKeys','receiptAuthority','signalAuthority','rawSecretCaptured']);
  demand(r.secretPayloadPresent===['complete','recovery'].includes(r.operation)&&r.registrySecretKind===(r.secretPayloadPresent?'KEYED_MAC':'NO_SECRET_PAYLOAD')&&r.registryPlainSecret===false&&r.unkeyedPinHash===false&&equalSet(r.auditKeys,['actorId','targetId','requestId','outcome','credentialChanged','state'])&&r.receiptAuthority===false&&r.signalAuthority===false&&r.rawSecretCaptured===false,'ORACLE');}
 return match(x,'TC-PIN-18.MAC-no-secret-audit-projection');});}
export function operatorPolicy(input){return checked(()=>{const x=record(data(input),['host','origin','method','route','unlocked','sessionValid','csrfMatches','bodyBytes','databaseRole']);
 demand(x.host==='127.0.0.1:5191'&&x.origin==='http://127.0.0.1:5191'&&x.method==='POST'&&['/api/unlock','/api/recover','/api/lock'].includes(x.route)&&uint(x.bodyBytes)&&x.bodyBytes<=16384,'ORACLE');
 demand(x.route==='/api/unlock'||x.unlocked===true&&x.sessionValid===true&&x.csrfMatches===true,'ORACLE');demand(x.databaseRole==='pos_owner_recovery','ORACLE');
 return result('MATCH',{policy:'LOOPBACK_UNLOCK_SESSION_CSRF_ORIGIN_BODY_ROLE',httpOrDbInvocations:0});});}
export function checkUiAndRegression(input,commandContextJson){return checked(()=>{const x=body(input,['selftest','pinViewports','commands','regressions']);record(x.selftest,['findings','rules','controls','ok']);
 demand(x.selftest.findings===23&&equalSet(x.selftest.rules,CONTRACT.rules)&&x.selftest.ok===true,'ORACLE');record(x.selftest.controls,CONTRACT.controls);demand(Object.values(x.selftest.controls).every(v=>v===true),'ORACLE');
 rows(x.pinViewports,['viewport','screenshotPath','screenshotSha256','photoInspected','classifications','masked','overflow','overlay','zeroSize'],['viewport']);demand(equalSet(x.pinViewports.map(r=>r.viewport),['desktop','tablet','mobile']),'ORACLE');
 for(const r of x.pinViewports){record(r,['viewport','screenshotPath','screenshotSha256','photoInspected','classifications','masked','overflow','overlay','zeroSize']);demand(safePath(r.screenshotPath)&&hex(r.screenshotSha256)&&r.photoInspected===true&&r.masked===true&&r.overflow===false&&r.overlay===false&&r.zeroSize===false&&Array.isArray(r.classifications),'ORACLE');
  for(const f of r.classifications){record(f,['findingId','classification','rationaleSha256']);demand(str(f.findingId)&&hex(f.rationaleSha256)&&['REAL_FIXED','FALSE_POSITIVE_DOCUMENTED'].includes(f.classification),'ORACLE');}}
 const commandContext=record(data(commandContextJson),['sourceIdentity','entrySha256','configSha256']);identity(commandContext.sourceIdentity);demand(JSON.stringify(commandContext.sourceIdentity)===JSON.stringify(x.sourceIdentity)&&hex(commandContext.entrySha256)&&hex(commandContext.configSha256),'SOURCE');
 const argv=[['node','ui-audit/run.mjs','--selftest'],['node','ui-audit/run.mjs','--state','required-pin-change']];
 demand(Array.isArray(x.commands)&&x.commands.length===2,'ORACLE');
 for(let i=0;i<2;i++){const c=record(x.commands[i],['id','argv','sourceFingerprint','entrySha256','configSha256']);demand(c.id===['UI_SELFTEST','PIN_UI_AUDIT'][i]&&JSON.stringify(c.argv)===JSON.stringify(argv[i])&&c.sourceFingerprint===x.sourceIdentity.sourceFingerprint&&c.entrySha256===commandContext.entrySha256&&c.configSha256===commandContext.configSha256,'ORACLE');}
 rows(x.regressions,['id','sourceFingerprint','required','passed','skipped','failed'],['id']);demand(equalSet(x.regressions.map(r=>r.id),['unit','tooling','permission-regression','build','typecheck']),'ORACLE');
 for(const r of x.regressions){record(r,['id','sourceFingerprint','required','passed','skipped','failed']);demand(r.sourceFingerprint===x.sourceIdentity.sourceFingerprint&&uint(r.required)&&r.required>0&&r.passed===r.required&&r.skipped===0&&r.failed===0,'ORACLE');}
 return match(x,'TC-PIN-17 full regression, selftest23/rules14/controls16, PIN3viewports/photos/classification/no update');});}
