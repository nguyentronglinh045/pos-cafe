-- Rotation support mail. Requires both T08 rotation SQL candidates.
begin;

create function private.owner_rotation_key_mail_current(p_mail uuid) returns boolean
language sql stable set search_path=pg_catalog as $$
  select exists(
    select 1 from private.mail_dispatches m join private.store_key_rotations r on r.id=m.rotation_id
    join public.stores s on s.id=r.store_id and s.key_generation=r.generation
    join private.key_mail_bindings b on b.mail_id=m.id and b.store_id=s.id and b.generation=s.key_generation
      and b.owner_account_id=s.owner_account_id and b.purpose='rotation_support'
    join private.owner_accounts a on a.id=s.owner_account_id and a.canonical_email=m.canonical_email
    where m.id=p_mail and m.kind='rotation_store_key' and r.status in ('applied','completed')
      and not exists(select 1 from private.store_key_rotations pending
        where pending.store_id=s.id and pending.status='pending')
  );
$$;

create function public.owner_claim_rotation_key_mail() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  mail private.mail_dispatches;
  r private.store_key_rotations;
  shop public.stores;
  at_time timestamptz;
begin
  select * into mail from private.mail_dispatches where kind='rotation_store_key' and status='queued'
    order by queued_at,id limit 1;
  if mail.id is null then return null; end if;
  select * into strict r from private.store_key_rotations where id=mail.rotation_id;
  perform private.owner_rotation_lock_store(r.store_id);
  select * into mail from private.mail_dispatches where id=mail.id and status='queued' for update;
  if mail.id is null then return null; end if;
  at_time := clock_timestamp();
  if not private.owner_rotation_key_mail_current(mail.id) then
    update private.mail_dispatches set status='failed_before_submit',resolved_at=at_time where id=mail.id;
    return null;
  end if;
  select * into strict shop from public.stores where id=r.store_id;
  update private.mail_dispatches set status='sending',claim_token=gen_random_uuid(),
    claim_expires_at=at_time+interval '60 seconds' where id=mail.id returning * into mail;
  return jsonb_build_object('state','claimed','id',mail.id,'claimToken',mail.claim_token,'email',mail.canonical_email,
    'storeId',shop.id,'storeNo',shop.store_no,'generation',r.generation::text,'acceptedAttemptId',r.accepted_attempt_id,
    'storeSecretEncrypted',encode(shop.key_secret_encrypted,'hex'),'keyEncryptionVersion',shop.key_encryption_version,
    'appliedAt',r.applied_at);
end;
$$;

create function public.owner_authorize_rotation_key_submit(p_id uuid,p_claim_token uuid) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  sid uuid;
  warning_until timestamptz;
  at_time timestamptz;
begin
  select r.store_id into sid from private.mail_dispatches m join private.store_key_rotations r on r.id=m.rotation_id
    where m.id=p_id and m.kind='rotation_store_key';
  if sid is null then return null; end if;
  perform private.owner_rotation_lock_store(sid);
  perform 1 from private.mail_dispatches where id=p_id for update;
  if not private.owner_rotation_key_mail_current(p_id) then return null; end if;
  select r.session_warning_until into strict warning_until from private.mail_dispatches m
    join private.store_key_rotations r on r.id=m.rotation_id where m.id=p_id;
  at_time := clock_timestamp();
  update private.mail_dispatches set submit_authorized_at=at_time
    where id=p_id and status='sending' and claim_token=p_claim_token
      and claim_expires_at>at_time and submit_authorized_at is null;
  if not found then return null; end if;
  return jsonb_build_object('allowed',true,'warnSessions',warning_until>at_time);
end;
$$;

create function public.owner_finish_rotation_key_mail(p_id uuid,p_claim_token uuid,p_status text) returns boolean
language sql volatile security definer set search_path=pg_catalog as $$
  with finished as (
    update private.mail_dispatches set status=p_status,resolved_at=clock_timestamp()
    where id=p_id and kind='rotation_store_key' and status='sending' and claim_token=p_claim_token
      and claim_expires_at>clock_timestamp() and p_status in ('submitted','rejected','failed_before_submit','unknown')
      and (p_status not in ('submitted','rejected') or submit_authorized_at is not null)
    returning 1
  ) select exists(select 1 from finished);
$$;

create function public.owner_sweep_rotation_key_mail() returns void
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare
  at_time timestamptz := clock_timestamp();
begin
  delete from private.rotation_otp_failures where recorded_at<at_time-interval '90 minutes';
  delete from private.rotation_otp_requests where recorded_at<at_time-interval '90 minutes';
  update private.mail_dispatches set status='unknown',resolved_at=at_time
    where kind='rotation_store_key' and status='sending' and claim_expires_at<=at_time;
  insert into private.store_key_rotation_alerts(mail_id,created_at)
    select m.id,at_time from private.mail_dispatches m
    where m.kind='rotation_store_key' and m.status='unknown'
      and not exists(select 1 from private.store_key_rotation_alerts a where a.mail_id=m.id)
    on conflict(mail_id) do nothing;
end;
$$;

revoke all on function private.owner_rotation_key_mail_current(uuid),
  public.owner_claim_rotation_key_mail(),public.owner_authorize_rotation_key_submit(uuid,uuid),
  public.owner_finish_rotation_key_mail(uuid,uuid,text),public.owner_sweep_rotation_key_mail()
  from public,anon,authenticated,service_role;
grant execute on function public.owner_claim_rotation_key_mail(),public.owner_authorize_rotation_key_submit(uuid,uuid),
  public.owner_finish_rotation_key_mail(uuid,uuid,text),public.owner_sweep_rotation_key_mail() to service_role;

commit;
