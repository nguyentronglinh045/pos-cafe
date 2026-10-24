import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {CI1_LIMITS} from './permission-ci1-policy.mjs';
import {FULL_RUNTIME_POLICY, fullRuntimeProfile, fullRuntimeLayout, fullRuntimeUnitProperties,
  assertFullRuntimeRootFacts} from './permission-full-runtime-policy.mjs';

const root = fileURLToPath(new URL('../',import.meta.url));
const hash = value => createHash('sha256').update(value).digest('hex');
const source = name => readFileSync(new URL(`../${name}`,import.meta.url),'utf8').replaceAll('\r\n','\n');
const blob = name => execFileSync('git',['show',`HEAD:${name}`],{cwd:root,maxBuffer:64*1024});
const layout = () => fullRuntimeLayout('39128774085',1,'a'.repeat(32),1001);
const refuses = callback => assert.throws(callback,/FULL_RUNTIME_POLICY_REFUSED|CI1_GUARD_REFUSED/);
function observations() {
  const expected = layout();
  const common = {path:expected.root, realpath:expected.root, directory:true, symlink:false,
    device:'2049', inode:'5001', ownerUid:expected.ownerUid, mode:0o700,
    nonce:expected.nonce, ownerLabel:expected.ownerLabel};
  return {host:{...common,preexistingSubmounts:[]}, unit:{...common,privateTmp:true,
    bindSource:expected.root, bindDestination:expected.root, bindRecursive:false, ignoreMissingSource:false}};
}

test('six closed runtime profiles stay plan-only and reject HP1, inherited and noncanonical IDs',() => {
  assert.deepEqual(FULL_RUNTIME_POLICY.profileOrder,
    ['PIN_ONBOARD','PIN_IDENTITY','PIN_CANARY','PG16_T01','SUPABASE_T02','SUPABASE_T04']);
  for (const id of FULL_RUNTIME_POLICY.profileOrder) {
    assert.equal(fullRuntimeProfile(id).provisioning,'NEEDS_PORT');
    assert.equal(fullRuntimeProfile(id).execution,'NOT_RUN');
  }
  for (const id of ['HP1','hp1','STATIC','__proto__','constructor','toString','SUPABASE_T04\n',null,{},new String('PIN_CANARY')]) {
    refuses(() => fullRuntimeProfile(id));
  }
  assert.equal(FULL_RUNTIME_POLICY.mode,'PLAN_ONLY');
  assert.equal(FULL_RUNTIME_POLICY.maxHeavyEnvironments,1);
  assert.equal(FULL_RUNTIME_POLICY.hp1,'RETIRED_DO_NOT_RUN');
  assert.throws(() => {fullRuntimeProfile('SUPABASE_T04').stages.pop();},TypeError);
});

