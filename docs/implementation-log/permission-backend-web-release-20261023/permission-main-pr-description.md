Integrate the permission model into main with its adapters/UI, employee roles and overrides, PIN/recovery flows, candidate SQL, and verification tooling. Production deployment and live database activation remain held.

The final integration review also fixes two regressions:

- Bind authority lookups to the initiating drawer/session so a late reply cannot register a financial write after navigation or suspension.
- Keep the nine legacy IDEM contracts in their own configuration; permission/PIN contracts retain their dedicated discovery routes.

Owner decision M24 (2026-10-24) explicitly prioritizes code integration before full backend acceptance. T04 timing and remaining backend profiles/supplemental obligations stay DEFERRED/NOT_ACCEPTED; expected results and coverage are unchanged. This merge does not claim full permission acceptance. HP1 remains inactive; unfinished HP1/proof files and the alternate pnpm lock are excluded.

Candidate: `a028cc5b07bf3a02e3b837d8aec2b832325503a2`.
Local verification: 12 lifecycle regression controls failed before the fix; 56 focused tests and TypeScript check pass after it. Contract discovery controls pass and preserve every dedicated permission/PIN contract. Both scoped independent reviews approve the final candidate. Fresh [PR CI 40088569310](https://github.com/nguyentronglinh045/pos-cafe/actions/runs/40088569310) passes all 18 phases; both independent reviewers also approved its source binding and all three fresh PIN images. Earlier PR CI failed on an existing exclusion-list assertion, now corrected to verify actual discovery. Full local tooling: 567 passed, 0 failed, 1 existing declared TC-IDEM-087 defer. Required source review and PR CI gates are now complete.

Release holds read back on 2026-10-24: GitHub Production/Preview require the owner, main-only branch policies, no admin bypass; Vercel Project Settings show “Don’t build anything” / `exit 0`. Source also disables Git deployment and production execution. No deployment, migration, or live DB/Edge activation is authorized by this PR.
