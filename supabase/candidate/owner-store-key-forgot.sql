-- Apply after all three T08 rotation candidates. The intake never looks up an owner.
begin;

create table private.forgot_store_key_requests (
  id uuid primary key default gen_random_uuid(),
  source_ip inet not null,
  canonical_email private.owner_canonical_email,
  received_at timestamptz not null,
  check (masklen(source_ip) = case family(source_ip) when 4 then 32 else 128 end)
);
create index forgot_key_requests_ip_idx on private.forgot_store_key_requests(source_ip, received_at);
create index forgot_key_requests_ready_idx on private.forgot_store_key_requests(received_at, id)
  where canonical_email is not null;
create index forgot_key_requests_cleanup_idx on private.forgot_store_key_requests(received_at);
create index forgot_key_mail_queue_idx on private.mail_dispatches(queued_at, id)
  where kind = 'forgot_store_key' and status = 'queued';
create index forgot_key_mail_project_idx on private.mail_dispatches(submit_authorized_at)
  where kind = 'forgot_store_key' and status in ('sending','submitted','unknown');
create index forgot_key_mail_email_idx on private.mail_dispatches(canonical_email, submit_authorized_at)
  where kind = 'forgot_store_key' and status in ('sending','submitted','unknown');
create index forgot_key_mail_cleanup_idx on private.mail_dispatches(resolved_at, id)
  where kind = 'forgot_store_key' and status in ('submitted','rejected','failed_before_submit','provider_limited');

alter table private.forgot_store_key_requests enable row level security;
revoke all on private.forgot_store_key_requests from public, anon, authenticated, service_role;

create function private.owner_mail_ip_usage(p_ip inet, p_at timestamptz) returns bigint
language sql stable set search_path = pg_catalog as $$
  select (select count(*) from private.otp_challenges where source_ip = p_ip and issued_at > p_at - interval '1 hour')
    + (select count(*) from private.forgot_store_key_requests where source_ip = p_ip and received_at > p_at - interval '1 hour');
$$;

create function private.owner_mail_project_usage(p_start timestamptz, p_end timestamptz) returns bigint
language sql stable set search_path = pg_catalog as $$
  select (select count(*) from private.otp_challenges where issued_at >= p_start and issued_at < p_end)
    + (select count(*) from private.mail_dispatches where kind = 'forgot_store_key'
      and status in ('sending','submitted','unknown') and submit_authorized_at >= p_start and submit_authorized_at < p_end);
$$;

create function public.owner_enqueue_forgot_store_key(p_email text, p_source_ip inet) returns void
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  at_time timestamptz;
begin
  if p_email is null or p_source_ip is null
    or masklen(p_source_ip) <> (case family(p_source_ip) when 4 then 32 else 128 end) then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-ip:' || host(p_source_ip), 0));
  at_time := clock_timestamp();
  if private.owner_mail_ip_usage(p_source_ip, at_time) < 10 then
    insert into private.forgot_store_key_requests(source_ip, canonical_email, received_at)
      values (p_source_ip, p_email::private.owner_canonical_email, at_time);
  end if;
end;
$$;

create function public.owner_prepare_forgot_key_mail() returns boolean
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  intake private.forgot_store_key_requests;
  at_time timestamptz := clock_timestamp();
  target_owner uuid;
  candidates uuid[];
  sid uuid;
  mail_id uuid;
begin
  select * into intake from private.forgot_store_key_requests where canonical_email is not null
      and received_at >= at_time - interval '90 minutes'
    order by received_at, id limit 1 for update skip locked;
  if not found then return false; end if;
  update private.forgot_store_key_requests set canonical_email = null where id = intake.id;

  select id into target_owner from private.owner_accounts where canonical_email = intake.canonical_email;
  if target_owner is null then return true; end if;
  select array(select id from public.stores where owner_account_id = target_owner order by id) into candidates;
  foreach sid in array candidates loop
    perform private.owner_rotation_lock_store(sid);
  end loop;

  insert into private.mail_dispatches(kind, canonical_email, queued_at)
    values ('forgot_store_key', intake.canonical_email, intake.received_at) returning id into mail_id;
  insert into private.key_mail_bindings(mail_id, store_id, generation, owner_account_id, purpose)
    select mail_id, s.id, s.key_generation, s.owner_account_id, 'forgot_key'
    from public.stores s join private.owner_accounts a on a.id = s.owner_account_id
    where s.id = any(candidates) and s.owner_account_id = target_owner and a.canonical_email = intake.canonical_email
      and not exists(select 1 from private.store_key_rotations r where r.store_id = s.id and r.status = 'pending');
  if not found then delete from private.mail_dispatches where id = mail_id; end if;
  return true;
