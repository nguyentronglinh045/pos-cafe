import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {closeCandidateDrawer,waitForCandidateSave,establishCandidateClearSettings} from '../tests/supabase/permissionCandidateUi.ts';
import {CandidateDiagnostics,diagnosticFields,imageDiagnosticFields,readCandidateDom,readCandidateImageDom} from '../tests/supabase/permissionCandidateDiagnostics.ts';
import {CANDIDATE_CHECKPOINT_BOUNDS,CANDIDATE_IMAGE_BOUNDS,CANDIDATE_TEST_NAMES,safeCandidateDiagnostic} from './permission-runtime-candidate-diagnostic.mjs';

test('visible floor cannot finish close before the selected drawer is hidden',async()=>{
 let release;const hidden=new Promise(resolve=>{release=resolve;});const calls=[];let completed=false;
 const closing=closeCandidateDrawer({visible:async id=>id==='settings-drawer',clickClose:async(id,name)=>calls.push([id,name]),
  hidden:async()=>hidden,floorVisible:async()=>calls.push('floor')}).then(()=>{completed=true;});
 await nextTurn();assert.equal(completed,false);assert.deepEqual(calls,[['settings-drawer','Huỷ']]);
 release();await closing;assert.equal(completed,true);assert.deepEqual(calls.at(-1),'floor');
});

test('cancel confirmation failure is preserved and does not fall back to floor or discard',async()=>{
 const refusal=new Error('DRAWER_STILL_PRESENT');let floor=false;
 await assert.rejects(closeCandidateDrawer({visible:async id=>id==='floor-editor',clickClose:async()=>{},
  hidden:async()=>{throw refusal;},floorVisible:async()=>{floor=true;}}),error=>error===refusal);
 assert.equal(floor,false);
});

test('pending-disabled Save is insufficient; callback must clear the dirty draft',async()=>{
 let completeLabel,completeDraft;const label=new Promise(resolve=>{completeLabel=resolve;}),draft=new Promise(resolve=>{completeDraft=resolve;});
 const calls=[];let completed=false;
 const saving=waitForCandidateSave({completedLabel:async(button,text)=>{calls.push([button,text]);await label;},
  noDirtyBadge:async badge=>{calls.push(badge);await draft;},disabled:async()=>calls.push('disabled')},'update_store_settings').then(()=>{completed=true;});
 await nextTurn();assert.equal(completed,false);completeLabel();await nextTurn();assert.equal(completed,false);
 assert.equal(calls.at(-1),'settings-dirty-badge');completeDraft();await saving;assert.equal(completed,true);assert.equal(calls.at(-1),'disabled');
});

class FakePage extends EventEmitter {
 mainFrame(){return this;}
 async evaluate(){return {drawerCount:2,inputCount:2,drawerVisible:2,inputVisible:2,inputSuffix:2,inputEqualsPreclear:0,
  sectionOrdinal:1,cancelDialog:1,dirty:1,savePending:1,queryState:0};}
}
const capture=(ordinal,status='failed')=>{const attachments=[];return{attachments,info:{title:CANDIDATE_TEST_NAMES[ordinal-1],status,attach:async(name,value)=>attachments.push({name,...value})}};};
const decoded=capture=>JSON.parse(capture.attachments[0].body.toString());
const request=name=>({url:()=>`http://127.0.0.1:62421/rest/v1/rpc/${name}`});
const response=(request,name)=>({url:request.url,request:()=>request,ok:()=>true,body:async()=>Buffer.from(JSON.stringify({ok:true,data:{displayName:name}}))});

test('checkpoint producer and reporter agree on every finite field',()=>{
 assert.deepEqual([...diagnosticFields].sort(),Object.keys(CANDIDATE_CHECKPOINT_BOUNDS).sort());
 assert.deepEqual([...imageDiagnosticFields].sort(),Object.keys(CANDIDATE_IMAGE_BOUNDS).sort());
});

