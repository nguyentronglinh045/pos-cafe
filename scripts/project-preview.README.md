# Protected frontend Preview

Run `.github/workflows/frontend-preview.yml` manually on `main` only after the
required application/backend acceptance and independent reviews are complete.
Supply the exact current main SHA and its successful **push** CI run/attempt.
PR CI, an ancestor's CI, or a mock smoke result does not replace those gates.
Keep the Preview environment approval and existing project protection enabled.
Production remains disabled; this command does not promote a deployment.

`data_mode` is an expectation checked before creating a deployment. It does not
write Vercel settings. Default `mock` requires no `POS_PREVIEW_*` variables.
For `supabase`, configure exactly these three **plain/config** environment
variables on the pinned Vercel project, with target **Preview only**, no branch
override or custom environment:

| Key | Value |
| --- | --- |
| `POS_PREVIEW_DATA_MODE` | `supabase` |
| `POS_PREVIEW_SUPABASE_URL` | `https://ineckiashpwloncxnbqx.supabase.co` |
| `POS_PREVIEW_SUPABASE_PUBLISHABLE_KEY` | That project's public `sb_publishable_...` key |

These values become public browser configuration. Never use a secret/service key.
Existing `VITE_*` variables are ignored by the build helper; do not decrypt or
change them for this operation. Partial, duplicate, extra `POS_PREVIEW_*`, shared
Production scopes, encrypted values and unsupported API shapes fail closed.
Supported wrappers are `envs` alone, `envs` plus `hiddenProductionEnvCount: 0`,
or `envs` plus a single complete page with `count` equal to the returned rows
and both `next` and `prev` null. Hidden or partial lists are refused.
The build child receives only the validated public Vite values and a small OS
environment allowlist; GitHub and Vercel credentials are excluded.

The deploy helper first verifies main, CI, canonical trusted files, GitHub
environment protection, pinned Vercel project and routing. Functional mode also
checks public Auth settings (email enabled, signup enabled, auto-confirm) and
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
