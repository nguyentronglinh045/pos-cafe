# Bounded permission runtime iterations

Run from the owned source checkout. This tooling does not authorize merge,
production changes, Supabase writes, a new WSL distro or extra test coverage
exceptions. Existing CI17 and backend acceptance gates remain required.

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
`source` and `operations` scopes. Heavy requires actual own-source push CI17
in canonical phase order, all exits zero, four original reporter controls,
seven diagnostic controls/20 mutations bound to source and lock. Native
cleanup must independently bind source/run, `NOT_PRESENT`, rootRemoved and
processReleased. Prior runtime must have measured image reclamation.

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