test('rendered section marker, pending Save and missing input remain distinct in DOM projection',()=>{
 const source=readFileSync(new URL('../src/app/drawers/admin/GeneralSettingsDrawer.tsx',import.meta.url),'utf8');
 assert(source.includes('border-pos-primaryLine bg-white'));
 const dom=new JSDOM('<div data-testid="settings-drawer"><button data-testid="settings-section-demo" class="border-pos-primaryLine bg-white"><strong class="text-pos-primary">Demo</strong></button><button data-testid="save-settings-button" disabled>Đang lưu...</button><span data-testid="settings-dirty-badge">Chưa lưu</span></div>');
 const beforeDocument=globalThis.document,beforeStyle=globalThis.getComputedStyle;
 globalThis.document=dom.window.document;globalThis.getComputedStyle=dom.window.getComputedStyle;
 dom.window.Element.prototype.getClientRects=()=>[{width:1,height:1}];
 try{
  const demo=readCandidateDom(undefined);assert.equal(demo.sectionOrdinal,2);assert.equal(demo.inputCount,1);assert.equal(demo.inputSuffix,0);
  assert.equal(demo.savePending,2);assert.equal(demo.dirty,2);
  const button=dom.window.document.querySelector('[data-testid="settings-section-demo"]');button.dataset.testid='settings-section-info';
  const input=dom.window.document.createElement('input');input.dataset.testid='settings-name-input';input.value='PRIVATE E2E';dom.window.document.body.append(input);
  const info=readCandidateDom('PRIVATE E2E');assert.equal(info.sectionOrdinal,1);assert.equal(info.inputSuffix,2);assert.equal(info.inputEqualsPreclear,2);
 }finally{globalThis.document=beforeDocument;globalThis.getComputedStyle=beforeStyle;dom.window.close();}
});

test('four boundaries distinguish persist, seed and clear using booleans, with preseed API unknown',async()=>{
 const name='PRIVATE_SENTINEL E2E',changed='PRIVATE_SENTINEL changed';
 const firstPage=new FakePage(),first=new CandidateDiagnostics(firstPage,async()=>name),persist=capture(4);
 const read=request('permission_get_settings_admin');firstPage.emit('request',read);firstPage.emit('response',response(read,name));await nextTurn();
 await first.checkpoint(1);await first.finish(persist.info);
 assert.equal(safeCandidateDiagnostic(decoded(persist),4)?.observations[0].apiEqualsDb,2);
 const page=new FakePage();let dbName=name;const clear=new CandidateDiagnostics(page,async()=>dbName),out=capture(6);
 await clear.checkpoint(1);await clear.checkpoint(2);dbName=changed;await clear.checkpoint(3);await clear.checkpoint(4);await clear.finish(out.info);
 const value=decoded(out);assert(safeCandidateDiagnostic(value,6));
 assert.equal(value.observations[1].apiReadState,0);assert.equal(value.observations[1].dbEqualsPersist,2);
 assert.equal(value.observations[2].dbEqualsPersist,1);assert.equal(value.observations[3].dbEqualsPreclear,2);
 for(const item of [persist,out])assert(!item.attachments[0].body.toString().includes('PRIVATE_SENTINEL'));
});

test('clear precondition always writes a changed name, verifies reopen and resets session before seed',async()=>{
 for(const previous of['Fixture store','Clear preservation A E2E','Clear preservation B E2E']){
  const calls=[];let saved;
  const name=await establishCandidateClearSettings({login:async()=>calls.push('login'),open:async()=>calls.push('open'),
   readName:async()=>previous,fillName:async value=>{saved=value;calls.push('fill');},save:async()=>calls.push('real-save'),
   recordPersist:async()=>calls.push('checkpoint1'),close:async()=>calls.push('close'),
   expectName:async value=>{assert.equal(value,saved);calls.push('exact-reopen');},resetToPasscode:async()=>calls.push('reset')});
  assert.notEqual(name,previous);assert.match(name,/E2E$/);
  assert.deepEqual(calls,['login','open','fill','real-save','checkpoint1','close','open','exact-reopen','close','reset']);
 }
 for(const failure of['save','expectName']){
  let reset=false;const original=Error('PRECONDITION_REFUSED');
  const driver={login:async()=>{},open:async()=>{},readName:async()=> 'Fixture',fillName:async()=>{},save:async()=>{},
   recordPersist:async()=>{},close:async()=>{},expectName:async()=>{},resetToPasscode:async()=>{reset=true;}};
  driver[failure]=async()=>{throw original;};await assert.rejects(establishCandidateClearSettings(driver),error=>error===original);
  assert.equal(reset,false);
 }
});

