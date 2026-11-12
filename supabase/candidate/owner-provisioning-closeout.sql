-- Closeout and durable work discovery. Client input reaches these RPCs only through the server.
begin;

create function public.owner_confirm_key_saved(
  p_attempt_id uuid, p_intent_id uuid, p_email private.owner_canonical_email,
  p_otp_digest bytea, p_input_digest bytea
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  op private.create_operations;
  intent private.create_intents;
  otp_digest bytea;
  at_time timestamptz;
begin
  select * into intent from private.create_intents where intent_id = p_intent_id;
  if intent.canonical_email is distinct from p_email then
    return private.owner_error('CONFIRM_REJECTED');
  end if;
  select * into op from private.create_operations where intent_id = p_intent_id for update;
  at_time := clock_timestamp();
  if op.status is distinct from 'created' then return private.owner_error('CONFIRM_REJECTED'); end if;
  if op.delivery_closed_at is not null or at_time >= op.receipt_expires_at then
    return jsonb_build_object('status','closed');
  end if;
  if p_attempt_id is distinct from op.accepted_attempt_id then return private.owner_error('CONFIRM_REJECTED'); end if;
  select c.otp_digest into otp_digest from private.otp_challenges c where c.id = op.accepted_challenge_id;
  if otp_digest is distinct from p_otp_digest or intent.input_digest is distinct from p_input_digest then
    update private.create_operations
      set wrong_receives = wrong_receives + 1,
          delivery_closed_at = case when wrong_receives = 4 then at_time else delivery_closed_at end
    where id = op.id;
    return private.owner_error('CONFIRM_REJECTED');
  end if;
  update private.create_operations set delivery_closed_at = at_time where id = op.id;
  return jsonb_build_object('status','closed');
end;
$$;

create function public.owner_next_initial_seed() returns uuid
language sql stable security definer set search_path = pg_catalog as $$
  select o.id from private.create_operations o
  join private.initial_seed_workflows w on w.store_id = o.created_store_id
  join public.stores s on s.id = o.created_store_id
  where o.status = 'created' and o.seed_demo and w.status = 'pending' and s.status = 'active'
  order by o.resolved_at, o.id limit 1;
$$;

create function public.owner_claim_store_key_mail() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  delivery private.mail_dispatches;
  op private.create_operations;
  store_row public.stores;
  version integer;
begin
  select * into delivery from private.mail_dispatches
    where kind = 'store_key' and status = 'queued'
    order by queued_at,id limit 1 for update skip locked;
  if delivery.id is null then return null; end if;
  select * into op from private.create_operations where id = delivery.operation_id;
  select * into store_row from public.stores where id = op.created_store_id;
  if op.status is distinct from 'created' or store_row.owner_account_id is distinct from op.owner_account_id
    or not exists(select 1 from private.owner_accounts where id = op.owner_account_id
      and canonical_email = delivery.canonical_email) then
    update private.mail_dispatches set status = 'failed_before_submit', resolved_at = clock_timestamp()
      where id = delivery.id;
    return jsonb_build_object('state','skipped');
  end if;
  update private.mail_dispatches set status = 'sending', claim_token = gen_random_uuid(),
    claim_expires_at = clock_timestamp() + interval '60 seconds'
  where id = delivery.id returning * into delivery;
  return jsonb_build_object(
    'state','claimed','id',delivery.id,'email',delivery.canonical_email,'claimToken',delivery.claim_token,
    'storeNo',store_row.store_no,'storeSecretEncrypted',encode(store_row.key_secret_encrypted,'hex'),
    'keyEncryptionVersion',store_row.key_encryption_version,'operationId',op.id,
    'displayName',op.display_name,'address',op.address
  );
end;
$$;

create function public.owner_authorize_store_key_submit(p_id uuid, p_claim_token uuid) returns boolean
language sql volatile security definer set search_path = pg_catalog as $$
  with permit as (
    update private.mail_dispatches m set submit_authorized_at = clock_timestamp()
    where m.id = p_id and m.kind = 'store_key' and m.status = 'sending'
      and m.claim_token = p_claim_token and m.claim_expires_at > clock_timestamp()
      and m.submit_authorized_at is null
      and exists(select 1 from private.create_operations o
        join public.stores s on s.id = o.created_store_id and s.owner_account_id = o.owner_account_id
        join private.owner_accounts a on a.id = o.owner_account_id
        where o.id = m.operation_id and a.canonical_email = m.canonical_email)
    returning 1
  ) select exists(select 1 from permit);
$$;

create function public.owner_finish_store_key_mail(p_id uuid, p_claim_token uuid, p_status text) returns boolean
language sql volatile security definer set search_path = pg_catalog as $$
  with changed as (
    update private.mail_dispatches set status = p_status, resolved_at = clock_timestamp()
    where id = p_id and kind = 'store_key' and status = 'sending' and claim_token = p_claim_token
      and claim_expires_at > clock_timestamp()
      and p_status in ('submitted','rejected','failed_before_submit','unknown')
      and (p_status not in ('submitted','rejected') or submit_authorized_at is not null)
    returning 1
  ) select exists(select 1 from changed);
$$;

create or replace function public.owner_sweep_otp_mail() returns void
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare target_mail uuid;
begin
  for target_mail in
    select m.id from private.mail_dispatches m join private.otp_challenges c on c.id=m.challenge_id
    where m.kind='create_store_otp' and m.status='queued'
      and (c.status <> 'active' or c.expires_at <= clock_timestamp())
    order by m.queued_at,m.id for update of c skip locked
  loop
    update private.mail_dispatches set status='failed_before_submit', otp_encrypted=null,
      otp_encryption_version=null,resolved_at=clock_timestamp()
    where id=target_mail and status='queued';
  end loop;
  update private.mail_dispatches set status = 'unknown', resolved_at = clock_timestamp()
    where status = 'sending' and claim_expires_at <= clock_timestamp();
  delete from private.otp_request_outcomes where retain_until < clock_timestamp();
  delete from private.otp_attempts where outcome = 'rejected' and retain_until < clock_timestamp();
  update private.otp_challenges set otp_digest=null,source_ip=null,redacted_at=clock_timestamp(),
    status=case when status='active' then 'superseded' else status end
  where redacted_at is null and issued_at < (
    (date_trunc('day',clock_timestamp() at time zone 'Asia/Ho_Chi_Minh') - interval '2 days')
    at time zone 'Asia/Ho_Chi_Minh');
end;
$$;

revoke all on function public.owner_confirm_key_saved(uuid,uuid,private.owner_canonical_email,bytea,bytea),
  public.owner_next_initial_seed(), public.owner_claim_store_key_mail(),
  public.owner_authorize_store_key_submit(uuid,uuid), public.owner_finish_store_key_mail(uuid,uuid,text)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_confirm_key_saved(uuid,uuid,private.owner_canonical_email,bytea,bytea),
  public.owner_next_initial_seed(), public.owner_claim_store_key_mail(),
  public.owner_authorize_store_key_submit(uuid,uuid), public.owner_finish_store_key_mail(uuid,uuid,text)
  to service_role;

commit;
