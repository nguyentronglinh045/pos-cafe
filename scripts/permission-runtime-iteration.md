# Bounded permission runtime iterations

## Image hook failure and JWT fixture compatibility

When `candidate-images-service` fails in `beforeAll`, its required test may be
reported as skipped. Preserve the failed hook as the primary diagnostic origin;
the skipped row does not identify the setup failure. Public receipts expose only
bounded hook-step, JWT-subreason, algorithm, HTTP-status and source-location
numbers defined in `permission-runtime-error-facts.mjs`. Zero means unknown.
Never export the private exception, stack, JWT, signing key or SQL.

The image expiry fixture accepts the owned Auth token's HS256, ES256 or RS256
header and binds its subject, role and audience to the fixture. It verifies the
original token with the owned Auth `/auth/v1/user` endpoint (five-second timeout,
no redirects, exact fixture identity); HS256 also retains its local HMAC check.
It then signs a new HS256 pair with the owned GoTrue secret and an explicit
header without the original asymmetric `kid`. Claims and `iat` are equal; only
`exp` differs. The actual positive 200/bytes and expired 401/no-effects checks
remain required. This changes no Auth configuration or application acceptance.

CLI v2.117.0 defaults to ES256 signing keys, so requiring its original Auth token
to be HS256 is incompatible. That source finding does not retroactively reveal
the header or hook substep of a reclaimed failed run. Keep its FAIL and consumed
action, review the repair, then run fresh CI and the whole T04 on the new source.
Do not reuse a prior source's PASS or retry the old source without new evidence.

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

## Candidate E2E diagnostics (six-test file)

The candidate reporter keeps all six source-fixed test identities, even though
the acceptance catalog requires two identities from that full file. Public
`t04CandidateTestNState` ordinals are 0 UNKNOWN, 1 passed, 2 failed, 3 timedOut,
4 interrupted, 5 skipped, 6 pending. N follows source order: 1 activation,
2 live cashier permission propagation, 3 waiter administration visibility,
4 menu/floor/settings persistence, 5 four-role parity, 6 clear-demo preservation.
The canonical file, full names and project are pinned in
`permission-runtime-candidate-diagnostic.mjs`; arbitrary titles never leave the
private runner report. Per-test attempts, failure line and known error ordinals
are exported. Matcher9 appends `toHaveValue`; original matcher1..8 retain meaning.

Inventory status1 means all six identities were discovered and have exactly one
result row; status2 means missing rows; status3 means duplicate or unknown
identities. It is not acceptance PASS. Missing/unknown/duplicate counts remain
explicit. All discovered tests must still pass once under the existing stage
validator; skipped, retried, expected-failure, hook or runner errors fail closed.
Playwright hook errors are observed from `onStepEnd` hook steps, not assumed zero.

Only the body of the exact `candidate-e2e-diagnostics` JSON attachment, schema
`candidate-e2e-diagnostics-v2`, is read,
up to16KiB. A defined file path is refused (the runner may include `path:undefined`
for an in-memory body). Duplicate attachments, wrong source identity, extra keys,
unknown schema or out-of-range fields produce diagnosticStatus2 INVALID; absent
attachments produce0 UNKNOWN; valid attachments produce1. No attachment file,
message, credential, raw DB/API value or request URL is opened/exported.
The producer attaches only on failed, timed-out or interrupted cases. Successful
cases discard transient diagnostics; their six fixed identities/results/attempts
remain in the ordinary reporter inventory. An absent attachment means UNKNOWN,
not false or NOT_RUN, including when the ordinary test result is PASS.

Five fixed checkpoints are projected to bounded scalar fields:
1 after settings persist settles, 2 pre-seed, 3 post-seed/pre-clear,
4 post-clear, 5 failure snapshot. Each checkpoint has Reached0 NOT_REACHED or1;
unreached values remain0 UNKNOWN. Boolean facts use0 UNKNOWN/1 false/2 true.
Counts use0 UNKNOWN/1 zero/2 one/3 many. DB/API readState uses0 UNKNOWN/1 success/
2 error; section uses0 UNKNOWN/1 info/2 demo/3 other. Query-state observations
describe the test's DOM and passive request evidence, not React internal state:
0 UNKNOWN/1 loading/2 error/3 fetching/4 observed settled. Pre-seed API observations
may be UNKNOWN before an employee session exists. Probes never log in, mint a
token or issue an extra authenticated read to fill that gap. Equality to a persist
snapshot not established in that same test remains UNKNOWN; no raw names are
persisted or inherited from another case. A main-frame navigation invalidates
passive API observations from the previous employee session.

The clear test establishes its own changed custom name through the normal owner
UI and real save RPC, closes/reopens and checks the exact value, then reloads to
passcode before requesting initial seed. Checkpoint1 belongs to that write;
checkpoint2 is still pre-seed. The exact custom value is checked after seed and
after clear, alongside the existing suffix, menu and employee preservation
oracles. All six cases still must pass; this setup cannot hide an earlier failure.

One optional test4-only image record projects seven `candidateImage*` facts,
without multiplying them across settings checkpoints: PhaseOrdinal1 saved detail
or2 reopened detail; Observed0 unavailable/1 DOM observed; SelectionCount and
ImageCount use the count encoding above; SelectionMatches, SrcMatches and Decoded
use the tri-state encoding. Selection matches the exact saved item ID, src matches
the exact persisted URL, and decoded means complete with positive natural width.
The snapshot is taken at failure time after configuring the expected image.
Zero/multiple images leave src/decode UNKNOWN; a refused/closed-page probe leaves
all image observations UNKNOWN. Raw item IDs/URLs stay in test memory. The target
is cleared after both image assertions pass, so unrelated later failures do not
export an obsolete image snapshot. Probes make no network or auth requests.

