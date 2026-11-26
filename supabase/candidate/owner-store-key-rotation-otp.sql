-- Rotation OTP issuance and acceptance. Requires T06 and owner-store-key-rotation.sql.
begin;

-- A shared challenge ledger preserves the T06 IP and project-wide ceilings.
-- Rotation intents never get create_intents.current_challenge_id.
alter table private.otp_challenges drop constraint otp_challenges_purpose_check,
  add constraint otp_challenges_purpose_check check (purpose in ('create_store','store_key_rotation'));
alter table private.mail_dispatches drop constraint mail_dispatches_target_check,
  drop constraint mail_dispatches_check1,
  add constraint mail_dispatches_target_check check (
    (kind in ('create_store_otp','rotation_otp') and challenge_id is not null and operation_id is null and rotation_id is null)
    or (kind = 'store_key' and challenge_id is null and operation_id is not null and rotation_id is null)
    or (kind = 'rotation_store_key' and challenge_id is null and operation_id is null and rotation_id is not null)
    or (kind = 'forgot_store_key' and challenge_id is null and operation_id is null and rotation_id is null)
  ),
  add constraint mail_dispatches_otp_payload_check check (
    (kind in ('create_store_otp','rotation_otp') and status='queued') = (otp_encrypted is not null)
  );

create table private.rotation_otp_scope (
  challenge_id uuid primary key references private.otp_challenges(id),
  store_id uuid not null references public.stores(id),
  owner_account_id uuid not null references private.owner_accounts(id)
);
create index rotation_otp_scope_store_idx on private.rotation_otp_scope(store_id);
create index rotation_otp_scope_owner_idx on private.rotation_otp_scope(owner_account_id);

create table private.rotation_otp_requests (
  request_id uuid primary key,
  store_id uuid not null references public.stores(id),
  owner_account_id uuid not null references private.owner_accounts(id),
  challenge_ref uuid,
  rotation_id uuid references private.store_key_rotations(id),
  recorded_at timestamptz not null,
  resend_not_before timestamptz not null,
  check ((challenge_ref is null) <> (rotation_id is null))
);
create index rotation_otp_requests_store_idx on private.rotation_otp_requests(store_id);
create index rotation_otp_requests_owner_idx on private.rotation_otp_requests(owner_account_id);
create index rotation_otp_requests_rotation_idx on private.rotation_otp_requests(rotation_id) where rotation_id is not null;
create index rotation_otp_requests_time_idx on private.rotation_otp_requests(recorded_at);

create table private.rotation_otp_failures (
  attempt_id uuid primary key,
  challenge_id uuid not null references private.otp_challenges(id),
  compared_digest bytea not null check (octet_length(compared_digest)=32),
  recorded_at timestamptz not null default clock_timestamp()
);
create index rotation_otp_failures_challenge_idx on private.rotation_otp_failures(challenge_id);
create index rotation_otp_failures_time_idx on private.rotation_otp_failures(recorded_at);

create table private.rotation_otp_acceptances (
  rotation_id uuid primary key references private.store_key_rotations(id),
  challenge_id uuid not null unique references private.otp_challenges(id),
  compared_digest bytea not null check (octet_length(compared_digest)=32)
);

alter table private.rotation_otp_scope enable row level security;
alter table private.rotation_otp_requests enable row level security;
alter table private.rotation_otp_failures enable row level security;
alter table private.rotation_otp_acceptances enable row level security;
revoke all on private.rotation_otp_scope, private.rotation_otp_requests, private.rotation_otp_failures
  , private.rotation_otp_acceptances
  from public, anon, authenticated, service_role;

-- The Edge verifies the store JWT. SQL independently checks its employee credential under the store lock.
create function private.owner_check_rotation_actor(p_store uuid, p_credential_hash bytea, p_store_name text)
returns jsonb language plpgsql volatile set search_path=pg_catalog as $$
declare
  shop public.stores;
  actor public.employees;
  employee_session private.employee_sessions;
  current_name text;
