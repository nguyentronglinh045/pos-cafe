# Bounded permission runtime iterations

Run from the owned source checkout. This tooling does not authorize merge,
production changes, Supabase writes, a new WSL distro or extra test coverage
exceptions. Existing17 CI gates and backend acceptance remain required;
the Edge resolution phase adds an eighteenth gate before backend admission.

## Check before dispatch

1. Inspect the current handoff and the original owner authorization. Keep the
   same workstream and cumulative action counts across source/profile/chat.
2. Run Node guard tests, then actual pinned reporter controls. The full CI
   reporter selftest retains its four original controls and adds seven
   diagnostic controls with 20 detected mutations. Synthetic Node reports
   alone do not prove actual reporter compatibility.
3. Freeze a recoverable source snapshot/patch, including new files and tests.
   Obtain independent source and operations APPROVE on the packet hash.
4. Construct one data manifest for publication or a backend profile. Reuse the
   helper and same-source CI receipt; do not clone the helper for each retry.
5. Dry-run admission, then use the same manifest to dispatch once. Every
   dispatch rechecks source, remote, disk, active jobs, reclaim and budget.

```powershell
node scripts/permission-batch-budget.mjs check ABSOLUTE_POLICY_PATH
node scripts/permission-runtime-admission.mjs publish ABSOLUTE_MANIFEST_PATH
node scripts/permission-runtime-admission.mjs publish ABSOLUTE_MANIFEST_PATH publication-identity --dispatch
node scripts/permission-runtime-admission.mjs heavy ABSOLUTE_MANIFEST_PATH
node scripts/permission-runtime-admission.mjs heavy ABSOLUTE_MANIFEST_PATH profile-identity --dispatch
```

Publication reserves both publication and its automatic push CI before push.
A failed or uncertain dispatch consumes the reservation. Investigate the
existing run; do not change identity to obtain a free retry.

## Manifest and evidence contracts

`permission-runtime-admission-v1` contains fixed repository/branch,
`sourceRoot`, `sourceSHA`, `expectedRemoteSHA`, `workstreamId`, `profile`,
`retainedRoots`, `knownHistoricalLinks`, and refs `{path,sha256}` for
`packet`, `reviews`, `prior`, `budget`; heavy adds `light` and `native` refs.
All paths are absolute owned regular files, hashes are SHA-256 of exact bytes.
Packet `effectivePins` is a flat unique list `{path,sha256}` of canonical Git
file bytes. Preserve historic effective pins, overriding only reviewed changes.
Packet `admission` pins repository, branch, sourceRoot, expectedRemoteSHA,
retainedRoots and knownHistoricalLinks. Those six values must match the
manifest exactly; operations review must include the whole retained task scope.
Packet workstreamId and budget path/hash must also match exactly; a new ledger
cannot be substituted behind an old review approval.

Reviews contain `candidateSHA256` and distinct named APPROVE reviewers in
`source` and `operations` scopes. Heavy requires actual own-source push CI18
in canonical phase order, all exits zero, four original reporter controls,
seven diagnostic controls/20 mutations bound to source and lock. Native
cleanup must independently bind source/run, `NOT_PRESENT`, rootRemoved and
processReleased. Prior runtime must have measured image reclamation.

Edge resolution uses reviewed runtime-only deno.json/deno.lock inputs, preserving
all20 exact version/SRI pins and explicit duplicate Node types edges. Both workers
copy the same inputs and check them before/after every warm/offline bundle.
The pinned Edgev1.74.3 reads lock snapshots but does not enforce frozen npm
updates; frozen:true is not an independently sufficient guard. Keep strict cache
proof and two actual network-isolated backend replays.