function tomlValue(config,section,key) {
  const body = config.split(`[${section}]\n`)[1]?.split(/\n\[/)[0];
  return body?.match(new RegExp(`^${key} = (.+)$`,'m'))?.[1];
}
test('Supabase config byte pins, full port maps and exact aliases match committed source',() => {
  for (const id of ['PIN_ONBOARD','PIN_IDENTITY','SUPABASE_T02','SUPABASE_T04']) {
    const profile = fullRuntimeProfile(id);
    const bytes = blob(profile.config.path);
    assert.equal(bytes.length,profile.config.bytes);
    assert.equal(hash(bytes),profile.config.sha256);
    const config = bytes.toString('utf8');
    assert.ok(config.includes(`project_id = "${profile.project}"`));
    for (const [field,section,key] of [['api','api','port'],['db','db','port'],['shadow','db','shadow_port'],
      ['pooler','db.pooler','port'],['studio','studio','port'],['smtp','local_smtp','port'],
      ['analytics','analytics','port'],['inspector','edge_runtime','inspector_port']]) {
      assert.equal(Number(tomlValue(config,section,key)),profile.ports[field],`${id}/${field}`);
    }
    assert.equal(Number(tomlValue(config,'db','major_version')),profile.postgresMajor);
    assert.equal(tomlValue(config,'db.migrations','enabled'),'true');
    assert.equal(tomlValue(config,'db.seed','enabled'),'true');
    assert.equal(profile.aliasRoot,`/var/tmp/${profile.project}`);
    assert.equal(profile.stackAlias,`${profile.aliasRoot}/stack`);
    assert.equal(profile.topology.dbVolume,`supabase_db_${profile.project}`);
    assert.equal(profile.topology.network,`supabase_network_${profile.project}`);
    assert.equal(profile.topology.containerKinds.length,12);
    assert.equal(profile.cliVersion,'2.117.0');
    assert.equal(profile.bootstrap.strategy,'MANUAL_001_016');
    assert.equal(profile.bootstrap.migrationCount,16);
  }
  const t04 = fullRuntimeProfile('SUPABASE_T04');
  for (const id of ['PIN_ONBOARD','PIN_IDENTITY','PIN_CANARY']) {
    assert.equal(fullRuntimeProfile(id).cliAlias,`${t04.aliasRoot}/bin/supabase`);
  }
  assert.equal(fullRuntimeProfile('SUPABASE_T02').cliAlias,'/var/tmp/pos-cafe-perm-s31-t02-20261013/bin/supabase');
});

test('TC19 exact legacy derivation retains its hash and requires CLI16 plus an exclusive empty seed',() => {
  const profile = fullRuntimeProfile('PIN_CANARY');
  const base = blob(profile.config.base.path);
  assert.equal(hash(base),profile.config.base.sha256);
  const derived = base.toString('utf8').replaceAll('pos-cafe-perm-s31-t04-20261013',profile.project)
    .replaceAll('6242','6282').replace('inspector_port = 8084','inspector_port = 8088')
    .replace('[db.seed]\nenabled = true','[db.seed]\nenabled = false');
  assert.equal(hash(derived),profile.config.sha256);
  assert.equal(tomlValue(derived,'db.seed','enabled'),'true'); // Existing comment makes the last replacement a no-op.
  assert.equal(tomlValue(derived,'db.seed','sql_paths'),'["./seed.sql"]');
  assert.equal(profile.bootstrap.strategy,'CLI_16_EMPTY_SEED_FILE');
  assert.equal(profile.bootstrap.seedRelativePath,'stack/supabase/seed.sql');
  assert.equal(profile.bootstrap.seedBytes,0);
  assert.equal(profile.bootstrap.exclusiveSeedFile,true);
  assert.deepEqual(profile.bootstrap.actualReadback,
    {database:'postgres',cliMigrations:16,tenantRowsEmpty:true,authUsers:0,storageObjects:0});
  const guard = source(profile.config.source);
  assert.ok(guard.includes(".replace('[db.seed]\\nenabled = true', '[db.seed]\\nenabled = false')"));
  assert.ok(guard.includes('migrations !== 16 || !empty.empty || auth !== 0 || storage !== 0'));
});

test('bootstrap policies preserve identity private absence, onboarding empty activation and PG16 guard',() => {
  const identity = fullRuntimeProfile('PIN_IDENTITY');
  assert.equal(identity.privateAlias,`${identity.aliasRoot}/private`);
  assert.equal(identity.privateMustBeAbsent,true);
  assert.equal(identity.bootstrap.exactAclPreflightRequired,true);
  assert.ok(source(identity.bootstrap.source).includes("if(existsSync(directory)) throw new Error('IDENTITY_PRIVATE_ALREADY_EXISTS')"));
  const onboard = fullRuntimeProfile('PIN_ONBOARD');
  assert.equal(onboard.bootstrap.emptyBeforeActivation,true);
  assert.ok(source(onboard.bootstrap.source).includes('!pre.schemaMatches || !pre.empty'));
  const native = fullRuntimeProfile('PG16_T01');
  assert.equal(native.postgresMajor,16);
  assert.equal(native.project,null);
  assert.equal(native.ports,null);
  assert.equal(native.config,null);
  assert.ok(new RegExp(native.aliasRootPattern).test('/var/tmp/pos-cafe-perm-t01-owned1'));
  assert.equal(new RegExp(native.aliasRootPattern).test('/var/tmp/pos-cafe-perm-t01-owned1/../foreign'),false);
  assert.equal(native.dataDirectoryMustEqualShowResult,true);
  assert.equal(native.bootstrap.observerOnly,true);
  assert.ok(source(native.bootstrap.source).includes("if (actual !== expectedDataDirectory) throw new Error('FIXTURE_CLUSTER_MISMATCH')"));
});

test('T04 retains all nineteen manifest stages on one physical backend with service fixture',() => {
  const profile = fullRuntimeProfile('SUPABASE_T04');
  const manifest = JSON.parse(source('tests/permissions/permissionAggregateCases.json'));
  const others = new Set(['foundation-unit','candidate-unit','candidate-seed-tools','legacy-t01-tools',
    'legacy-t01-database',...fullRuntimeProfile('SUPABASE_T02').bootstrap.stages]);
  const t04Stages = [...new Set(manifest.cases.flatMap(item => item.variants.map(variant => variant.stage)))]
    .filter(stage => !others.has(stage)).sort();
  assert.equal(profile.stages.length,19);
  assert.deepEqual([...profile.stages].sort(),t04Stages);
  assert.equal(profile.samePhysicalBackendRequired,true);
  assert.equal(profile.logicalResetsOnlyAtReviewedBoundaries,true);
  assert.equal(profile.bootstrap.buckets,3);
  assert.equal(profile.bootstrap.objects,6);
  assert.equal(profile.bootstrap.payloadGetHashRequired,true);
  assert.equal(profile.bootstrap.realtimeReadyBeforeBaseline,true);
});

test('owned layout and resource limits are canonical plans and explicitly unenforced',() => {
  const value = layout();
  assert.equal(value.root,'/var/tmp/pos-permission-full-39128774085-1');
  assert.equal(value.loopBackingFile,`${value.root}/data.img`);
  assert.equal(value.loopMount,`${value.root}/data`);
  assert.equal(value.ownerLabel,`pos-permission-full-39128774085-1-${'a'.repeat(32)}`);
  assert.equal(value.mode,'PLAN_ONLY');
  assert.deepEqual(FULL_RUNTIME_POLICY.resources,{enforcement:'NOT_ENFORCED_BY_THIS_MODULE',
    loopBytes:CI1_LIMITS.filesystemBytes,taskBytes:CI1_LIMITS.taskBytes,hostReserveBytes:CI1_LIMITS.hostReserveBytes,
    admission:'STOP_UNTIL_ACTUAL_MAXIMUM_GROWTH_RESERVES_WRITER_PLACEMENT_AND_TIME_FIT_VERIFIED'});
  assert.equal(FULL_RUNTIME_POLICY.resources.loopBytes,18*1024**3);
  assert.equal(FULL_RUNTIME_POLICY.resources.taskBytes,20*1024**3);
  assert.equal(FULL_RUNTIME_POLICY.resources.hostReserveBytes,30*1024**3);
  for (const runId of ['0','01','1\n','../1','1:2',1,'1'.repeat(21)]) refuses(() => fullRuntimeLayout(runId,1,'a'.repeat(32),1001));
  for (const attempt of [0,1001,1.5,'1',NaN]) refuses(() => fullRuntimeLayout('1',attempt,'a'.repeat(32),1001));
  for (const nonce of ['', 'A'.repeat(32),'a'.repeat(31),'a'.repeat(32)+'\n',null]) refuses(() => fullRuntimeLayout('1',1,nonce,1001));
  for (const uid of [-1,1.1,'1001',NaN,0x100000000]) refuses(() => fullRuntimeLayout('1',1,'a'.repeat(32),uid));
});

test('systemd property uses exact existing source and norbind within PrivateTmp',() => {
  const value = layout();
  assert.deepEqual(fullRuntimeUnitProperties(value),['--property=PrivateTmp=yes',
    `--property=BindPaths=${value.root}:${value.root}:norbind`]);
  for (const rootPath of ['/var/tmp/foreign',`${value.root}/`,`${value.root}/../foreign`,`${value.root}:other`,`${value.root}\n`]) {
    refuses(() => fullRuntimeUnitProperties({...value,root:rootPath}));
  }
  refuses(() => fullRuntimeUnitProperties({...value,ownerLabel:'other'}));
  refuses(() => fullRuntimeUnitProperties({...value,loopMount:'/tmp/unbounded'}));
});

test('matching independently measured root facts remain plan-only and never claim enforcement',() => {
  assert.deepEqual(assertFullRuntimeRootFacts(layout(),observations()),
    {mode:'PLAN_ONLY',predicate:'ROOT_FACTS_MATCH',execution:'NOT_RUN',provisioning:'NEEDS_PORT'});
});

test('root predicate refuses missing facts, alias paths, inode/device/owner/mode/nonce drift and submounts',() => {
  for (const side of ['host','unit']) {
    for (const [key,value] of Object.entries({path:'/var/tmp/foreign',realpath:'/var/tmp/foreign',directory:false,symlink:true,
      device:'2050',inode:'5002',ownerUid:0,mode:0o755,nonce:'b'.repeat(32),ownerLabel:'foreign'})) {
      const facts = observations();facts[side][key]=value;
      refuses(() => assertFullRuntimeRootFacts(layout(),facts));
    }
    for (const value of ['05001','5001\n',5001,null]) {
      const facts = observations();facts[side].inode=value;
      refuses(() => assertFullRuntimeRootFacts(layout(),facts));
    }
  }
  for (const [key,value] of Object.entries({privateTmp:false,bindSource:'/tmp/foreign',bindDestination:'/tmp/foreign',
    bindRecursive:true,ignoreMissingSource:true})) {
    const facts=observations();facts.unit[key]=value;
    refuses(() => assertFullRuntimeRootFacts(layout(),facts));
  }
  for (const mounts of [['/foreign'],null,{}]) {
    const facts=observations();facts.host.preexistingSubmounts=mounts;
    refuses(() => assertFullRuntimeRootFacts(layout(),facts));
  }
  const missing=observations();delete missing.host.nonce;
  refuses(() => assertFullRuntimeRootFacts(layout(),missing));
  refuses(() => assertFullRuntimeRootFacts(layout(),{receipt:'PASS'}));
  for (const key of ['device','inode']) {
    const facts=observations();facts.host[key]+='\n';facts.unit[key]+='\n';
    refuses(() => assertFullRuntimeRootFacts(layout(),facts));
  }
});

test('inherited facts and accessor declarations cannot substitute measured data',() => {
  const inherited=observations();inherited.host=Object.create(inherited.host);
  refuses(() => assertFullRuntimeRootFacts(layout(),inherited));
  let getterCalls=0;
  const accessor=observations();Object.defineProperty(accessor.unit,'nonce',{enumerable:true,get(){getterCalls++;return 'a'.repeat(32);}});
  refuses(() => assertFullRuntimeRootFacts(layout(),accessor));
  const nonenumerable=observations();Object.defineProperty(nonenumerable.host,'ownerUid',{value:1001,enumerable:false});
  refuses(() => assertFullRuntimeRootFacts(layout(),nonenumerable));
  assert.equal(getterCalls,0);
});
