# Time-only dispatch budget

`permission-batch-budget.mjs` records immutable policy, cumulative history and
one-shot dispatch intents. `permission-runtime-admission.mjs` performs the live
source, review, CI, clock, disk and GitHub checks before external actions. Use
the admission entry point for publication and backend dispatch; a budget
reservation by itself does not authorize an external action.

V1–V3 remain readable under their original contracts. V4 supports a new owner
grant through data without editing dates, source hashes or checkout paths in
the executable. Policy, evidence and claims must stay at their original paths.
Do not delete or rename a spent claim to retry it.

## V4 policy

All JSON references have `{ "path": "absolute regular file", "sha256":
"64 lowercase hexadecimal characters" }`. Files must be regular, non-symlink,
single-link and bounded in size. Hashes cover raw bytes. Placeholder references
are invalid; record the actual owner's reply and recording time before init.

| Field | Contract |
| --- | --- |
| `schemaVersion` | `permission-batch-budget-v4` |
| `workstreamId`, `batch`, `originalStartedAtUtc` | Exactly inherited from CLOSED predecessor |
| `phaseId` | New unique lowercase alphanumeric/hyphen identifier, 1–100 characters |
| `budgetMode`, `usageLimits` | `owner-time-only-continuation`, `null` |
| `deadlineUtc` | Absolute parseable UTC timestamp granted by owner |
| `ownerAuthorization` | `{reference,recordedAtUtc,receipt:{path,sha256}}`; reference and recording time match receipt |
| `phaseActionLimits` | `{publication,ci,heavy,reviewRounds:null}`; publication=ci; action limits are nonnegative safe integers≤10000 and must match actual grant |
| `scope` | `{repository,branch,sourceRoot,profiles}`; exact reviewed repository/ref/real root and unique whole-profile allowlist |
| `storage` | Inherited `{baselineFreeBytes:{C,D},taskMaximumBytes,reserveBytes,ciMaximumBytes}`; 20GiB total, 30GiB free reserve, 5GiB light CI |
| `predecessor` | `{path,policySHA256,anchorSHA256,journalSHA256,headSHA256}`; immutable CLOSED parent |
| `legacyBridge` | First V4 after V3 imports the two original publication policy/claim pairs; later V4 uses `[]` |

The owner receipt includes `reference`, `recordedAtUtc`, `authorizedDeadlineUtc`,
a nonempty `answer` and `phaseActionLimits` with
`candidatePublication`, `candidateCi`, `heavyProfiles`, `reviewRounds:null`.
The limits and deadline must match policy. Recording time is not a claimed
exact user-click timestamp. Two independent non-author reviewers verify that
the actual reply grants the recorded scope; matching JSON fields do not
authenticate a conversation reply.

The whole-profile allowlist consists of `SUPABASE_T04`, `SUPABASE_T02`,
`PIN_ONBOARD`, `PIN_RACE`, `PIN_EXPIRY`, `PIN_IDENTITY_SERVER`,
`PIN_IDENTITY_ONBOARDING`, `PIN_CANARY`. A grant can select a subset; it cannot
introduce a new fixture or partial test selection.

Each first-V4 bridge item is `{policy:{path,sha256},claim:{path,sha256}}`.
The adapter recognizes the original publication claim v1 followed by remediation
claim v2, validates their parent linkage, source/phase/policy/action pins and
storage baseline, and adds only each claim's own publication+CI pair. Repeated
predecessor counts inside those payloads are not added twice. Missing, duplicate,
reordered, changed or replayed imports refuse initialization. For the existing
history, the expected derived historical totals are 4 publication, 4 CI,
1 heavy, 6 review rounds. These totals are checked from source records, never
seeded as substitute counters.

Initialize only after policy/packet review:

```powershell
node scripts/permission-batch-budget.mjs init ABSOLUTE_POLICY_PATH
node scripts/permission-batch-budget.mjs check ABSOLUTE_POLICY_PATH
```

