-- T06 cutover. Apply after the permission candidate and only to an empty store catalog.
begin;

lock table public.stores in access exclusive mode;
do $$
begin
  if exists (select 1 from public.stores) then
    raise exception 'T06_STORE_CATALOG_NOT_EMPTY';
  end if;
end;
$$;

create type private.store_status as enum ('active', 'suspended');
create type private.store_admin_action as enum (
  'store_created', 'store_key_regenerated', 'store_status_changed', 'owner_pin_reset',
  'owner_email_changed', 'ownership_transferred', 'store_data_reset'
);

create domain private.owner_canonical_email as text
  check (
    octet_length(value) <= 254
    and octet_length(split_part(value, '@', 1)) between 1 and 64
    and value collate "C" ~ '^[!-?A-~]+@[!-?A-~]+$'
    and value = lower(value collate "C")
  );

create table private.owner_accounts (
  id uuid primary key default gen_random_uuid(),
  canonical_email private.owner_canonical_email not null unique,
  created_at timestamptz not null default clock_timestamp()
);

create table private.owner_provisioning_settings (
  singleton boolean primary key default true check (singleton),
  store_limit integer not null check (store_limit > 0)
);
insert into private.owner_provisioning_settings(store_limit) values (5);

alter table public.stores
  add column owner_account_id uuid not null references private.owner_accounts(id),
  add column status private.store_status not null default 'active',
  add column key_secret_encrypted bytea not null check (octet_length(key_secret_encrypted) > 0),
  add column key_encryption_version integer not null check (key_encryption_version > 0),
  drop column is_active;
create index stores_owner_account_idx on public.stores(owner_account_id);

create table private.create_intents (
  intent_id uuid primary key,
  canonical_email private.owner_canonical_email not null,
  input_digest bytea not null check (octet_length(input_digest) = 32),
  current_challenge_id uuid,
  created_at timestamptz not null
);

create table private.otp_challenges (
  id uuid primary key,
  intent_id uuid not null references private.create_intents(intent_id),
  canonical_email private.owner_canonical_email not null,
  purpose text not null default 'create_store' check (purpose = 'create_store'),
  source_ip inet,
  issued_at timestamptz not null,
  expires_at timestamptz not null,
  otp_digest bytea check (octet_length(otp_digest) = 32),
  redacted_at timestamptz,
  failed_attempts smallint not null default 0 check (failed_attempts between 0 and 5),
  status text not null default 'active' check (status in ('active','used','locked','superseded')),
  unique (intent_id, id),
  check (expires_at = issued_at + interval '10 minutes'),
  check ((redacted_at is null and source_ip is not null and otp_digest is not null)
    or (redacted_at is not null and source_ip is null and otp_digest is null and status <> 'active')),
  check ((status = 'locked') = (failed_attempts = 5))
);
alter table private.create_intents
  add constraint create_intent_current_challenge_fk
  foreign key (intent_id, current_challenge_id) references private.otp_challenges(intent_id, id);
create unique index otp_active_email_idx on private.otp_challenges(canonical_email, purpose)
  where status = 'active';
create index otp_email_issuance_idx on private.otp_challenges(canonical_email, purpose, issued_at);
create index otp_ip_issuance_idx on private.otp_challenges(source_ip, issued_at);
create index otp_issued_at_idx on private.otp_challenges(issued_at);

create table private.otp_request_outcomes (
  request_id uuid primary key,
  intent_id uuid not null,
  canonical_email private.owner_canonical_email not null,
  challenge_id uuid references private.otp_challenges(id),
  recorded_at timestamptz not null,
  resend_not_before timestamptz not null,
  retain_until timestamptz not null,
  check (retain_until >= recorded_at + interval '90 minutes')
);
create index otp_request_outcomes_challenge_idx on private.otp_request_outcomes(challenge_id);
create index otp_request_outcomes_retention_idx on private.otp_request_outcomes(retain_until);

