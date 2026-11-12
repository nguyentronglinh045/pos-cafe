-- Fenced provisioning. External Auth calls occur between claim and recording, never in a DB transaction.
begin;

alter table private.create_operations add column original_delivery_authorized_at timestamptz;

create function public.owner_claim_create_auth(
  p_operation_id uuid, p_lease_token uuid, p_secret_encrypted bytea, p_key_version integer
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  op private.create_operations;
  reservation private.store_no_reservations;
  dispatch private.auth_create_dispatches;
  at_time timestamptz;
  selection smallint;
  candidate bigint;
  new_reservation_id uuid;
  email text;
begin
  select * into op from private.create_operations where id = p_operation_id for update;
  at_time := clock_timestamp();
  if op.id is null or p_lease_token is null or op.lease_token <> p_lease_token then
    return private.owner_error('CREATE_PROOF_REQUIRED');
  end if;
  if op.status <> 'accepted' or at_time >= op.lease_expires_at then
    return private.owner_status(op, at_time);
  end if;
  if coalesce(octet_length(p_secret_encrypted),0) = 0 or coalesce(p_key_version,0) < 1 then
    return private.owner_error('CREATE_PROOF_REQUIRED');
  end if;

  select * into reservation from private.store_no_reservations
    where operation_id = op.id order by selection_no desc limit 1;
  if reservation.request_id is not null then
    select * into dispatch from private.auth_create_dispatches where reservation_id = reservation.request_id;
    if dispatch.status is distinct from 'no_effect' then
      return private.owner_status(op, at_time);
    end if;
    if op.store_secret_encrypted <> p_secret_encrypted or op.store_secret_encryption_version <> p_key_version then
      return private.owner_error('CREATE_PROOF_REQUIRED');
    end if;
  end if;

  selection := coalesce(reservation.selection_no, 0) + 1;
  if selection > 3 then
    update private.create_operations set status = 'failed', resolved_at = at_time,
      reason_code = 'C_STORE_NO_UNAVAILABLE', owner_pin_hash = null,
      store_secret_encrypted = null, store_secret_encryption_version = null
    where id = op.id returning * into op;
    return private.owner_status(op, at_time);
  end if;

  loop
    if clock_timestamp() >= op.lease_expires_at then
      return jsonb_build_object('status','unknown');
    end if;
    candidate := nextval('public.store_no_seq');
    if candidate not between 1 and 2147483647 then
      update private.create_operations set status = 'failed', resolved_at = clock_timestamp(),
        reason_code = 'C_STORE_NO_UNAVAILABLE', owner_pin_hash = null,
        store_secret_encrypted = null, store_secret_encryption_version = null
      where id = op.id returning * into op;
      return private.owner_status(op, clock_timestamp());
    end if;
    if exists (select 1 from public.stores where store_no = candidate) then continue; end if;
    insert into private.store_no_reservations(request_id, store_no, created_at, operation_id, selection_no)
      values (gen_random_uuid(), candidate::integer, clock_timestamp(), op.id, selection)
      on conflict (store_no) do nothing returning request_id into new_reservation_id;
    exit when new_reservation_id is not null;
  end loop;

  at_time := clock_timestamp();
  if at_time >= op.lease_expires_at then
    delete from private.store_no_reservations where request_id = new_reservation_id;
    return jsonb_build_object('status','unknown');
  end if;
  email := 'store' || candidate || '@store.pos.local';
  insert into private.auth_create_dispatches(reservation_id, lease_token, dispatch_token, expected_email, claimed_at)
    values (new_reservation_id, p_lease_token, gen_random_uuid(), email, at_time) returning * into dispatch;
  update private.create_operations set store_secret_encrypted = p_secret_encrypted,
    store_secret_encryption_version = p_key_version where id = op.id;
  return jsonb_build_object('status','accepted','dispatchToken',dispatch.dispatch_token,
    'email',email,'storeNo',candidate,'leaseExpiresAt',op.lease_expires_at);
end;
$$;

create function public.owner_record_create_auth(
  p_operation_id uuid, p_lease_token uuid, p_dispatch_token uuid, p_result text, p_auth_user_id uuid default null
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  op private.create_operations;
  dispatch private.auth_create_dispatches;
  user_email text;
  user_dispatch text;
  colliding_user uuid;
  result text := p_result;
  at_time timestamptz;
begin
  if p_result is null or p_result not in ('created','no_effect','unknown')
    or (p_result = 'created') <> (p_auth_user_id is not null) then
    return private.owner_error('A_REQUEST_INVALID');
  end if;
  select * into op from private.create_operations where id = p_operation_id for update;
  at_time := clock_timestamp();
  if op.id is null or p_lease_token is null or op.lease_token <> p_lease_token then
    return private.owner_error('CREATE_PROOF_REQUIRED');
  end if;
  if op.status <> 'accepted' or at_time >= op.lease_expires_at then
    return private.owner_status(op, at_time);
  end if;
  select d.* into dispatch
  from private.auth_create_dispatches d join private.store_no_reservations r on r.request_id = d.reservation_id
  where r.operation_id = op.id and d.dispatch_token = p_dispatch_token and d.lease_token = p_lease_token
  for update of d;
  if dispatch.reservation_id is null then return private.owner_error('CREATE_PROOF_REQUIRED'); end if;
  if dispatch.status <> 'claimed' then
    return jsonb_build_object('status',op.status,'authResult',dispatch.status);
  end if;
  if p_result = 'created' then
    select email, raw_app_meta_data->>'pos_cafe_create_dispatch' into user_email, user_dispatch
    from auth.users where id = p_auth_user_id for share;
    if user_email is distinct from dispatch.expected_email or user_dispatch is distinct from dispatch.dispatch_token::text then
      result := 'unknown';
    end if;
  elsif p_result = 'no_effect' then
    select u.id into colliding_user from auth.users u
    where u.email = dispatch.expected_email
      and (u.raw_app_meta_data->>'pos_cafe_create_dispatch') is distinct from dispatch.dispatch_token::text
    limit 1 for share;
    if colliding_user is null then result := 'unknown'; end if;
  end if;
  at_time := clock_timestamp();
  if at_time >= op.lease_expires_at then return jsonb_build_object('status','unknown'); end if;

  update private.auth_create_dispatches set status = result, resolved_at = at_time,
    auth_user_id = case when result = 'created' then p_auth_user_id end
  where reservation_id = dispatch.reservation_id;
  if result = 'unknown' then
    update private.create_operations set status = 'unknown', reason_code = 'C_AUTH_UNCONFIRMED' where id = op.id;
    return jsonb_build_object('status','unknown');
  end if;
  return jsonb_build_object('status','accepted','authResult',result);
end;
$$;

create function public.owner_commit_created_store(p_operation_id uuid, p_lease_token uuid) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare
  op private.create_operations;
  reservation private.store_no_reservations;
  dispatch private.auth_create_dispatches;
  user_email text;
  user_dispatch text;
  at_time timestamptz;
  store_id uuid;
  workflow_id uuid;
  stage_name text;
  canonical_email private.owner_canonical_email;
begin
  select * into op from private.create_operations where id = p_operation_id for update;
  at_time := clock_timestamp();
  if op.id is null or p_lease_token is null or op.lease_token <> p_lease_token then
    return private.owner_error('CREATE_PROOF_REQUIRED');
  end if;
  if op.status <> 'accepted' or at_time >= op.lease_expires_at then
    return private.owner_status(op, at_time);
  end if;
  select * into reservation from private.store_no_reservations
    where operation_id = op.id order by selection_no desc limit 1;
  select * into dispatch from private.auth_create_dispatches
    where reservation_id = reservation.request_id and lease_token = p_lease_token for update;
  if dispatch.status is distinct from 'created' then
    return private.owner_status(op, clock_timestamp());
  end if;

  store_id := dispatch.auth_user_id;
  select email, raw_app_meta_data->>'pos_cafe_create_dispatch' into user_email, user_dispatch
    from auth.users where id = store_id for share;
  at_time := clock_timestamp();
  if at_time >= op.lease_expires_at then return jsonb_build_object('status','unknown'); end if;
  if user_email is distinct from dispatch.expected_email or user_dispatch is distinct from dispatch.dispatch_token::text
    or user_email is distinct from 'store' || reservation.store_no || '@store.pos.local' then
    update private.create_operations set status = 'unknown', reason_code = 'C_AUTH_UNCONFIRMED' where id = op.id;
    return jsonb_build_object('status','unknown');
  end if;

  select i.canonical_email into canonical_email from private.create_intents i where i.intent_id = op.intent_id;
  workflow_id := private.permission_stable_uuid(store_id,'initial-seed.workflow.v1');
  insert into public.stores(id, store_no, name, seed_status, owner_account_id,
    key_secret_encrypted, key_encryption_version)
  values (store_id, reservation.store_no, op.display_name,
    (case when op.seed_demo then 'pending' else 'seeded' end)::public.seed_status,
    op.owner_account_id, op.store_secret_encrypted, op.store_secret_encryption_version);
  insert into public.store_settings(store_id, display_name, address)
    values (store_id, op.display_name, op.address);
  insert into public.employees(id, store_id, name, role, passcode_hash, pin_change_required)
    values (gen_random_uuid(), store_id, 'Chủ quán', 'owner', op.owner_pin_hash, false);
  insert into private.initial_seed_workflows(workflow_id, store_id, requested, template_version,
    status, created_at, updated_at)
  values (workflow_id, store_id, op.seed_demo, 1,
    case when op.seed_demo then 'pending' else 'skipped' end, at_time, at_time);
  if op.seed_demo then
    foreach stage_name in array array['employee','menu','floor'] loop
      insert into private.initial_seed_stages(workflow_id, stage, stage_id)
      values (workflow_id, stage_name, private.permission_stable_uuid(store_id,'initial-seed.stage.v1:' || stage_name));
    end loop;
  end if;
  insert into private.store_admin_log(store_id, action, actor_kind, actor_owner_account_id, detail)
    values (store_id, 'store_created', 'owner', op.owner_account_id, jsonb_build_object('operationId',op.id));
  insert into private.mail_dispatches(kind, canonical_email, operation_id, queued_at)
    values ('store_key', canonical_email, op.id, at_time);
  update private.create_operations set status = 'created', created_store_id = store_id,
    resolved_at = at_time, owner_pin_hash = null, store_secret_encrypted = null, store_secret_encryption_version = null
    where id = op.id;
  return jsonb_build_object('status','created','storeNo',reservation.store_no,'seedRequested',op.seed_demo);
end;
$$;

create function public.owner_authorize_original_delivery(p_operation_id uuid, p_lease_token uuid) returns boolean
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare op private.create_operations;
begin
  perform 1 from private.create_operations where id = p_operation_id for update;
  select * into op from private.create_operations where id = p_operation_id;
  if op.id is null or p_lease_token is null or op.lease_token <> p_lease_token or op.status <> 'created'
    or op.delivery_closed_at is not null or op.original_delivery_authorized_at is not null then
    return false;
  end if;
  update private.create_operations set original_delivery_authorized_at = clock_timestamp() where id = op.id;
  return true;
end;
$$;

revoke all on function public.owner_claim_create_auth(uuid,uuid,bytea,integer),
  public.owner_record_create_auth(uuid,uuid,uuid,text,uuid), public.owner_commit_created_store(uuid,uuid),
  public.owner_authorize_original_delivery(uuid,uuid) from public, anon, authenticated, service_role;
grant execute on function public.owner_claim_create_auth(uuid,uuid,bytea,integer),
  public.owner_record_create_auth(uuid,uuid,uuid,text,uuid), public.owner_commit_created_store(uuid,uuid),
  public.owner_authorize_original_delivery(uuid,uuid) to service_role;

commit;
