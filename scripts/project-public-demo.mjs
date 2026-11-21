import { setTimeout as sleep } from "node:timers/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const projectId = "prj_7xwZL8MUEccVL2o0EvxoCtIYJ1en";
const teamSlug = "24tx810010-hcmutes-projects";
const repository = "nguyentronglinh045/pos-cafe";
const repoId = 1263057386;
const domain = "pos-cafe-azure.vercel.app";
const staging = "https://ineckiashpwloncxnbqx.supabase.co";

function requireState(ok, reason) {
  if (!ok) throw new Error(reason);
}

async function json(url, options = {}) {
  const response = await fetch(url, { ...options, redirect: "error", signal: AbortSignal.timeout(20000) });
  if (response.status === 404 && new URL(url).origin === "https://api.vercel.com" && new URL(url).pathname === "/v4/aliases/" + domain) return null;
  requireState(response.ok, "HTTP " + response.status + " " + new URL(url).pathname);
  return response.json();
}

async function verifyPublicSite() {
  const origin = "https://" + domain;
  const get = (path, options) => fetch(new URL(path, origin), { ...options, redirect: "error", signal: AbortSignal.timeout(20000) });
  const page = await get("/");
  requireState(page.ok, "Public homepage unavailable");
  const html = await page.text();
  const asset = html.match(/<script\b[^>]+src="(\/assets\/index-[\w-]+\.js)"/)?.[1];
  requireState(asset, "Public homepage did not serve the application");
  const script = await get(asset);
  requireState(script.ok && (await script.text()).includes(staging), "Public client does not target staging");
  // No email, request ID or store information. Edge rejects this before any write.
  const gateway = await get("/api/owner-otp", { method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ action: "requestCreateStoreOtp" }) });
  requireState(gateway.status === 400 && (await gateway.json()).code === "A_REQUEST_INVALID", "Public OTP gateway unavailable");
}

