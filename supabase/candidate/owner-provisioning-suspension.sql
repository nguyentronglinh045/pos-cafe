-- Store suspension checks for the already activated permission candidate.
begin;

create function private.owner_store_active(p_store_id uuid) returns boolean
language sql stable set search_path = pg_catalog as $$
  select exists (select 1 from public.stores where id = p_store_id and status = 'active');
$$;

create function private.owner_signal_store_active() returns boolean
language sql stable security definer set search_path = pg_catalog as $$
  select private.owner_store_active(auth.uid());
$$;

revoke all on function private.owner_store_active(uuid), private.owner_signal_store_active()
  from public, anon, authenticated, service_role;
grant execute on function private.owner_signal_store_active() to authenticated;

drop policy store_change_signals_same_store on public.store_change_signals;
create policy store_change_signals_same_store on public.store_change_signals
  for select to authenticated
  using (store_id = (select auth.uid()) and (select private.owner_signal_store_active()));

do $$
begin
  if (select count(*) from pg_publication_tables where pubname = 'supabase_realtime') <> 2
    or exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and (schemaname <> 'public' or tablename not in ('store_change_signals','permission_catalog_signals'))) then
    raise exception 'T06_REALTIME_PUBLICATION_LAYOUT_CHANGED';
  end if;
end;
$$;
alter publication supabase_realtime set (publish = 'insert, update');

create function public.owner_set_store_status(
  p_store_id uuid, p_new_status private.store_status, p_operator_reference text
) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare old_status private.store_status;
begin
  if p_new_status is null or p_operator_reference is null
    or char_length(p_operator_reference) not between 1 and 128 then
    return private.owner_error('A_REQUEST_INVALID');
  end if;
  select status into old_status from public.stores where id = p_store_id for no key update;
  if not found then return private.owner_error('A_REQUEST_INVALID'); end if;
  if old_status = p_new_status then return jsonb_build_object('status',old_status); end if;
  update public.stores set status=p_new_status where id=p_store_id;
  insert into private.store_admin_log(store_id, action, actor_kind, actor_reference, detail)
  values(p_store_id,'store_status_changed','operator',p_operator_reference,
    jsonb_build_object('before',old_status,'after',p_new_status));
  return jsonb_build_object('status',p_new_status);
end;
$$;
revoke all on function public.owner_set_store_status(uuid,private.store_status,text)
  from public, anon, authenticated, service_role;
grant execute on function public.owner_set_store_status(uuid,private.store_status,text) to service_role;


create or replace function private.permission_failure(code text,context text default null) returns jsonb
language sql immutable set search_path=pg_catalog as $$
 select case when code='INVALID_PIN' and context='self_pin' then
  jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'message','PIN hiện tại không đúng.','details',null))
 else jsonb_build_object('ok',false,'error',jsonb_build_object('code',code,'details',null,'message',case code
  when 'INVALID_EMPLOYEE_REQUEST' then 'Thông tin nhân viên không hợp lệ. Kiểm tra các trường được đánh dấu.'
  when 'EMPLOYEE_ROLE_UNAVAILABLE' then 'Vai trò này chưa được hỗ trợ trên ứng dụng.'
  when 'OWNER_PROTECTED' then 'Không thể thay đổi chủ quán bằng thao tác này.'
   when 'EMPLOYEE_VERSION_CONFLICT' then 'PIN hoặc trạng thái tài khoản đã thay đổi. Vui lòng đăng nhập lại.'
   when 'ADMIN_REQUEST_REUSED' then 'Mã yêu cầu đã được dùng cho nội dung khác.'
   when 'PIN_CHANGE_REQUIRED' then 'Bạn cần đổi PIN tạm trước khi sử dụng quán.'
   when 'PIN_REUSE_NOT_ALLOWED' then 'PIN mới phải khác PIN tạm đang dùng.'
   when 'INITIAL_SEED_ATTEMPT_STALE' then 'Tiến trình dữ liệu mẫu đã thay đổi. Kiểm tra trạng thái trước khi thử lại.'
   when 'ENTITY_ID_CONFLICT' then 'Dữ liệu hiện có trùng với dữ liệu mẫu. Đã dừng để giữ các thay đổi của quán.'
  when 'PERMISSION_UPDATE_UNAVAILABLE' then 'Chưa thể xác nhận thay đổi. Kiểm tra kết quả trước khi thử lại.'
  when 'STORE_SUSPENDED' then 'Quán đang tạm ngưng nên chưa thực hiện được thao tác này.'
  when 'OWNER_ROLE_REQUIRED' then 'Chỉ tài khoản chủ quán mới thực hiện được thao tác này.'
  when 'INITIAL_SEED_NOT_READY' then 'Quán đang chuẩn bị dữ liệu mẫu.'
  when 'OWNER_RECOVERY_REVIEW_REQUIRED' then 'Chưa đủ căn cứ khôi phục chủ quán. Cần xác minh hồ sơ hỗ trợ.'
  when 'BOOTSTRAP_CONFLICT' then 'Cửa hàng đã được khởi tạo; không thể thay chủ quán bằng thao tác này.'
  else private.write_error(code)->>'message' end)) end