test('image observation distinguishes absent, wrong selection, wrong exact src, decoded and nonunique images',()=>{
 const source=readFileSync(new URL('../src/app/drawers/admin/MenuCatalogPane.tsx',import.meta.url),'utf8');
 assert(source.includes('border-pos-primary'));
 const dom=new JSDOM('<button data-testid="menu-edit-card-PRIVATE_ITEM" class="border-pos-primary"></button><div data-testid="menu-editor-detail-pane"><img src="PRIVATE_URL"></div>');
 const before=globalThis.document;globalThis.document=dom.window.document;
 const target={phaseOrdinal:1,itemId:'PRIVATE_ITEM',url:'PRIVATE_URL'};
 try{
  const image=dom.window.document.querySelector('img');Object.defineProperties(image,{complete:{value:true,configurable:true},naturalWidth:{value:20,configurable:true}});
  assert.deepEqual(readCandidateImageDom(target),{phaseOrdinal:1,observed:1,selectionCount:2,selectionMatches:2,imageCount:2,srcMatches:2,decoded:2});
  image.setAttribute('src','OTHER_PRIVATE_URL');assert.equal(readCandidateImageDom(target).srcMatches,1);
  Object.defineProperty(image,'naturalWidth',{value:0});assert.equal(readCandidateImageDom(target).decoded,1);
  dom.window.document.querySelector('button').dataset.testid='menu-edit-card-OTHER';assert.equal(readCandidateImageDom(target).selectionMatches,1);
  image.parentElement.append(image.cloneNode());let row=readCandidateImageDom(target);assert.equal(row.imageCount,3);assert.equal(row.srcMatches,0);assert.equal(row.decoded,0);
  dom.window.document.querySelectorAll('img').forEach(image=>image.remove());row=readCandidateImageDom(target);assert.equal(row.imageCount,1);assert.equal(row.srcMatches,0);assert.equal(row.decoded,0);
 }finally{globalThis.document=before;dom.window.close();}
});

test('failure captures current image state; successful cases discard diagnostics and closed page stays unknown',async()=>{
 for(const status of['failed','timedOut','interrupted','passed']){
  const page=new FakePage(),evaluate=page.evaluate.bind(page);let imageReads=0,state=1;
  page.evaluate=async(fn,target)=>{if(fn!==readCandidateImageDom)return evaluate();imageReads++;assert.equal(target.itemId,'PRIVATE_ITEM');
   return {phaseOrdinal:target.phaseOrdinal,observed:1,selectionCount:2,selectionMatches:2,imageCount:2,srcMatches:state,decoded:state};};
  const diag=new CandidateDiagnostics(page,async()=> 'PRIVATE E2E'),out=capture(4,status);
  diag.expectMenuImage(1,'PRIVATE_ITEM','PRIVATE_URL');state=2;await diag.finish(out.info);
  assert.equal(imageReads,status==='passed'?0:1);assert.equal(out.attachments.length,status==='passed'?0:1);
  if(status!=='passed'){const value=decoded(out);assert(safeCandidateDiagnostic(value,4));assert.equal(value.image.srcMatches,2);assert(!out.attachments[0].body.toString().includes('PRIVATE'));}
  for(const event of['request','requestfailed','response','framenavigated'])assert.equal(page.listenerCount(event),0);
 }
 const page=new FakePage();page.evaluate=async()=>{throw Error('PRIVATE_CLOSED');};
 const diag=new CandidateDiagnostics(page,async()=> 'PRIVATE E2E'),out=capture(4);diag.expectMenuImage(2,'PRIVATE_ITEM','PRIVATE_URL');
 await diag.finish(out.info);assert.deepEqual(decoded(out).image,{phaseOrdinal:2,observed:0,selectionCount:0,selectionMatches:0,imageCount:0,srcMatches:0,decoded:0});
});

