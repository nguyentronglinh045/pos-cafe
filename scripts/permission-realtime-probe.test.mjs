import test from 'node:test';
import assert from 'node:assert/strict';
import {runInNewContext} from 'node:vm';
import {installPermissionTimingProbe} from './permission-realtime-probe.mjs';
function fixture(){
 class Socket{constructor(){this.listeners={};}addEventListener(name,fn){(this.listeners[name]??=[]).push(fn);}send(){}emit(name,event={}){for(const fn of this.listeners[name]??[])fn(event);}}
 let clock=0;const document={visibilityState:'visible',addEventListener(){},querySelector:()=>null};
 const window={WebSocket:Socket,fetch:async()=>({ok:true,text:async()=>'ok',json:async()=>({ok:true})}),addEventListener(){}};
 runInNewContext('('+installPermissionTimingProbe.toString()+')({storeId:"store-1"})',{window,document,performance:{now:()=>++clock},Request:class{},MutationObserver:class{observe(){}}});
 const state=window.permissionTimingProbe,socket=()=>new window.WebSocket('ws://synthetic.invalid');
 const topic=(kind,generation='1')=>'realtime:permission-'+kind+'-store-1-'+generation;
 const binding=kind=>({id:kind==='store'?11:22,event:'*',schema:'public',table:kind==='store'?'store_change_signals':'permission_catalog_signals',...(kind==='store'?{filter:'store_id=eq.store-1'}:{})});
 const frame=(kind,ref,event,payload,generation='1')=>JSON.stringify([ref,['phx_reply','phx_join'].includes(event)?ref:null,topic(kind,generation),event,payload]);
 const join=(ws,kind,ref,generation)=>ws.send(frame(kind,ref,'phx_join',{},generation));
 const ack=(ws,kind,ref,generation,bindings=[binding(kind)])=>ws.emit('message',{data:frame(kind,ref,'phx_reply',{status:'ok',response:{postgres_changes:bindings}},generation)});
 const system=(ws,kind,ref,extension,message,status='ok',generation)=>ws.emit('message',{data:frame(kind,ref,'system',{extension,message,status},generation)});
 const ready=(ws,kind,ref,generation)=>{ack(ws,kind,ref,generation);system(ws,kind,ref,'postgres_changes','Subscribed to PostgreSQL','ok',generation);system(ws,kind,ref,'system','Replication connection established','ok',generation);};
 const signal=(ws,{kind='store',joinRef=null,generation='1',ids=[kind==='store'?11:22],schema='public',table=kind==='store'?'store_change_signals':'permission_catalog_signals',store_id='store-1',topic:rowTopic='permission',onDrop=()=>{}}={})=>ws.emit('message',{data:frame(kind,joinRef,'postgres_changes',{ids,data:{schema,table,record:{store_id,topic:rowTopic,revision:'7',target_id:'target'}}},generation),stopImmediatePropagation:onDrop});
 return{state,socket,join,ack,system,ready,frame,topic,binding,signal};
}
test('join ACKs cannot open readiness; both permission channels need PostgreSQL and WAL readiness',()=>{
 const f=fixture(),ws=f.socket();for(const kind of['store','catalog']){f.join(ws,kind,kind);f.ack(ws,kind,kind);}
 assert.equal(f.state.ready.store,false);assert.equal(f.state.ready.catalog,false);assert.equal(f.state.resumes.length,0);
 f.ready(ws,'store','store');assert.equal(f.state.ready.store,true);assert.equal(f.state.ready.catalog,false);
 f.system(ws,'catalog','catalog','system','Replication connection established');assert.equal(f.state.ready.catalog,false);
 f.system(ws,'catalog','catalog','postgres_changes','Subscribed to PostgreSQL');assert.equal(f.state.ready.catalog,true);assert.equal(f.state.resumes.length,0);
});
test('the initial barrier cannot mix sockets or subscription suffix generations; channel join references remain independent',()=>{
 const f=fixture(),first=f.socket(),second=f.socket();
 f.join(first,'store','s');f.ready(first,'store','s');f.join(second,'catalog','c');f.ready(second,'catalog','c');
 assert.equal(f.state.ready.store,false);assert.equal(f.state.ready.catalog,false);
 f.join(first,'catalog','different-ref');f.ready(first,'catalog','different-ref');
 assert.equal(f.state.ready.store,true);assert.equal(f.state.ready.catalog,true);
 f.join(first,'store','s2','2');f.ready(first,'store','s2','2');
 assert.equal(f.state.ready.store,false);assert.equal(f.state.ready.catalog,false);
 f.join(first,'catalog','c2','2');f.ready(first,'catalog','c2','2');
 assert.equal(f.state.ready.store,true);assert.equal(f.state.ready.catalog,true);
});
test('new join invalidates readiness immediately; stale join references cannot restore it or count another initial topic as rejoin',()=>{
 const f=fixture(),ws=f.socket();f.join(ws,'store','old');f.ready(ws,'store','old');assert.equal(f.state.ready.store,true);
 f.join(ws,'store','new');assert.equal(f.state.ready.store,false);f.ready(ws,'store','old');assert.equal(f.state.ready.store,false);
 f.ready(ws,'store','new');assert.equal(f.state.ready.store,true);assert.equal(f.state.resumes.length,1);
 f.ack(ws,'store','new');assert.equal(f.state.resumes.length,1);
});
test('socket close and error clear readiness; stale socket events cannot restore or clear its replacement',()=>{
 const f=fixture(),old=f.socket();f.join(old,'store','1');f.ready(old,'store','1');old.emit('close');assert.equal(f.state.ready.store,false);
 f.ready(old,'store','1');assert.equal(f.state.ready.store,false);
 const next=f.socket();f.join(next,'store','1');f.ready(next,'store','1');assert.equal(f.state.ready.store,true);
 old.emit('close');f.ready(old,'store','1');f.signal(old);assert.equal(f.state.ready.store,true);assert.equal(f.state.signals.length,0);
 next.emit('error');assert.equal(f.state.ready.store,false);f.ready(next,'store','1');assert.equal(f.state.ready.store,false);
});
test('WAL terminal error or timeout invalidates the generation until a fresh outgoing join',()=>{
 for(const status of['error','timeout']){
  const f=fixture(),ws=f.socket();f.join(ws,'store','1');f.ready(ws,'store','1');
  f.system(ws,'store','1','system','Replication connection established',status);assert.equal(f.state.ready.store,false);
  f.ready(ws,'store','1');f.signal(ws);assert.equal(f.state.ready.store,false);assert.equal(f.state.signals.length,0);
  f.join(ws,'store','2');f.ready(ws,'store','1');assert.equal(f.state.ready.store,false);
  f.ready(ws,'store','2');assert.equal(f.state.ready.store,true);
 }
});
test('PostgreSQL subscription errors can recover on the same current generation',()=>{
 const f=fixture(),ws=f.socket();f.join(ws,'store','1');f.ready(ws,'store','1');
 f.system(ws,'store','1','postgres_changes','subscription retry','error');assert.equal(f.state.ready.store,false);
 f.system(ws,'store','1','postgres_changes','Subscribed to PostgreSQL');assert.equal(f.state.ready.store,true);
});
test('ACK requires the expected subscription ID, schema, table and store filter before readiness or signals',()=>{
 const f=fixture(),ws=f.socket();f.join(ws,'store','1');
 for(const bindings of[[],[{...f.binding('store'),id:-1}],[{...f.binding('store'),id:2**32}],[{...f.binding('store'),schema:'private'}],[{...f.binding('store'),table:'permission_catalog_signals'}],[{...f.binding('store'),filter:'store_id=eq.other'}]]){
  f.ack(ws,'store','1',undefined,bindings);f.system(ws,'store','1','postgres_changes','Subscribed to PostgreSQL');f.system(ws,'store','1','system','Replication connection established');f.signal(ws);
  assert.equal(f.state.ready.store,false);assert.equal(f.state.signals.length,0);
 }
 f.ack(ws,'store','1');assert.equal(f.state.ready.store,true);
});
test('only active acknowledged channel signals are captured; null join_ref is valid and controlled loss precedes app delivery',()=>{
 const f=fixture(),ws=f.socket();let dropped=0;f.state.blockSignals=true;
 const send=options=>f.signal(ws,{onDrop:()=>dropped++,...options});
 send();assert.equal(f.state.signals.length,0);f.join(ws,'store','1');send();assert.equal(f.state.signals.length,0);f.ready(ws,'store','1');
 for(const options of[{joinRef:'stale'},{ids:[999]},{schema:'private'},{table:'permission_catalog_signals'},{store_id:'other'},{topic:'orders'}])send(options);
 assert.equal(f.state.signals.length,0);assert.equal(dropped,0);
 send();assert.equal(f.state.signals.length,1);assert.equal(f.state.signals[0].revision,7);assert.equal(f.state.signals[0].dropped,true);assert.equal(dropped,1);
 f.state.blockSignals=false;send({joinRef:'1'});assert.equal(f.state.signals[1].dropped,false);assert.equal(dropped,1);
 ws.send(f.frame('store','1','phx_leave',{}));send();assert.equal(f.state.signals.length,2);assert.equal(f.state.ready.store,false);
 f.join(ws,'store','2');send({joinRef:'1'});send();assert.equal(f.state.signals.length,2);
 f.ready(ws,'store','2');send();assert.equal(f.state.signals.length,3);
 f.join(ws,'catalog','c');f.ready(ws,'catalog','c');send({kind:'catalog'});assert.equal(f.state.signals.length,4);assert.equal(f.state.signals[3].table,'permission_catalog_signals');
});
test('object protocol frames require matching join and request references; server close invalidates the topic',()=>{
 const f=fixture(),ws=f.socket(),topic=f.topic('store');
 const frame=(event,payload,join_ref='j',ref=event==='phx_reply'?'r':null)=>JSON.stringify({join_ref,ref,topic,event,payload});
 ws.send(frame('phx_join',{},'j','r'));
 for(const[event,payload]of[['phx_reply',{status:'ok',response:{postgres_changes:[f.binding('store')]}}],['system',{status:'ok',extension:'postgres_changes',message:'Subscribed to PostgreSQL'}],['system',{status:'ok',extension:'system',message:'Replication connection established'}]]){
  ws.emit('message',{data:frame(event,payload,'stale')});assert.equal(f.state.ready.store,false);
  if(event==='phx_reply'){ws.emit('message',{data:frame(event,payload,'j','wrong')});assert.equal(f.state.subscriptions,0);}
  ws.emit('message',{data:frame(event,payload)});
 }
 assert.equal(f.state.ready.store,true);ws.emit('message',{data:frame('phx_error',{})});assert.equal(f.state.ready.store,false);f.signal(ws);assert.equal(f.state.signals.length,0);
});
test('unrelated store channels and noncanonical subscription suffixes never satisfy readiness',()=>{
 const f=fixture(),ws=f.socket();
 for(const topic of['realtime:permission-store-other-store-1',...['0','01','-1','1junk','9007199254740992'].map(g=>f.topic('store',g))]){
  ws.send(JSON.stringify(['x','x',topic,'phx_join',{}]));
  for(const[event,payload]of[['phx_reply',{status:'ok',response:{postgres_changes:[f.binding('store')]}}],['system',{status:'ok',extension:'postgres_changes',message:'Subscribed to PostgreSQL'}],['system',{status:'ok',extension:'system',message:'Replication connection established'}]])
   ws.emit('message',{data:JSON.stringify(['x',event==='phx_reply'?'x':null,topic,event,payload])});
 }
 assert.equal(f.state.ready.store,false);assert.equal(f.state.ready.catalog,false);
});
