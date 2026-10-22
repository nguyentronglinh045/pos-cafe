# Offline preparation of a fresh permission staging bootstrap

This tool prepares reviewable SQL; it has no database/browser/network client and
no apply command. It does not produce backend PASS evidence. The original project
`kfqjdfwxhkdwihjobpny` remains forbidden. Only staging `ineckiashpwloncxnbqx` is in
scope. Opening a mutation is refused at or after 22 October 2026 10:15 +07; the
hard stop is 11:00 +07. These are application/operator guards, not infrastructure
quotas or a substitute for the owner's authorization.

First capture and independently review the result from
`permission-staging-introspection.sql`. Keep its exact bytes, observed SQL-editor
project URL/ref and one-cell JSON export. Do not invent the provider observation,
its allowlist or review references to make generation succeed. Fixture data in the
tool tests is explicitly synthetic and cannot open a real execution.

An allowlist JSON has these exact top-level keys:

```json
{
  "schemaVersion": "permission-staging-provider-allowlist-v1",
  "projectRef": "ineckiashpwloncxnbqx",
  "observationSha256": "RAW_SHA256_OF_ACTUAL_OBSERVATION_FILE",
  "projectBinding": {
    "projectRef": "ineckiashpwloncxnbqx",
    "sqlEditorUrl": "https://supabase.com/dashboard/project/ineckiashpwloncxnbqx/sql/new"
  },
  "reviewReferences": ["SOURCE_SECURITY_REVIEW", "OPERATIONS_EVIDENCE_REVIEW"],
  "providerCatalog": {}
}
```

`providerCatalog` is the complete observed JSON except `identity`, reviewed as an
exact provider baseline. It is not a wildcard allowlist. Non-extension public or
private relations/functions/types, an existing hook/recovery role, existing Auth
users/buckets/objects, missing pgcrypto functions, unsupported execution role or
missing Realtime publication are rejected. Provider differences require analysis
and review of a new candidate; the generator does not repair provider ACLs.

Obtain the current source fingerprint with `readSource().sourceFingerprint` from
the module. It binds the actual local HEAD and raw working-tree bytes; it is not
a canonical Git-blob fingerprint or a claim of CI equivalence. Its scope is every
tracked file plus the six new introspection and
bootstrap files. Unrelated untracked recovery helpers are not implicitly included.
Freeze the source before preparation; a new commit, byte change, or review delta
requires regeneration and review. Use a fresh Node process after source changes.
The input JSON has these exact keys:

```json
{
  "schemaVersion": "permission-staging-bootstrap-input-v1",
  "projectRef": "ineckiashpwloncxnbqx",
  "sourceFingerprint": "CURRENT_SOURCE_FINGERPRINT",
  "observation": {"path": "ABSOLUTE_OBSERVATION_JSON", "sha256": "RAW_SHA256"},
  "allowlist": {"path": "ABSOLUTE_REVIEWED_ALLOWLIST_JSON", "sha256": "RAW_SHA256"},
  "nonce": "32_LOWERCASE_HEX_CHARACTERS_FOR_THIS_CANDIDATE"
}
```

Use an existing, empty task-owned output directory; writes are exclusive. The
operator must preserve any partial output after a filesystem failure and inspect
it; the tool never deletes, overwrites or retries output automatically.

```powershell
node --test scripts/permission-staging-bootstrap.test.mjs
node scripts/permission-staging-bootstrap.mjs ABSOLUTE_INPUT_JSON ABSOLUTE_EXISTING_OUTPUT_DIRECTORY
```

The three output files are `bootstrap.sql`, `bootstrap.manifest.json`, and
`reconcile.sql`. The manifest pins source, controller, 28 raw SQL files, normalized
fragments, supplemental controller commands, observation, allowlist, nonce, target,
deadline and the predecessor preflight claim. Synthetic collector calls to
`applyActivationSteps()` recover the current mutation statement order without a
database. Their fabricated read responses are **planning only**, never readiness
or execution evidence. Live SQL guards replace those planning responses.