Initialization consumes the predecessor's exclusive successor slot. A sibling
policy at a different path cannot split counters. Old unused allowances expire;
only the new phase's actual owner grant creates new action slots. Candidate
changes within a phase use the same ledger. A later grant requires a new unique
phase, actual reply and CLOSED parent, and inherits all total spent, failed
source hashes and imported identities.

## APIs and accounting

`inspectBatch(path,{now,reserveMs,reservationId})` retains the legacy `counts`
field as cumulative totals and adds V4 `schemaVersion`, `phaseId`, `scope`,
`storage`, `historicalCounts`, `phaseCounts`, `totalCounts`, `pending` and
`blockedSources`. Without an exact own reservation ID, a pending intent refuses
admission. An exact own ID permits post-claim revalidation of that one intent;
it does not bypass time, scope or source checks.

`assertBatchScope(path,context)` validates policy scope, source hash, failed-source
status and current admission before claim. Context has
`{repository,branch,sourceRoot,sourceSHA,profile?,now?,reserveMs?,reservationId?}`.

`reservePublicationPair(path,context)` atomically spends one publication and one
automatic CI in one durable journal event. `reserveHeavyProfile(path,context)`
spends one whole-profile slot. Both require an `identity` of 1–100 characters
from letters, digits, underscore, dot, colon or hyphen, revalidate scope inside
the exclusive ledger lock, return `reservationId`, and require zero pending
intents. Publication stores `profile:null`; heavy stores the exact whole profile.
The same source/profile cannot be retried under another identity. V4's old
single-action `reserveBatchAction` API permits review recording only; it cannot
split a publication+CI pair or bypass dispatch checks.
Read-only review recording may continue while CI/heavy is PENDING. It ignores
only the pending-dispatch reason, keeps the clock/CLOSED checks, increments the
review counter and never releases the intent or opens another dispatch slot.

An uncertain external result leaves the intent PENDING and spent. Restarting
the process or opening another chat cannot release it. One pending intent also
closes the GitHub-listing delay window between dispatch and a visible run.
Workflow concurrency provides another physical runtime guard.

## Terminal settlement

Collect current GitHub run metadata and actual source-bound receipts first.
Then call:

```js
settleBatchDispatch(policyPath, {
  reservationId, sourceSHA, profile, runId, attempt: 1, conclusion,
  terminal: { path: terminalProofPath, sha256: terminalProofSHA256 }, now
});
```

`profile` is null for publication. Known terminal conclusions are `success`,
`failure`, `cancelled`, `timed_out`; UNKNOWN never clears a pending intent.
Attempts above 1 are refused because rerun is not an automatically authorized
retry. The terminal proof contains:

```text
schemaVersion = permission-batch-terminal-v1
reservationId, kind = publication|heavy, sourceSHA, profile = null|whole profile
runId = positive decimal string, attempt = 1, conclusion
metadata = raw-pinned GitHub Actions run API JSON reference
observation = raw-pinned CI summary or backend collector wrapper reference
reclaim = raw-pinned actual cleanup receipt reference
```

Metadata must bind `id`, `head_sha`, `run_attempt`, `status=completed`,
`conclusion`, `path`, `event`, repository/head-repository name+ID and exact
`head_branch` to the reserved action. Publication uses
`.github/workflows/ci.yml`/`push`; heavy uses `backend.yml`/`workflow_dispatch`.
The coordinator must retrieve these facts from GitHub immediately before
settlement; a handwritten collection of positive booleans is not a substitute.

Successful publication additionally requires the actual same-source/workflow
CI18 PASS summary. Its reclaim receipt must be
`permission-pg16-reclaim-v1`, `NOT_PRESENT`, `rootRemoved=true`,
`processReleased=true`, with matching source/run. Failed publication still
requires actual metadata and cleanup evidence; absence stays blocked.

