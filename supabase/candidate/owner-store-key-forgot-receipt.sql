-- Apply after owner-store-key-forgot.sql, with forgotten-key traffic paused.
begin;
set local lock_timeout = '5s';

lock table private.forgot_store_key_requests, private.mail_dispatches in share row exclusive mode;
do $$
begin
  if exists (select 1 from private.forgot_store_key_requests where canonical_email is not null
      and received_at >= clock_timestamp() - interval '90 minutes')
    or exists (select 1 from private.mail_dispatches where kind = 'forgot_store_key'
      and (status = 'sending' or (status = 'queued' and queued_at >= clock_timestamp() - interval '90 minutes'))) then
    raise exception 'Drain legacy forgotten-key intake and mail before enabling receipt confirmation';
  end if;
end;
$$;

-- The drain check above leaves only expired legacy intake with an address.
update private.forgot_store_key_requests set canonical_email = null where canonical_email is not null;

-- Only confirmed email addresses enter the existing worker's partial index.
alter table private.forgot_store_key_requests
  add column pending_email private.owner_canonical_email,
  add column receipt_confirmed_at timestamptz,
  add constraint forgot_key_requests_confirmed_email check (canonical_email is null or receipt_confirmed_at is not null),
  add constraint forgot_key_requests_one_email check (pending_email is null or canonical_email is null);

drop function public.owner_enqueue_forgot_store_key(text, inet);

create function public.owner_enqueue_forgot_store_key(p_email text, p_source_ip inet, p_receipt_id uuid) returns void
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  at_time timestamptz;
begin
  if p_email is null or p_source_ip is null or p_receipt_id is null
    or masklen(p_source_ip) <> (case family(p_source_ip) when 4 then 32 else 128 end) then
    return;
  end if;
  perform pg_advisory_xact_lock(hashtextextended('owner-otp-ip:' || host(p_source_ip), 0));
  at_time := clock_timestamp();
  if private.owner_mail_ip_usage(p_source_ip, at_time) < 10 then
    insert into private.forgot_store_key_requests(id, source_ip, pending_email, received_at)
      values (p_receipt_id, p_source_ip, p_email::private.owner_canonical_email, at_time);
  end if;
end;
$$;

create function public.owner_confirm_forgot_store_key_receipt(p_receipt_id uuid) returns void
language sql volatile security definer set search_path = pg_catalog as $$
  update private.forgot_store_key_requests
     set canonical_email = pending_email, pending_email = null, receipt_confirmed_at = clock_timestamp()
   where id = p_receipt_id and pending_email is not null
     and received_at >= clock_timestamp() - interval '90 minutes';
$$;

revoke all on function public.owner_enqueue_forgot_store_key(text, inet, uuid),
  public.owner_confirm_forgot_store_key_receipt(uuid) from public, anon, authenticated, service_role;
grant execute on function public.owner_enqueue_forgot_store_key(text, inet, uuid),
  public.owner_confirm_forgot_store_key_receipt(uuid) to service_role;
notify pgrst, 'reload schema';
commit;
