# Protected frontend Preview

Run `.github/workflows/frontend-preview.yml` manually on `main` only after the
required application/backend acceptance and independent reviews are complete.
Supply the exact current main SHA and its successful **push** CI run/attempt.
PR CI, an ancestor's CI, or a mock smoke result does not replace those gates.
Keep the Preview environment approval and existing project protection enabled.
The Preview workflow never promotes a deployment. The separate manual workflow
`frontend-release.yml` publishes the approved main SHA on `pos-cafe-azure.vercel.app`
as a public demo backed by the same staging database. Its protected Production
environment supplies VERCEL_TOKEN, the secret POS_PUBLIC_DEMO_OTP_INGRESS_KEY
and the public variable POS_PUBLIC_DEMO_CLIENT_KEY. The release verifies staging
readiness and the project/domain, sets Production-only demo variables, then
checks the final domain binding. Automatic Git deployment stays disabled.
To recover from a failed run, inspect its deployment ID before retrying the same run.
A rerun reconciles the existing deployment for that run. For a terminal build error, fix the cause and start a new approved dispatch.
For an incident after traffic changes, use Vercel Instant Rollback to restore the previous deployment.

`data_mode` is an expectation checked before creating a deployment. It does not
write Vercel settings. Default `mock` requires no `POS_PREVIEW_*` variables.
For `supabase`, configure exactly these three public **Config** environment
variables on the pinned Vercel project, with target **Preview only**, no branch
override or custom environment:

| Key | Value |
| --- | --- |
| `POS_PREVIEW_DATA_MODE` | `supabase` |
| `POS_PREVIEW_SUPABASE_URL` | `https://ineckiashpwloncxnbqx.supabase.co` |
| `POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY` | That project's public `sb_publishable_...` key |

These values become public browser configuration. Never use a secret/service key.
The deploy helper accepts `plain` rows and dashboard Config rows stored as
`encrypted` with `visibility: config`. It reads the latter by individual ID only
after validating the complete list, the three keys and their Preview-only scope.
It checks the returned identity and scope, then validates the public values.
Partial lists, duplicate or extra `POS_PREVIEW_*` keys, Secret rows and shared
Production scopes fail closed. Existing `VITE_*` and runtime secrets stay outside
the individual reads.
Supported wrappers are `envs` alone, `envs` plus `hiddenProductionEnvCount: 0`,
or `envs` plus a single complete page with `count` equal to the returned rows
and both `next` and `prev` null. Hidden or partial lists are refused.
The build child receives only the validated public Vite values and a small OS
environment allowlist; GitHub and Vercel credentials are excluded.
The build sets `VITE_OWNER_PROVISIONING=1` for the validated `supabase` mode.
Only the Supabase-backed Protected Preview build also sets `VITE_FORGOT_STORE_KEY=1`.
For the forgotten-key rollout, use this sequence on the pinned staging project:

1. Verify the T06 schema, the existing Edge function and the signed worker.
   Check that `POS_CAFE_FORGOT_STORE_KEY_ENABLED` and
   `POS_CAFE_STORE_ROTATION_ACCESS_TOKEN_TTL_SECONDS` are both absent.
   An empty rotation value fails startup and does not count as absent.
2. Apply the reviewed SQL in order, using `owner-store-key-rotation.sql`,
   `owner-store-key-rotation-otp.sql`, `owner-store-key-rotation-mail.sql`,
   then `owner-store-key-forgot.sql` and `owner-store-key-forgot-receipt.sql`.
   Verify the service-only RPC grants, the mail queue and cleanup indexes, and
   that the two-argument forgot-key enqueue RPC is absent.
3. Deploy the reviewed `owner-provisioning` bundle with both flags still
   absent. Probe the existing T06 endpoint and verify that a signed worker
   invocation succeeds with the new bundle.
4. Set only `POS_CAFE_FORGOT_STORE_KEY_ENABLED=1`. Verify startup and signed
   worker health again, then create the protected Supabase Preview.
5. Use the protected Preview in both designated browser profiles. The
   same-origin gateway requests keep the Vercel protection cookie. The client
   confirms the receipt after reading the public `202` response and rendering
   the generic status. Verify that a worker run before confirmation leaves the
   request out of the mail queue. Establish the paired POS session before
   requesting the key and compare its session ID after mail delivery. Keep the
   key, email and credentials out of evidence.

For an upgrade from the earlier forgotten-key deployment, verify that legacy
intake and queued/sending forgotten-key mail have drained. Disable only the
forgotten-key flag and verify the drain again before applying
`owner-store-key-forgot-receipt.sql`. The SQL refuses to proceed with a live
legacy queue and clears remaining expired intake addresses. Deploy the new
Edge bundle and protected Preview together using
the same approved source. Probe the T06 and worker paths with recovery paused,
then enable recovery and verify through the new Preview. Cached code and older
Preview URLs receive the unavailable outcome after the cutover. A request
without a successful confirmation uses its initial IP slot and expires on the
existing 90-minute schedule. Repeating confirmation does not use another slot.

For rollback, disable the forgotten-key Edge flag first, check the queued,
sending and unknown mail counts, and roll back the Preview. An already claimed
SMTP send can still complete. Retain the schema and inspect unresolved mail
before any further recovery work. Keep the flag off until the deployed client
and Edge bundle both use receipt confirmation.

The Vercel function `/api/owner-otp` also needs the following Preview-only
runtime variables for the signed OTP request:

| Key | Value |
| --- | --- |
| `POS_CAFE_OTP_INGRESS_KEY` | The same base64 key as the Supabase staging Edge secret |
| `POS_CAFE_OWNER_SUPABASE_PROJECT_REF` | `ineckiashpwloncxnbqx` |
| `POS_CAFE_OWNER_SUPABASE_PUBLISHABLE_KEY` | Same value as `POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY` |

Keep the ingress key in the function environment. It is excluded from the
Vite build environment.

The deploy helper first verifies main, CI, canonical trusted files, GitHub
environment protection, pinned Vercel project and routing. Functional mode also
checks public Auth settings (email enabled, public signup disabled, auto-confirm) and
the read-only permission contract (versions 2/1) on the pinned Supabase project.
It then creates at most one Preview, polls only that ID, and checks source,
routing, protection and configuration again. The receipt excludes credentials
and reports application smoke as `NOT_RUN`; verify the actual deployed browser
flows separately. A protected page returning an HTTP success is insufficient.

If a run fails, inspect its finite stage/code and the created deployment ID,
if known. A timeout or lost POST response may still have created a deployment.
Do not repeat the workflow until that outcome and the underlying cause are
resolved. Keep raw backend receipts bound to their original source; never
rename old evidence to the main merge SHA.
