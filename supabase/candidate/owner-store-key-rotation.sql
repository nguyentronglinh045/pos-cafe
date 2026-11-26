-- T08 foundation. Apply after T06 in an isolated database until the Auth and mail lanes are ready.
begin;

alter table public.stores add column key_generation bigint not null default 0
  check (key_generation >= 0);

create table private.store_key_rotations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores(id),
  generation bigint not null check (generation > 0),
  accepted_attempt_id uuid not null unique,
  actor_owner_account_id uuid not null references private.owner_accounts(id),
  status text not null default 'pending' check (status in ('pending','applied','completed')),
  candidate_encrypted bytea,
  candidate_version integer,
  current_attempt_no integer not null default 1 check (current_attempt_no > 0),
  run_token uuid,
  run_expires_at timestamptz,
  run_phase text check (run_phase in ('dispatch','probe','publish','finish')),
  failure_phase text check (failure_phase in ('dispatch','probe','publish','finish')),
  consecutive_failures smallint not null default 0 check (consecutive_failures between 0 and 6),
  next_attempt_at timestamptz not null,
  operator_alerted_at timestamptz,
  created_at timestamptz not null,
  applied_at timestamptz,
  completed_at timestamptz,
  session_warning_until timestamptz,
  unique (store_id, generation),
  check ((status = 'pending' and candidate_encrypted is not null and candidate_version is not null
            and octet_length(candidate_encrypted) between 1 and 4096 and candidate_version > 0)
    or (status <> 'pending' and candidate_encrypted is null and candidate_version is null)),
  check ((status = 'pending') = (applied_at is null)),
  check ((status = 'completed') = (completed_at is not null)),
  check ((applied_at is null and session_warning_until is null)
    or (applied_at is not null and session_warning_until is not null and session_warning_until > applied_at)),
  check ((run_token is null and run_expires_at is null and run_phase is null)
    or (run_token is not null and run_expires_at is not null and run_phase is not null)),
  check ((failure_phase is null) = (consecutive_failures = 0)),
  check ((operator_alerted_at is not null) = (consecutive_failures = 6))
);
create unique index store_key_rotation_open_idx on private.store_key_rotations(store_id)
  where status in ('pending','applied');
create index store_key_rotation_due_idx on private.store_key_rotations(next_attempt_at,id)
  where status in ('pending','applied') and operator_alerted_at is null;
create index store_key_rotation_actor_idx on private.store_key_rotations(actor_owner_account_id);

create table private.store_key_rotation_dispatches (
  rotation_id uuid not null references private.store_key_rotations(id),
  attempt_no integer not null check (attempt_no > 0),
  dispatch_token uuid not null unique default gen_random_uuid(),
  state text not null default 'ready'
    check (state in ('ready','dispatched','ambiguous','confirmed','no_effect','operator_released')),
  claimed_at timestamptz,
  resolved_at timestamptz,
  primary key (rotation_id,attempt_no),
  check ((state='ready') = (claimed_at is null)),
  check ((state in ('confirmed','no_effect','operator_released')) = (resolved_at is not null))
);
create unique index store_key_rotation_dispatch_open_idx
  on private.store_key_rotation_dispatches(rotation_id)
  where state in ('ready','dispatched','ambiguous','confirmed');

alter table private.mail_dispatches
  drop constraint mail_dispatches_kind_check,
  drop constraint mail_dispatches_check,
  add column rotation_id uuid unique references private.store_key_rotations(id),
  add constraint mail_dispatches_target_check check (
    (kind = 'create_store_otp' and challenge_id is not null and operation_id is null and rotation_id is null)
    or (kind = 'store_key' and challenge_id is null and operation_id is not null and rotation_id is null)
    or (kind = 'rotation_store_key' and challenge_id is null and operation_id is null and rotation_id is not null)
    or (kind = 'forgot_store_key' and challenge_id is null and operation_id is null and rotation_id is null)
  );

create table private.key_mail_bindings (
  mail_id uuid not null references private.mail_dispatches(id),
  store_id uuid not null references public.stores(id),
  generation bigint not null check (generation >= 0),
  owner_account_id uuid not null references private.owner_accounts(id),
  purpose text not null check (purpose in ('rotation_support','forgot_key')),
  primary key (mail_id,store_id,generation,purpose)
);
create index key_mail_bindings_store_idx on private.key_mail_bindings(store_id,generation,mail_id);
create index key_mail_bindings_owner_idx on private.key_mail_bindings(owner_account_id);
create unique index rotation_audit_once_idx on private.store_admin_log ((detail->>'rotationId'))
  where action = 'store_key_regenerated' and detail ? 'rotationId';