$$;

create or replace function private.permission_current_employee(p_lock boolean default true) returns public.employees
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

create or replace function public.permission_list_roster() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$ begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 perform 1 from public.stores where id=auth.uid() for share;
 if not private.owner_store_active(auth.uid()) then return private.permission_failure('STORE_SUSPENDED'); end if;
 return jsonb_build_object('ok',true,'data',coalesce((select jsonb_agg(jsonb_build_object('id',e.id,'name',e.name) order by e.name,e.id)
 from public.employees e join public.permission_roles r on r.code=e.role and r.enabled where e.store_id=auth.uid() and e.is_active),'[]'));
end $$;

create or replace function public.permission_start_session(p_employee_id uuid,p_pin text) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare e public.employees; token text; issued timestamptz; purpose text; ttl interval;
begin
 if auth.uid() is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if p_pin is null or p_pin !~ '^[0-9]{6}$' then return private.permission_failure('INVALID_PIN'); end if;
 perform private.permission_identity_lock(auth.uid(),p_employee_id,false);
 if not private.owner_store_active(auth.uid()) then return private.permission_failure('STORE_SUSPENDED'); end if;
 select * into e from public.employees where store_id=auth.uid() and id=p_employee_id;
 if e.id is null or not e.is_active or e.passcode_hash<>extensions.crypt(p_pin,e.passcode_hash) then return private.permission_failure('INVALID_PIN'); end if;
 if not exists(select 1 from public.permission_roles where code=e.role and enabled) then return private.permission_failure('EMPLOYEE_ROLE_UNAVAILABLE'); end if;
  if e.pin_change_required and e.role<>'owner' then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
  purpose:=case when e.pin_change_required then 'required_pin_change' else 'normal' end;
  ttl:=case when purpose='required_pin_change' then interval '5 minutes' else interval '12 hours' end;
  token:=rtrim(translate(encode(extensions.gen_random_bytes(32),'base64'),'+/','-_'),'='); issued:=private.write_clock();
  insert into private.employee_sessions(token_hash,store_id,employee_id,issued_at,expires_at,purpose,employee_revision)
  values(extensions.digest(convert_to(token,'UTF8'),'sha256'),auth.uid(),e.id,issued,issued+ttl,purpose,e.permission_revision);
  if purpose='required_pin_change' then
   return jsonb_build_object('ok',true,'token',token,'kind','required_pin_change','pinChangeRequired',true,
    'storeId',e.store_id,'employeeId',e.id,'name',e.name,'employeeRevision',e.permission_revision,
    'issuedAt',issued,'expiresAt',issued+ttl);
  end if;
  return jsonb_build_object('ok',true,'token',token,'kind','normal','pinChangeRequired',false,'issuedAt',issued,'expiresAt',issued+ttl,
   'authority',jsonb_build_object('catalog',private.permission_catalog_json(),'snapshot',private.permission_authority_json(e)));
