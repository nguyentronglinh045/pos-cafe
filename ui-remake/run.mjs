import { readFile, writeFile, mkdir, stat, realpath, lstat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, relative, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { platform, release, arch } from 'node:os';
import { validateConfig, expandConfig, within, MAX_ARTIFACT_BYTES } from './config.mjs';
import { compareAnchors } from './metrics.mjs';
import { observePage, stabilizePage } from './capture.mjs';

const here = dirname(fileURLToPath(import.meta.url)), root = resolve(here, '..');
const hash = data => createHash('sha256').update(data).digest('hex');
const readJson = async path => JSON.parse((await readFile(path, 'utf8')).replace(/^\uFEFF/, ''));
const selector = value => value.startsWith('@') ? `[data-testid=${JSON.stringify(value.slice(1))}]` : value;

export function contractDigest(cfg, referenceSourceSha256) {
  return hash(JSON.stringify({kind:cfg.kind,designUrl:cfg.designUrl,referenceSourceSha256,clock:cfg.clock,browser:cfg.browser || 'chromium',actualSourceRoot:cfg.actualSourceRoot,dataMode:cfg.dataMode,serverRecipe:cfg.serverRecipe,cases:cfg.cases}));
}

export function assertApproved(cfg, referenceSourceSha256, contractSha256) {
  const a = cfg.referenceApproval;
  if (!a || typeof a.by !== 'string' || !a.by.trim() || !Number.isFinite(Date.parse(a.at)) || a.sourceSha256 !== referenceSourceSha256 || a.contractSha256 !== contractSha256) throw new Error('REFERENCE_NOT_APPROVED: approve normalized source and measurement contract hashes from --plan');
}

async function fileRecord(path, base = root) {
  const full = within(base, path), physical = await realpath(full);
  within(base, physical);
  if ((await stat(full)).size > 64 * 1024 * 1024) throw new Error('Source member exceeds 64 MiB read budget');
  const bytes = await readFile(full);
  return { path: relative(base, full).split(sep).join('/'), bytes: bytes.length, sha256: hash(bytes) };
}

async function sourceManifest(base = root) {
  const files = execFileSync('git', ['ls-files', '-co', '--exclude-standard', '-z'], { cwd: base, maxBuffer: 8 * 1024 * 1024 }).toString().split('\0').filter(Boolean);
  if (files.length > 10000) throw new Error('Source manifest exceeds 10000 members');
  const records = [];
  let total = 0;
  for (const path of [...new Set(files)].sort()) { const record = existsSync(within(base,path)) ? await fileRecord(path, base) : {path,bytes:0,sha256:null,deleted:true}; total += record.bytes; if (total > 256 * 1024 * 1024) throw new Error('Source manifest exceeds 256 MiB budget'); records.push(record); }
  return { head: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: base }).toString().trim(), dirty:!!execFileSync('git',['status','--porcelain','--untracked-files=normal'],{cwd:base}).toString().trim(), files: records, sha256: hash(JSON.stringify(records)) };
}

async function serve(palette) {
  const fontFiles = ['BeVietnamPro-Regular.ttf', 'BeVietnamPro-Medium.ttf', 'BeVietnamPro-SemiBold.ttf', 'BeVietnamPro-Bold.ttf'];
  const css = fontFiles.map((name, i) => `@font-face{font-family:"Be Vietnam Pro";font-style:normal;font-weight:${[400,500,600,700][i]};font-display:block;src:url("/fonts/${name}") format("truetype")}`).join('\n') + `\n:root{${Object.entries(palette.colors).map(([k,v]) => `${k}:${v}`).join(';')};--font:"Be Vietnam Pro",sans-serif}`;
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, 'http://127.0.0.1');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Cache-Control', 'no-store');
      if (url.pathname === '/theme.css') { res.setHeader('Content-Type', 'text/css'); res.end(css); return; }
      let path, type;
      if (url.pathname === '/metrics.mjs') { path = resolve(here, 'metrics.mjs'); type = 'text/javascript'; }
      else if (url.pathname === '/fixtures/payment.html') { path = resolve(here, 'fixtures/payment.html'); type = 'text/html; charset=utf-8'; }
      else if (fontFiles.includes(url.pathname.slice('/fonts/'.length)) && url.pathname.startsWith('/fonts/')) { path = resolve(here, 'fonts', url.pathname.slice(7)); type = 'font/ttf'; }
      else { res.writeHead(404); res.end('Not found'); return; }
      res.setHeader('Content-Type', type); res.end(await readFile(path));
    } catch { res.writeHead(500); res.end('Fixture resource failed'); }
  });
  await new Promise((yes, no) => { server.once('error', no); server.listen(0, '127.0.0.1', yes); });
  return { origin: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((yes, no) => server.close(error => error ? no(error) : yes())) };
}