Heavy observation uses the existing `t04-observed-checkpoint-v1` or
`service-observed-checkpoint-v1` wrapper. It must bind source/run/profile,
conclusion, raw log hash and exactly one reclaim record matching the pinned
cleanup receipt. Cleanup requires `permission-ci1-reclaim-v1`, `RECLAIMED`,
`imageUnlinked=true` and a positive measured host-free delta. Success additionally
passes the existing full T04/service evidence renderer and exact source/run/
attempt/PASS binding. A stage-count-only claim does not satisfy it. Failure
still needs the actual wrapper and reclaim evidence before releasing the slot.

Settlement never refunds action counters. A failed/cancelled/timed-out source
is blocked for dependent dispatch; a fixed new source must pass the full local,
review and own-source CI gates within remaining phase slots. Terminal proof
references are rechecked on ledger reads; later evidence drift fails closed.
A pending ledger cannot be closed to create another grant and overlap runtime.

## Optional PR/main CI bookkeeping

An additional owner grant can be attached before initialization as
`postGateCi:{grant:{path,sha256},limits:{pull_request:1,main_push:1}}`.
The raw receipt must independently grant exactly two additional automatic CI,
match the absolute deadline, and record its own reply/recording time. It does
not increase candidate publication/CI/heavy slots. A later phase cannot replay
this additional grant.

`reservePostGateCi(path,{...context,purpose,packet,reviews})` records a CI-only
intent for `pull_request` or `main_push`. It opens no PR, performs no merge/push
and contains no external-action controller. The coordinator must check fresh
remote/base/head/branch protection and the live clock before the authorized
external action. It shares the same single pending slot and strict 42-minute
reserve. Every purpose has one slot; uncertain/failing actions remain spent.

`phaseCounts.ci` continues to mean candidate automatic CI. The separate
`postGateCiCounts` reports PR, main and total CI-only spent. `counts.ci` and
`totalCounts.ci` include both categories plus history; successors inherit that
real total. `ciSettlements` exposes pinned successful/failed CI-only settlement
records needed to bind the later main intent.

The raw-pinned packet uses `permission-postgate-ci-packet-v1` and binds
`repository`, candidate `sourceSHA`, `candidateTreeSHA`, `purpose`, `authors`,
`acceptance:D19/R0/R1`, `fullGate` reference and `mapping`. Two distinct
non-author source/operations APPROVE records must bind the exact packet hash.
The `permission-fullgate-reviewed-v1` attestation requires candidate source,
`status:PASS`, `stageCount:35`, `requiredIdentities:760`, `requiredSkip:0`,
`retry:0`, twelve unique PASS obligations with individual `evidence` references,
`inventory` and `receipts` references, and `workflowSHA256`. Every listed raw
reference is rehashed. Obligation IDs must equal the existing twelve `gaps.field`
values in `tests/permissions/full-oracle-contracts.json`, with none renamed or
replaced. This is bookkeeping for an independently verified full
gate, not a replacement fullgate aggregator or a count-only acceptance route.

Mapping fields are `targetBranch:main`, reviewed `baseSHA`, `candidateCommit`
and `baseCommit` raw Git object references. Main additionally requires
`prNumber` and `prSettlement` copied exactly from
`inspectBatch(...).ciSettlements.pull_request`, whose conclusion must be
success for this candidate. Its base and candidate tree must match the PR
packet. Capture and revalidate the actual current branch state before acting;
the budget tool does not query GitHub or authorize stale-base merges.

CI-only terminal proof extends the normal proof with `kind:ci`, `purpose`,
`testedSourceSHA`, `testedCommit`, `pullRequest`, `workflowCommit`,
`workflowTree`, `workflowBlob`, and `mainRef` for main. These are raw-pinned
API/file references. `sourceSHA` remains the fullgate candidate; cleanup and CI
summary must bind the actual tested source and run instead.

