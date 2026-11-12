-- Stop business calls until the atomic seed has committed or been explicitly skipped.
begin;

create function private.owner_session_for_seed(p_lock boolean default true) returns public.employees
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions;
begin
 if sid is null then raise exception 'AUTH_REQUIRED' using errcode='P0401'; end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 if p_lock then
  perform 1 from public.stores where id=sid for share;
  perform 1 from public.employees where store_id=sid and id=eid for share;
  perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
  perform private.permission_catalog_share();
 end if;
 if not private.owner_store_active(sid) then raise exception 'STORE_SUSPENDED' using errcode='P0401'; end if;
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
  if e.id is null or not e.is_active or s.token_hash is null or s.revoked_at is not null or s.expires_at<=private.write_clock() then
   raise exception 'EMPLOYEE_SESSION_REQUIRED' using errcode='P0401';
  end if;
  if s.purpose<>'normal' or e.pin_change_required then
   raise exception 'PIN_CHANGE_REQUIRED' using errcode='P0401';
  end if;
 if not exists(select 1 from public.permission_roles where code=e.role and enabled) then
  raise exception 'EMPLOYEE_ROLE_UNAVAILABLE' using errcode='P0401';
 end if;
 return e;
end $$;

revoke all on function private.owner_session_for_seed(boolean) from public, anon, authenticated, service_role;

create or replace function private.permission_current_employee(p_lock boolean default true) returns public.employees
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare actor public.employees;
begin
  actor := private.owner_session_for_seed(p_lock);
  if not exists (select 1 from private.initial_seed_workflows
    where store_id = actor.store_id and status in ('completed','skipped')) then
    raise exception 'INITIAL_SEED_NOT_READY' using errcode='P0401';
  end if;
  return actor;
end;
$$;

create or replace function public.permission_get_authority() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; begin
 e:=private.owner_session_for_seed();
 return jsonb_build_object('ok',true,'data',jsonb_build_object('catalog',private.permission_catalog_json(),'snapshot',private.permission_authority_json(e)));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); end $$;

create or replace function public.permission_get_revision() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; begin
 e:=private.owner_session_for_seed();
 return jsonb_build_object('ok',true,'data',jsonb_build_object('employeeRevision',e.permission_revision,
 'catalogRevision',(select revision from public.permission_catalog_state where singleton),'serverTime',private.write_clock()));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm); end $$;

create or replace function public.permission_get_initial_seed_status() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare actor public.employees; result jsonb;
begin
  actor := private.owner_session_for_seed(true);
  if actor.role <> 'owner' then return private.permission_failure('FORBIDDEN'); end if;
  result := private.permission_initial_seed_status_json(actor.store_id);
  if result is null then return private.permission_failure('NOT_FOUND'); end if;
  return jsonb_build_object('ok',true,'data',result);
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end;
$$;

create function public.owner_get_seed_readiness() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare actor public.employees; phase text;
begin
  actor := private.owner_session_for_seed(true);
  select status into phase from private.initial_seed_workflows where store_id = actor.store_id;
  if phase is null then return private.permission_failure('NOT_FOUND'); end if;
  return jsonb_build_object('ok',true,'data',jsonb_build_object('status',case
    when phase in ('completed','skipped') then 'ready' when phase='needs_retry' then 'failed' else 'waiting' end));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end;
$$;

create function public.owner_retry_initial_seed() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare actor public.employees; op_id uuid; result jsonb;
begin
  actor := private.owner_session_for_seed(false);
  if actor.role <> 'owner' then return private.permission_failure('OWNER_ROLE_REQUIRED'); end if;
  select id into op_id from private.create_operations where created_store_id = actor.store_id and seed_demo;
  if op_id is null then return private.permission_failure('NOT_FOUND'); end if;
  result := private.owner_apply_initial_seed(op_id,actor.id);
  if result->>'ok' = 'false' then return private.permission_failure(result->>'code'); end if;
  return jsonb_build_object('ok',true,'data',private.permission_initial_seed_status_json(actor.store_id));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end;
$$;

create function public.owner_skip_initial_seed() returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare actor public.employees; workflow private.initial_seed_workflows; sid uuid := auth.uid();
begin
  if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
  perform pg_advisory_xact_lock(hashtextextended('store-authority:' || sid,0));
  perform pg_advisory_xact_lock(hashtext(sid::text || ':pos-write'));
  perform pg_advisory_xact_lock(hashtext(sid::text || ':catalog-write'));
  perform 1 from public.stores where id=sid for no key update;
  select * into workflow from private.initial_seed_workflows where store_id=sid for update;
  actor := private.owner_session_for_seed(true);
  if actor.role <> 'owner' then return private.permission_failure('OWNER_ROLE_REQUIRED'); end if;
  if workflow.status in ('skipped','completed') then
    return jsonb_build_object('ok',true,'data',private.permission_initial_seed_status_json(sid));
  end if;
  if workflow.status is distinct from 'needs_retry'
    or exists(select 1 from private.initial_seed_stages where workflow_id=workflow.workflow_id and status='committed')
    or exists(select 1 from public.employees where store_id=sid and role <> 'owner')
    or exists(select 1 from public.categories where store_id=sid)
    or exists(select 1 from public.menu_items where store_id=sid)
    or exists(select 1 from public.option_groups where store_id=sid)
    or exists(select 1 from public.option_values where store_id=sid)
    or exists(select 1 from public.floor_areas where store_id=sid)
    or exists(select 1 from public.tables where store_id=sid)
    or exists(select 1 from public.floor_decor_items where store_id=sid)
    or exists(select 1 from public.orders where store_id=sid)
    or exists(select 1 from public.payments where store_id=sid) then
    return private.permission_failure('INITIAL_SEED_NOT_READY');
  end if;
  update private.initial_seed_workflows set status='skipped', workflow_revision=workflow_revision+1,
    last_error_code=null,updated_at=clock_timestamp() where store_id=sid;
  delete from private.initial_seed_stages where workflow_id=workflow.workflow_id;
  update public.stores set seed_status='seeded' where id=sid;
  return jsonb_build_object('ok',true,'data',private.permission_initial_seed_status_json(sid));
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
end;
$$;

revoke all on function public.owner_get_seed_readiness(), public.owner_retry_initial_seed(), public.owner_skip_initial_seed(),
  public.permission_begin_initial_seed(jsonb), public.permission_run_initial_seed_stage(jsonb)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_get_seed_readiness(), public.owner_retry_initial_seed(), public.owner_skip_initial_seed() to authenticated;

commit;