async function loadPlaywright() {
  // A caller may explicitly reuse an already installed, compatible checkout.
  // This is never downloaded or resolved from user data in a config file.
  return import(process.env.UI_REMAKE_PLAYWRIGHT_MODULE || 'playwright');
}

async function runSteps(page, steps = []) {
  for (const step of steps) {
    const locator = page.locator(selector(step.selector));
    await locator.waitFor({ state: 'visible', timeout: 15000 });
    if (await locator.count() !== 1) throw new Error(`Ambiguous step selector: ${step.selector}`);
    if (step.action === 'click') await locator.click();
    else if (step.action === 'fill') await locator.fill(step.value);
    else if (step.action === 'scrollIntoView') await locator.scrollIntoViewIfNeeded();
  }
}

async function tokenReport(page, palette) {
  return page.evaluate(colors => {
    const context = document.createElement('canvas').getContext('2d');
    const canon = value => { context.fillStyle = '#010203'; context.fillStyle = value; return context.fillStyle.toLowerCase(); };
    const computed = getComputedStyle(document.documentElement);
    const entries = Object.entries(colors).map(([token, expected]) => {
      const actual = computed.getPropertyValue(token).trim();
      return { token, expected, actual, pass: !!actual && canon(actual) === canon(expected) };
    });
    return { pass: entries.every(e => e.pass), checked: entries.length, matched: entries.filter(e => e.pass).length, entries };
  }, palette.colors);
}

async function capture(browser, item, target, side, palette, fixtureOrigin, clock) {
  const context = await browser.newContext({ viewport: item.viewport, deviceScaleFactor: 1, locale: 'vi-VN', timezoneId: 'Asia/Ho_Chi_Minh', colorScheme: 'light', reducedMotion: 'reduce', serviceWorkers: 'block' });
  try {
    const page = await context.newPage();
    await context.route('**/*', route => {
      const url = new URL(route.request().url());
      return ['localhost','127.0.0.1','[::1]'].includes(url.hostname) ? route.continue() : route.abort('blockedbyclient');
    });
    await page.clock.setFixedTime(new Date(clock));
    const targetUrl = target.url.startsWith('fixture:') ? `${fixtureOrigin}/fixtures/payment.html${new URL(target.url).search}` : target.url;
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await runSteps(page, target.steps);
    if (target.normalizationCss) {
      if (side !== 'reference') throw new Error('Normalization overrides are reference-only');
      await page.addStyleTag({ content: await readFile(within(root, target.normalizationCss), 'utf8') });
    }
    await stabilizePage(page, { readySelector: selector(target.ready) });
    const observed = await observePage(page, { anchors: item.anchors.map(a => ({ id: a.id, selector: selector(a[side]) })), criticalSelectors: item.criticalSelectors.map(a => ({ ...a, selector: selector(side === 'reference' ? a.reference || a.selector : a.selector) })), minTargetPx: item.thresholds.minTargetPx, requiredFont: palette.fontFamily });
    const tokens = await tokenReport(page, palette);
    const screenshot = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
    await page.evaluate(() => new Promise(requestAnimationFrame));
    const repeated = await page.screenshot({ type: 'png', animations: 'disabled', caret: 'hide' });
    if (!screenshot.equals(repeated)) throw new Error(`UNSTABLE_CAPTURE: ${side}/${item.id}; freeze changing data before measuring`);
    return { screenshot, observed, tokens, url: targetUrl, screenshotSha256: hash(screenshot) };
  } finally { await context.close(); }
}

async function imageComparison(page, actual, expected, item, moduleUrl) {
  return page.evaluate(async ({ a, e, item, moduleUrl }) => {
    const { comparePixels } = await import(moduleUrl);
    async function pixels(data) {
      const img = new Image(); img.src = `data:image/png;base64,${data}`; await img.decode();
      if (img.width !== item.viewport.width || img.height !== item.viewport.height) throw new Error('Screenshot dimensions differ from CSS viewport/DPR1');
      const canvas = document.createElement('canvas'); canvas.width = img.width; canvas.height = img.height;
      const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0); return ctx.getImageData(0,0,img.width,img.height).data;
    }
    const result = comparePixels(await pixels(a), await pixels(e), item.viewport.width, item.viewport.height, { channelThreshold: item.thresholds.channelThreshold, maxDiffRatio: item.thresholds.maxDiffRatio, regions: item.regions || [] });
    function png(rgba) { const canvas = document.createElement('canvas'); canvas.width = result.width; canvas.height = result.height; canvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(rgba), result.width, result.height), 0, 0); return canvas.toDataURL('image/png').split(',')[1]; }
    const { diffRgba, overlayRgba, ...metrics } = result;
    return { ...metrics, diffPng: png(diffRgba), overlayPng: png(overlayRgba) };
  }, { a: actual.toString('base64'), e: expected.toString('base64'), item, moduleUrl });
}

