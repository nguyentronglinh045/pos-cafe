#22Oct candidate publication admission

This is a new, explicit publication phase for22Oct2026, ending11:00Asia/Bangkok.
It does not reset or reopen the21Oct V3 budget. The exact policy SHA256
`3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c`, journal
`583f336dafa025e3088e0afc1dad23be68b2324c6e5f37facc11ca230d372880` and spent
counts publication2/CI2/heavy1/review6 remain immutable and CLOSED.

The only executable mutation is one push of an exact committed candidate to
`nguyentronglinh045/pos-cafe`, branch `run/permissions-20261020`. That push is
expected to create automatic light CI; success of the push never proves CI PASS.
There is no main merge, deployment, DB operation, heavy dispatch or retry here.

## Policy, packet and reviews

The external public policy has exactly these fields:

```json
{
  "schemaVersion": "permission-release-phase-admission-v1",
  "phaseId": "permission-release-20261022",
  "repository": "nguyentronglinh045/pos-cafe",
  "branch": "run/permissions-20261020",
  "sourceRoot": "D:/Workspace/pos-cafe-permission-run-20261020/code",
  "sourceSHA": "EXACT_COMMITTED_SHA40",
  "expectedRemoteSHA": "OBSERVED_PREVIOUS_SHA40",
  "deadlineUtc": "2026-10-22T04:00:00.000Z",
  "publicationCutoffUtc": "2026-10-22T03:15:00.000Z",
  "predecessor": {
    "policySHA256": "3c222cb3a5b66a37107522ddce08c2fc8f68e99777f4a921aeb0eba2c936797c",
    "journalSHA256": "583f336dafa025e3088e0afc1dad23be68b2324c6e5f37facc11ca230d372880",
    "counts": {"publication": 2, "ci": 2, "heavy": 1, "reviewRounds": 6}
  },
  "storage": {
    "baselineFreeBytes": {"C": "MEASURED_INTEGER_BYTES", "D": "MEASURED_INTEGER_BYTES"},
    "taskMaximumBytes": 21474836480,
    "reserveBytes": 32212254720,
    "ciMaximumBytes": 5368709120
  },
  "packet": {"path": "ABSOLUTE_PUBLIC_PACKET_PATH", "sha256": "RAW_FILE_SHA256"},
  "reviews": {"path": "ABSOLUTE_PUBLIC_REVIEWS_PATH", "sha256": "RAW_FILE_SHA256"}
}
```

The packet has exactly `schemaVersion=permission-release-phase-packet-v1`,
`sourceSHA`, `admission`, `authors`, `sourcePins`. `admission` copies the policy
except its `packet` and `reviews` references, avoiding a hash cycle. Authors must
include `/root` and `/root/release_gate_feasibility_20261022`, plus every other
candidate author. Each source pin is exactly `{path,sha256}`: a unique repository
relative path and SHA256 of its exact committed Git blob bytes. All three files
of this tool must be pinned and tracked; add the affected candidate files to the
reviewed packet. Do not generate unreviewed replacement pins at dispatch.

