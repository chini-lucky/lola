-- People: one row per account. Created by the sign-up trigger as 'waiting'.
create table public.people (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9-]{3,20}$'),
  role text not null default 'waiting' check (role in ('admin', 'nanny', 'waiting')),
  created_at timestamptz not null default now()
);

-- The username is the part of the hidden email before '@' ({username}@lola.invalid).
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.people (id, username) values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Pay data: raw facts only; all pay maths lives in src/pay.ts.

-- Exception days only (OT, leave, note); every other weekday is a normal day.
create table public.days (
  date date primary key,
  ot text[] not null default '{}'
    check (array_to_string(ot, ',') ~ '^([0-2][0-9]:[0-5][0-9]-[0-2][0-9]:[0-5][0-9](,|$))*$'),
  leave boolean not null default false,
  note text,
  updated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  period_end date not null check (extract(day from period_end) = 27),
  paid_on date not null,
  amount integer not null check (amount > 0),
  note text,
  receipts text[] not null default '{}',
  created_at timestamptz not null default now()
);

create table public.rates (
  effective_from date primary key,
  salary integer not null,
  ot_rate integer not null
);

create table public.holidays (
  date date primary key,
  name text not null
);

create table public.period_overrides (
  period_end date primary key,
  salary integer not null,
  note text
);

-- The nanny's "This looks right ✓". The latest row per pay period counts.
create table public.confirmations (
  id uuid primary key default gen_random_uuid(),
  period_end date not null,
  snapshot jsonb not null,
  confirmed_by uuid not null default auth.uid(),
  confirmed_at timestamptz not null default now()
);