test('main-frame reset invalidates passive API and each test owns its persisted comparison baseline',async()=>{
 const page=new FakePage(),first=new CandidateDiagnostics(page,async()=> 'PRIVATE E2E'),out=capture(4);
 const read=request('permission_get_settings_admin');page.emit('request',read);page.emit('response',response(read,'PRIVATE E2E'));await nextTurn();
 await first.checkpoint(1);page.emit('framenavigated',page.mainFrame());page.emit('response',response(read,'PRIVATE E2E'));await nextTurn();
 await first.checkpoint(2);await first.finish(out.info);assert.equal(decoded(out).observations[1].apiReadState,0);
 assert.equal(decoded(out).observations[1].settingsReadPending,0);
 const second=new CandidateDiagnostics(new FakePage(),async()=> 'PRIVATE E2E'),other=capture(6);
 await second.checkpoint(2);await second.finish(other.info);assert.equal(decoded(other).observations[0].dbEqualsPersist,0);
});

test('a delayed response body cannot repopulate private state after diagnostic teardown',async()=>{
 const page=new FakePage(),diag=new CandidateDiagnostics(page,async()=> 'PRIVATE E2E'),out=capture(4,'passed');
 const read=request('permission_get_settings_admin');let release;
 const body=new Promise(resolve=>{release=resolve;});page.emit('request',read);
 page.emit('response',{...response(read,'PRIVATE E2E'),body:async()=>body});
 await diag.finish(out.info);release(Buffer.from(JSON.stringify({ok:true,data:{displayName:'PRIVATE_LATE E2E'}})));await nextTurn();
 assert.equal(diag.apiName,undefined);assert.equal(diag.apiState,0);assert.equal(diag.responseTasks.size,0);
 assert.equal(out.attachments.length,0);assert.equal(page.listenerCount('response'),0);
});

test('stale API response from before settings mutation cannot certify the new generation',async()=>{
 const page=new FakePage(),diag=new CandidateDiagnostics(page,async()=> 'PRIVATE_NEW E2E'),out=capture(4);
 const read=request('permission_get_settings_admin');page.emit('request',read);
 page.emit('request',request('update_store_settings'));page.emit('response',response(read,'PRIVATE_OLD E2E'));await nextTurn();
 await diag.checkpoint(1);await diag.finish(out.info);
 assert.equal(decoded(out).observations[0].apiReadState,0);assert.equal(decoded(out).observations[0].apiEqualsDb,0);
});

test('probe failures and absent milestones remain unknown, original failed test still attaches',async()=>{
 const page=new FakePage();page.evaluate=async()=>{throw new Error('PRIVATE_BROWSER_ERROR');};
 const diag=new CandidateDiagnostics(page,async()=>{throw new Error('PRIVATE_DB_ERROR');}),out=capture(6);out.info.status='failed';
 diag.mark(18);await diag.checkpoint(2);await diag.finish(out.info);
 const value=decoded(out);assert(safeCandidateDiagnostic(value,6));assert.deepEqual(value.observations.map(row=>row.checkpointOrdinal),[2,5]);
 assert.equal(value.observations[0].dbReadState,2);assert.equal(value.observations[0].dbSuffix,0);assert.equal(value.observations[1].drawerCount,0);
 assert(!out.attachments[0].body.toString().includes('PRIVATE_'));assert.equal(page.listenerCount('request'),0);
});
