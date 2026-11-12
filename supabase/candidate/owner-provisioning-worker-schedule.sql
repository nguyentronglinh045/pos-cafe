-- Apply on the intended hosted project after deploying owner-provisioning and configuring Vault.
-- Requires Supabase Cron, pg_net, Vault and pgcrypto in the project's extensions schema.
begin;

create function private.owner_worker_tick() returns bigint
language plpgsql volatile set search_path = pg_catalog as $$
declare
  worker_url text;
  worker_key bytea;
  publishable_key text;
  milliseconds text := floor(extract(epoch from clock_timestamp())*1000)::bigint::text;
  signature text;
  request_id bigint;
begin
  select decrypted_secret into strict worker_url from vault.decrypted_secrets
    where name='pos_cafe_owner_worker_url';
  select decode(decrypted_secret,'base64') into strict worker_key from vault.decrypted_secrets
    where name='pos_cafe_owner_worker_key';
  select decrypted_secret into strict publishable_key from vault.decrypted_secrets
    where name='pos_cafe_owner_worker_publishable_key';
  if worker_url !~ '^https://[a-z0-9]{20}\.supabase\.co/functions/v1/owner-provisioning$'
    or coalesce(octet_length(worker_key),0) <> 32 or nullif(publishable_key,'') is null then
    raise exception 'OWNER_WORKER_CONFIGURATION_INVALID';
  end if;
  signature := encode(extensions.hmac(convert_to('owner-work-v1' || chr(10) || milliseconds,'UTF8'),
    worker_key,'sha256'),'hex');
  select net.http_post(url := worker_url, body := '{"action":"processOwnerWork"}'::jsonb,
    headers := jsonb_build_object('content-type','application/json','apikey',publishable_key,
      'x-pos-cafe-time',milliseconds,'x-pos-cafe-worker-signature',signature),timeout_milliseconds := 20000)
  into request_id;
  return request_id;
end;
$$;

revoke all on function private.owner_worker_tick() from public, anon, authenticated, service_role;
select cron.schedule('pos-cafe-owner-work', '* * * * *', 'select private.owner_worker_tick();');

commit;