Reviews have exactly `candidateSHA256` (the packet's raw file hash) and `reviewers`:
exactly two `{name,scope,verdict}` records, distinct non-author names, scopes
`source` and `operations`, both `APPROVE`. An extra reviewer is refused rather
than ignored. Packet, policy and review records stay outside the code checkout.

Tracked files must match HEAD, HEAD must be the stated source on the fixed branch,
and source must descend from expectedRemoteSHA. The exact15 pre-existing recovery
helper paths listed in `RECOVERY_EXCLUSIONS` must remain untracked. No other
untracked path is accepted. Their contents are never read or staged by this tool.

## Running

Create the fixed evidence directory first as part of reviewed preparation:
`D:/Workspace/pos-cafe-permission-run-20261020/evidence/permission-release-20261022`.
Do not create or delete a claim to rerun a consumed attempt.

```powershell
node --test scripts/permission-release-phase-admission.test.mjs
node scripts/permission-release-phase-admission.mjs ABSOLUTE_POLICY_JSON
node scripts/permission-release-phase-admission.mjs ABSOLUTE_POLICY_JSON --dispatch
```

Without `--dispatch`, the command is read-only. Actual preflight checks Git
source/origin/remote and repository1263057386, exact packet blobs and predecessor files, C/D free bytes,
and GitHub run counts for queued/in_progress/waiting/requested/pending across the
repository. Any unavailable or malformed response refuses admission. It performs
no network in the local fixture tests; actual read-only remote preflight is a
separate check. Node built-ins suffice; install nothing to run this guard.
Git's actual top-level must be the fixed checkout; assume-unchanged/skip-worktree
entries and linked/nonregular pinned files are refused.

The workflow also listens to pull requests. Both live collections therefore
query open PRs for exact head `nguyentronglinh045:run/permissions-20261020` using
the fixed repository's pulls API, `state=open`, `per_page=1`. Only an empty array
proves absence; non-array, malformed, unrelated or nonempty results refuse
publication even when active jobs are zero. This prevents a known open PR from
adding a synchronize CI run to the one reserved push CI. A PR appearing during
the second collection refuses push and leaves the claim spent.

Admission stops at10:15 local, and independently requires37minutes before11:00.
Both C and D must retain30GiB. The reviewed baseline records actual free bytes
before the phase. Sum every positive C/D free-space decrease and reserve5GiB for
light CI; the sum must fit20GiB. This is a conservative admission measurement,
not an OS quota or proof attributing every host write to this task. Existing CI
still enforces its own5GiB operating guard. Do not use this publication guard to
admit later heavy or DB work.

Dispatch writes and flushes the combined publication+automatic-CI claim with
exclusive creation at the fixed path `publication-autoci.claim.json`, before
push. It rereads all evidence, current time, remote/jobs/source/disk and the claim
before one exact-ref push. Changing policy, output or SHA cannot open another
slot. Failure or an unknown push outcome leaves the claim spent. Retain it and
inspect the actual remote/CI result; never delete, rename or retry it. The tool
does not retry, force-push, push tags, invoke pre-push hooks or recurse submodules.

Observation time is captured after all collection I/O. Independent live-clock
checks run after claim-parent metadata immediately before exclusive creation,
and after claim-hash verification immediately before the actual push. Cached
preflight timestamps cannot authorize crossing10:15. Crossing during later
revalidation refuses push while retaining the already spent claim.

## Explicit remediation continuation v2

Preparation of v2 grants no publication authority. The original v1 policy and
`publication-autoci.claim.json` remain immutable and spent; v1 still refuses that
claim. The21Oct CLOSED budget and its counts2/2/1/6 are unchanged.

V2 uses `schemaVersion=permission-release-phase-admission-v2`, the same phaseId,
repository, target `branch=run/permissions-20261020`, deadline/cutoff and storage
caps. Its `sourceRoot` is exactly
`D:/Workspace/pos-cafe-permission-ci-fix-20261022/code`; its additional
`sourceBranch` is exactly `fix/permissions-ci-portability-20261022`. Local branch
facts must match sourceBranch. The target remote expected SHA is fixed to
`38a55aab775e1d70dba4b62d6658f41e28f8aef1`. The new checkout must have zero
untracked files; do not copy or stage the15 historical recovery helpers.

Add exactly this `continuation` object to the policy:

```json
{
  "kind": "OWNER_GRANTED_REMEDIATION_01",
  "parentPolicy": {
    "path": "D:/Workspace/pos-cafe-docs/docs/implementation-log/permission-release-20261022/publication-policy01.json",
    "sha256": "aaf7d7a943927218c1773eb93ba69f308b0e09ec82f9ecff30c87cd4358d6658"
  },
  "parentClaim": {
    "path": "D:/Workspace/pos-cafe-permission-run-20261020/evidence/permission-release-20261022/publication-autoci.claim.json",
    "sha256": "74fd7017a497ddc2da4658798f68756edca3ac637e04ecf0b9009f7282e5a598"
  },
  "additionalActions": {"publication": 1, "ci": 1},
  "ownerAuthorization": {
    "reference": "USER_REPLY_call_ACTUAL_32_LOWERCASE_HEX:item0",
    "authorizedAtUtc": "ACTUAL_OWNER_REPLY_CANONICAL_ISO_Z"
  }
}
```

The example placeholders are deliberately invalid. Missing, PENDING, malformed,
non-item0, pre-claim or future authorization is refused. Use the actual owner's
reply reference and timestamp, after the original claim's02:01:46.917Z timestamp;
do not fabricate these fields from preparation, silence or an agent's message.
The guard validates shape/chronology and pinned records; the two non-author
reviewers must verify that the referenced user reply actually granted this scope.
It does not independently authenticate a conversation reply.

Both parent files are read-only and raw-hash pinned. Their payloads must bind the
same phase, source38, predecessor and exactly1publication/1CI. The storage object,
including baselineFreeBytes, must remain identical to the parent policy: no
growth-budget reset. Packet schema remains-v1; its admission copies the entire
v2 scope, and its authors list includes every code author. Two distinct
non-author source/operations APPROVE records remain required.

Only v2's fixed `publication-autoci-remediation01.claim.json` can be created for
this continuation, in the original phase evidence directory. It reserves exactly
one additional publication plus automatic CI before push. The original claim is
never rewritten. A spent remediation claim is refused independently of policy,
SHA or output changes. The same fresh-clock barriers, no-open-PR/no-active-job
checks, reserves and no-retry/no-main/no-DB/no-heavy rules apply.