begin
  select * into shop from public.stores where id=p_store;
  if shop.id is null or shop.status is distinct from 'active' then return private.owner_error('STORE_SUSPENDED'); end if;
  select * into employee_session from private.employee_sessions where store_id=p_store and token_hash=p_credential_hash;
  if not found then return private.owner_error('EMPLOYEE_SESSION_REQUIRED'); end if;
  select * into actor from public.employees where id=employee_session.employee_id and store_id=p_store for share;
  select * into employee_session from private.employee_sessions where store_id=p_store and token_hash=p_credential_hash for share;
  perform private.permission_catalog_share();
  if actor.id is null or not actor.is_active or employee_session.token_hash is null
    or employee_session.revoked_at is not null or employee_session.expires_at <= clock_timestamp()
    or employee_session.employee_revision <> actor.permission_revision then
    return private.owner_error('EMPLOYEE_SESSION_REQUIRED');
  end if;
  if actor.pin_change_required or employee_session.purpose <> 'normal' then return private.owner_error('PIN_CHANGE_REQUIRED'); end if;
  if actor.role <> 'owner' or not exists(select 1 from public.permission_roles where code='owner' and enabled) then
    return private.owner_error('OWNER_ROLE_REQUIRED');
  end if;
  select coalesce(nullif(display_name,''),shop.name) into current_name from public.store_settings where store_id=p_store;
  if btrim(coalesce(current_name,shop.name)) is distinct from btrim(p_store_name) then
    return private.owner_error('STORE_NAME_MISMATCH');
  end if;
  return jsonb_build_object('owner',shop.owner_account_id);
end;
$$;

create function public.owner_request_rotation_otp(
  p_store uuid, p_credential_hash bytea, p_store_name text, p_request_id uuid, p_source_ip inet,
  p_challenge_id uuid, p_otp_digest bytea, p_otp_encrypted bytea
) returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  at_time timestamptz;
  request_time timestamptz := private.owner_uuid_v7_time(p_request_id);
  day_start timestamptz;
  day_end timestamptz;
  last_issued timestamptz;
  recent_count integer;
  day_count integer;
  context jsonb;
  actor uuid;
  email private.owner_canonical_email;
  prior private.rotation_otp_requests;
  current_rotation private.store_key_rotations;
  internal_intent uuid;
  issued boolean := false;