For PR, the summary's `prHeadSHA` must equal the candidate. Existing
`sourceBinding` validates the actual merge commit's parents as
`[reviewedBaseSHA,candidateSHA]`. The actual tested Git tree must equal the
fullgate candidate tree. Record the observed run API head role explicitly as
`metadataHeadRole:candidate|tested_merge`; it must match the corresponding
concrete hash. Do not assume candidate, run-API head and tested merge SHA are
identical. Raw PR head/base/repository/ref data must match the reviewed mapping.
Raw run repository/head-repository IDs and purpose-specific `head_branch` must
match too. PR run metadata must contain exactly the observed PR number/head/base;
main run PR associations may be empty, but contradictory associations refuse.

For main, the raw PR must be merged with the exact reviewed number/head and
`merge_commit_sha` equal to actual tested source; current `refs/heads/main`
and run metadata must bind that commit. The actual tree remains identical to
the candidate tree, event is push, and summary `prHeadSHA` is null. A different
tree cannot reuse candidate acceptance. This route uses a merge commit with
actual parents exactly `[reviewedBaseSHA,candidateSHA]` and matching frozen PR
base; it does not silently accept rebase/squash or a changed base.

Workflow SHA may differ by event. A raw workflow commit and recursive tree
must bind the `.github/workflows/ci.yml` Git blob; the blob's raw SHA256 must
equal the reviewed fullgate workflow pin. CI summary, metadata, event and
source binding still apply. Success requires full CI18 and actual source-bound
native cleanup; attempt2, unknown, missing mapping or missing cleanup cannot
release a pending intent. No claim is made that backend tests executed again
on the merge commit; exact tree equivalence and actual CI binding are explicit
reviewed evidence.

## Runtime admission manifest v2

The new manifest keeps the reviewed repository, target remote ref, exact
candidate SHA, real source root, retained roots, prior reclaim, budget, packet,
two reviews and applicable CI/native/Edge references. In addition:

- `manifest.local` references a pinned `permission-node-local-v1` receipt with
  exact `sourceSHA`, `wholeTrackedSuite:true`, `tests>=904`, `pass===tests`,
  `fail:0`, `skip:0`, `exitCode:0`.
- `packet.localSHA256` equals `manifest.local.sha256`.
- `packet.sourceSHA` equals the manifest candidate.
- `packet.authors` lists every author explicitly. Required source/operations
  reviewers are distinct and neither is an author.

Local receipts record the actual command, source and observation times; tests
must cover the whole tracked Node suite plus the new guards. A targeted test
run cannot be relabeled whole-suite evidence. Candidate publication uses these
local checks and two APPROVE reviews, then push creates automatic CI. Only
heavy dispatch requires own-source full CI18, reporter controls, native cleanup
and Edge bindings; requiring CI of an unpushed SHA would deadlock publication.

Runtime admission collects repository-wide active backend runs, reserves one
intent, recollects live facts with its own reservation ID, checks a fresh clock
and only then invokes one external action. A post-claim refusal leaves the
intent spent; investigate and preserve its evidence rather than retry it.

## Time, resources and limits

Every V4 dispatch reserves at least 42 minutes. The check is strict:
`now + reserveMs < deadline`. The exact boundary refuses. The 42-minute interval
includes a 35-minute job plus 7 minutes buffer; it is not 35+42 minutes per job.
It is an admission guard, not an operating-system quota or automatic process/
model kill at the deadline. Keep time to collect evidence, reclaim owned runtime
and write the handoff before the owner's absolute stop.

The existing source, full coverage, disk, privacy, preservation and release
gates remain. No hosted DB mutation, original DB write, Auth setting change,
Edge deployment or production deployment is granted by this budget. Existing
isolated backend fixture contracts remain applicable. Do not replace them with
a populated staging database or a hosted adapter.

Additional PR/main automatic CI consumes separate authority beyond candidate
publication+CI slots; do not silently expand the grant or skip required checks.
The hash chain/head detects independent journal corruption and suffix rollback,
not deliberate coordinated replacement of all trusted files. Preserve policy,
head, journal, successor claim and raw-pinned receipts together as evidence.