end;
$$;

-- Claim and authorize in one transaction. No later lookup can rebind this mail to a different recipient.
create function public.owner_claim_forgot_key_mail() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  mail private.mail_dispatches;
  sid uuid;
  items jsonb;
  at_time timestamptz := clock_timestamp();
  local_day timestamp;
begin
  select * into mail from private.mail_dispatches where kind = 'forgot_store_key' and status = 'queued'
    and queued_at >= at_time - interval '90 minutes'
    order by queued_at, id limit 1;
  if not found then return null; end if;
  for sid in select distinct store_id from private.key_mail_bindings where mail_id = mail.id order by store_id loop
    perform private.owner_rotation_lock_store(sid);
  end loop;
  select * into mail from private.mail_dispatches where id = mail.id and status = 'queued' for update;
  if not found then return jsonb_build_object('state', 'skipped'); end if;

  perform pg_advisory_xact_lock(hashtextextended('owner-forgot-email:' || mail.canonical_email, 0));
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-project', 0));
  at_time := clock_timestamp();
  if mail.queued_at < at_time - interval '90 minutes' then return jsonb_build_object('state', 'skipped'); end if;
  local_day := date_trunc('day', at_time at time zone 'Asia/Ho_Chi_Minh');
  if (select count(*) from private.mail_dispatches where kind = 'forgot_store_key' and canonical_email = mail.canonical_email
      and status in ('sending','submitted','unknown') and submit_authorized_at > at_time - interval '1 hour') >= 3
    or private.owner_mail_project_usage(local_day at time zone 'Asia/Ho_Chi_Minh',
      (local_day + interval '1 day') at time zone 'Asia/Ho_Chi_Minh') >= 400 then
    update private.mail_dispatches set status = 'provider_limited', resolved_at = at_time where id = mail.id;
    return jsonb_build_object('state', 'skipped');
  end if;

  select jsonb_agg(jsonb_build_object('storeId', s.id, 'storeNo', s.store_no,
    'displayName', coalesce(settings.display_name, s.name, ''), 'address', coalesce(settings.address, ''),
    'generation', b.generation::text, 'acceptedAttemptId', r.accepted_attempt_id, 'operationId', o.id,
    'storeSecretEncrypted', encode(s.key_secret_encrypted, 'hex'), 'keyEncryptionVersion', s.key_encryption_version,
    'warnSessions', coalesce(r.session_warning_until > at_time, false)) order by s.store_no)
  into items from private.key_mail_bindings b
  join public.stores s on s.id = b.store_id and s.key_generation = b.generation and s.owner_account_id = b.owner_account_id
  join private.owner_accounts a on a.id = b.owner_account_id and a.canonical_email = mail.canonical_email
  left join public.store_settings settings on settings.store_id = s.id
  left join private.create_operations o on b.generation = 0 and o.created_store_id = s.id and o.status = 'created'
  left join private.store_key_rotations r on b.generation > 0 and r.store_id = s.id and r.generation = b.generation
    and r.status in ('applied','completed')
  where b.mail_id = mail.id and b.purpose = 'forgot_key'
    and (o.id is not null or r.id is not null)
    and not exists(select 1 from private.store_key_rotations pending where pending.store_id = s.id and pending.status = 'pending');

  -- Remove bindings excluded above, so they do not fence an unrelated rotation while this mail is sent.
  delete from private.key_mail_bindings b where b.mail_id = mail.id and not exists (
    select 1 from jsonb_array_elements(coalesce(items, '[]'::jsonb)) item where item->>'storeId' = b.store_id::text
  );
  if items is null then
    update private.mail_dispatches set status = 'failed_before_submit', resolved_at = at_time where id = mail.id;
    return jsonb_build_object('state', 'skipped');
  end if;

  update private.mail_dispatches set status = 'sending', claim_token = gen_random_uuid(),
    claim_expires_at = at_time + interval '60 seconds', submit_authorized_at = at_time
    where id = mail.id returning * into mail;
  return jsonb_build_object('state', 'claimed', 'id', mail.id, 'claimToken', mail.claim_token,
    'email', mail.canonical_email, 'stores', items);
end;
$$;

