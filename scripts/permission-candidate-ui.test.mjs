import test from 'node:test';
import assert from 'node:assert/strict';
import {EventEmitter} from 'node:events';
import {setImmediate as nextTurn} from 'node:timers/promises';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {closeCandidateDrawer,waitForCandidateSave} from '../tests/supabase/permissionCandidateUi.ts';
import {CandidateDiagnostics,diagnosticFields,readCandidateDom} from '../tests/supabase/permissionCandidateDiagnostics.ts';
import {CANDIDATE_CHECKPOINT_BOUNDS,CANDIDATE_TEST_NAMES,safeCandidateDiagnostic} from './permission-runtime-candidate-diagnostic.mjs';

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
 async evaluate(){return {drawerCount:2,inputCount:2,drawerVisible:2,inputVisible:2,inputSuffix:2,inputEqualsPreclear:0,
  sectionOrdinal:1,cancelDialog:1,dirty:1,savePending:1,queryState:0};}
}
const capture=ordinal=>{const attachments=[];return{attachments,info:{title:CANDIDATE_TEST_NAMES[ordinal-1],status:'passed',attach:async(name,value)=>attachments.push({name,...value})}};};
const decoded=capture=>JSON.parse(capture.attachments[0].body.toString());
const request=name=>({url:()=>`http://127.0.0.1:62421/rest/v1/rpc/${name}`});
const response=(request,name)=>({url:request.url,request:()=>request,ok:()=>true,body:async()=>Buffer.from(JSON.stringify({ok:true,data:{displayName:name}}))});

test('checkpoint producer and reporter agree on every finite field',()=>{
 assert.deepEqual([...diagnosticFields].sort(),Object.keys(CANDIDATE_CHECKPOINT_BOUNDS).sort());
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
 await clear.checkpoint(2);dbName=changed;await clear.checkpoint(3);await clear.checkpoint(4);await clear.finish(out.info);
 const value=decoded(out);assert(safeCandidateDiagnostic(value,6));
 assert.equal(value.observations[0].apiReadState,0);assert.equal(value.observations[0].dbEqualsPersist,2);
 assert.equal(value.observations[1].dbEqualsPersist,1);assert.equal(value.observations[2].dbEqualsPreclear,2);
 for(const item of [persist,out])assert(!item.attachments[0].body.toString().includes('PRIVATE_SENTINEL'));
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