create table private.create_operations (
  id uuid primary key default gen_random_uuid(),
  intent_id uuid not null unique references private.create_intents(intent_id),
  accepted_attempt_id uuid not null unique,
  owner_account_id uuid not null references private.owner_accounts(id),
  accepted_challenge_id uuid not null references private.otp_challenges(id),
  status text not null default 'accepted' check (status in ('accepted','unknown','created','failed')),
  accepted_at timestamptz not null,
  lease_token uuid not null default gen_random_uuid(),
  lease_expires_at timestamptz not null,
  resolved_at timestamptz,
  reason_code text,
  display_name text not null check (char_length(display_name) between 1 and 120),
  address text not null check (char_length(address) <= 500),
  seed_demo boolean not null,
  owner_pin_hash text,
  store_secret_encrypted bytea,
  store_secret_encryption_version integer check (store_secret_encryption_version > 0),
  created_store_id uuid unique references public.stores(id),
  receipt_expires_at timestamptz not null,
  delivery_closed_at timestamptz,
  wrong_receives smallint not null default 0 check (wrong_receives between 0 and 5),
  check (lease_expires_at > accepted_at and receipt_expires_at > accepted_at),
  check ((status = 'created') = (created_store_id is not null)),
  check ((status in ('created','failed')) = (resolved_at is not null)),
  check (status not in ('created','failed') or (owner_pin_hash is null and store_secret_encrypted is null)),
  check ((store_secret_encrypted is null) = (store_secret_encryption_version is null))
);
create index create_operations_owner_slots_idx on private.create_operations(owner_account_id)
  where status in ('accepted','unknown');
create index create_operations_challenge_idx on private.create_operations(accepted_challenge_id);

create table private.otp_attempts (
  attempt_id uuid primary key,
  intent_id uuid not null,
  canonical_email private.owner_canonical_email not null,
  challenge_id uuid references private.otp_challenges(id),
  compared_otp_digest bytea check (octet_length(compared_otp_digest) = 32),
  outcome text not null check (outcome in ('rejected','status_only')),
  reason_code text,
  operation_id uuid references private.create_operations(id),
  skew_marker boolean not null default false,
  recorded_at timestamptz not null,
  retain_until timestamptz,
  check (
    (outcome = 'rejected' and reason_code is not null and operation_id is null
      and retain_until is not null and retain_until >= recorded_at + interval '90 minutes')
    or
    (outcome = 'status_only' and operation_id is not null and reason_code is null
      and compared_otp_digest is null and challenge_id is null and retain_until is null)
  ),
  check (not skew_marker or (
    outcome = 'rejected' and reason_code = 'A_REQUEST_ID_STALE'
    and challenge_id is not null and compared_otp_digest is null
  ))
);
create unique index otp_attempt_skew_once_idx on private.otp_attempts(challenge_id) where skew_marker;
create index otp_attempts_challenge_idx on private.otp_attempts(challenge_id);
create index otp_attempts_operation_idx on private.otp_attempts(operation_id) where operation_id is not null;
create index otp_attempts_retention_idx on private.otp_attempts(retain_until) where retain_until is not null;

alter table private.store_no_reservations
  add column operation_id uuid references private.create_operations(id),
  add column selection_no smallint,
  add constraint store_number_operation_selection_key unique (operation_id, selection_no),
  add constraint store_number_operation_selection_check check (
    (operation_id is null and selection_no is null)
    or (operation_id is not null and selection_no is not null and selection_no between 1 and 3)
  );

create table private.auth_create_dispatches (
  reservation_id uuid primary key references private.store_no_reservations(request_id),
  lease_token uuid not null,
  dispatch_token uuid not null unique,
  expected_email text not null,
  status text not null default 'claimed' check (status in ('claimed','created','no_effect','unknown')),
  auth_user_id uuid unique,
  claimed_at timestamptz not null,
  resolved_at timestamptz,
  check ((status = 'created') = (auth_user_id is not null)),
  check ((status = 'claimed') = (resolved_at is null))
);

