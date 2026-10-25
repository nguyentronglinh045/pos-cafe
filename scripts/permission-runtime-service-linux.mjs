import{readFileSync,readlinkSync,lstatSync,statSync,statfsSync,realpathSync}from'node:fs';
import{join,dirname}from'node:path';import{execFileSync}from'node:child_process';import{cpus,totalmem}from'node:os';
import{coreDumpDisabled}from'./project-ci-launch.mjs';
import{CI1_LIMITS,CI1_PROJECT,CI1_RUNTIME,ACTIVE_PROFILE,assertCi1WriteBoundary}from'./permission-runtime-service-policy.mjs';
import{ci1LinuxRecipe,ci1SystemdProperty,ci1ContainersCoreDisabled}from'./permission-ci1-harness.mjs';
import{readStoppedServicePeer}from'./permission-runtime-service-peer.mjs';
export{ci1LinuxRecipe,ci1SystemdProperty,ci1HarnessFailureFacts}from'./permission-ci1-harness.mjs';
const refused=()=>{throw Error('PERMISSION_SERVICE_ENVELOPE_REFUSED');};
const readJSON=p=>{if(statSync(p).size>1024**2)refused();return JSON.parse(readFileSync(p));};
const child=(name,args)=>execFileSync(name,args,{encoding:'utf8',timeout:30000,maxBuffer:1024**2,stdio:['ignore','pipe','pipe']});
export function readCi1LinuxEnvelope(root, identity, env = process.env) {
  if (process.platform !== 'linux' || process.arch !== 'x64' || process.getuid?.() !== 0
    || env.CI1_EXECUTION_AUTHORIZED !== 'yes' || /microsoft/i.test(readFileSync('/proc/version', 'utf8'))) refused();
  if (!coreDumpDisabled(readFileSync('/proc/self/limits', 'utf8'), readFileSync('/proc/sys/kernel/core_pattern', 'utf8'))) refused();
  root = realpathSync(root);
  const ownCgroup = readFileSync('/proc/self/cgroup', 'utf8').trim().split('\n').find(value => value.startsWith('0::'))?.slice(3);
  const cgroup = `/system.slice/${identity.unit}`;
  if (ownCgroup !== `${cgroup}/supervisor`) refused();
  const cg = '/sys/fs/cgroup' + cgroup;
  const scalar = name => readFileSync(`${cg}/${name}`, 'utf8').trim();
  const events = name => Object.fromEntries(scalar(name).split('\n').map(value => value.split(/\s+/)));
  const runtime = ci1SystemdProperty(identity, 'RuntimeMaxUSec');
  const stop = ci1SystemdProperty(identity, 'TimeoutStopUSec');
  const killMode = ci1SystemdProperty(identity, 'KillMode');
  const standardOutput = ci1SystemdProperty(identity, 'StandardOutput');
  const standardError = ci1SystemdProperty(identity, 'StandardError');
  const mount = JSON.parse(child('findmnt', ['--json', '--target', root, '--output', 'TARGET,SOURCE,FSTYPE'])).filesystems[0];
  if (realpathSync(mount.target) !== root || !/^\/dev\/loop[0-9]+$/.test(mount.source)) refused();
  const loop = JSON.parse(child('losetup', ['--json', '--list', '--output', 'NAME,BACK-FILE,OFFSET,SIZELIMIT', mount.source])).loopdevices[0];
  const image = realpathSync(loop['back-file']);
  if (image !== join(dirname(root), 'data.img') || Number(loop.offset) !== 0 || Number(loop.sizelimit) !== CI1_LIMITS.filesystemBytes) refused();
  const filesystem = statfsSync(root), host = statfsSync(image), device = statSync(root).dev;
  const pathFact = path => { const info = statSync(path); return { realpath: realpathSync(path),
    device: info.dev, inode: info.ino, directory: info.isDirectory(), symlink: lstatSync(path).isSymbolicLink() }; };
  const paths = Object.fromEntries(['source', 'private', 'docker', 'containerd', 'run', 'tmp', 'home', 'npm-cache', 'runtime', 'home/.cache']
    .map(name => [name, pathFact(join(root, name))]));
  Object.assign(paths, { root: pathFact(root), compatibility: pathFact(CI1_RUNTIME),
    nodeModules: lstatSync(join(root, 'source', 'node_modules'), { throwIfNoEntry: false }) ? pathFact(join(root, 'source', 'node_modules')) : null });
  for (const [key, suffix] of Object.entries({ XDG_CONFIG_HOME: 'home/.config', DENO_DIR: 'home/.cache/deno' })) {
    if (env[key] !== undefined) paths[suffix] = pathFact(join(root, suffix));
  }
  const compatibility = JSON.parse(child('findmnt', ['--json', '--target', CI1_RUNTIME, '--output', 'TARGET,FSTYPE'])).filesystems[0];
  if(ACTIVE_PROFILE.cliAlias!==CI1_RUNTIME+'/bin/supabase'){
    const alias='/var/tmp/pos-cafe-perm-s31-t04-20261013';
    const actual=pathFact(alias),backing=paths.runtime;
    const binding=JSON.parse(child('findmnt',['--json','--target',alias,'--output','TARGET,FSTYPE'])).filesystems[0];
    if(actual.symlink||actual.realpath!==alias||actual.device!==backing.device||actual.inode!==backing.inode
      ||binding.target!==alias||binding.fstype!=='ext4')refused();
  }
  if (realpathSync(process.cwd()) !== join(root, 'source')) refused();
  const docker = JSON.parse(child('docker', ['info', '--format', '{{json .}}']));
  const ownedProcess = name => {
    const pid = readFileSync(join(root, 'run', `${name}.pid`), 'utf8').trim();
    if (!/^[1-9][0-9]*$/.test(pid)) refused();
    const argv = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0');
    return { argv, inCgroup: readFileSync(`/proc/${pid}/cgroup`, 'utf8').trim().split('\n')
      .some(line => line === `0::${cgroup}` || line.startsWith(`0::${cgroup}/`)) };
  };
  const mutablePathsOnVolume = assertCi1WriteBoundary({ root, environment: env, paths,
    runtimeMount: { target: compatibility.target, filesystem: compatibility.fstype },
    dockerd: ownedProcess('dockerd'), containerd: ownedProcess('containerd') }, identity);
  if(ACTIVE_PROFILE.id==='PIN_EXPIRY')readStoppedServicePeer(root,identity,env,child);
  const containers = JSON.parse(child('docker', ['inspect', ...['db', 'auth', 'rest', 'kong', 'storage', 'realtime', 'edge_runtime', 'studio', 'pg_meta', 'inbucket', 'vector', 'analytics'].map(name => `supabase_${name}_${CI1_PROJECT}`)]));
  const containersInCgroup = containers.every(value => value.State.Running
    && readFileSync(`/proc/${value.State.Pid}/cgroup`, 'utf8').trim().split('\n').some(line => line.startsWith(`0::${cgroup}/`))
    && value.Mounts.every(mount => mount.Type === 'tmpfs' || (['bind', 'volume'].includes(mount.Type) && statSync(mount.Source).dev === device)));
  const origin = readJSON(join(dirname(root), 'host-namespaces.json'));
  const event = env.GITHUB_EVENT_PATH ? readJSON(env.GITHUB_EVENT_PATH) : null;
  const privateNamespaces = ['mnt', 'net', 'pid'].every(name => typeof origin[name] === 'string'
    && /^[a-z]+:\[[0-9]+\]$/.test(origin[name]) && readlinkSync(`/proc/self/ns/${name}`) !== origin[name]);
  return {
    platform: process.platform, arch: process.arch, githubHosted: env.GITHUB_ACTIONS === 'true' && env.RUNNER_ENVIRONMENT === 'github-hosted',
    publicRepository: event?.repository?.private === false, hostCPUs: cpus().length, hostMemoryBytes: totalmem(),
    repository: env.GITHUB_REPOSITORY, manual: env.GITHUB_EVENT_NAME === 'workflow_dispatch', unit: identity.unit, cgroup,
    delegatedSupervisor: ownCgroup === `${cgroup}/supervisor`,
    cpuMax: scalar('cpu.max'), memoryMax: scalar('memory.max'), swapMax: scalar('memory.swap.max'), pidsMax: scalar('pids.max'),
    runtimeSeconds: runtime === '30min' ? 1800 : -1, stopGraceSeconds: stop === '30s' ? 30 : -1, killMode, standardOutput, standardError,
    memoryCurrent: Number(scalar('memory.current')), pidsCurrent: Number(scalar('pids.current')),
    oomEvents: Number(events('memory.events').oom ?? 0) + Number(events('memory.events').oom_kill ?? 0),
    pidsLimitEvents: Number(events('pids.events').max ?? 0),
    filesystem: mount.fstype, loopBacked: true, imageBytes: statSync(image).size,
    imageAllocatedBytes: statSync(image).blocks * 512,
    filesystemBytes: filesystem.blocks * filesystem.bsize, filesystemFreeBytes: filesystem.bavail * filesystem.bsize,
    hostFreeBytes: host.bavail * host.bsize, mutablePathsOnVolume, privateNamespaces,
    noDefaultRoute: child('ip', ['route', 'show', 'default']).trim() === '',
    ownedDaemon: docker.DockerRootDir === `${root}/docker` && docker.CgroupDriver === 'cgroupfs' && typeof docker.ID === 'string' && docker.ID.length > 0,
    containersInCgroup,
    containersCoreDisabled: ci1ContainersCoreDisabled(containers, readFileSync('/proc/sys/kernel/core_pattern', 'utf8'),
      pid => readFileSync(`/proc/${pid}/limits`, 'utf8')),
  };
}

