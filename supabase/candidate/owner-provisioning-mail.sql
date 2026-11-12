-- Server-side OTP outbox. The claim and send authorization are separate committed calls.
begin;

create function public.owner_claim_otp_mail() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  dispatch_id uuid;
  challenge private.otp_challenges;
  delivery private.mail_dispatches;
  at_time timestamptz;
begin
  select m.id into dispatch_id
  from private.mail_dispatches m join private.otp_challenges c on c.id = m.challenge_id
  where m.kind = 'create_store_otp' and m.status = 'queued'
  order by m.queued_at, m.id
  limit 1 for update of c skip locked;

  if dispatch_id is null then return null; end if;
  select * into delivery from private.mail_dispatches where id = dispatch_id for update;
  if delivery.status <> 'queued' then return null; end if;
  select * into challenge from private.otp_challenges where id = delivery.challenge_id;
  at_time := clock_timestamp();

  if challenge.status <> 'active' or at_time >= challenge.expires_at then
    update private.mail_dispatches set status = 'failed_before_submit', otp_encrypted = null,
      otp_encryption_version = null, resolved_at = at_time where id = dispatch_id;
    return jsonb_build_object('state','skipped');
  end if;

  update private.mail_dispatches set status = 'sending', claim_token = gen_random_uuid(),
    claim_expires_at = at_time + interval '60 seconds',
    otp_encrypted = null, otp_encryption_version = null
  where id = dispatch_id;
  return jsonb_build_object(
    'state','claimed', 'id', dispatch_id, 'challengeId', challenge.id,
    'email', delivery.canonical_email, 'otpEncrypted', encode(delivery.otp_encrypted,'hex'),
    'otpEncryptionVersion', delivery.otp_encryption_version,
    'claimToken', (select claim_token from private.mail_dispatches where id = dispatch_id),
    'expiresAt', (select claim_expires_at from private.mail_dispatches where id = dispatch_id)
  );
end;
$$;

create function public.owner_authorize_otp_submit(p_id uuid, p_claim_token uuid) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  target_challenge uuid;
  challenge private.otp_challenges;
  delivery private.mail_dispatches;
  at_time timestamptz;
begin
  select challenge_id into target_challenge from private.mail_dispatches
    where id = p_id and kind = 'create_store_otp';
  if target_challenge is null then return null; end if;
  select * into challenge from private.otp_challenges where id = target_challenge for update;
  select * into delivery from private.mail_dispatches where id = p_id for update;
  at_time := clock_timestamp();

  if delivery.status <> 'sending' or p_claim_token is null or delivery.claim_token <> p_claim_token
    or delivery.submit_authorized_at is not null or at_time >= delivery.claim_expires_at then
    return null;
  end if;
  if challenge.status <> 'active' or at_time >= challenge.expires_at then
    update private.mail_dispatches set status = 'failed_before_submit', resolved_at = at_time where id = p_id;
    return null;
  end if;
  update private.mail_dispatches set submit_authorized_at = at_time where id = p_id;
  return jsonb_build_object('allowed',true,
    'serverNow',floor(extract(epoch from at_time)*1000)::bigint,
    'deadline',floor(extract(epoch from least(challenge.expires_at,delivery.claim_expires_at))*1000)::bigint);
end;
$$;

create function public.owner_finish_otp_mail(p_id uuid, p_claim_token uuid, p_status text) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  delivery private.mail_dispatches;
  at_time timestamptz;
begin
  if p_status is null or p_status not in ('submitted','rejected','failed_before_submit','unknown') then
    return false;
  end if;
  select * into delivery from private.mail_dispatches where id = p_id and kind = 'create_store_otp' for update;
  at_time := clock_timestamp();
  if not found or delivery.status <> 'sending' or p_claim_token is null
    or delivery.claim_token <> p_claim_token or at_time >= delivery.claim_expires_at
    or (p_status in ('submitted','rejected') and delivery.submit_authorized_at is null) then
    return false;
  end if;
  update private.mail_dispatches set status = p_status, resolved_at = at_time where id = p_id;
  return true;
end;
$$;

create function public.owner_sweep_otp_mail() returns void
language sql volatile security definer set search_path = pg_catalog as $$
  update private.mail_dispatches set status = 'unknown', resolved_at = clock_timestamp()
    where kind = 'create_store_otp' and status = 'sending' and claim_expires_at <= clock_timestamp();
  delete from private.otp_request_outcomes where retain_until < clock_timestamp();
  delete from private.otp_attempts where outcome = 'rejected' and retain_until < clock_timestamp();
$$;

revoke all on function public.owner_claim_otp_mail(), public.owner_authorize_otp_submit(uuid,uuid),
  public.owner_finish_otp_mail(uuid,uuid,text), public.owner_sweep_otp_mail()
  from public, anon, authenticated, service_role;
grant execute on function public.owner_claim_otp_mail(), public.owner_authorize_otp_submit(uuid,uuid),
  public.owner_finish_otp_mail(uuid,uuid,text), public.owner_sweep_otp_mail() to service_role;

commit;
