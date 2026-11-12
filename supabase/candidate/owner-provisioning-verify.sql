-- Verification owns the OTP/counter/seat transaction. Provisioning runs after commit.
begin;

create function private.owner_status(p_op private.create_operations, p_time timestamptz) returns jsonb
language sql stable set search_path = pg_catalog as $$
  select jsonb_build_object('status', case
    when p_op.status = 'accepted' and p_op.lease_expires_at <= p_time then 'unknown'
    else p_op.status end);
$$;

create function private.owner_count_wrong(p_challenge_id uuid) returns void
language sql volatile set search_path = pg_catalog as $$
  update private.otp_challenges
  set failed_attempts = failed_attempts + 1,
      status = case when failed_attempts = 4 then 'locked' else status end
  where id = p_challenge_id and status = 'active' and failed_attempts < 5;
$$;

create function public.owner_verify_create(
  p_attempt_id uuid, p_intent_id uuid, p_email private.owner_canonical_email,
  p_otp_digest bytea, p_input_digest bytea, p_display_name text, p_address text,
  p_seed_demo boolean, p_owner_pin text
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  attempt_time timestamptz := private.owner_uuid_v7_time(p_attempt_id);
  at_time timestamptz;
  scope_intent uuid;
  scope_email private.owner_canonical_email;
  selected_challenge uuid;
  challenge private.otp_challenges;
  intent private.create_intents;
  previous private.otp_attempts;
  op private.create_operations;
  store_row public.stores;
  account_id uuid;
  failure_code text;
  compared_digest bytea;
  slot_count integer;
  slot_limit integer;
begin
  if attempt_time is null or p_intent_id is null or p_email is null
    or coalesce(octet_length(p_otp_digest),0) <> 32 or coalesce(octet_length(p_input_digest),0) <> 32
    or p_display_name is null or char_length(p_display_name) not between 1 and 120
    or p_address is null or char_length(p_address) > 500 or p_seed_demo is null
    or p_owner_pin is null or p_owner_pin !~ '^[0-9]{6}$' then
    return private.owner_error('A_REQUEST_INVALID');
  end if;

  perform pg_advisory_xact_lock(hashtextextended('owner-create-attempt:' || p_attempt_id, 0));
  select * into previous from private.otp_attempts where attempt_id = p_attempt_id;
  select * into op from private.create_operations where accepted_attempt_id = p_attempt_id;

  if previous.attempt_id is not null then
    scope_intent := previous.intent_id;
    scope_email := previous.canonical_email;
    selected_challenge := previous.challenge_id;
  elsif op.id is not null then
    scope_intent := op.intent_id;
    select canonical_email into scope_email from private.create_intents where intent_id = scope_intent;
    selected_challenge := op.accepted_challenge_id;
  else
    scope_intent := p_intent_id;
    scope_email := p_email;
    select current_challenge_id into selected_challenge from private.create_intents where intent_id = scope_intent;
  end if;

  select * into challenge from private.otp_challenges where id = selected_challenge for update;
  perform pg_advisory_xact_lock(hashtextextended('owner-create-intent:' || scope_intent, 0));
  select * into intent from private.create_intents where intent_id = scope_intent;
  at_time := clock_timestamp();

  if attempt_time > at_time + interval '2 hours' then
    return private.owner_error('A_REQUEST_INVALID');
  end if;

  if previous.attempt_id is not null then
    if scope_intent <> p_intent_id or scope_email <> p_email
      or (previous.compared_otp_digest is not null and previous.compared_otp_digest <> p_otp_digest) then
      if previous.compared_otp_digest is not null and challenge.id = intent.current_challenge_id
        and challenge.status = 'active' and at_time < challenge.expires_at
        and not exists (select 1 from private.create_operations where intent_id = scope_intent) then
        perform private.owner_count_wrong(challenge.id);
      end if;
      return private.owner_error('A_ATTEMPT_ID_REUSED');
    end if;
    if previous.outcome = 'rejected' then
      return private.owner_error(previous.reason_code,
        case when previous.skew_marker then previous.recorded_at end);
    end if;
    select * into op from private.create_operations where id = previous.operation_id;
    return private.owner_status(op, at_time);
  end if;

  if op.id is not null then
    if scope_intent <> p_intent_id or scope_email <> p_email then
      return private.owner_error('A_ATTEMPT_ID_REUSED');
    end if;
    select * into op from private.create_operations where id = op.id for update;
    at_time := clock_timestamp();
    if op.status <> 'created' or op.delivery_closed_at is not null or at_time >= op.receipt_expires_at then
      return private.owner_status(op, at_time);
    end if;
    if challenge.otp_digest <> p_otp_digest or intent.input_digest <> p_input_digest then
      update private.create_operations
      set wrong_receives = wrong_receives + 1,
          delivery_closed_at = case when wrong_receives = 4 then at_time else delivery_closed_at end
      where id = op.id;
      return private.owner_status(op, at_time);
    end if;
    select * into store_row from public.stores where id = op.created_store_id;
    return private.owner_status(op, at_time) || jsonb_build_object(
      'operationId', op.id, 'storeNo', store_row.store_no, 'storeSecretEncrypted', encode(store_row.key_secret_encrypted,'hex'),
      'keyEncryptionVersion', store_row.key_encryption_version);
  end if;

  -- A concurrent issue may have installed a different challenge while we waited.
  if selected_challenge is distinct from intent.current_challenge_id then
    return private.owner_error('CREATE_VERIFY_UNAVAILABLE');
  end if;
  if attempt_time < at_time - interval '30 minutes' then
    return private.owner_error('A_REQUEST_ID_STALE', at_time);
  end if;

  select * into op from private.create_operations where intent_id = scope_intent;
  if op.id is not null and intent.canonical_email = p_email then
    if attempt_time > at_time + interval '30 minutes'
      or (select count(*) from private.otp_attempts where operation_id = op.id) >= 64 then
      return private.owner_error('CREATE_VERIFY_UNAVAILABLE');
    end if;
    insert into private.otp_attempts(attempt_id, intent_id, canonical_email, outcome, operation_id, recorded_at)
      values (p_attempt_id, p_intent_id, p_email, 'status_only', op.id, at_time);
    return private.owner_status(op, at_time);
  end if;

  if attempt_time > at_time + interval '30 minutes' then
    if intent.canonical_email = p_email and challenge.status = 'active' and at_time < challenge.expires_at
      and not exists (select 1 from private.otp_attempts where challenge_id = challenge.id and skew_marker) then
      insert into private.otp_attempts(attempt_id, intent_id, canonical_email, challenge_id,
        outcome, reason_code, skew_marker, recorded_at, retain_until)
      values (p_attempt_id, p_intent_id, p_email, challenge.id, 'rejected', 'A_REQUEST_ID_STALE',
        true, at_time, greatest(at_time + interval '90 minutes', attempt_time + interval '30 minutes'));
      return private.owner_error('A_REQUEST_ID_STALE', at_time);
    end if;
    return private.owner_error('CREATE_VERIFY_UNAVAILABLE');
  end if;

  if intent.canonical_email is distinct from p_email or challenge.id is null or op.id is not null then
    failure_code := 'A_OTP_UNAVAILABLE';
  elsif at_time >= challenge.expires_at then
    failure_code := 'A_OTP_EXPIRED';
  elsif challenge.status = 'locked' then
    failure_code := 'A_OTP_ATTEMPTS_EXCEEDED';
  elsif challenge.status <> 'active' then
    failure_code := 'A_OTP_UNAVAILABLE';
  elsif challenge.otp_digest <> p_otp_digest then
    failure_code := 'A_OTP_INVALID';
    compared_digest := p_otp_digest;
  elsif intent.input_digest <> p_input_digest then
    failure_code := 'CREATE_INTENT_CONFLICT';
    compared_digest := p_otp_digest;
  end if;

  if failure_code is null then
    perform pg_advisory_xact_lock(hashtextextended('owner-store-quota:' || p_email, 0));
    at_time := clock_timestamp();
    if at_time >= challenge.expires_at then
      failure_code := 'A_OTP_EXPIRED';
    else
      select id into account_id from private.owner_accounts where canonical_email = p_email;
      select store_limit into strict slot_limit from private.owner_provisioning_settings where singleton;
      select
        (select count(*) from public.stores where owner_account_id = account_id) +
        (select count(*) from private.create_operations
          where owner_account_id = account_id and status in ('accepted','unknown'))
      into slot_count;
      if slot_count >= slot_limit then
        failure_code := 'OWNER_STORE_LIMIT_REACHED';
        compared_digest := p_otp_digest;
      end if;
    end if;
  end if;

  if failure_code is not null then
    if failure_code in ('A_OTP_INVALID','CREATE_INTENT_CONFLICT') then
      perform private.owner_count_wrong(challenge.id);
    end if;
    insert into private.otp_attempts(attempt_id, intent_id, canonical_email, challenge_id,
      compared_otp_digest, outcome, reason_code, recorded_at, retain_until)
    values (p_attempt_id, p_intent_id, p_email,
      case when intent.canonical_email = p_email then challenge.id end,
      compared_digest, 'rejected', failure_code, at_time, at_time + interval '90 minutes');
    return private.owner_error(failure_code);
  end if;

  if account_id is null then
    insert into private.owner_accounts(canonical_email) values (p_email) returning id into account_id;
  end if;
  insert into private.create_operations(intent_id, accepted_attempt_id, owner_account_id,
    accepted_challenge_id, accepted_at, lease_expires_at, display_name, address, seed_demo,
    owner_pin_hash, receipt_expires_at)
  values (p_intent_id, p_attempt_id, account_id, challenge.id, at_time, at_time + interval '10 minutes',
    p_display_name, p_address, p_seed_demo, extensions.crypt(p_owner_pin, extensions.gen_salt('bf',10)), challenge.expires_at)
  returning * into op;
  update private.otp_challenges set status = 'used' where id = challenge.id;
  return private.owner_status(op, at_time) || jsonb_build_object('operationId', op.id, 'leaseToken', op.lease_token);
end;
$$;

create function public.owner_get_create_status(p_attempt_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  attempt_time timestamptz := private.owner_uuid_v7_time(p_attempt_id);
  at_time timestamptz;
  op private.create_operations;
  previous private.otp_attempts;
begin
  if attempt_time is null then return private.owner_error('A_REQUEST_INVALID'); end if;
  perform pg_advisory_xact_lock(hashtextextended('owner-create-attempt:' || p_attempt_id, 0));
  at_time := clock_timestamp();
  if attempt_time > at_time + interval '2 hours' then return private.owner_error('A_REQUEST_INVALID'); end if;
  select * into op from private.create_operations where accepted_attempt_id = p_attempt_id;
  if op.id is not null then return private.owner_status(op, at_time); end if;
  select * into previous from private.otp_attempts where attempt_id = p_attempt_id;
  if previous.operation_id is not null then
    select * into op from private.create_operations where id = previous.operation_id;
    return private.owner_status(op, at_time);
  end if;
  return jsonb_build_object('status', case
    when previous.attempt_id is not null or attempt_time < at_time - interval '30 minutes' then 'not_accepted'
    else 'unconfirmed' end);
end;
$$;

revoke all on function private.owner_status(private.create_operations,timestamptz),
  private.owner_count_wrong(uuid) from public, anon, authenticated, service_role;
revoke all on function public.owner_verify_create(uuid,uuid,private.owner_canonical_email,bytea,bytea,text,text,boolean,text),
  public.owner_get_create_status(uuid) from public, anon, authenticated, service_role;
grant execute on function public.owner_verify_create(uuid,uuid,private.owner_canonical_email,bytea,bytea,text,text,boolean,text),
  public.owner_get_create_status(uuid) to service_role;

commit;