create table private.store_key_rotation_alerts (
  id uuid primary key default gen_random_uuid(),
  rotation_id uuid unique references private.store_key_rotations(id),
  mail_id uuid unique references private.mail_dispatches(id),
  phase text check (phase in ('dispatch','probe','publish','finish')),
  outcome text check (outcome in ('transport_not_called','ambiguous','probe_failed','database_failed')),
  created_at timestamptz not null default clock_timestamp(),
  claim_token uuid,
  claim_expires_at timestamptz,
  delivered_at timestamptz,
  check ((claim_token is null) = (claim_expires_at is null)),
  check ((rotation_id is not null and mail_id is null and phase is not null and outcome is not null)
    or (rotation_id is null and mail_id is not null and phase is null and outcome is null))
);
create index store_key_rotation_alerts_ready_idx on private.store_key_rotation_alerts(created_at,id)
  where delivered_at is null;

alter table private.store_key_rotations enable row level security;
alter table private.store_key_rotation_dispatches enable row level security;
alter table private.key_mail_bindings enable row level security;
alter table private.store_key_rotation_alerts enable row level security;
revoke all on private.store_key_rotations, private.store_key_rotation_dispatches, private.key_mail_bindings,
  private.store_key_rotation_alerts
  from public, anon, authenticated, service_role;
revoke all (key_generation) on public.stores from public, anon, authenticated, service_role;

-- Existing store-authority advisory key, with a write lock up front to avoid a share-to-write upgrade.
create function private.owner_rotation_lock_store(p_store uuid) returns void
language plpgsql volatile set search_path = pg_catalog as $$
begin
  perform pg_advisory_xact_lock(hashtextextended('store-authority:' || p_store::text,0));
  perform 1 from public.stores where id = p_store for update;
end;
$$;

-- Trusted foundation entry. The future OTP endpoint must validate and consume the code in this transaction.
create function private.owner_begin_store_key_rotation(
  p_store uuid, p_actor uuid, p_attempt uuid, p_ciphertext bytea, p_version integer
) returns jsonb
language plpgsql volatile set search_path = pg_catalog as $$
declare
  shop public.stores;
  rotation private.store_key_rotations;
  locked_mail uuid[];
  at_time timestamptz;
begin
  if p_store is null or p_actor is null or p_attempt is null then
    return private.owner_error('A_REQUEST_INVALID');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('store-key-rotation-attempt:' || p_attempt::text,0));
  perform private.owner_rotation_lock_store(p_store);
  select * into shop from public.stores where id = p_store;
  if shop.owner_account_id is distinct from p_actor then return private.owner_error('OWNER_ROLE_REQUIRED'); end if;
  if shop.status <> 'active' then return private.owner_error('STORE_SUSPENDED'); end if;

  select * into rotation from private.store_key_rotations where accepted_attempt_id = p_attempt;
  if found then
    if rotation.store_id <> p_store or rotation.actor_owner_account_id <> p_actor then
      return private.owner_error('A_ATTEMPT_ID_REUSED');
    end if;
    return jsonb_build_object('status',rotation.status,'id',rotation.id,'generation',rotation.generation);
  end if;
  select * into rotation from private.store_key_rotations
    where store_id = p_store and status in ('pending','applied');
  if found then
    return jsonb_build_object('status',rotation.status,'id',rotation.id,'generation',rotation.generation);
  end if;
  if p_ciphertext is null or octet_length(p_ciphertext) not between 1 and 4096
     or p_version is null or p_version <= 0 then
    return private.owner_error('A_REQUEST_INVALID');
  end if;

  -- Lock existing key mail before changing generation or closing the T06 delivery window.
  -- T06's mail worker locks its mail row first and only reads the store, so the order is compatible.
  select array(select m.id from private.mail_dispatches m
    where m.status in ('queued','sending','unknown') and (
      exists(select 1 from private.create_operations o where o.id=m.operation_id and o.created_store_id=p_store)
      or exists(select 1 from private.key_mail_bindings b where b.mail_id=m.id and b.store_id=p_store)
    )
    order by m.id for update of m) into locked_mail;
  if exists(select 1 from private.mail_dispatches where id=any(locked_mail) and status in ('sending','unknown')) then
    return private.owner_error('CREATE_VERIFY_UNAVAILABLE');
  end if;

  at_time := clock_timestamp();
  delete from private.key_mail_bindings b using private.mail_dispatches m
    where m.id=b.mail_id and m.id=any(locked_mail) and m.status='queued'
      and b.store_id=p_store and b.purpose='forgot_key';
  update private.mail_dispatches m set status='failed_before_submit',resolved_at=at_time
    where m.id=any(locked_mail) and m.status='queued' and
      (m.kind <> 'forgot_store_key' or not exists(select 1 from private.key_mail_bindings b where b.mail_id=m.id));
  update private.create_operations set delivery_closed_at=at_time
    where created_store_id=p_store and delivery_closed_at is null;

  insert into private.store_key_rotations
    (store_id,generation,actor_owner_account_id,accepted_attempt_id,candidate_encrypted,candidate_version,
     next_attempt_at,created_at)
    values (p_store,shop.key_generation+1,p_actor,p_attempt,p_ciphertext,p_version,at_time,at_time)
    returning * into rotation;
  insert into private.store_key_rotation_dispatches(rotation_id,attempt_no) values(rotation.id,1);
  return jsonb_build_object('status','pending','id',rotation.id,'generation',rotation.generation);