Milestone ordinals: 1 test-start, 2 owner-login, 3 image-selected,
4 menu-upload-save-started, 5 menu-RPC/UI-settled, 6 image-transport-assertions,
7 first-image-decoded, 8 menu-reopened, 9 reopened-image-decoded,
10 floor-save-settled, 11 floor-reopen-asserted, 12 settings-save-started,
13 settings-save-settled, 14 settings-reopen-asserted, 15 consumer-image-decoded,
16 consumer503-placeholder, 17 consumer-receipt-asserted, 18 preseed,
19 seed-prepared, 20 seed-committed, 21 clear-blocked-asserted,
22 open-orders-settled, 23 preclear, 24 clear-RPC-ok, 25 clear-dialog-hidden,
26 settings-drawer-hidden, 27 settings-reopened, 28 name-suffix-asserted,
29 clear-final-asserted, 30 clear-settings-setup-started,
31 clear-settings-setup-verified; 0 UNKNOWN. These identify locations, not a
numeric time sequence (clear setup30/31 precedes18). Check the exact source.

The existing failed diagnostic selftest group includes real Playwright controls
for persist+clear failure, roles+clear failure and beforeAll-hook failure, without
a browser/backend. It verifies actual attachment transport, source binding,
failure-stage rejection, public projection and collector output. Original4
reporter groups and7 diagnostic groups/20 transport mutations remain exact;
these nested controls must also pass. Fixed candidate facts remain below64KiB,
within unchanged1MiB report/marker limits. Run the existing reporter selftest
before a newly authorized whole T04; a selftest PASS is not a backend PASS.

## Isolated failure receipt transport

T04 and service workers use the same 128KiB UTF-8 serialized receipt limit at
both writer and reader. The source-derived conservative maxima include both a
primary and a cleanup failure, every allowlisted numeric fact at MAX_SAFE_INTEGER,
the longest fixed enums, a20-digit run ID, attempt1000 and source SHA40. Current
bounds are100,551 bytes for T04 and106,305 for service; changing the allowlists
beyond the shared cap refuses at module load. Actual per-field bounds remain
independently enforced. This diagnostic limit does not alter stage acceptance,
retries, timeouts, the32KiB D12 counts receipt or the1MiB report/marker limits.

The file must have a canonical path and root-owned parent with no group/world
write permission, be regular,
root-owned, private-mode and single-link on the parent's device. No-follow fd
reads stop at cap+1. Pre/post inode, device, ownership, mode, link count, size,
timestamp and path checks reject replaced or changing files. JSON, schema, run,
attempt and source binding must pass before an inner failure is recovered.

On a failed namespace invocation, public failure.facts retains only these finite
receipt observations: isolatedReceiptReadOrdinal1 VALID,2 MISSING,3 OVERSIZED,
4 UNSAFE,5 MALFORMED JSON,6 BINDING/SCHEMA,7 IO,8 UNSTABLE. isolatedReceiptBytes
is the observed size saturated at131073; isolatedReceiptBytesCapped1 means the
observed size exceeded131072, otherwise0. Zero bytes can mean no size was
available. A refused receipt preserves the original outer command/exit/operation;
it does not invent an inner cause. These common transport facts are in the safe
failure envelope; diagnosticFacts[] continues to hold profile-prefixed facts.
Missing diagnostics do not establish that business stages were NOT_RUN.
Image ordinal/pull-attempt facts are emitted only for the current IMAGE_PULL,
IMAGE_TAG or IMAGE_INSPECT operation; a completed prefetch counter is not a
failing-image identity for a later namespace failure.

Each real reporter control writes isolated-receipt-control.json with source SHA,
run/attempt, complete-envelope SHA256/bytes, cap and coverage/provenance. Linux CI
requires a real root-owned file roundtrip through the production reader and the
unchanged outer failure-evidence gate. Native node-tools cases also cover both
failures, cleanup-only, exact limits, binding/schema drift, malformed/missing,
owner/mode/link/path refusals and deterministic replacement/growth. Windows
controls report WINDOWS_REFUSAL_ONLY; Unix ownership success is not executed.
After Linux assertions, the control helper returns only its captured fresh
fixture trees to the original caller's UID/GID with private modes, child first
using identity-checked no-follow descriptors and fchown/fchmod. Symlinks receive
lchown only. The negative writable-parent fixture is resealed through its open
directory descriptor before handback. The nonroot caller verifies it can inspect/read
them, so the existing reporter cleanup and CI size accounting still work.
This handback happens after the root-owned production-reader proof; it does not
relax that reader or claim the handed-back fixture still meets its root guard.
Synthetic control directories are root0755 during proof, allowing the existing
nonroot CI allocation monitor to traverse them even while assertions run. Their
receipt files remain root0600. Actual runtime setup still uses private0700
directories; no resource monitor exception or excluded storage root is added.
The control child sets its local umask022 before creating synthetic directories.
Before handback, it runs the real project-ci allocatedBytes as the captured
caller's UID/GID while root-owned fixtures remain present. Post-return traversal
then checks caller accessibility. Neither check relies on the5s monitor timing.
New small control directories below artifacts/isolated-receipt-control-* and
reporter-control directories remain until scoped cleanup is authorized.

For recurring failures, retain compact source/run/attempt-bound collected JSON
and the safe workflow log by run in the task evidence directory. Compare finite
receipt outcome, bytes and inner/original provenance before attributing a cause.
The owned runtime's private receipt is reclaimed by the existing cleanup flow;
the public finite outcome survives in the safe failure log. These failure-only
guards remain; no temporary raw logging, secret export or continuous probe is
needed after the defect is verified fixed. A successful run emits no receipt
failure trace.
