-- Run on the isolated PostgreSQL fixture after applying the T06 SQL files.
begin;

create function pg_temp.attempt_id(at_time timestamptz default clock_timestamp()) returns uuid
language sql as $$
  select (substr(ts,1,8) || '-' || substr(ts,9) || '-7' ||
    substr(gen_random_uuid()::text,16,3) || '-' || substr(gen_random_uuid()::text,20))::uuid
  from (select lpad(to_hex(floor(extract(epoch from at_time)*1000)::bigint),12,'0') ts) stamp;
$$;

do $$
declare
  protected_table text;
begin
  if (select count(*) from public.stores) <> 0 then
    raise exception 'expected an isolated empty T06 fixture';
  end if;
  foreach protected_table in array array['owner_accounts','create_intents','otp_challenges',
    'otp_request_outcomes','otp_attempts','create_operations','mail_dispatches','auth_create_dispatches','store_admin_log'] loop
    if has_table_privilege('authenticated', 'private.' || protected_table, 'SELECT')
      or has_table_privilege('anon', 'private.' || protected_table, 'INSERT')
      or has_table_privilege('service_role', 'private.' || protected_table, 'UPDATE') then
      raise exception 'raw privilege granted on %', protected_table;
    end if;
  end loop;
  if has_any_column_privilege('authenticated', 'public.stores', 'SELECT')
    or has_function_privilege('authenticated', 'public.permission_bootstrap_store(jsonb)', 'EXECUTE')
    or has_function_privilege('anon', 'public.permission_reserve_store_no(uuid)', 'EXECUTE')
    or has_function_privilege('anon', 'public.owner_request_create_otp(uuid,uuid,text,inet,uuid,bytea,bytea,bytea,integer)', 'EXECUTE')
    or has_function_privilege('authenticated', 'public.owner_verify_create(uuid,uuid,text,bytea,bytea,text,text,boolean,text)', 'EXECUTE')
    or has_function_privilege('service_role', 'private.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer)', 'EXECUTE')
    or has_function_privilege('anon', 'public.owner_get_create_status(uuid)', 'EXECUTE') then
    raise exception 'unexpected client privileges after migration';
  end if;
end;
$$;

do $$
declare
  account uuid := gen_random_uuid();
  first_store uuid := gen_random_uuid();
  second_store uuid := gen_random_uuid();
begin
  insert into auth.users(id) values (first_store), (second_store);
  insert into private.owner_accounts(id,canonical_email) values (account,'schema@invalid.test');
  insert into public.stores(id,store_no,owner_account_id,key_secret_encrypted,key_encryption_version)
    values (first_store,101,account,'\x01',1),(second_store,102,account,'\x02',1);
  insert into public.employees(id,store_id,name,role,passcode_hash)
    values (gen_random_uuid(),first_store,'Chủ quán','owner',extensions.crypt('123456',extensions.gen_salt('bf'))),
      (gen_random_uuid(),second_store,'Chủ quán','owner',extensions.crypt('123456',extensions.gen_salt('bf')));
  if (select count(*) from public.stores where owner_account_id = account) <> 2 then
    raise exception 'owner must be allowed multiple stores';
  end if;
  begin
    update public.stores set owner_account_id = null where id = first_store;
    raise exception 'nullable owner accepted';
  exception when not_null_violation then null;
  end;
end;
$$;

do $$
declare
  intent uuid := gen_random_uuid();
  challenge uuid := gen_random_uuid();
  at_time timestamptz := clock_timestamp();
  digest bytea := extensions.digest('claim-expiry','sha256');
  claimed jsonb;
  permission jsonb;
begin
  insert into private.create_intents(intent_id,canonical_email,input_digest,created_at)
    values (intent,'expired-mail@invalid.test',digest,at_time);
  insert into private.otp_challenges(id,intent_id,canonical_email,source_ip,issued_at,expires_at,otp_digest)
    values (challenge,intent,'expired-mail@invalid.test','192.0.2.13',
      at_time-interval '9 minutes 59.9 seconds',at_time+interval '0.1 seconds',digest);
  insert into private.mail_dispatches(kind,canonical_email,challenge_id,otp_encrypted,otp_encryption_version,queued_at)
    values ('create_store_otp','expired-mail@invalid.test',challenge,'\x12',1,at_time);
  claimed := public.owner_claim_otp_mail();
  if claimed->>'state' is distinct from 'claimed' then raise exception 'OTP was not claimed in time'; end if;
  perform pg_sleep(0.15);
  permission := public.owner_authorize_otp_submit((claimed->>'id')::uuid,(claimed->>'claimToken')::uuid);
  if permission is not null
    or (select status from private.mail_dispatches where id=(claimed->>'id')::uuid) <> 'failed_before_submit' then
    raise exception 'expired OTP was not independently rejected before submit';
  end if;
end;
$$;