end $$;

create or replace function public.permission_check_required_pin_session() returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform private.permission_store_mutex(sid);
 perform 1 from public.employees where store_id=sid and id=eid for share;
 perform 1 from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash() for share;
 perform private.permission_catalog_share();
 if not private.owner_store_active(sid) then return private.permission_failure('STORE_SUSPENDED'); end if;
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 if e.id is null or not e.is_active or e.role<>'owner' or not e.pin_change_required or s.token_hash is null
  or s.purpose<>'required_pin_change' or s.revoked_at is not null or s.expires_at<=private.write_clock()
  or s.employee_id<>e.id or s.employee_revision<>e.permission_revision then return private.permission_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('valid',true,'purpose','required_pin_change',
  'employeeRevision',e.permission_revision,'expiresAt',s.expires_at));
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create or replace function public.permission_complete_required_pin_change(p_request jsonb) returns jsonb
language plpgsql volatile security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); eid uuid; e public.employees; s private.employee_sessions; req uuid;
 prior private.employee_admin_requests; key private.permission_request_mac_keys; mac bytea; result jsonb;
 before_json jsonb; after_json jsonb; catrev bigint; receipt_payload jsonb; why text; occurred timestamptz;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 if jsonb_typeof(p_request) is distinct from 'object' or
  not p_request ?& array['requestId','expectedRevision','newPin'] or
  p_request-array['requestId','expectedRevision','newPin']<>'{}' or
  not private.valid_uuid(p_request->'requestId') or
  jsonb_typeof(p_request->'expectedRevision') is distinct from 'number' or (p_request->>'expectedRevision') !~ '^[0-9]+$' or
  (p_request->>'expectedRevision')::numeric>9007199254740991 or
  jsonb_typeof(p_request->'newPin') is distinct from 'string' or (p_request->>'newPin') !~ '^[0-9]{6}$'
 then return private.permission_failure('INVALID_EMPLOYEE_REQUEST'); end if;
 req:=(p_request->>'requestId')::uuid;
 select employee_id into eid from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 perform private.permission_identity_lock(sid,eid,true);
 if not private.owner_store_active(sid) then return private.permission_failure('STORE_SUSPENDED'); end if;
 select * into e from public.employees where store_id=sid and id=eid;
 select * into s from private.employee_sessions where store_id=sid and token_hash=private.employee_token_hash();
 -- Session validity deliberately precedes receipt lookup: a completed request
 -- revokes its own credential and can never be replayed into authority.
 if e.id is null or not e.is_active or e.role<>'owner' or not e.pin_change_required or s.token_hash is null
  or s.purpose<>'required_pin_change' or s.revoked_at is not null or s.expires_at<=private.write_clock()
  or s.employee_id<>e.id or s.employee_revision<>e.permission_revision then return private.permission_failure('EMPLOYEE_SESSION_REQUIRED'); end if;
 select * into prior from private.employee_admin_requests r where r.store_id=sid and r.actor_type='employee' and r.actor_key=e.id::text and r.request_id=req;
 select * into key from private.permission_request_mac_keys where key_version=coalesce(prior.mac_key_version,(select max(key_version) from private.permission_request_mac_keys)) for share;
 if key.key_version is null then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end if;
 receipt_payload:=jsonb_build_object('kind','complete_required_pin_change','targetId',e.id,'requestId',req,
  'expectedRevision',p_request->'expectedRevision','newPinMac',encode(extensions.hmac(convert_to(p_request->>'newPin','UTF8'),key.secret_bytes,'sha256'),'hex'));
 mac:=extensions.hmac(convert_to(receipt_payload::text,'UTF8'),key.secret_bytes,'sha256');
 if prior.request_id is not null then
  if prior.payload_mac<>mac then return private.permission_failure('ADMIN_REQUEST_REUSED'); end if;
  return prior.terminal_outcome;
 end if;
 if (p_request->>'expectedRevision')::bigint<>e.permission_revision then why:='EMPLOYEE_VERSION_CONFLICT';
 elsif e.passcode_hash=extensions.crypt(p_request->>'newPin',e.passcode_hash) then why:='PIN_REUSE_NOT_ALLOWED'; end if;
 before_json:=private.permission_employee_snapshot(e); catrev:=(select revision from public.permission_catalog_state where singleton); occurred:=private.write_clock();
 if why is not null then
  result:=private.permission_failure(why); after_json:=before_json;
  insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,reason,before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at)
  values(sid,'employee',e.id::text,req,e.id,'complete_required_pin_change','denied',why,before_json,before_json,after_json,array[]::text[],catrev,false,occurred);
  insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
  values(sid,'employee',e.id::text,req,'complete_required_pin_change',mac,key.key_version,result,jsonb_build_array(jsonb_build_array(sid,'employee',e.id,req,e.id)));
  return result;
 end if;
 update public.employees set passcode_hash=extensions.crypt(p_request->>'newPin',extensions.gen_salt('bf')),
  pin_change_required=false,permission_revision=permission_revision+1 where store_id=sid and id=e.id returning * into e;
 update private.employee_sessions set revoked_at=coalesce(revoked_at,occurred) where store_id=sid and employee_id=e.id;
 insert into public.store_change_signals values(sid,'permission',1,req,e.id)
 on conflict(store_id,topic) do update set revision=public.store_change_signals.revision+1,event_id=req,target_id=e.id;
 result:=jsonb_build_object('ok',true,'outcome','applied','data',jsonb_build_object('credentialChanged',true,
  'pinChangeRequired',false,'employeeRevision',e.permission_revision));
 after_json:=private.permission_employee_snapshot(e);
 insert into public.employee_admin_audit(store_id,actor_type,actor_key,request_id,target_id,kind,outcome,before_snapshot,proposed_after,actual_after,actor_effective,catalog_revision,credential_changed,occurred_at)
 values(sid,'employee',e.id::text,req,e.id,'complete_required_pin_change','applied',before_json,after_json,after_json,array[]::text[],catrev,true,occurred);
 insert into private.employee_admin_requests(store_id,actor_type,actor_key,request_id,kind,payload_mac,mac_key_version,terminal_outcome,audit_keys)
 values(sid,'employee',e.id::text,req,'complete_required_pin_change',mac,key.key_version,result,jsonb_build_array(jsonb_build_array(sid,'employee',e.id,req,e.id)));
 return result;
