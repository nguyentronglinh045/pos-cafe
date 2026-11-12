-- Apply after owner-provisioning-schema.sql. This surface is callable only by the server.
begin;

create function private.owner_uuid_v7_time(p_id uuid) returns timestamptz
language sql immutable strict set search_path = pg_catalog as $$
  select case when get_byte(b, 6) >> 4 = 7 and get_byte(b, 8) >> 6 = 2 then
    to_timestamp(((get_byte(b,0)::bigint << 40) + (get_byte(b,1)::bigint << 32) +
      (get_byte(b,2)::bigint << 24) + (get_byte(b,3)::bigint << 16) +
      (get_byte(b,4)::bigint << 8) + get_byte(b,5)::bigint) / 1000.0)
  end from (select uuid_send(p_id) b) uuid_bytes;
$$;

create function private.owner_error(p_code text, p_time timestamptz default null) returns jsonb
language sql immutable set search_path = pg_catalog as $$
  select jsonb_strip_nulls(jsonb_build_object(
    'ok', false, 'code', p_code,
    'serverNow', case when p_time is not null then floor(extract(epoch from p_time) * 1000)::bigint end
  ));
$$;

create function private.owner_otp_receipt(p_row private.otp_request_outcomes) returns jsonb
language sql immutable set search_path = pg_catalog as $$
  select jsonb_build_object(
    'challengeRef', coalesce(p_row.challenge_id, p_row.request_id),
    'serverNow', floor(extract(epoch from p_row.recorded_at) * 1000)::bigint,
    'resendNotBefore', floor(extract(epoch from p_row.resend_not_before) * 1000)::bigint
  );
$$;

create function public.owner_request_create_otp(
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
    and (select count(*) from private.otp_challenges
      where source_ip = p_source_ip and issued_at > at_time - interval '1 hour') < 10
    and (select count(*) from private.otp_challenges
      where issued_at >= day_start and issued_at < day_end) < 400
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

revoke all on function private.owner_uuid_v7_time(uuid),
  private.owner_error(text,timestamptz), private.owner_otp_receipt(private.otp_request_outcomes)
  from public, anon, authenticated, service_role;
revoke all on function public.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer)
  to service_role;

commit;
