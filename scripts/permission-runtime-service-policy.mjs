import{ci1Identity}from'./permission-ci1-policy.mjs';
import{serviceProfile}from'./permission-runtime-service-profile.mjs';
export{CI1_LIMITS,ci1Identity,ci1ProcessEnvironment,ci1TrustedRepository,assertCi1Envelope}from'./permission-ci1-policy.mjs';
export const ACTIVE_PROFILE=serviceProfile(process.env.PERMISSION_RUNTIME_PROFILE??'SUPABASE_T02');
export const CI1_PROJECT=ACTIVE_PROFILE.project,CI1_RUNTIME=ACTIVE_PROFILE.aliasRoot;
const refuse=()=>{throw Error('PERMISSION_SERVICE_WRITE_BOUNDARY_REFUSED');};
export function assertCi1WriteBoundary({ root, environment, paths, runtimeMount, dockerd, containerd }, identity) {
  if (typeof root !== 'string' || !root.startsWith('/') || /[\r\n\0]/.test(root)
    || root.endsWith('/') || !paths?.root?.directory || paths.root.realpath !== root || paths.root.symlink) refuse();
  const device = paths.root.device;
  const ownedDirectory = (fact, expected) => fact?.directory === true && fact.symlink === false
    && fact.realpath === expected && fact.device === device;
  for (const name of ['source', 'private', 'docker', 'containerd', 'run', 'tmp', 'home', 'npm-cache', 'runtime', 'home/.cache']) {
    if (!ownedDirectory(paths[name], `${root}/${name}`)) refuse();
  }
  if (paths.nodeModules && !ownedDirectory(paths.nodeModules, `${root}/source/node_modules`)) refuse();
  const fixed = { HOME: `${root}/home`, TMPDIR: `${root}/tmp`, XDG_CACHE_HOME: `${root}/home/.cache`, NPM_CONFIG_CACHE: `${root}/npm-cache` };
  if (!environment || Object.entries(fixed).some(([key, value]) => environment[key] !== value)
    || environment.DOCKER_HOST !== `unix://${root}/docker.sock` || environment.DOCKER_CONTEXT) refuse();
  for (const [key, suffix] of Object.entries({ TMP: 'tmp', TEMP: 'tmp', npm_config_cache: 'npm-cache',
    XDG_CONFIG_HOME: 'home/.config', DENO_DIR: 'home/.cache/deno' })) {
    if (environment[key] !== undefined && (environment[key] !== `${root}/${suffix}`
      || !ownedDirectory(paths[suffix], `${root}/${suffix}`))) refuse();
  }
  // A bind mount keeps its alias path under realpath(); inode/device identify the
  // actual backing directory, while findmnt proves the exact mount boundary.
  if (runtimeMount?.target !== CI1_RUNTIME || runtimeMount.filesystem !== 'ext4'
    || !ownedDirectory(paths.compatibility, CI1_RUNTIME)
    || paths.compatibility.inode !== paths.runtime.inode) refuse();
  const cgroup = `/system.slice/${ci1Identity(identity.runId, identity.attempt).unit}`;
  const matches = (daemon, flags) => daemon?.inCgroup === true && Array.isArray(daemon.argv)
    && flags.every(flag => { const key = flag.slice(0, flag.indexOf('='));
      return daemon.argv.includes(flag) && daemon.argv.filter(arg => arg === key || arg.startsWith(key + '=')).length === 1; });
  if (!matches(dockerd, [`--host=unix://${root}/docker.sock`, `--data-root=${root}/docker`,
    `--exec-root=${root}/run/docker`, `--pidfile=${root}/run/dockerd.pid`, `--containerd=${root}/run/containerd.sock`,
    `--cgroup-parent=${cgroup}`, '--exec-opt=native.cgroupdriver=cgroupfs', '--default-ulimit=core=0:0'])
    || !matches(containerd, [`--root=${root}/containerd`, `--state=${root}/run/containerd-state`,
      `--address=${root}/run/containerd.sock`])) refuse();
  return true;
}