do $$
declare
  mail jsonb;
  result jsonb;
  first_receipt jsonb;
  original_request uuid := pg_temp.attempt_id();
  challenge uuid := gen_random_uuid();
  intent uuid := gen_random_uuid();
  accepted_id uuid := pg_temp.attempt_id();
  alias_id uuid := pg_temp.attempt_id();
  email private.owner_canonical_email := 'owner@invalid.test';
  correct bytea := extensions.digest('correct','sha256');
  wrong bytea := extensions.digest('wrong','sha256');
  input bytea := extensions.digest('input','sha256');
  attempt uuid;
begin
  first_receipt := public.owner_request_create_otp(original_request,intent,email,'192.0.2.11',
    challenge,input,correct,'\x1234',1);
  if first_receipt->>'challengeRef' is distinct from challenge::text then
    raise exception 'initial request did not issue';
  end if;
  result := public.owner_request_create_otp(original_request,intent,email,'192.0.2.11',
    gen_random_uuid(),wrong,wrong,'\x1234',1);
  if result is distinct from first_receipt - 'dispatchNew' or first_receipt->>'dispatchNew' is distinct from 'true' then
    raise exception 'issue replay changed receipt or acquired a new mail trigger';
  end if;
  perform public.owner_request_create_otp(pg_temp.attempt_id(),intent,email,'192.0.2.12',
    gen_random_uuid(),wrong,wrong,'\x1234',1);
  if (select count(*) from private.otp_challenges where canonical_email=email) <> 1 then
    raise exception 'cooldown accepted another challenge';
  end if;

  mail := public.owner_claim_otp_mail();
  if mail->>'state' is distinct from 'claimed'
    or mail->>'otpEncrypted' is distinct from '1234' or public.owner_claim_otp_mail() is not null then
    raise exception 'OTP mail was not claimed once';
  end if;
  if public.owner_authorize_otp_submit((mail->>'id')::uuid,(mail->>'claimToken')::uuid)->>'allowed' is distinct from 'true'
    or public.owner_authorize_otp_submit((mail->>'id')::uuid,(mail->>'claimToken')::uuid) is not null
    or not public.owner_finish_otp_mail((mail->>'id')::uuid,(mail->>'claimToken')::uuid,'submitted') then
    raise exception 'outbox did not enforce single submit';
  end if;
  if exists (select 1 from private.mail_dispatches where challenge_id=challenge
    and (status <> 'submitted' or otp_encrypted is not null)) then
    raise exception 'submitted mail retained the queued ciphertext';
  end if;

  attempt := pg_temp.attempt_id();
  result := public.owner_verify_create(attempt,intent,email,wrong,input,'Cafe','',false,'123456');
  if result->>'code' is distinct from 'A_OTP_INVALID'
    or public.owner_verify_create(attempt,intent,email,wrong,wrong,'Cafe','',false,'000000') is distinct from result then
    raise exception 'wrong OTP leaked form/PIN or did not replay';
  end if;
  if (select failed_attempts from private.otp_challenges where id=challenge) <> 1 then
    raise exception 'identical replay added a failure';
  end if;

  result := public.owner_verify_create(accepted_id,intent,email,correct,input,'Cafe','',false,'123456');
  if result->>'status' is distinct from 'accepted' or not (result ?& array['operationId','leaseToken']) then
    raise exception 'valid OTP did not accept an operation';
  end if;
  if public.owner_verify_create(attempt,intent,email,wrong,input,'Cafe','',false,'123456')->>'code'
    is distinct from 'A_OTP_INVALID' or public.owner_get_create_status(attempt)->>'status' is distinct from 'not_accepted' then
    raise exception 'stored refusal changed after acceptance';
  end if;
  if public.owner_verify_create(alias_id,intent,email,wrong,wrong,'Cafe','',false,'000000')
    is distinct from '{"status":"accepted"}'::jsonb
    or public.owner_get_create_status(alias_id) is distinct from '{"status":"accepted"}'::jsonb then
    raise exception 'alias did not stay status-only';
  end if;
  if (select count(*) from private.create_operations where intent_id=intent) <> 1
    or (select status from private.otp_challenges where id=challenge) <> 'used' then
    raise exception 'OTP was not consumed exactly once';
  end if;
end;
$$;

do $$
declare
  challenge uuid := gen_random_uuid();
  intent uuid := gen_random_uuid();
  last_attempt uuid;
  email private.owner_canonical_email := 'fifth@invalid.test';
  correct bytea := extensions.digest('correct','sha256');
  wrong bytea := extensions.digest('wrong','sha256');
  input bytea := extensions.digest('input','sha256');