end;
$$;

create function public.owner_next_store_key_rotation() returns uuid
language sql stable security definer set search_path = pg_catalog as $$
  select r.store_id from private.store_key_rotations r
  join public.stores s on s.id=r.store_id
    and s.key_generation=r.generation - (case when r.status='pending' then 1 else 0 end)
  where r.status in ('pending','applied') and r.operator_alerted_at is null
    and r.next_attempt_at <= statement_timestamp()
    and (r.run_expires_at is null or r.run_expires_at <= statement_timestamp())
  order by r.next_attempt_at,r.id limit 1;
$$;

-- Claim is per store and uses the same lock order for every state transition.
-- Expiry reclaims DB/probe work. It never reacquires the right to send a dispatched password update.
create function public.owner_claim_store_key_rotation(p_store uuid, p_expected_rotation uuid default null) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  r private.store_key_rotations;
  d private.store_key_rotation_dispatches;
  store_generation bigint;
  phase text;
  at_time timestamptz;
  result jsonb;
begin
  if p_store is null then return null; end if;
  perform private.owner_rotation_lock_store(p_store);
  at_time := clock_timestamp();
  select * into r from private.store_key_rotations where store_id=p_store and status in ('pending','applied')
    and (p_expected_rotation is null or id=p_expected_rotation)
    and operator_alerted_at is null and next_attempt_at <= at_time
    and (run_expires_at is null or run_expires_at <= at_time) for update;
  if not found then return null; end if;
  select key_generation into strict store_generation from public.stores where id=p_store;
  if store_generation <> r.generation - (case when r.status='pending' then 1 else 0 end) then
    return null;
  end if;
  select * into strict d from private.store_key_rotation_dispatches
    where rotation_id=r.id and attempt_no=r.current_attempt_no for update;
  phase := case when r.status='applied' then 'finish' when d.state='confirmed' then 'publish'
    when d.state='ready' then 'dispatch' else 'probe' end;
  if phase='dispatch' then
    update private.store_key_rotation_dispatches set state='dispatched',claimed_at=at_time
      where rotation_id=r.id and attempt_no=d.attempt_no;
  elsif phase='probe' then
    if d.state not in ('dispatched','ambiguous') then raise exception 'ROTATION_DISPATCH_INVALID'; end if;
    update private.store_key_rotation_dispatches set state='ambiguous'
      where rotation_id=r.id and attempt_no=d.attempt_no and state='dispatched';
  end if;
  update private.store_key_rotations set run_token=gen_random_uuid(), run_phase=phase,
    run_expires_at=at_time+interval '60 seconds'
    where id=r.id returning * into r;
  result := jsonb_build_object('id',r.id,'storeId',r.store_id,'generation',r.generation::text,
    'attempt',d.attempt_no,'dispatchToken',d.dispatch_token,'runToken',r.run_token,
    'phase',phase,'expiresAt',r.run_expires_at);
  if phase in ('dispatch','probe') then
    result := result || jsonb_build_object('ciphertext',encode(r.candidate_encrypted,'hex'),'version',r.candidate_version,
      'storeNo',(select store_no from public.stores where id=p_store),'acceptedAttemptId',r.accepted_attempt_id);
  end if;
  return result;
end;
$$;

