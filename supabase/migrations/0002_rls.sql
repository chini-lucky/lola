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
