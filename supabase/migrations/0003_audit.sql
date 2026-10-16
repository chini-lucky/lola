-- Change log of every add, edit and delete. Written only by the audit trigger; admin reads it.
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid default auth.uid(),
  tbl text not null,
  op text not null check (op in ('insert', 'update', 'delete')),
  old jsonb,
  new jsonb
);

alter table public.audit_log enable row level security;
create policy "admin reads" on public.audit_log for select to authenticated
  using ((select public.my_role()) = 'admin');

create function public.audit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log (tbl, op, old, new) values (
    tg_table_name,
    lower(tg_op),
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end
  );
  return null;
end $$;
revoke execute on function public.audit() from public, anon, authenticated;

create trigger audit after insert or update or delete on public.days
  for each row execute function public.audit();
create trigger audit after insert or update or delete on public.payments
  for each row execute function public.audit();
create trigger audit after insert or update or delete on public.rates
  for each row execute function public.audit();
create trigger audit after insert or update or delete on public.holidays
  for each row execute function public.audit();
create trigger audit after insert or update or delete on public.period_overrides
  for each row execute function public.audit();
create trigger audit after insert or update or delete on public.confirmations
  for each row execute function public.audit();
-- People: sign-ups and role changes. Removing a person is logged by the remove-user function.
create trigger audit after insert or update of role on public.people
  for each row execute function public.audit();