The generated bundle is **one top-level DO statement**, run once in its implicit
transaction, with no outer BEGIN/COMMIT or swallowed exception. PostgreSQL executes
this transient function once; a command error aborts its implicit transaction.
See [DO](https://www.postgresql.org/docs/17/sql-do.html) and
[protocol flow](https://www.postgresql.org/docs/17/protocol-flow.html).
At entry it rejects a disabled/server statement timeout over 120 seconds; setting
a new statement timeout inside an already running DO is not claimed to restart
its timer. A 5-second lock timeout bounds future lock waits, and wall-clock checks
before each fragment and final completion reject elapsed time of 50 seconds or
the hard deadline. An individual running fragment is still bounded by the
pre-existing server statement timeout, not those between-fragment checks.
The DO acquires an advisory lock and provider table SHARE locks, checks fresh
identity/catalog/data twice before its first persistent write, creates an API-inaccessible
marker, then baseline001–016, prepare,017, employees.role conversion, ten candidate
fragments and legacy teardown. It maps no owners because the store set is empty.
Raw source hashes/lengths remain exact evidence for this checkout. The generator
strips outer BEGIN/COMMIT with the shared stripper and applies the explicit
`CRLF_TO_LF` transform to fragments and final bootstrap/reconciliation outputs.
The manifest records both ordered raw-file and canonical-LF-file identities,
final LF hashes/lengths and transform labels. Tests freeze the ordered canonical
LF bundle identity so Windows checkout conversion does not break Linux checks.
These identities do not replace a full source/HEAD binding. The tool does not create fake Auth/Storage services,
change provider grants, seed Auth users, deploy Edge functions, or launch suites.

**Browser apply remains BLOCKED** in every generated manifest pending both review
approvals and proof that the complete editor contents match the final LF SQL byte
count/SHA256. If the editor uses CRLF, record its raw byte count/hash separately,
then apply exactly the declared `CRLF_TO_LF` transform and compare LF bytes/hash.
No trimming, rewriting or other semantic normalization is accepted. One
dollar-quoted top-level statement avoids depending on a browser
client preserving a connection across multiple SQL statements. Record the
documented Dashboard 60-second request maximum separately; its timeout does not
prove cancellation/rollback of the database command. The approximately 489KB raw bundle grows
with guards and the exact observation; generation refuses output over 1,000,000
bytes. This size check is only a preparation bound, not proof of the UI limit.
Using a supported browser API to fill from a local file avoids token pasting,
but does not itself prove no truncation. Do not press Run to discover that property
using a mutation. If unavailable, prepare a separately reviewed TLS database-client
transport; do not split this bundle across statements or commits.

The SQL-editor project binding is external evidence: the SQL catalog cannot
independently attest a Supabase project ref. The SQL identity/database OID and
locked observed catalog must match the reviewed observation. Advisory locking
does not stop a different operator doing uncoordinated DDL; keep operational
exclusive use of this new staging during application.

The DO has no result rows; a "Success" UI response is not a readiness receipt.
Its committed marker has state `COMMITTED_NOT_READY`, never full backend PASS.
After any application response, timeout, disconnection or ambiguous response,
preserve all evidence and do not replay the bundle. Execute only the separately reviewed
read-only `reconcile.sql`; a matching catalog comment is an observation, not a
business-test PASS. An absent marker does not by itself prove rollback. Inspect
the complete catalog/provider baseline and transaction outcome before deciding
any recovery. Never reset/drop the cloud database to obtain a clean retry.

After a confirmed commit, strict REST/Auth/Storage/Realtime/Edge checks and all
required full-suite rows remain gates. Keep the native PostgreSQL16 requirement.
Do not push main unless the user's full gate passes; no Vercel or production
deployment is authorized by this workflow.
