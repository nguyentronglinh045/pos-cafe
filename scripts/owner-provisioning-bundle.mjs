import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { stripTopLevelTransactions } from "./permission-activation-steps.mjs";

export const OWNER_PROVISIONING_SQL_ORDER = Object.freeze([
  "schema", "otp", "verify", "mail", "commit", "seed", "closeout", "suspension", "readiness", "postgrest",
].map((name) => `supabase/candidate/owner-provisioning-${name}.sql`));

export function buildOwnerProvisioningBundle(root) {
  const parts = OWNER_PROVISIONING_SQL_ORDER.map((path) =>
    stripTopLevelTransactions(readFileSync(resolve(root, path), "utf8")));
  return ["begin;", ...parts, "commit;", ""].join("\n");
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  process.stdout.write(buildOwnerProvisioningBundle(resolve(import.meta.dirname, "..")));
}