function markdown(report) {
  const lines = [`# ${report.title}`, '', `Scope: **${report.kind}**. Measurement status: **${report.status}**. Product acceptance: **NOT_ASSESSED**.`, '', 'Pixel difference is a count of differing pixels, not a percentage of design accuracy.', '', '| case | measurement | control expectation | diff pixels / all | max geometry px | tokens | responsive | font |', '| --- | --- | --- | --- | --- | --- | --- | --- |'];
  for (const c of report.cases) lines.push(`| ${c.id} | ${c.status} | ${c.selftestExpectation || 'n/a'} | ${c.pixels ? `${c.pixels.differentPixels}/${c.pixels.totalPixels}` : 'NOT_RUN'} | ${c.geometry?.maxGeometryDeltaPx ?? 'NOT_RUN'} | ${c.actual?.tokens ? `${c.actual.tokens.matched}/${c.actual.tokens.checked}` : 'NOT_RUN'} | ${c.actual?.observed.responsive.pass ?? 'NOT_RUN'} | ${c.actual?.observed.font.pass ?? 'NOT_RUN'} |`);
  lines.push('', 'All required app audit, business, permission and owner-acceptance gates remain NOT_ASSESSED by this runner.', '', `Source manifest SHA-256: \`${report.source.sha256}\``, `Reference input SHA-256: \`${report.referenceSourceSha256}\``, '', '## Images and details');
  for (const c of report.cases) { lines.push('', `### ${c.id}`, c.error || `[reference](${c.id}-reference.png) · [actual](${c.id}-actual.png) · [diff](${c.id}-diff.png) · [overlay](${c.id}-overlay.png)`); }
  return lines.join('\n') + '\n';
}

