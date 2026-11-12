-- PostgREST casts JSON arguments as its calling role. Keep private types behind the server RPCs.
begin;

alter function public.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer) set schema private;
alter function public.owner_verify_create(uuid,uuid,private.owner_canonical_email,bytea,bytea,text,text,boolean,text) set schema private;
alter function public.owner_confirm_key_saved(uuid,uuid,private.owner_canonical_email,bytea,bytea) set schema private;
alter function public.owner_set_store_status(uuid,private.store_status,text) set schema private;

revoke all on function private.owner_request_create_otp(uuid,uuid,private.owner_canonical_email,inet,uuid,bytea,bytea,bytea,integer),
  private.owner_verify_create(uuid,uuid,private.owner_canonical_email,bytea,bytea,text,text,boolean,text),
  private.owner_confirm_key_saved(uuid,uuid,private.owner_canonical_email,bytea,bytea),
  private.owner_set_store_status(uuid,private.store_status,text)
  from public, anon, authenticated, service_role;

create function public.owner_request_create_otp(
  p_request_id uuid, p_intent_id uuid, p_email text, p_source_ip inet,
  p_challenge_id uuid, p_input_digest bytea, p_otp_digest bytea,
  p_otp_encrypted bytea, p_otp_encryption_version integer
) returns jsonb
language sql volatile security definer set search_path = pg_catalog as $$
  select private.owner_request_create_otp(p_request_id, p_intent_id,
    p_email::private.owner_canonical_email, p_source_ip, p_challenge_id,
    p_input_digest, p_otp_digest, p_otp_encrypted, p_otp_encryption_version);
$$;

create function public.owner_verify_create(
  p_attempt_id uuid, p_intent_id uuid, p_email text, p_otp_digest bytea,
  p_input_digest bytea, p_display_name text, p_address text, p_seed_demo boolean, p_owner_pin text
) returns jsonb
language sql volatile security definer set search_path = pg_catalog as $$
  select private.owner_verify_create(p_attempt_id, p_intent_id,
    p_email::private.owner_canonical_email, p_otp_digest, p_input_digest,
    p_display_name, p_address, p_seed_demo, p_owner_pin);
$$;

create function public.owner_confirm_key_saved(
  p_attempt_id uuid, p_intent_id uuid, p_email text, p_otp_digest bytea, p_input_digest bytea
) returns jsonb
language sql volatile security definer set search_path = pg_catalog as $$
  select private.owner_confirm_key_saved(p_attempt_id, p_intent_id,
    p_email::private.owner_canonical_email, p_otp_digest, p_input_digest);
$$;

create function public.owner_set_store_status(p_store_id uuid, p_new_status text, p_operator_reference text) returns jsonb
language sql volatile security definer set search_path = pg_catalog as $$
  select private.owner_set_store_status(p_store_id, p_new_status::private.store_status, p_operator_reference);
$$;

revoke all on function public.owner_request_create_otp(uuid,uuid,text,inet,uuid,bytea,bytea,bytea,integer),
  public.owner_verify_create(uuid,uuid,text,bytea,bytea,text,text,boolean,text),
  public.owner_confirm_key_saved(uuid,uuid,text,bytea,bytea), public.owner_set_store_status(uuid,text,text)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_request_create_otp(uuid,uuid,text,inet,uuid,bytea,bytea,bytea,integer),
  public.owner_verify_create(uuid,uuid,text,bytea,bytea,text,text,boolean,text),
  public.owner_confirm_key_saved(uuid,uuid,text,bytea,bytea), public.owner_set_store_status(uuid,text,text)
  to service_role;

notify pgrst, 'reload schema';
commit;
