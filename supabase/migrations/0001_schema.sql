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
