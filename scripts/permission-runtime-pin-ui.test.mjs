import test from'node:test';import assert from'node:assert/strict';import{crc32,deflateSync}from'node:zlib';
import{PIN_UI_VIEWPORTS,pinPngFacts,pinUiManifest,validatePinUiManifest}from'./permission-runtime-pin-ui.mjs';import{hash}from'./project-ci-results.mjs';
import{pinUiActionRoot,PIN_UI_ACTION_SHA}from'./permission-pin-ui-policy.mjs';
const h='a'.repeat(64),binding={sourceSHA:'b'.repeat(40),sourceFingerprint:h,lockSHA:h,runId:'123',attempt:1},files={runnerSHA256:h,fixtureSHA256:h,configSHA256:h,detectorSHA256:h};
function chunk(type,data){const b=Buffer.alloc(data.length+12);b.writeUInt32BE(data.length);b.write(type,4);data.copy(b,8);b.writeUInt32BE(crc32(b.subarray(4,data.length+8)),data.length+8);return b;}
function png(v,extra=[]){const head=Buffer.alloc(13);head.writeUInt32BE(v.width);head.writeUInt32BE(v.height,4);head[8]=8;head[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),...extra,chunk('IDAT',deflateSync(Buffer.alloc((v.width*4+1)*v.height))),chunk('IEND',Buffer.alloc(0))]);}
function fixture(){const images=PIN_UI_VIEWPORTS.map(v=>({filename:'required_pin_change__'+v.name+'.png',bytes:png(v)}));
 const proofs=PIN_UI_VIEWPORTS.map((v,i)=>({state:'required-pin-change',viewport:v.name,width:v.width,height:v.height,filename:images[i].filename,bytes:images[i].bytes.length,
  sha256:hash(images[i].bytes),credentialFreeMock:true,passwordInputsEmpty:true,maskedPasswordInputs:2,annotatedFindings:0}));return{images,proofs};}
test('action download accounting uses only the fixed owned GitHub action path, never caller path escapes',()=>{
 assert.equal(pinUiActionRoot('/home/runner/work/pos-cafe/pos-cafe'),'/home/runner/work/_actions/actions/upload-artifact/'+PIN_UI_ACTION_SHA);
 for(const p of['relative','/home/x/../pos-cafe/pos-cafe','/home/other','/home/pos-cafe/pos-cafe\n','C:\\pos-cafe'])assert.throws(()=>pinUiActionRoot(p));
});
test('safe PIN evidence has exactly three source-bound masked images, remains unclassified and excludes raw findings text',()=>{
 const{images,proofs}=fixture(),f={target:'required-pin-change',viewport:'desktop',rule:'tiny-target',severity:'warn',known:true,key:'fixed-selector',rect:{x:1,y:2,w:3,h:4},label:'SECRET',detail:'SECRET'};
 proofs[0].annotatedFindings=1;const{r,json}=pinUiManifest(binding,proofs,images,[f],h,files,true);
 assert.equal(r.photos.length,3);assert.equal(r.visualReview,'NOT_RUN');assert.equal(r.photos[0].photoInspected,false);assert.equal(json.includes('SECRET'),false);
 assert.equal(validatePinUiManifest(r,binding,images,h,files),r);assert.equal(r.photos[0].findingIds[0],r.findings[0].id);
 const unknown=structuredClone(r);unknown.findings[0].known=false;unknown.findings[0].severity='error';
 assert.throws(()=>validatePinUiManifest(unknown,binding,images,h,files));
 unknown.auditStatus='FAIL_REVIEW_REQUIRED';assert.equal(validatePinUiManifest(unknown,binding,images,h,files),unknown);
 assert.throws(()=>pinUiManifest(binding,proofs,images,[{...f,known:false,severity:'error'}],h,files,true));
});
test('PNG boundary refuses metadata payloads, bad CRC, trailers and wrong pixel dimensions',()=>{
 const v=PIN_UI_VIEWPORTS[0],good=png(v);assert.deepEqual(pinPngFacts(good,v),{width:v.width,height:v.height});
 const badCRC=Buffer.from(good);badCRC[35]^=1;
 for(const bad of[png(v,[chunk('tEXt',Buffer.from('SECRET'))]),badCRC,Buffer.concat([good,Buffer.from('SECRET')]),png({...v,width:v.width+1})])assert.throws(()=>pinPngFacts(bad,v));
});
test('producer and independent public boundary reject unknown fields, source confusion, unmasked/missing photos and invented review claims',()=>{
 const{images,proofs}=fixture(),{r}=pinUiManifest(binding,proofs,images,[],h,files,true);
 for(const edit of[p=>p[0].maskedPasswordInputs=0,p=>p[0].credentialFreeMock=false,p=>p[0].filename='private-tc18.png',p=>p.pop(),p=>p[0].raw='SECRET']){
  const a=structuredClone(proofs);edit(a);assert.throws(()=>pinUiManifest(binding,a,images,[],h,files,true));}
 for(const edit of[m=>m.raw='SECRET',m=>m.sourceSHA='c'.repeat(40),m=>m.photos[0].photoInspected=true,m=>m.photos[0].classifications='PASS',
  m=>m.photos[0].raw='SECRET',m=>m.photos[0].bytes++,m=>m.photos[0].imageWidth++,m=>m.canonicalArgv=['node','ui-audit/run.mjs'],m=>m.baselineSHA256='c'.repeat(64)]){
  const a=structuredClone(r);edit(a);assert.throws(()=>validatePinUiManifest(a,binding,images,h,files));}
});
