-- Role of the signed-in user, or null (anonymous, deleted). Security definer so policies on
-- people can call it without recursing into people's own RLS.
create function public.my_role() returns text
language sql stable security definer set search_path = '' as $$
  select role from public.people where id = (select auth.uid())
$$;
revoke execute on function public.my_role() from public, anon;
grant execute on function public.my_role() to authenticated;

-- People: read your own row (so a waiting person sees "Waiting for approval"); admin reads all.
-- No direct writes: sign-up trigger inserts, set_role changes roles.
alter table public.people enable row level security;
create policy "read own row or admin reads all" on public.people for select to authenticated
  using (id = (select auth.uid()) or (select public.my_role()) = 'admin');

-- The only way to change a role. Approve = set_role(id, 'nanny').
create function public.set_role(target uuid, new_role text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if (select public.my_role()) is distinct from 'admin' then
    raise exception 'only an admin can change roles' using errcode = '42501';
  end if;
  if target = (select auth.uid()) then
    raise exception 'you cannot change your own role' using errcode = '42501';
  end if;
  if new_role not in ('admin', 'nanny') then
    raise exception 'role must be admin or nanny' using errcode = '22023';
  end if;
  update public.people set role = new_role where id = target;
  if not found then
    raise exception 'no such person' using errcode = 'P0002';
  end if;
end $$;
revoke execute on function public.set_role(uuid, text) from public, anon;
grant execute on function public.set_role(uuid, text) to authenticated;