exception when sqlstate 'P0401' then return private.permission_failure(sqlerrm);
 when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;

create or replace function public.permission_get_store_session() returns jsonb
language plpgsql stable security definer set search_path=pg_catalog as $$
declare sid uuid:=auth.uid(); s public.stores;
begin
 if sid is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 select * into s from public.stores where id=sid;
 if s.id is null then return private.permission_failure('AUTH_REQUIRED'); end if;
 return jsonb_build_object('ok',true,'data',jsonb_build_object('storeId',s.id,'storeNo',s.store_no,'status',s.status));
exception when others then return private.permission_failure('PERMISSION_UPDATE_UNAVAILABLE'); end $$;


create or replace function public.permission_menu_image_public_lookup(p_asset_key uuid) returns jsonb
language plpgsql volatile security definer set search_path = pg_catalog as $$
declare store_id_target uuid;
begin
  select store_id into store_id_target from private.menu_image_assets where asset_key = p_asset_key;
  if store_id_target is null then return null; end if;
  perform 1 from public.stores where id = store_id_target for share;
  if not private.owner_store_active(store_id_target) then return null; end if;
  return (
    select jsonb_build_object('assetKey',a.asset_key,'objectKey',a.object_key,
      'mimeType',a.mime_type,'byteSize',a.byte_size)
    from private.menu_image_assets a
    join public.menu_items m on m.store_id=a.store_id and m.id=a.item_id
      and m.deleted_at is null and m.image_asset_key=a.asset_key::text
    where a.asset_key=p_asset_key and a.store_id=store_id_target and a.published
  );
end;
$$;

commit;
