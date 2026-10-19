import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdir, symlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const exec=promisify(execFile),root=resolve(dirname(fileURLToPath(import.meta.url)),'..');

test('screen-mode CLI binds approved reference/contract, refuses changed gates and evidence overwrite',async()=>{
  const palette=JSON.parse(await readFile(resolve(root,'ui-remake/palette-a-v1.json'),'utf8'));
  const html=await readFile(resolve(root,'ui-remake/fixtures/payment.html'));
  const base=resolve(root,`artifacts/ui-remake/screen-mode-test-${process.pid}-${Date.now()}`);
  await mkdir(base,{recursive:true});
  const fonts=['Regular','Medium','SemiBold','Bold'];
  const css=fonts.map((w,i)=>`@font-face{font-family:"Be Vietnam Pro";font-weight:${[400,500,600,700][i]};src:url(/fonts/${w}.ttf)}`).join('')+`:root{${Object.entries(palette.colors).map(([k,v])=>`${k}:${v}`).join(';')}}`;
  const server=createServer(async(req,res)=>{try{if(req.url==='/theme.css'){res.setHeader('Content-Type','text/css');res.end(css)}else if(['/actual.html','/reference.html'].includes(req.url)){res.setHeader('Content-Type','text/html');res.end(html)}else if(/^\/fonts\/(Regular|Medium|SemiBold|Bold)\.ttf$/.test(req.url)){res.setHeader('Content-Type','font/ttf');res.end(await readFile(resolve(root,'ui-remake/fonts',`BeVietnamPro-${req.url.split('/').pop()}`)))}else{res.writeHead(404);res.end()}}catch{res.writeHead(500);res.end()}});
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  try {
    const origin=`http://127.0.0.1:${server.address().port}`;
    const c={version:1,kind:'screen-remake',title:'SYNTHETIC screen-mode control; no app acceptance',designUrl:'https://stitch.withgoogle.com/projects/synthetic-tool-test',actualSourceRoot:'.',dataMode:'mock',serverRecipe:'in-process synthetic test HTTP server',clock:'2026-10-19T03:00:00Z',referenceFiles:['ui-remake/fixtures/payment.html','ui-remake/run.integration.test.mjs'],cases:[{id:'synthetic',viewport:{width:568,height:320},actual:{url:`${origin}/actual.html`,ready:'main'},reference:{url:`${origin}/reference.html`,ready:'main'},anchors:[{id:'complete',actual:'button',reference:'button'}],criticalSelectors:[{id:'complete',selector:'button'}],thresholds:{channelThreshold:0,maxDiffRatio:0,geometryTolerancePx:0,minTargetPx:44}}]};
    const path=resolve(base,'config.json');
    const run=(args)=>exec(process.execPath,['ui-remake/run.mjs',...args],{cwd:root,windowsHide:true,timeout:60000,maxBuffer:2*1024*1024});
    await writeFile(path,JSON.stringify(c));
    const plan=JSON.parse((await run(['--config',path,'--plan'])).stdout);
    assert.equal(plan.status,'PLAN_ONLY');
    c.referenceApproval={by:'synthetic control, not an owner approval',at:'2026-10-19T03:00:00Z',sourceSha256:plan.referenceSourceSha256,contractSha256:plan.contractSha256};
    await writeFile(path,JSON.stringify(c));
    const output=resolve(base,'measurement');
    const good=await run(['--config',path,'--out',output]);
    assert.match(good.stdout,/MEASUREMENT PASS/);
    const report=JSON.parse(await readFile(resolve(output,'report.json'),'utf8'));
    assert.equal(report.kind,'screen-remake');assert.equal(report.productAcceptance,'NOT_ASSESSED');assert.equal(report.cases[0].pixels.differentPixels,0);assert.equal(report.referenceSourceSha256,plan.referenceSourceSha256);
    await assert.rejects(run(['--config',path,'--out',output]),error=>error.code===2&&/refusing to overwrite/.test(error.stderr));
    const linkTarget=resolve(base,'link-target');await mkdir(linkTarget);await symlink(linkTarget,resolve(base,'output-alias'),'junction');
    await assert.rejects(run(['--config',path,'--out',resolve(base,'output-alias','must-not-write')]),error=>error.code===2&&/symlink\/junction/.test(error.stderr));
    assert.equal(existsSync(resolve(linkTarget,'must-not-write')),false);
    c.cases[0].thresholds.maxDiffRatio=.1;await writeFile(path,JSON.stringify(c));
    await assert.rejects(run(['--config',path,'--out',resolve(base,'must-not-exist')]),error=>error.code===2&&/NOT_APPROVED/.test(error.stderr));
    assert.equal(existsSync(resolve(base,'must-not-exist')),false);
    console.log(`retained synthetic integration evidence: ${base}`);
  }finally{await new Promise(done=>server.close(done))}
});