-- Resolve a live claim. The only automatic no-effect code in this slice is proof of no transport call.
create function public.owner_report_store_key_rotation(
  p_store uuid, p_rotation uuid, p_generation bigint, p_attempt integer,
  p_dispatch uuid, p_run uuid, p_outcome text
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  r private.store_key_rotations;
  d private.store_key_rotation_dispatches;
  at_time timestamptz;
  fails integer;
  next_no integer;
begin
  if p_store is null or p_outcome is null then return null; end if;
  perform private.owner_rotation_lock_store(p_store);
  at_time := clock_timestamp();
  select * into r from private.store_key_rotations where id=p_rotation and store_id=p_store
    and generation=p_generation and current_attempt_no=p_attempt and run_token=p_run
    and run_expires_at > at_time and status in ('pending','applied') and operator_alerted_at is null for update;
  if not found then return null; end if;
  select * into d from private.store_key_rotation_dispatches
    where rotation_id=r.id and attempt_no=p_attempt and dispatch_token=p_dispatch for update;
  if not found then return null; end if;

  if p_outcome='confirmed' and (
    (r.run_phase='dispatch' and d.state='dispatched') or (r.run_phase='probe' and d.state='ambiguous')
  ) then
    update private.store_key_rotation_dispatches set state='confirmed',resolved_at=at_time
      where rotation_id=r.id and attempt_no=p_attempt;
    update private.store_key_rotations set run_token=null,run_expires_at=null,run_phase=null,
      failure_phase=null,consecutive_failures=0,next_attempt_at=at_time where id=r.id;
    return jsonb_build_object('status','confirmed');
  end if;

  if not (
    (r.run_phase='dispatch' and d.state='dispatched' and p_outcome in ('transport_not_called','ambiguous'))
    or (r.run_phase='probe' and d.state='ambiguous' and p_outcome='probe_failed')
    or (r.run_phase in ('publish','finish') and d.state='confirmed' and p_outcome='database_failed')
  ) then return null; end if;

  fails := case when r.failure_phase=r.run_phase then r.consecutive_failures+1 else 1 end;
  next_no := p_attempt;
  if p_outcome='transport_not_called' then
    update private.store_key_rotation_dispatches set state='no_effect',resolved_at=at_time
      where rotation_id=r.id and attempt_no=p_attempt;
    if fails < 6 then
      next_no := p_attempt+1;
      insert into private.store_key_rotation_dispatches(rotation_id,attempt_no) values(r.id,next_no);
    end if;
  elsif p_outcome='ambiguous' then
    update private.store_key_rotation_dispatches set state='ambiguous'
      where rotation_id=r.id and attempt_no=p_attempt;
  end if;

  update private.store_key_rotations set run_token=null,run_expires_at=null,run_phase=null,
    current_attempt_no=next_no, failure_phase=r.run_phase, consecutive_failures=fails,
    next_attempt_at=at_time+interval '1 minute',
    operator_alerted_at=case when fails=6 then at_time else null end where id=r.id;
  if fails=6 then
    insert into private.store_key_rotation_alerts(rotation_id,phase,outcome,created_at)
      values(r.id,r.run_phase,p_outcome,at_time);
  end if;
  return jsonb_build_object('status','recorded','phase',r.run_phase,'failureCount',fails,'alert',fails=6);
end;
$$;

create function public.owner_advance_store_key_rotation(
  p_store uuid, p_rotation uuid, p_generation bigint, p_attempt integer,
  p_dispatch uuid, p_run uuid, p_access_token_ttl_seconds integer
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  r private.store_key_rotations;
  shop public.stores;
  recipient private.owner_canonical_email;
  mail uuid;
  at_time timestamptz;
begin
  if p_store is null then return null; end if;
  perform private.owner_rotation_lock_store(p_store);
  at_time := clock_timestamp();
  select * into r from private.store_key_rotations where id=p_rotation and store_id=p_store
    and generation=p_generation and current_attempt_no=p_attempt and run_token=p_run
    and run_expires_at>at_time and operator_alerted_at is null for update;
  if not found then return null; end if;
  perform 1 from private.store_key_rotation_dispatches where rotation_id=r.id
    and attempt_no=p_attempt and dispatch_token=p_dispatch and state='confirmed' for update;
  if not found then return null; end if;
  select * into strict shop from public.stores where id=p_store;

  if r.status='pending' and r.run_phase='publish' and shop.key_generation=r.generation-1 then
    if p_access_token_ttl_seconds is null or p_access_token_ttl_seconds <= 0 then
      return private.owner_error('A_REQUEST_INVALID');
    end if;
    select canonical_email into strict recipient from private.owner_accounts where id=shop.owner_account_id;
    update public.stores set key_generation=r.generation, key_secret_encrypted=r.candidate_encrypted,
      key_encryption_version=r.candidate_version where id=p_store;
    insert into private.store_admin_log(store_id,action,actor_kind,actor_owner_account_id,detail)
      values (p_store,'store_key_regenerated','owner',r.actor_owner_account_id,
              jsonb_build_object('rotationId',r.id,'generation',r.generation));
    insert into private.mail_dispatches(kind,canonical_email,rotation_id,queued_at)
      values ('rotation_store_key',recipient,r.id,at_time) returning id into mail;
    insert into private.key_mail_bindings(mail_id,store_id,generation,owner_account_id,purpose)
      values(mail,p_store,r.generation,shop.owner_account_id,'rotation_support');
    update private.store_key_rotations set status='applied',applied_at=at_time,
      session_warning_until=at_time+make_interval(secs=>p_access_token_ttl_seconds),
      candidate_encrypted=null,candidate_version=null,run_token=null,run_expires_at=null,run_phase=null,
      failure_phase=null,consecutive_failures=0,next_attempt_at=at_time where id=r.id;
    return jsonb_build_object('status','applied');
  end if;

  if r.status='applied' and r.run_phase='finish' and shop.key_generation=r.generation
    and exists(select 1 from private.store_admin_log a where a.store_id=p_store
      and a.action='store_key_regenerated' and a.detail->>'rotationId'=r.id::text
      and a.detail->>'generation'=r.generation::text)
    and exists(select 1 from private.mail_dispatches m join private.key_mail_bindings b on b.mail_id=m.id
      where m.rotation_id=r.id and b.store_id=p_store and b.generation=r.generation
      and b.purpose='rotation_support')
  then
    update private.store_key_rotations set status='completed',completed_at=at_time,
      run_token=null,run_expires_at=null,run_phase=null,
      failure_phase=null,consecutive_failures=0 where id=r.id;
    return jsonb_build_object('status','completed');
  end if;
  return null;
end;
$$;

create function public.owner_claim_store_key_rotation_alert() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  alert private.store_key_rotation_alerts;
  r private.store_key_rotations;
  at_time timestamptz := clock_timestamp();
begin
  select * into alert from private.store_key_rotation_alerts
    where delivered_at is null and (claim_expires_at is null or claim_expires_at<=at_time)
    order by created_at,id limit 1 for update skip locked;
  if not found then return null; end if;
  update private.store_key_rotation_alerts set claim_token=gen_random_uuid(),
    claim_expires_at=at_time+interval '60 seconds' where id=alert.id returning * into alert;
  if alert.rotation_id is not null then
    select * into strict r from private.store_key_rotations where id=alert.rotation_id;
  end if;
  return jsonb_strip_nulls(jsonb_build_object('id',alert.id,'claimToken',alert.claim_token,
    'rotationId',alert.rotation_id,'storeId',r.store_id,'generation',r.generation::text,
    'phase',alert.phase,'outcome',alert.outcome,'mailId',alert.mail_id));
end;
$$;

create function public.owner_finish_store_key_rotation_alert(p_id uuid,p_claim_token uuid) returns boolean
language sql volatile security definer set search_path=pg_catalog as $$
  with delivered as (
    update private.store_key_rotation_alerts set delivered_at=clock_timestamp(),claim_token=null,claim_expires_at=null
      where id=p_id and claim_token=p_claim_token and delivered_at is null and claim_expires_at>clock_timestamp()
    returning 1
  ) select exists(select 1 from delivered);
$$;

revoke all on function private.owner_rotation_lock_store(uuid),
  private.owner_begin_store_key_rotation(uuid,uuid,uuid,bytea,integer) from public, anon, authenticated, service_role;
revoke all on function public.owner_next_store_key_rotation(),public.owner_claim_store_key_rotation(uuid,uuid),
  public.owner_report_store_key_rotation(uuid,uuid,bigint,integer,uuid,uuid,text),
  public.owner_advance_store_key_rotation(uuid,uuid,bigint,integer,uuid,uuid,integer),
  public.owner_claim_store_key_rotation_alert(),public.owner_finish_store_key_rotation_alert(uuid,uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_next_store_key_rotation(),public.owner_claim_store_key_rotation(uuid,uuid),
  public.owner_report_store_key_rotation(uuid,uuid,bigint,integer,uuid,uuid,text),
  public.owner_advance_store_key_rotation(uuid,uuid,bigint,integer,uuid,uuid,integer),
  public.owner_claim_store_key_rotation_alert(),public.owner_finish_store_key_rotation_alert(uuid,uuid) to service_role;

commit;
