-- Seed workers use an authenticated server identity and an immutable creation-operation reference.
begin;

alter table public.employee_admin_audit drop constraint employee_admin_audit_actor_type_check;
alter table public.employee_admin_audit add constraint employee_admin_audit_actor_type_check
  check (actor_type in ('employee','operator','system'));

create function private.owner_seed_system_employee(p_store uuid, p_operation uuid, p_event uuid) returns void
language plpgsql volatile set search_path = pg_catalog as $$
declare
  target_id uuid := private.permission_seed_uuid(p_store,'demo.employee.demo-emp-cashier');
  target public.employees;
begin
  if exists(select 1 from public.employees where id = target_id
    or (store_id = p_store and seed_key = 'demo.employee.demo-emp-cashier')) then
    raise exception 'ENTITY_ID_CONFLICT' using errcode = 'P0001';
  end if;
  insert into public.employees(id,store_id,name,role,passcode_hash,is_active,seed_key,
    permission_revision,permission_overrides,pin_change_required)
  values(target_id,p_store,'Thu ngân demo','cashier',extensions.crypt('111111',extensions.gen_salt('bf')),
    true,'demo.employee.demo-emp-cashier',0,null,false)
  returning * into target;
  insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,
    outcome,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at)
  values(p_store,'system',p_operation::text,p_event,target.id,'initial_seed_employee','applied',
    private.permission_employee_snapshot(target),private.permission_employee_snapshot(target),
    array[]::text[],(select revision from public.permission_catalog_state where singleton),false,clock_timestamp());
  insert into public.store_change_signals values(p_store,'permission',1,p_event,target.id)
    on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,
      event_id=p_event,target_id=target.id;
end;
$$;

create function private.owner_apply_initial_seed(p_operation_id uuid, p_employee_id uuid default null) returns jsonb
language plpgsql volatile set search_path = pg_catalog as $$
declare
  store_id_target uuid;
  store_status_value private.store_status;
  workflow private.initial_seed_workflows;
  event_id uuid;
  at_time timestamptz;
  error_code text;
  actor public.employees;
  generation bigint;
begin
  select created_store_id into store_id_target from private.create_operations
    where id = p_operation_id and status = 'created' and seed_demo;
  if store_id_target is null then return private.owner_error('CREATE_PROOF_REQUIRED'); end if;

  -- Same advisory order as the permission seed path. Lock the store row strongly
  -- here because this worker updates its seed status in the same transaction.
  perform pg_advisory_xact_lock(hashtextextended('store-authority:' || store_id_target,0));
  perform pg_advisory_xact_lock(hashtext(store_id_target::text || ':pos-write'));
  perform pg_advisory_xact_lock(hashtext(store_id_target::text || ':catalog-write'));
  select status into store_status_value from public.stores where id = store_id_target for no key update;
  if store_status_value is distinct from 'active'::private.store_status then
    return private.owner_error('STORE_SUSPENDED');
  end if;
  select * into workflow from private.initial_seed_workflows where store_id = store_id_target for update;
  perform private.permission_catalog_share();
  if p_employee_id is not null then
    actor := private.owner_session_for_seed(true);
    if actor.id <> p_employee_id or actor.store_id <> store_id_target or actor.role <> 'owner' then
      return private.owner_error('OWNER_ROLE_REQUIRED');
    end if;
    if workflow.status in ('pending','in_progress') then return private.owner_error('INITIAL_SEED_NOT_READY'); end if;
  end if;
  if workflow.workflow_id is null or workflow.status <> (case when p_employee_id is null then 'pending' else 'needs_retry' end) then
    return jsonb_build_object('status',coalesce(workflow.status,'not_found'));
  end if;
  generation := workflow.run_generation + 1;
  select stage_id into event_id from private.initial_seed_stages
    where workflow_id = workflow.workflow_id and stage = 'employee';
  begin
    if p_employee_id is null then
      perform private.owner_seed_system_employee(store_id_target,p_operation_id,event_id);
    else
      perform private.permission_seed_employee_insert(store_id_target,actor,event_id);
    end if;
    perform private.permission_seed_menu_insert(store_id_target);
    perform private.permission_seed_floor_insert(store_id_target);
    at_time := clock_timestamp();
    update private.initial_seed_stages s set status='committed', committed_at=at_time,
      receipt=jsonb_build_object('stage',s.stage,'stageId',s.stage_id,'runGeneration',generation,'committedAt',at_time)
    where s.workflow_id=workflow.workflow_id;
    update private.initial_seed_workflows set status='completed',workflow_revision=workflow_revision+1,
      run_generation=generation,auto_claimed_at=coalesce(auto_claimed_at,at_time),updated_at=at_time,last_error_code=null
      where workflow_id=workflow.workflow_id;
    update public.stores set seed_status='seeded' where id=store_id_target;
  exception when others then
    error_code := case when sqlstate='23505' or sqlerrm='ENTITY_ID_CONFLICT'
      then 'ENTITY_ID_CONFLICT' else 'PERMISSION_UPDATE_UNAVAILABLE' end;
    update private.initial_seed_workflows set status='needs_retry',workflow_revision=workflow_revision+1,
      last_error_code=error_code,updated_at=clock_timestamp()
      where workflow_id=workflow.workflow_id;
    update public.stores set seed_status='failed' where id=store_id_target;
    return private.owner_error(error_code);
  end;
  return jsonb_build_object('status','completed');
end;
$$;

create function public.owner_run_initial_seed(p_operation_id uuid) returns jsonb
language sql volatile security definer set search_path = pg_catalog as $$
  select private.owner_apply_initial_seed(p_operation_id);
$$;

revoke all on function private.owner_apply_initial_seed(uuid,uuid),
  private.owner_seed_system_employee(uuid,uuid,uuid), public.owner_run_initial_seed(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_run_initial_seed(uuid) to service_role;

commit;