The added CI phase runs the official SHA256-pinned portable Linux native
Edgev1.74.3 with fresh cache and both actual entrypoints. It verifies all20 cache
entries (including explicitly permitted optional metadata) and a fresh-cache
bad-SRI negative control in the actual resolver. Its receipt is bound to source,
input hashes and cleanup; admission compares hashes with current reviewed input.
Native proof does not replace the pinned OCI runtime/backend acceptance.
The archive release identity isv1.74.3; upstream CLI's --version banner uses
CLI crate0.1.0 and embeddedDeno2.1.4. Validate both source-derived banner versions
and the archive SHA256, rather than requiring the release tag in CLI output.
Archive82,997,085B, expanded files245,736,752B were independently inspected.
Expanded listing cap256MiB, cache proof cap512MiB, probe retained cap1GiB with
30GiB minimum free fit the existing whole-CI5GiB operating cap. Download/hash,
archive checks, process timeout and periodic accounting fail closed; these are
application guards, not an OS disk quota. Probe executes no package install
scripts and installs no Windows runtime, Docker or Nix.

Measure C and D >=30 GiB free and retained task scope <=768 MiB. The historical
scope includes this task root, the shared project Git directory, and the
owned execution root on C. One heavy runtime only; no WSL creation. Loop18 GiB,
outside1 GiB and Windows768 MiB total19.75 GiB stay below20 GiB task cap.

## Ledger, deadline and recovery

V1 retains original fixed token/time budgets. A closed V1 never reopens.
V2 `owner-time-only-continuation` requires explicit owner authorization and a
new absolute deadline, `usageLimits:null`, and a pinned CLOSED predecessor.
Keep original start, workstream, batch and execution allowance exactly. Predecessor refs
pin policy/anchor/journal exact SHA-256. Legacy no-head import additionally
requires explicit `legacyWithoutHead:true`; ordinary inspection fails closed.
Spent, usage and reservation identities are inherited rather than copied/reset.

An explicit separate owner grant may add exactly two review rounds to batch A,
up to four total. Set ownerAuthorization.additionalReviewRounds:2 and a
reviewGrantReference identifying that approval; allowance.reviewRounds must
equal the predecessor allowance plus2. The authorization must follow the
predecessor close and its earlier authorization. Publication, CI and backend
allowances cannot change. No grant means every allowance stays unchanged.

Each CLOSED predecessor additionally owns one durable `.successor.json` receipt
binding the exact child policy hash and absolute path. A sibling policy cannot
reuse a grant or fork remaining execution allowance. Missing or changed claim
fails closed. Historical lineage was sealed once from exact already reviewed
policy/journal hashes; those policies, journals and action counters were not
rewritten. Keep successor receipts with the ledger bundle when handing off.

Anchor pins immutable policy. Journal and independent durable head must agree
on hash, sequence and final digest. Missing/stale/pending head, drift or crash
is REFUSED: preserve all files for diagnosis. Never repair by truncating,
deleting a lock, rewriting an anchor or initializing another batch silently.
Do not restore a whole older ledger bundle as current evidence.

Admission reserves37 minutes for publication/CI or42 for backend: the existing
32/37-minute observation limits plus5 minutes to collect/checkpoint. At the
cutoff, cancel a known unfinished run and verify cleanup; do not start another.
The guard refuses admission; it is not an OS quota or an automatic job killer.
Use one bounded watcher per run. Stop all work by the owner's absolute time.

Before stopping, preserve source/patch/test logs, run IDs, remaining cumulative
counts and exact next command/blocker in the docs handoff. Record fresh state
and close the continuation ledger. A later deadline requires fresh owner
authorization and a successor policy, not editing the expired policy.

Cloud collectors in the current execution workspace call
`collectRuntimeDiagnosticFacts` before writing receipts. Keep them and their
hashes in the reviewed operations packet. Public diagnostic facts are bounded
ordinals/counts only; never publish private reports or raw exception text.

The explicit V3 owner grant is limited to batchA total publication2/CI2/heavy3/
review6. It requires the exact approved increments1/1/1/2, an authorization newer
than the predecessor's owner grant and every cumulative reservation, the same deadline and
a closed V2 predecessor. Approval can precede checkpoint closure; it cannot
precede later action reservations. Spent, identities, usage and single-successor
claims persist. V3 cannot grant again from V3, reset counters or extend time.
After closing this V3, a later session needs a new explicit owner deadline and
reviewed guard/spec support for continuing its exact closed history. It cannot
initialize a new root, reuse V2 or silently restart the counters.
