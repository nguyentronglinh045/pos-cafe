import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { applyActivationSteps } from "../../scripts/permission-activation-steps.mjs";
import { buildOwnerProvisioningBundle } from "../../scripts/owner-provisioning-bundle.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const connectionString = process.env.POS_CAFE_T06_TEST_DSN;
if (!connectionString) throw new Error("Set POS_CAFE_T06_TEST_DSN to the isolated local database");
const target = new URL(connectionString);
if (target.protocol !== "postgresql:" || target.hostname !== "127.0.0.1" || target.search || target.hash
  || !/^\/pos_cafe_t06_contract(?:_[a-z0-9]+)?$/.test(target.pathname)) {
  throw new Error("Refusing to initialize a non-fixture database");
}
const db = new pg.Client({ connectionString });
const migrations = join(root, "supabase", "migrations");
const candidate = join(root, "supabase", "candidate");
const sql = (path) => readFileSync(path, "utf8");
await db.connect();
try {
  const probe = await db.query("select to_regclass('public.stores') as existing, current_database() as db");
  if (probe.rows[0].existing || `/${probe.rows[0].db}` !== target.pathname) throw new Error("Fixture must be empty");

  await db.query(`
    do $$ begin
      if not exists(select 1 from pg_roles where rolname='anon') then create role anon nologin; end if;
      if not exists(select 1 from pg_roles where rolname='authenticated') then create role authenticated nologin; end if;
      if not exists(select 1 from pg_roles where rolname='service_role') then create role service_role nologin bypassrls; end if;
      if not exists(select 1 from pg_roles where rolname='authenticator') then create role authenticator nologin noinherit; end if;
    end $$;
    grant anon, authenticated, service_role to authenticator;
    create schema auth;
    create table auth.users (id uuid primary key, email text, aud text default 'authenticated',
      role text default 'authenticated', raw_app_meta_data jsonb not null default '{}');
    create function auth.uid() returns uuid language sql stable as $$
      select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),
        nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid;
    $$;
    grant usage on schema auth, public to anon, authenticated, service_role;
    grant execute on function auth.uid() to anon, authenticated, service_role;
    alter default privileges in schema public grant all on tables to authenticated, service_role;
    alter default privileges in schema public grant all on sequences to authenticated, service_role;
    create schema storage;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key,bucket_id text references storage.buckets(id),name text);
    alter table storage.objects enable row level security;
    create function storage.foldername(name text) returns text[] language sql immutable as $$
      select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1];
    $$;
    grant usage on schema storage to anon, authenticated, service_role;
    grant all on storage.objects to authenticated;
    create schema private;
    revoke all on schema private from public, anon, authenticated;
    create publication supabase_realtime;
  `);
  for (const file of readdirSync(migrations).filter((name) => /^[0-9]+.*\.sql$/.test(name)).sort()) {
    if (file.startsWith("017_")) break;
    await db.query(sql(join(migrations,file)));
  }
  await db.query(sql(join(candidate,"permission-compatibility-prepare.sql")));
  const baselineSql = await import("../../scripts/permission-activation-bundle.mjs");
  const sqlFiles = new Map(baselineSql.ACTIVATION_SQL_ORDER.map((file) => [file, sql(join(root,file))]));
  await db.query("begin");
  try {
    await applyActivationSteps(db, { plan: { stores: [] }, storeIds: [], expectedEmptyStoreSet: true, sqlFiles });
    await db.query("commit");
  } catch (failure) {
    await db.query("rollback");
    throw failure;
  }
  await db.query(buildOwnerProvisioningBundle(root));
  console.log("T06 PostgreSQL contract fixture initialized");
} finally {
  await db.end();
}
