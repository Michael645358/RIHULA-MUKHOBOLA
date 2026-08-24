-- RIHULA REGISTRATION DATABASE ERROR FIX
-- Run this file in the SAME Supabase project used by supabase.js.
-- It fixes "Database error saving new user" caused by the auth.users trigger.

alter table public.members add column if not exists auth_id uuid;
alter table public.members add column if not exists is_admin boolean not null default false;
alter table public.members add column if not exists is_member boolean not null default true;

create or replace function public.rihula_handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(coalesce(new.raw_user_meta_data->>'name',''));
  v_phone text := trim(coalesce(new.raw_user_meta_data->>'phone',''));
  v_email text := lower(trim(coalesce(new.email,'')));
  v_member_id bigint;
begin
  -- If the profile was already created for this Auth user, keep it linked.
  select m.id
    into v_member_id
  from public.members m
  where m.auth_id = new.id
  limit 1;

  -- Prefer an existing unlinked member with the same email or phone.
  if v_member_id is null then
    select m.id
      into v_member_id
    from public.members m
    where m.auth_id is null
      and (
        (v_email <> '' and lower(coalesce(m.email,'')) = v_email)
        or
        (
          v_phone <> ''
          and regexp_replace(coalesce(m.phone::text,''),'[^0-9]','','g')
              = regexp_replace(v_phone,'[^0-9]','','g')
        )
      )
    order by m.id
    limit 1;
  end if;

  if v_member_id is not null then
    update public.members
    set auth_id = new.id,
        email = case when v_email <> '' then v_email else email end,
        name = coalesce(nullif(v_name,''), name),
        phone = coalesce(nullif(v_phone,''), phone),
        is_member = true
    where id = v_member_id;
  else
    insert into public.members
      (auth_id, name, phone, email, role, status, online, is_admin, is_member)
    values
      (new.id, nullif(v_name,''), nullif(v_phone,''), nullif(v_email,''),
       'member', 'pending', false, false, true);
  end if;

  return new;

exception
  when unique_violation then
    -- A duplicate email/phone should not make Supabase Auth fail with the
    -- generic "Database error saving new user" message.
    select m.id
      into v_member_id
    from public.members m
    where m.auth_id is null
      and (
        (v_email <> '' and lower(coalesce(m.email,'')) = v_email)
        or
        (
          v_phone <> ''
          and regexp_replace(coalesce(m.phone::text,''),'[^0-9]','','g')
              = regexp_replace(v_phone,'[^0-9]','','g')
        )
      )
    order by m.id
    limit 1;

    if v_member_id is not null then
      update public.members
      set auth_id = new.id,
          email = case when v_email <> '' then v_email else email end,
          name = coalesce(nullif(v_name,''), name),
          phone = coalesce(nullif(v_phone,''), phone),
          is_member = true
      where id = v_member_id;
      return new;
    end if;

    raise;
end;
$$;

drop trigger if exists on_auth_user_created_rihula on auth.users;
create trigger on_auth_user_created_rihula
after insert on auth.users
for each row execute function public.rihula_handle_new_auth_user();

-- Keep the existing member/admin access helper.
create or replace function public.is_rihula_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.members m
    where m.auth_id = auth.uid()
      and (
        m.is_admin = true
        or lower(coalesce(m.role,'')) in
          ('admin','administrator','chairperson','secretary','treasurer')
      )
      and lower(coalesce(m.status,'active')) not in
          ('blocked','suspended','inactive')
  );
$$;

revoke all on function public.is_rihula_admin() from public;
grant execute on function public.is_rihula_admin() to authenticated;