begin
  if p_store is null or request_time is null or octet_length(p_credential_hash) is distinct from 32
    or p_source_ip is null or masklen(p_source_ip) <> (case family(p_source_ip) when 4 then 32 else 128 end)
    or p_challenge_id is null or octet_length(p_otp_digest) is distinct from 32
    or not coalesce(octet_length(p_otp_encrypted) between 29 and 64,false) then
    return private.owner_error('A_REQUEST_INVALID');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('owner-rotation-otp-request:'||p_request_id::text,0));
  perform private.owner_rotation_lock_store(p_store);
  context := private.owner_check_rotation_actor(p_store,p_credential_hash,p_store_name);
  if context ? 'code' then return context; end if;
  actor := (context->>'owner')::uuid;
  select canonical_email into strict email from private.owner_accounts where id=actor for share;

  select * into prior from private.rotation_otp_requests where request_id=p_request_id;
  if found and (prior.store_id<>p_store or prior.owner_account_id<>actor) then
    return private.owner_error('A_REQUEST_ID_REUSED');
  end if;
  if prior.rotation_id is not null then
    select * into strict current_rotation from private.store_key_rotations where id=prior.rotation_id;
    return jsonb_build_object('status',current_rotation.status);
  end if;
  if prior.request_id is null then
    at_time := clock_timestamp();
    if request_time < at_time-interval '30 minutes' or request_time > at_time+interval '30 minutes' then
      return private.owner_error('A_REQUEST_ID_STALE',at_time);
    end if;
    select * into current_rotation from private.store_key_rotations where store_id=p_store and status in ('pending','applied');
    if current_rotation.id is not null then
      insert into private.rotation_otp_requests(request_id,store_id,owner_account_id,rotation_id,recorded_at,resend_not_before)
        values(p_request_id,p_store,actor,current_rotation.id,at_time,at_time);
      return jsonb_build_object('status',current_rotation.status);
    end if;

    perform pg_advisory_xact_lock(hashtextextended('owner-otp-email:'||email,0));
    perform pg_advisory_xact_lock(hashtextextended('owner-otp-ip:'||host(p_source_ip),0));
    perform pg_advisory_xact_lock(hashtextextended('owner-otp-project',0));
    at_time := clock_timestamp();
    if request_time < at_time-interval '30 minutes' or request_time > at_time+interval '30 minutes' then
      return private.owner_error('A_REQUEST_ID_STALE',at_time);
    end if;
    day_start := date_trunc('day',at_time at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
    day_end := (date_trunc('day',at_time at time zone 'Asia/Ho_Chi_Minh')+interval '1 day')
      at time zone 'Asia/Ho_Chi_Minh';
    select max(issued_at),count(*) filter(where issued_at>at_time-interval '15 minutes'),
      count(*) filter(where issued_at>=day_start and issued_at<day_end)
      into last_issued,recent_count,day_count
      from private.otp_challenges where canonical_email=email and purpose='store_key_rotation';
    if (last_issued is null or last_issued<=at_time-interval '10 minutes') and recent_count<3 and day_count<10
      and (select count(*) from private.otp_challenges where source_ip=p_source_ip
        and issued_at>at_time-interval '1 hour')<10
      and (select count(*) from private.otp_challenges where issued_at>=day_start and issued_at<day_end)<400
    then
      update private.otp_challenges set status='superseded'
        where canonical_email=email and purpose='store_key_rotation' and status='active';
      internal_intent := gen_random_uuid();
      insert into private.create_intents(intent_id,canonical_email,input_digest,created_at)
        values(internal_intent,email,p_otp_digest,at_time);
      insert into private.otp_challenges(id,intent_id,canonical_email,purpose,source_ip,issued_at,expires_at,otp_digest)
        values(p_challenge_id,internal_intent,email,'store_key_rotation',p_source_ip,at_time,
          at_time+interval '10 minutes',p_otp_digest);
      insert into private.rotation_otp_scope values(p_challenge_id,p_store,actor);
      insert into private.mail_dispatches(kind,canonical_email,challenge_id,otp_encrypted,otp_encryption_version,queued_at)
        values('rotation_otp',email,p_challenge_id,p_otp_encrypted,1,at_time);
      issued := true;
    end if;
    insert into private.rotation_otp_requests(request_id,store_id,owner_account_id,challenge_ref,recorded_at,resend_not_before)
      values(p_request_id,p_store,actor,case when issued then p_challenge_id else p_request_id end,
        at_time,at_time+interval '10 minutes')
      returning * into prior;
  end if;
  return jsonb_build_object('challengeRef',prior.challenge_ref,'dispatchNew',issued,
    'serverNow',floor(extract(epoch from prior.recorded_at)*1000)::bigint,
    'resendNotBefore',floor(extract(epoch from prior.resend_not_before)*1000)::bigint);
end;
$$;

create function public.owner_verify_rotation_otp(
  p_store uuid, p_credential_hash bytea, p_store_name text, p_attempt_id uuid, p_challenge_id uuid,
  p_otp_digest bytea, p_ciphertext bytea, p_version integer
) returns jsonb language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  at_time timestamptz;
  attempt_time timestamptz := private.owner_uuid_v7_time(p_attempt_id);
  context jsonb;
  result jsonb;
  actor uuid;
  email private.owner_canonical_email;
  r private.store_key_rotations;
  prior private.rotation_otp_failures;
  challenge private.otp_challenges;
begin
  if p_store is null or attempt_time is null or p_challenge_id is null
    or octet_length(p_credential_hash) is distinct from 32 or octet_length(p_otp_digest) is distinct from 32 then
    return private.owner_error('A_REQUEST_INVALID');
  end if;
  perform pg_advisory_xact_lock(hashtextextended('store-key-rotation-attempt:'||p_attempt_id::text,0));
  perform private.owner_rotation_lock_store(p_store);
  context := private.owner_check_rotation_actor(p_store,p_credential_hash,p_store_name);
  if context ? 'code' then return context; end if;
  actor := (context->>'owner')::uuid;

  select * into r from private.store_key_rotations where accepted_attempt_id=p_attempt_id;
  if found then
    if r.store_id<>p_store or r.actor_owner_account_id<>actor or not exists(
      select 1 from private.rotation_otp_acceptances where rotation_id=r.id
        and challenge_id=p_challenge_id and compared_digest=p_otp_digest
    ) then return private.owner_error('A_ATTEMPT_ID_REUSED'); end if;
    return jsonb_build_object('status',r.status);
  end if;
  select * into prior from private.rotation_otp_failures where attempt_id=p_attempt_id;
  if found then
    if prior.challenge_id<>p_challenge_id or prior.compared_digest<>p_otp_digest
      or not exists(select 1 from private.rotation_otp_scope where challenge_id=p_challenge_id
        and store_id=p_store and owner_account_id=actor) then return private.owner_error('A_ATTEMPT_ID_REUSED'); end if;
    return private.owner_error('A_OTP_INVALID');
  end if;
  select * into r from private.store_key_rotations where store_id=p_store and status in ('pending','applied');
  if found then return jsonb_build_object('status',r.status); end if;

  select canonical_email into strict email from private.owner_accounts where id=actor for share;
  select c.* into challenge from private.otp_challenges c join private.rotation_otp_scope s on s.challenge_id=c.id
    where c.id=p_challenge_id and s.store_id=p_store and s.owner_account_id=actor
      and c.canonical_email=email and c.purpose='store_key_rotation' for update of c;
  at_time := clock_timestamp();
  if attempt_time<at_time-interval '30 minutes' or attempt_time>at_time+interval '30 minutes' then
    return private.owner_error('A_REQUEST_ID_STALE',at_time);
  end if;
  if challenge.id is null then return private.owner_error('A_OTP_UNAVAILABLE'); end if;
  if challenge.status='locked' then return private.owner_error('A_OTP_ATTEMPTS_EXCEEDED'); end if;
  if challenge.status<>'active' then return private.owner_error('A_OTP_UNAVAILABLE'); end if;
  if at_time>=challenge.expires_at then return private.owner_error('A_OTP_EXPIRED'); end if;
  if challenge.otp_digest is distinct from p_otp_digest then
    update private.otp_challenges set failed_attempts=failed_attempts+1,
      status=case when failed_attempts=4 then 'locked' else 'active' end where id=challenge.id;
    insert into private.rotation_otp_failures(attempt_id,challenge_id,compared_digest)
      values(p_attempt_id,challenge.id,p_otp_digest);
    return private.owner_error('A_OTP_INVALID');
  end if;

  begin
    result := private.owner_begin_store_key_rotation(p_store,actor,p_attempt_id,p_ciphertext,p_version);
    if result->>'status'='pending' and result ? 'id' then
      if clock_timestamp() >= challenge.expires_at then raise sqlstate 'P0801'; end if;
      insert into private.rotation_otp_acceptances(rotation_id,challenge_id,compared_digest)
        values((result->>'id')::uuid,challenge.id,p_otp_digest);
      update private.otp_challenges set status='used' where id=challenge.id;
      return jsonb_build_object('status','pending','firstAcceptance',true,'rotationId',result->>'id',
        'storeNo',(select store_no from public.stores where id=p_store));
    end if;
  exception when sqlstate 'P0801' then
    return private.owner_error('A_OTP_EXPIRED');
  end;
  return result;
end;
$$;

revoke all on function private.owner_check_rotation_actor(uuid,bytea,text) from public, anon, authenticated, service_role;
revoke all on function public.owner_request_rotation_otp(uuid,bytea,text,uuid,inet,uuid,bytea,bytea),
  public.owner_verify_rotation_otp(uuid,bytea,text,uuid,uuid,bytea,bytea,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_request_rotation_otp(uuid,bytea,text,uuid,inet,uuid,bytea,bytea),
  public.owner_verify_rotation_otp(uuid,bytea,text,uuid,uuid,bytea,bytea,integer) to service_role;

create function private.owner_rotation_otp_mail_valid(p_challenge uuid, p_time timestamptz) returns boolean
language sql stable set search_path=pg_catalog as $$
  select exists(select 1 from private.otp_challenges c join private.rotation_otp_scope sc on sc.challenge_id=c.id
    join public.stores s on s.id=sc.store_id and s.owner_account_id=sc.owner_account_id and s.status='active'
    join private.owner_accounts a on a.id=s.owner_account_id and a.canonical_email=c.canonical_email
    where c.id=p_challenge and c.purpose='store_key_rotation' and c.status='active' and c.expires_at>p_time);
$$;

create function public.owner_claim_rotation_otp_mail() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  delivery private.mail_dispatches;
  scope private.rotation_otp_scope;
  token uuid;
  at_time timestamptz;
begin
  select m.* into delivery from private.mail_dispatches m
    where m.kind='rotation_otp' and m.status='queued' order by m.queued_at,m.id limit 1;
  if delivery.id is null then return null; end if;
  select * into strict scope from private.rotation_otp_scope where challenge_id=delivery.challenge_id;
  perform private.owner_rotation_lock_store(scope.store_id);
  perform 1 from private.otp_challenges where id=scope.challenge_id for update;
  select * into delivery from private.mail_dispatches where id=delivery.id and status='queued' for update;
  if delivery.id is null then return null; end if;
  at_time := clock_timestamp();
  if not private.owner_rotation_otp_mail_valid(scope.challenge_id,at_time) then
    update private.mail_dispatches set status='failed_before_submit',resolved_at=at_time,
      otp_encrypted=null,otp_encryption_version=null where id=delivery.id;
    return null;
  end if;
  token := gen_random_uuid();
  update private.mail_dispatches set status='sending',claim_token=token,claim_expires_at=at_time+interval '60 seconds',
    otp_encrypted=null,otp_encryption_version=null where id=delivery.id;
  return jsonb_build_object('state','claimed','id',delivery.id,'claimToken',token,'challengeId',scope.challenge_id,
    'storeId',scope.store_id,'email',delivery.canonical_email,'otpEncrypted',encode(delivery.otp_encrypted,'hex'),
    'otpEncryptionVersion',delivery.otp_encryption_version);
end;
$$;

create function public.owner_authorize_rotation_otp_submit(p_id uuid,p_claim_token uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  delivery private.mail_dispatches;
  scope private.rotation_otp_scope;
  expires timestamptz;
  at_time timestamptz;
begin
  select sc.* into scope from private.mail_dispatches m join private.rotation_otp_scope sc
    on sc.challenge_id=m.challenge_id where m.id=p_id and m.kind='rotation_otp';
  if not found then return null; end if;
  perform private.owner_rotation_lock_store(scope.store_id);
  select expires_at into expires from private.otp_challenges where id=scope.challenge_id for update;
  select * into delivery from private.mail_dispatches where id=p_id for update;
  at_time := clock_timestamp();
  if delivery.status is distinct from 'sending' or delivery.claim_token is distinct from p_claim_token
    or delivery.submit_authorized_at is not null or at_time>=delivery.claim_expires_at then return null; end if;
  if not private.owner_rotation_otp_mail_valid(scope.challenge_id,at_time) then
    update private.mail_dispatches set status='failed_before_submit',resolved_at=at_time where id=p_id;
    return null;
  end if;
  update private.mail_dispatches set submit_authorized_at=at_time where id=p_id;
  return jsonb_build_object('allowed',true,'serverNow',floor(extract(epoch from at_time)*1000)::bigint,
    'deadline',floor(extract(epoch from least(expires,delivery.claim_expires_at))*1000)::bigint);
end;
$$;

create function public.owner_finish_rotation_otp_mail(p_id uuid,p_claim_token uuid,p_status text) returns boolean
language sql volatile security definer set search_path=pg_catalog as $$
  with finished as (
    update private.mail_dispatches set status=p_status,resolved_at=clock_timestamp()
    where id=p_id and kind='rotation_otp' and status='sending' and claim_token=p_claim_token
      and claim_expires_at>clock_timestamp() and p_status in ('submitted','rejected','failed_before_submit','unknown')
      and (p_status not in ('submitted','rejected') or submit_authorized_at is not null)
    returning 1
  ) select exists(select 1 from finished);
$$;

revoke all on function private.owner_rotation_otp_mail_valid(uuid,timestamptz),
  public.owner_claim_rotation_otp_mail(),public.owner_authorize_rotation_otp_submit(uuid,uuid),
  public.owner_finish_rotation_otp_mail(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.owner_claim_rotation_otp_mail(),public.owner_authorize_rotation_otp_submit(uuid,uuid),
  public.owner_finish_rotation_otp_mail(uuid,uuid,text) to service_role;

commit;