create function public.owner_finish_forgot_key_mail(p_id uuid, p_claim_token uuid, p_status text) returns boolean
language sql volatile security definer set search_path = pg_catalog as $$
  with finished as (
    update private.mail_dispatches set status = p_status, resolved_at = clock_timestamp()
      where id = p_id and kind = 'forgot_store_key' and status = 'sending' and claim_token = p_claim_token
        and claim_expires_at > clock_timestamp() and p_status in ('submitted','rejected','failed_before_submit','unknown')
    returning 1
  ) select exists(select 1 from finished);
$$;

-- owner_sweep_mail moves expired sending claims to unknown. Once classified there is no automatic resend.
create function public.owner_sweep_forgot_key_mail() returns void
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  at_time timestamptz := clock_timestamp();
  expired_mail uuid[];
begin
  delete from private.forgot_store_key_requests where id in (
    select id from private.forgot_store_key_requests where received_at < at_time - interval '90 minutes'
    order by received_at limit 500 for update skip locked
  );
  select array(select m.id from private.mail_dispatches m
    where m.kind = 'forgot_store_key' and m.status = 'queued' and m.queued_at < at_time - interval '90 minutes'
    order by m.queued_at, m.id limit 128 for update of m skip locked)
  || array(select m.id from private.mail_dispatches m
    where m.kind = 'forgot_store_key' and m.status in ('submitted','rejected','failed_before_submit','provider_limited')
      and m.resolved_at < at_time - interval '3 days'
      and not exists(select 1 from private.store_key_rotation_alerts a where a.mail_id = m.id)
    order by m.resolved_at, m.id limit 128 for update of m skip locked) into expired_mail;
  delete from private.key_mail_bindings where mail_id = any(expired_mail);
  delete from private.mail_dispatches where id = any(expired_mail);
  insert into private.store_key_rotation_alerts(mail_id)
    select id from private.mail_dispatches where kind = 'forgot_store_key' and status = 'unknown'
    on conflict(mail_id) do nothing;
end;
$$;

create or replace function public.owner_claim_store_key_rotation_alert() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  alert private.store_key_rotation_alerts;
  r private.store_key_rotations;
  mail_kind text;
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
  else
    select kind into mail_kind from private.mail_dispatches where id=alert.mail_id;
  end if;
  return jsonb_strip_nulls(jsonb_build_object('id',alert.id,'claimToken',alert.claim_token,
    'rotationId',alert.rotation_id,'storeId',r.store_id,'generation',r.generation::text,
    'phase',alert.phase,'outcome',alert.outcome,'mailId',alert.mail_id,'mailKind',mail_kind));
end;
$$;

revoke all on function private.owner_mail_ip_usage(inet,timestamptz),
  private.owner_mail_project_usage(timestamptz,timestamptz),
  public.owner_enqueue_forgot_store_key(text,inet),public.owner_prepare_forgot_key_mail(),
  public.owner_claim_forgot_key_mail(),public.owner_finish_forgot_key_mail(uuid,uuid,text),public.owner_sweep_forgot_key_mail()
  from public,anon,authenticated,service_role;
grant execute on function public.owner_enqueue_forgot_store_key(text,inet),public.owner_prepare_forgot_key_mail(),
  public.owner_claim_forgot_key_mail(),public.owner_finish_forgot_key_mail(uuid,uuid,text),public.owner_sweep_forgot_key_mail()
  to service_role;