create table private.mail_dispatches (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('create_store_otp','store_key')),
  canonical_email private.owner_canonical_email not null,
  challenge_id uuid unique references private.otp_challenges(id),
  operation_id uuid unique references private.create_operations(id),
  status text not null default 'queued' check (
    status in ('queued','sending','submitted','rejected','failed_before_submit','provider_limited','unknown')
  ),
  otp_encrypted bytea,
  otp_encryption_version integer check (otp_encryption_version > 0),
  queued_at timestamptz not null,
  claim_token uuid unique,
  claim_expires_at timestamptz,
  submit_authorized_at timestamptz,
  resolved_at timestamptz,
  check (
    (kind = 'create_store_otp' and challenge_id is not null and operation_id is null)
    or (kind = 'store_key' and challenge_id is null and operation_id is not null)
  ),
  check ((kind = 'create_store_otp' and status = 'queued') = (otp_encrypted is not null)),
  check ((otp_encrypted is null) = (otp_encryption_version is null)),
  check ((claim_token is null) = (claim_expires_at is null)),
  check (status <> 'sending' or claim_token is not null)
);
create index mail_dispatches_queued_idx on private.mail_dispatches(queued_at) where status = 'queued';
create index mail_dispatches_sending_idx on private.mail_dispatches(claim_expires_at) where status = 'sending';

create table private.store_admin_log (
  id bigint generated always as identity primary key,
  store_id uuid not null references public.stores(id),
  action private.store_admin_action not null,
  actor_kind text not null check (actor_kind in ('owner','system','operator')),
  actor_owner_account_id uuid references private.owner_accounts(id),
  actor_reference text,
  detail jsonb not null default '{}' check (jsonb_typeof(detail) = 'object'),
  created_at timestamptz not null default clock_timestamp(),
  check (
    (actor_kind = 'owner' and actor_owner_account_id is not null and actor_reference is null)
    or (actor_kind in ('system','operator') and actor_owner_account_id is null
      and actor_reference is not null and char_length(actor_reference) between 1 and 128)
  )
);
create index store_admin_log_store_idx on private.store_admin_log(store_id, created_at);
create index store_admin_log_owner_idx on private.store_admin_log(actor_owner_account_id);

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'owner_accounts', 'owner_provisioning_settings', 'create_intents', 'otp_challenges', 'otp_request_outcomes',
    'create_operations', 'otp_attempts', 'auth_create_dispatches', 'mail_dispatches', 'store_admin_log'
  ] loop
    execute format('alter table private.%I enable row level security', table_name);
    execute format('revoke all on table private.%I from public, anon, authenticated, service_role', table_name);
  end loop;
end;
$$;

revoke all on sequence private.store_admin_log_id_seq from public, anon, authenticated, service_role;
revoke all on type private.store_status, private.store_admin_action from public, anon, authenticated, service_role;
revoke all on domain private.owner_canonical_email from public, anon, authenticated, service_role;

-- The supported store projection remains an RPC. Close direct access, including column grants.
revoke all on public.stores from public, anon, authenticated, service_role;
revoke select (id, store_no, name, email, seed_status, created_at, updated_at, owner_account_id,
  status, key_secret_encrypted, key_encryption_version),
  insert (id, store_no, name, email, seed_status, created_at, updated_at, owner_account_id,
  status, key_secret_encrypted, key_encryption_version),
  update (id, store_no, name, email, seed_status, created_at, updated_at, owner_account_id,
  status, key_secret_encrypted, key_encryption_version),
  references (id, store_no, name, email, seed_status, created_at, updated_at, owner_account_id,
  status, key_secret_encrypted, key_encryption_version)
on public.stores from public, anon, authenticated, service_role;

revoke all on function public.permission_reserve_store_no(uuid), public.permission_bootstrap_store(jsonb)
  from public, anon, authenticated, service_role;

commit;