begin
  perform public.owner_request_create_otp(pg_temp.attempt_id(),intent,email,'192.0.2.11',
    challenge,input,correct,'\x1234',1);
  for count in 1..4 loop
    if public.owner_verify_create(pg_temp.attempt_id(),intent,email,wrong,input,'Cafe','',false,'123456')->>'code'
      is distinct from 'A_OTP_INVALID' then raise exception 'ordinary wrong OTP did not count'; end if;
  end loop;
  last_attempt := pg_temp.attempt_id();
  if public.owner_verify_create(last_attempt,intent,email,correct,wrong,'Cafe','',false,'123456')->>'code'
    is distinct from 'CREATE_INTENT_CONFLICT' then raise exception 'fifth cause was lost'; end if;
  if public.owner_verify_create(last_attempt,intent,email,correct,wrong,'Cafe','',false,'123456')->>'code'
    is distinct from 'CREATE_INTENT_CONFLICT' then raise exception 'fifth replay cause changed'; end if;
  if public.owner_verify_create(pg_temp.attempt_id(),intent,email,correct,input,'Cafe','',false,'123456')->>'code'
    is distinct from 'A_OTP_ATTEMPTS_EXCEEDED' then raise exception 'fifth failure did not lock'; end if;
  if not exists (select 1 from private.otp_challenges where id=challenge and status='locked' and failed_attempts=5) then
    raise exception 'counter was not exactly five';
  end if;
end;
$$;

do $$
declare
  intent uuid := gen_random_uuid();
  challenge uuid := gen_random_uuid();
  attempt uuid := pg_temp.attempt_id();
  email private.owner_canonical_email := 'provision@invalid.test';
  digest bytea := extensions.digest('provision','sha256');
  result jsonb;
  claim jsonb;
  op_id uuid;
  lease uuid;
  tech_user uuid := gen_random_uuid();
begin
  perform public.owner_request_create_otp(pg_temp.attempt_id(),intent,email,'192.0.2.11',challenge,digest,digest,'\x1234',1);
  result := public.owner_verify_create(attempt,intent,email,digest,digest,'Quán thử','',false,'647393');
  op_id := (result->>'operationId')::uuid;
  lease := (result->>'leaseToken')::uuid;
  claim := public.owner_claim_create_auth(op_id,lease,'\x121212',1);
  if claim->>'dispatchToken' is null or public.owner_claim_create_auth(op_id,lease,'\x121212',1) ? 'dispatchToken' then
    raise exception 'Auth claim is not at-most-once';
  end if;
  insert into auth.users(id,email,raw_app_meta_data)
  values (tech_user,claim->>'email',jsonb_build_object('pos_cafe_create_dispatch',claim->>'dispatchToken'));
  result := public.owner_record_create_auth(op_id,lease,(claim->>'dispatchToken')::uuid,'created',tech_user);
  if result->>'authResult' is distinct from 'created' then raise exception 'verified Auth result was lost'; end if;
  result := public.owner_commit_created_store(op_id,lease);
  if result->>'storeNo' is distinct from claim->>'storeNo'
    or public.owner_commit_created_store(op_id,lease) is distinct from '{"status":"created"}'::jsonb then
    raise exception 'bootstrap replay must only read status';
  end if;
  if (select count(*) from public.employees where store_id=tech_user and role='owner'
    and not pin_change_required and extensions.crypt('647393',passcode_hash)=passcode_hash) <> 1
    or (select count(*) from private.mail_dispatches where operation_id=op_id and kind='store_key') <> 1 then
    raise exception 'bootstrap did not atomically persist PIN and key mail';
  end if;
  if not public.owner_authorize_original_delivery(op_id,lease)
    or public.owner_authorize_original_delivery(op_id,lease)
    or public.owner_get_create_status(attempt) is distinct from '{"status":"created"}'::jsonb then
    raise exception 'original delivery authorization was not limited to one';
  end if;
end;
$$;

set local role service_role;
select public.owner_get_create_status('00000000-0000-0000-0000-000000000000'::uuid) as service_entrypoint;

-- PostgREST converts its JSON body as the caller before executing the definer RPC.
do $$
declare result jsonb;
begin
  if has_schema_privilege(current_user, 'private', 'USAGE') then
    raise exception 'service-role RPC must not require access to the private schema';
  end if;
  select public.owner_request_create_otp(null,null,body.email,null,null,null,null,null,null) into result
  from json_to_record('{"email":"rpc@invalid.test"}'::json) as body(email text);
  if result->>'code' is distinct from 'A_REQUEST_INVALID'
    or (public.owner_verify_create(null,null,'rpc@invalid.test',null,null,'','',false,'123456')->>'ok') is distinct from 'false'
    or (public.owner_confirm_key_saved(null,null,'rpc@invalid.test',null,null)->>'ok') is distinct from 'false'
    or (public.owner_set_store_status(null,'active','local-contract')->>'ok') is distinct from 'false' then
    raise exception 'owner RPC argument conversion did not reach the private implementation';
  end if;
end;
$$;
reset role;

rollback;