-- OTP issuance keeps its receipt semantics and now counts intake and reserved sends in the shared buckets.
create or replace function private.owner_request_create_otp(
  p_request_id uuid, p_intent_id uuid, p_email private.owner_canonical_email, p_source_ip inet,
  p_challenge_id uuid, p_input_digest bytea, p_otp_digest bytea,
  p_otp_encrypted bytea, p_otp_encryption_version integer
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  request_time timestamptz := private.owner_uuid_v7_time(p_request_id);
  at_time timestamptz;
  day_start timestamptz;
  day_end timestamptz;
  email_last timestamptz;
  email_recent integer;
  email_day integer;
  current_challenge uuid;
  receipt private.otp_request_outcomes;
  intent private.create_intents;
  issued_challenge uuid;
begin
  if request_time is null or p_intent_id is null or p_email is null or p_source_ip is null
    or masklen(p_source_ip) <> (case family(p_source_ip) when 4 then 32 else 128 end)
    or p_challenge_id is null or coalesce(octet_length(p_input_digest),0) <> 32
    or coalesce(octet_length(p_otp_digest),0) <> 32 or coalesce(octet_length(p_otp_encrypted),0) = 0
    or coalesce(p_otp_encryption_version,0) < 1 then
    return private.owner_error('A_REQUEST_INVALID');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('owner-otp-request:' || p_request_id, 0));
  select * into receipt from private.otp_request_outcomes where request_id = p_request_id;
  if found then
    if receipt.canonical_email <> p_email or receipt.intent_id <> p_intent_id then
      return private.owner_error('A_REQUEST_ID_REUSED');
    end if;
    return private.owner_otp_receipt(receipt);
  end if;

  -- Distinct from the per-owner store quota mutex used by verification.
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-email:' || p_email, 0));
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-ip:' || host(p_source_ip), 0));
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-project', 0));
  select id into current_challenge from private.otp_challenges
    where canonical_email = p_email and purpose = 'create_store' and status = 'active'
    for update;
  perform pg_advisory_xact_lock(hashtextextended('owner-create-intent:' || p_intent_id, 0));
  at_time := clock_timestamp();
  if request_time < at_time - interval '30 minutes' or request_time > at_time + interval '30 minutes' then
    return private.owner_error('A_REQUEST_ID_STALE', at_time);
  end if;

  select * into intent from private.create_intents where intent_id = p_intent_id;
  if found and intent.canonical_email <> p_email then
    return private.owner_error('CREATE_INTENT_ID_REUSED');
  end if;

  day_start := date_trunc('day', at_time at time zone 'Asia/Ho_Chi_Minh') at time zone 'Asia/Ho_Chi_Minh';
  day_end := (date_trunc('day', at_time at time zone 'Asia/Ho_Chi_Minh') + interval '1 day') at time zone 'Asia/Ho_Chi_Minh';
  select max(issued_at),
    count(*) filter (where issued_at > at_time - interval '15 minutes'),
    count(*) filter (where issued_at >= day_start and issued_at < day_end)
    into email_last, email_recent, email_day
  from private.otp_challenges
  where canonical_email = p_email and purpose = 'create_store';

  if (email_last is null or email_last <= at_time - interval '10 minutes')
    and email_recent < 3 and email_day < 10
    and private.owner_mail_ip_usage(p_source_ip, at_time) < 10
    and private.owner_mail_project_usage(day_start, day_end) < 400
    and not exists (select 1 from private.create_operations where intent_id = p_intent_id) then

    insert into private.create_intents(intent_id, canonical_email, input_digest, created_at)
    values (p_intent_id, p_email, p_input_digest, at_time) on conflict (intent_id) do nothing;

    if current_challenge is not null then
      update private.otp_challenges set status = 'superseded' where id = current_challenge;
      update private.mail_dispatches set status = 'failed_before_submit',
        otp_encrypted = null, otp_encryption_version = null, resolved_at = at_time
      where challenge_id = current_challenge and status = 'queued';
    end if;

    insert into private.otp_challenges(id, intent_id, canonical_email, source_ip, issued_at, expires_at, otp_digest)
    values (p_challenge_id, p_intent_id, p_email, p_source_ip, at_time, at_time + interval '10 minutes', p_otp_digest);
    update private.create_intents set current_challenge_id = p_challenge_id where intent_id = p_intent_id;
    insert into private.mail_dispatches(kind, canonical_email, challenge_id,
      otp_encrypted, otp_encryption_version, queued_at)
    values ('create_store_otp', p_email, p_challenge_id, p_otp_encrypted, p_otp_encryption_version, at_time);
    issued_challenge := p_challenge_id;
  end if;

  insert into private.otp_request_outcomes(request_id, intent_id, canonical_email, challenge_id,
    recorded_at, resend_not_before, retain_until)
  values (p_request_id, p_intent_id, p_email, issued_challenge, at_time,
    at_time + interval '10 minutes', at_time + interval '90 minutes')
  returning * into receipt;
  return private.owner_otp_receipt(receipt) || jsonb_build_object('dispatchNew', issued_challenge is not null);
end;
$$;

create or replace function public.owner_request_rotation_otp(
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
      and private.owner_mail_ip_usage(p_source_ip, at_time)<10
      and private.owner_mail_project_usage(day_start, day_end)<400
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

revoke all on function private.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer)
  from public,anon,authenticated,service_role;
notify pgrst, 'reload schema';
commit;