export async function main(argv = process.argv.slice(2)) {
  if (argv.length === 1 && argv[0] === '--help') {
    console.log('UI remake measurement: --selftest | --config <repo-relative JSON> [--plan] [--out artifacts/ui-remake/NEW-RUN]\nWorkflow: https://github.com/nguyentronglinh045/pos-cafe/blob/workflow/stitch-ui-remake-docs/docs/workflow/stitch-ui-remake/README.md\nMeasurement PASS is not product acceptance. No reference update or installation is performed.'); return 0;
  }
  let configPath, outputArg, selftest = false, plan = false;
  for (let i=0;i<argv.length;i++) {
    if (argv[i] === '--config') configPath = argv[++i];
    else if (argv[i] === '--out') outputArg = argv[++i];
    else if (argv[i] === '--selftest') selftest = true;
    else if (argv[i] === '--plan') plan = true;
    else throw new Error(`Unknown argument: ${argv[i]}`);
  }
  if (selftest && configPath) throw new Error('Use --selftest or --config, not both');
  if (!selftest && !configPath) throw new Error('Use --config <path> or --selftest');
  const configFile = configPath ? within(root, configPath) : resolve(here, 'examples/selftest.json');
  const configBytes = await readFile(configFile);
  const cfg = expandConfig(JSON.parse(configBytes.toString('utf8').replace(/^\uFEFF/, '')));
  const budget = validateConfig(cfg);
  if (selftest && cfg.kind !== 'selftest') throw new Error('Selftest kind mismatch');
  if (typeof cfg.clock !== 'string' || !Number.isFinite(Date.parse(cfg.clock))) throw new Error('Explicit ISO clock required');
  const engine = cfg.browser || 'chromium';
  if (!['chromium','firefox','webkit'].includes(engine)) throw new Error('Unsupported browser engine');
  const palette = await readJson(resolve(here, 'palette-a-v1.json'));
  const fontProvenance = await readJson(resolve(here,'fonts/provenance.json'));
  const expectedFontFiles = ['BeVietnamPro-Regular.ttf','BeVietnamPro-Medium.ttf','BeVietnamPro-SemiBold.ttf','BeVietnamPro-Bold.ttf','OFL.txt'];
  if (fontProvenance.files?.length !== expectedFontFiles.length || expectedFontFiles.some(name => fontProvenance.files.filter(f=>f.file===name).length!==1)) throw new Error('FONT_PROVENANCE_INVALID: expected four font weights and their license');
  for (const font of fontProvenance.files) { const actual=await fileRecord(`ui-remake/fonts/${font.file}`);if(actual.sha256!==font.sha256 || actual.bytes!==font.bytes)throw new Error(`FONT_INTEGRITY_FAILED: ${font.file}`); }
  const refs = [];
  for (const path of [...new Set([...(cfg.referenceFiles || []), 'ui-remake/palette-a-v1.json', 'ui-remake/fonts/provenance.json', ...['Regular','Medium','SemiBold','Bold'].map(w => `ui-remake/fonts/BeVietnamPro-${w}.ttf`)])].sort()) refs.push(await fileRecord(path));
  for (const item of cfg.cases) {
    if (item.actual.normalizationCss) throw new Error('Actual UI normalization is forbidden');
    if (item.reference.normalizationCss && !cfg.referenceFiles?.includes(item.reference.normalizationCss)) throw new Error('Normalization CSS must be included in frozen referenceFiles');
  }
  const referenceSourceSha256 = hash(JSON.stringify(refs)), source = await sourceManifest();
  if (cfg.kind === 'screen-remake' && (typeof cfg.actualSourceRoot !== 'string' || cfg.dataMode !== 'mock' || typeof cfg.serverRecipe !== 'string' || !cfg.serverRecipe.trim())) throw new Error('Declare actualSourceRoot, dataMode=mock and serverRecipe; the tool cannot attest the source behind an arbitrary dev server');
  const actualSourceRoot = cfg.actualSourceRoot ? await realpath(resolve(root, cfg.actualSourceRoot)) : root;
  const actualSource = actualSourceRoot === root ? source : await sourceManifest(actualSourceRoot);
  const contractSha256 = contractDigest(cfg,referenceSourceSha256);
  if (plan) { console.log(JSON.stringify({ status:'PLAN_ONLY',kind:cfg.kind,referenceSourceSha256,contractSha256,referenceFiles:refs,budget,sourceSha256:source.sha256 }, null, 2)); return 0; }
  if (cfg.kind === 'screen-remake') {
    assertApproved(cfg,referenceSourceSha256,contractSha256);
  }
  const artifactRoot = resolve(root, 'artifacts/ui-remake');
  const output = outputArg ? within(artifactRoot, resolve(root, outputArg)) : resolve(artifactRoot, new Date().toISOString().replace(/[:.]/g,'-'));
  if (existsSync(output)) throw new Error('Output exists; refusing to overwrite retained evidence');
  let parent=root;
  for(const part of relative(root,output).split(sep)) {
    parent=resolve(parent,part);
    if(existsSync(parent) && (await lstat(parent)).isSymbolicLink()) throw new Error('Output symlink/junction is forbidden; evidence must remain in its declared artifact area');
  }
  await mkdir(output, { recursive:true });
  within(root, await realpath(output));
  let written = 0;
  async function save(name, bytes) { const next=written+Buffer.byteLength(bytes), limit=name.endsWith('.png')?MAX_ARTIFACT_BYTES-8*1024*1024:MAX_ARTIFACT_BYTES; if (next > limit) throw new Error('Artifact budget exceeded; stop and review retained output'); await writeFile(resolve(output, name), bytes, { flag:'wx' }); written=next; }
  const fixture = await serve(palette);
  let browser, compareContext;
  const report = { version:1, title:cfg.title, kind:cfg.kind, status:'NOT_RUN', productAcceptance:'NOT_ASSESSED', startedAt:new Date().toISOString(), configSha256:hash(configBytes), referenceSourceSha256, contractSha256, referenceApproval:cfg.referenceApproval || null, referenceFiles:refs, source, actualSource:{...actualSource,declaredRoot:actualSourceRoot,serverRecipe:cfg.serverRecipe || 'in-process synthetic fixture server',dataMode:cfg.dataMode || 'synthetic',binding:cfg.kind==='selftest'?'in-process-fixture':'declared-by-config; server/source binding requires operator review'}, budget, environment:{node:process.version,os:platform(),release:release(),arch:arch(),engine,locale:'vi-VN',timezone:'Asia/Ho_Chi_Minh',dpr:1,clock:cfg.clock,colorScheme:'light',animations:'disabled',capture:'viewport; two identical PNG captures required'}, cases:[] };
  try {
    const playwright = await loadPlaywright(); browser = await playwright[engine].launch({ headless:true });
    report.environment.browserVersion = browser.version();
    report.environment.fontSourceCommit=fontProvenance.sourceCommit;
    report.environment.playwrightModule = process.env.UI_REMAKE_PLAYWRIGHT_MODULE || 'playwright';
    const moduleUrl=process.env.UI_REMAKE_PLAYWRIGHT_MODULE || import.meta.resolve('playwright');
    report.environment.playwrightVersion=(await readJson(fileURLToPath(new URL('./package.json',moduleUrl)))).version;
    compareContext = await browser.newContext(); const comparisonPage = await compareContext.newPage();
    await comparisonPage.goto(`${fixture.origin}/fixtures/payment.html`);
    for (const item of cfg.cases) {
      const result = {id:item.id,viewport:item.viewport,thresholds:item.thresholds,selftestExpectation:item.selftestExpectation};
      try {
        const expected = await capture(browser,item,item.reference,'reference',palette,fixture.origin,cfg.clock);
        if (!expected.observed.font.pass || !expected.tokens.pass || !expected.observed.responsive.pass) throw new Error('INVALID_REFERENCE: normalized reference fails font/token/responsive contract');
        const actual = await capture(browser,item,item.actual,'actual',palette,fixture.origin,cfg.clock);
        const pixelData = await imageComparison(comparisonPage,actual.screenshot,expected.screenshot,item,`${fixture.origin}/metrics.mjs`);
        const {diffPng,overlayPng,...pixels} = pixelData;
        result.pixels = pixels; result.geometry = compareAnchors(actual.observed.anchors,expected.observed.anchors,item.thresholds.geometryTolerancePx);
        result.reference = {screenshotSha256:expected.screenshotSha256,observed:expected.observed,tokens:expected.tokens};
        result.actual = {screenshotSha256:actual.screenshotSha256,observed:actual.observed,tokens:actual.tokens};
        result.status = pixels.pass && result.geometry.pass && actual.tokens.pass && actual.observed.font.pass && actual.observed.responsive.pass ? 'PASS' : 'FAIL';
        await save(`${item.id}-reference.png`,expected.screenshot); await save(`${item.id}-actual.png`,actual.screenshot); await save(`${item.id}-diff.png`,Buffer.from(diffPng,'base64')); await save(`${item.id}-overlay.png`,Buffer.from(overlayPng,'base64'));
      } catch (error) { result.status='ERROR'; result.error=String(error.message).slice(0,1000); }
      report.cases.push(result);
      console.log(`${item.id}: ${result.status}${cfg.kind === 'selftest' ? ` (control expects ${item.selftestExpectation})` : ''}${result.error ? ` - ${result.error}` : ''}`);
    }
    report.status = report.cases.every(c => cfg.kind === 'selftest' ? c.status === c.selftestExpectation : c.status === 'PASS') ? 'PASS' : 'FAIL';
  } catch(error) { report.status='ERROR'; report.error=String(error.message).slice(0,1000); }
  finally { if(compareContext)await compareContext.close();if(browser)await browser.close();await fixture.close(); }
  try {
    const after = await sourceManifest();
    if(after.sha256 !== source.sha256) {report.status='ERROR';report.error='SOURCE_DRIFT: files changed during measurement';}
    const actualAfter = actualSourceRoot === root ? after : await sourceManifest(actualSourceRoot);
    if(actualAfter.sha256 !== actualSource.sha256) {report.status='ERROR';report.error='ACTUAL_SOURCE_DRIFT: declared app source changed during measurement';}
    for(const ref of refs) if ((await fileRecord(ref.path)).sha256 !== ref.sha256) {report.status='ERROR';report.error='REFERENCE_DRIFT: frozen reference input changed during measurement';break;}
  } catch(error) {report.status='ERROR';report.error=`PROVENANCE_RECHECK_FAILED: ${String(error.message).slice(0,500)}`;}
  report.finishedAt=new Date().toISOString(); report.artifactBytes=written;
  await save('report.json',JSON.stringify(report,null,2)+'\n'); await save('report.md',markdown(report));
  console.log(`${cfg.kind === 'selftest' ? 'SELFTEST' : 'MEASUREMENT'} ${report.status}; ${report.cases.length} cases; product acceptance NOT_ASSESSED; ${relative(root,output)}`);
  return report.status==='PASS' ? 0 : 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().then(code => {process.exitCode=code}).catch(error => {console.error(`UI_REMAKE BLOCKED: ${error.message}`);process.exitCode=2});
}
