// Self-contained so Playwright can serialize this function into each browser.
export function installPermissionTimingProbe({storeId}) {
  const state={blockSignals:false,subscriptions:0,ready:{store:false,catalog:false},resumes:[],signals:[],nav:[],requests:[]};
  window.permissionTimingProbe=state;
  const active=new Map(),joinedTopics=new Set();
  const channelOf=topic=>{
    for(const kind of['store','catalog']){
      const prefix=`realtime:permission-${kind}-${storeId}-`;
      if(typeof topic==='string'&&topic.startsWith(prefix)){
        const generation=topic.slice(prefix.length);
        if(/^[1-9][0-9]*$/.test(generation)&&Number.isSafeInteger(Number(generation)))return{kind,generation};
      }
    }
    return null;
  };
  const refresh=()=>{
    const store=active.get('store'),catalog=active.get('catalog');
    const coherent=!store||!catalog||(store.socket===catalog.socket&&store.generation===catalog.generation);
    for(const kind of['store','catalog']){const item=active.get(kind);state.ready[kind]=!!(coherent&&item?.joined&&item.pgReady&&item.walReady);}
  };
  const bindingIds=(kind,bindings)=>bindings.filter(binding=>Number.isInteger(binding?.id)&&binding.id>=0&&binding.id<=0xffffffff
    &&binding.event==='*'&&binding.schema==='public'
    &&binding.table===(kind==='store'?'store_change_signals':'permission_catalog_signals')
    &&(kind==='store'?binding.filter===`store_id=eq.${storeId}`:binding.filter==null)).map(binding=>binding.id);
  const decode=data=>{
    if(typeof data!=='string')return null;
    try{const message=JSON.parse(data);return Array.isArray(message)
      ?{joinRef:message[0],ref:message[1],topic:message[2],event:message[3],payload:message[4]}
      :{joinRef:message.join_ref,ref:message.ref,topic:message.topic,event:message.event,payload:message.payload};}catch{return null;}
  };
  const NativeWebSocket=window.WebSocket;
  window.WebSocket=class extends NativeWebSocket{
    constructor(url,protocols){
      super(url,protocols);this.probeJoins=new Map();this.probeAlive=true;
      const invalidate=()=>{this.probeAlive=false;this.probeJoins.clear();for(const[kind,item]of active)if(item.socket===this)active.delete(kind);refresh();};
      this.addEventListener('close',invalidate);this.addEventListener('error',invalidate);
      this.addEventListener('message',event=>{
        const message=decode(event.data);if(!message||!this.probeAlive)return;
        const{joinRef,ref,topic,event:name,payload}=message,item=this.probeJoins.get(topic),channel=channelOf(topic),kind=channel?.kind;
        if(!kind||!item||active.get(kind)!==item)return;
        if(item&&joinRef===item.joinRef){
          if(name==='phx_reply'&&ref===item.ref&&payload?.status==='ok'&&Array.isArray(payload.response?.postgres_changes)&&!item.joined){
            item.bindingIds=bindingIds(kind,payload.response.postgres_changes);
            if(item.bindingIds.length){
              if(joinedTopics.has(topic))state.resumes.push({time:performance.now(),event:'realtime-rejoin'});
              joinedTopics.add(topic);item.joined=true;state.subscriptions++;
            }
          }
          if(name==='system'){
            if(payload?.extension==='postgres_changes')item.pgReady=payload.status==='ok'&&payload.message==='Subscribed to PostgreSQL';
            if(payload?.extension==='system'){
              item.walReady=payload.status==='ok'&&payload.message==='Replication connection established';
              if(payload.status==='error'||payload.status==='timeout'){active.delete(kind);this.probeJoins.delete(topic);}
            }
          }
          if(name==='phx_close'||name==='phx_error'){active.delete(kind);this.probeJoins.delete(topic);}
          refresh();
        }
        const data=payload?.data,row=data?.record;
        if(name!=='postgres_changes'||!item.joined||!row||(joinRef!=null&&joinRef!==item.joinRef)
          ||data.schema!=='public'||data.table!==(kind==='store'?'store_change_signals':'permission_catalog_signals')
          ||!Array.isArray(payload.ids)||!payload.ids.some(id=>item.bindingIds.includes(id)))return;
        if(kind==='store'&&(row.topic!=='permission'||row.store_id!==storeId))return;
        state.signals.push({time:performance.now(),table:data.table,revision:Number(row.revision),targetId:row.target_id??null,dropped:state.blockSignals});
        // Controlled transport loss occurs before the app's message listener.
        if(state.blockSignals)event.stopImmediatePropagation();
      });
    }
    send(data){
      const message=decode(data);
      if(message&&typeof message.topic==='string'){
        const{joinRef,ref,topic,event}=message,channel=channelOf(topic),kind=channel?.kind;
        if(kind&&event==='phx_join'&&typeof joinRef==='string'&&joinRef&&typeof ref==='string'&&ref){
          const item={socket:this,topic,generation:channel.generation,joinRef,ref,joined:false,pgReady:false,walReady:false,bindingIds:[]};this.probeJoins.set(topic,item);
          active.set(kind,item);refresh();
        }else if(event==='phx_leave'){
          const item=this.probeJoins.get(topic);
          if(item&&joinRef===item.joinRef){if(active.get(kind)===item)active.delete(kind);this.probeJoins.delete(topic);refresh();}
        }
      }
      return super.send(data);
    }
  };
  const originalFetch=window.fetch.bind(window);
  window.fetch=async(...args)=>{
    const url=String(args[0] instanceof Request?args[0].url:args[0]);
    const name=/\/rpc\/(permission_get_revision|permission_get_authority)(?:\?|$)/.exec(url)?.[1],start=performance.now();
    const response=await originalFetch(...args);
    if(name){const originalText=response.text.bind(response),originalJson=response.json.bind(response);
      const finished=()=>state.requests.push({name,start,end:performance.now(),ok:response.ok});
      response.text=async()=>{const body=await originalText();finished();return body;};
      response.json=async()=>{const body=await originalJson();finished();return body;};}
    return response;
  };
  for(const event of['focus','online'])window.addEventListener(event,()=>state.resumes.push({time:performance.now(),event}));
  document.addEventListener('visibilitychange',()=>state.resumes.push({time:performance.now(),event:`visibility:${document.visibilityState}`}));
  let previous;const observer=new MutationObserver(()=>{const present=document.querySelector('[data-testid="nav-report"]')!==null;
    if(present!==previous){previous=present;state.nav.push({time:performance.now(),present});}});
  observer.observe(document,{childList:true,subtree:true});
}