export async function deployPublicDemo(env, request = json, checkSite = verifyPublicSite) {
  const sha = env.GITHUB_SHA;
  const clientKey = env.DEMO_CLIENT_KEY;
  const ingress = env.DEMO_OTP_KEY;
  requireState(env.GITHUB_REPOSITORY === repository && env.GITHUB_REPOSITORY_ID === String(repoId)
    && env.GITHUB_EVENT_NAME === "workflow_dispatch" && env.GITHUB_REF === "refs/heads/main"
    && env.GITHUB_WORKFLOW_SHA === sha && /^[a-f0-9]{40}$/.test(sha ?? ""), "Unexpected source");
  requireState(env.VERCEL_TOKEN && env.GITHUB_TOKEN && /^sb_publishable_[\w-]{16,256}$/.test(clientKey ?? "")
    && /^[A-Za-z0-9+/]{43}=$/.test(ingress ?? "") && Buffer.from(ingress, "base64").length === 32, "Missing Production credentials");

  const vercel = async (path, body) => {
    const url = new URL(path, "https://api.vercel.com");
    url.searchParams.set("slug", teamSlug);
    return request(url, { method: body ? "POST" : "GET",
      headers: { authorization: "Bearer " + env.VERCEL_TOKEN, "content-type": "application/json" },
      ...(body ? { body: JSON.stringify(body) } : {}) });
  };
  async function checkMain() {
    const ref = await request("https://api.github.com/repos/" + repository + "/git/ref/heads/main",
      { headers: { authorization: "Bearer " + env.GITHUB_TOKEN } });
    requireState(ref.object?.sha === sha, "main has moved");
  }
  await checkMain();
  const project = await vercel("/v9/projects/" + projectId);
  requireState(project.id === projectId && project.name === "pos-cafe" && project.link?.repoId === repoId
    && project.link.productionBranch === "main" && project.autoExposeSystemEnvs === true, "Unexpected Vercel project");
  const binding = await vercel("/v9/projects/" + projectId + "/domains/" + domain);
  requireState(binding.verified === true && !binding.customEnvironmentId && binding.name === domain && binding.projectId === projectId && !binding.redirect && !binding.gitBranch, "Unexpected production domain");
  const domains = await vercel("/v9/projects/" + projectId + "/domains?limit=100");
  requireState(Array.isArray(domains.domains) && !domains.pagination?.next && domains.domains.every(item =>
    item.name === domain || item.gitBranch || item.customEnvironmentId), "Additional Production domain in project");
  const auth = await request(staging + "/auth/v1/settings", { headers: { apikey: clientKey } });
  const contract = await request(staging + "/rest/v1/rpc/permission_get_contract", { method: "POST",
    headers: { apikey: clientKey, "content-type": "application/json", "x-pos-permission-contract": "2" }, body: "{}" });
  requireState(auth.disable_signup === true && auth.external?.email === true && auth.mailer_autoconfirm === true
    && contract.permissionContractVersion === 2 && contract.writeProtocolVersion === 1, "Staging readiness failed");

  const marker = { publicDemoSource: sha, publicDemoRun: env.GITHUB_RUN_ID };
  const listing = await vercel("/v7/deployments?projectId=" + projectId + "&target=production&limit=100&sha=" + sha);
  requireState(Array.isArray(listing.deployments) && !listing.pagination?.next, "Incomplete deployment list");
  const prior = listing.deployments.filter(d => d.meta?.publicDemoRun === env.GITHUB_RUN_ID);
  requireState(prior.length <= 1 && prior.every(d => d.meta?.publicDemoSource === sha && /^dpl_[A-Za-z0-9]+$/.test(d.uid ?? "")), "Ambiguous previous release");
  let id = prior[0]?.uid;
  if (!id) {
    const variables = [
      { key: "POS_PUBLIC_DEMO_CLIENT_KEY", value: clientKey, type: "encrypted" },
      { key: "POS_PUBLIC_DEMO_OTP_INGRESS_KEY", value: ingress, type: "sensitive" },
      { key: "POS_PUBLIC_DEMO_SHA", value: sha, type: "encrypted" },
    ].map(row => ({ ...row, target: ["production"] }));
    const config = await vercel("/v10/projects/" + projectId + "/env?decrypt=false");
    const rows = Array.isArray(config) ? config : config.envs;
    requireState(Array.isArray(rows) && !config.pagination?.next && !config.hiddenProductionEnvCount, "Incomplete environment list");
    const names = new Set(variables.map(row => row.key));
    const existing = rows.filter(row => names.has(row.key));
    requireState(new Set(existing.map(row => row.key)).size === existing.length && existing.every(row =>
      row.target?.length === 1 && row.target[0] === "production" && !row.gitBranch && !row.customEnvironmentIds?.length),
    "Public demo variables have unexpected scope");
    const updated = await vercel("/v10/projects/" + projectId + "/env?upsert=true", variables);
    requireState(Array.isArray(updated.created) && updated.created.length === variables.length && Array.isArray(updated.failed) && updated.failed.length === 0
      && variables.every(input => updated.created.some(row => row.key === input.key && row.type === input.type
        && row.target?.length === 1 && row.target[0] === "production")), "Production variable update incomplete");
    await checkMain();
    const created = await vercel("/v13/deployments", { name: "pos-cafe", project: projectId, target: "production",
      gitSource: { type: "github", repoId, ref: "main", sha }, meta: marker });
    id = created.id;
  }
  requireState(/^dpl_[A-Za-z0-9]+$/.test(id ?? ""), "Invalid deployment ID");
  console.log("Production deployment " + id);
  const until = Date.now() + 600000;
  while (Date.now() < until) {
    const result = await vercel("/v13/deployments/" + id + "?withGitRepoInfo=true");
    requireState(result.id === id && result.projectId === projectId && result.target === "production" && result.gitSource?.sha === sha
      && result.gitSource.type === "github" && result.gitSource.repoId === repoId && result.gitSource.ref === "main"
      && result.meta?.publicDemoRun === marker.publicDemoRun && result.meta?.publicDemoSource === sha
      && (!result.meta.githubCommitSha || result.meta.githubCommitSha === sha),
      "Unexpected deployed source");
    requireState(["QUEUED","BUILDING","INITIALIZING","READY"].includes(result.readyState), "Deployment " + result.readyState);
    if (result.readyState === "READY") {
      const alias = await vercel("/v4/aliases/" + domain);
      if (alias?.projectId === projectId && alias.alias === domain && (alias.deploymentId ?? alias.deployment?.id) === id) {
        await checkSite();
        console.log(JSON.stringify({ status: "READY", domain, sha, deploymentId: id, data: "staging" }));
        return;
      }
    }
    await sleep(5000);
  }
  throw new Error("Timed out verifying the production deployment and alias");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  deployPublicDemo(process.env).catch(error => { console.error(error.message); process.exitCode = 1; });
}
