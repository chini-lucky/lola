-- Local test logins only (applied by `supabase db reset`, never in production).
-- e2e/logins.ts holds the same usernames and passwords.
with logins (id, username, password, role) as (
  values
    ('00000000-0000-0000-0000-00000000a000'::uuid, 'chini-lucky', 'local-admin-pass', 'admin'),
    ('00000000-0000-0000-0000-00000000b000'::uuid, 'lola', 'local-nanny-pass', 'nanny'),
    ('00000000-0000-0000-0000-00000000c000'::uuid, 'newbie', 'local-newbie-pass', 'waiting')
), users as (
  insert into auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change
  )
  select
    '00000000-0000-0000-0000-000000000000', id, 'authenticated', 'authenticated',
    username || '@lola.invalid', extensions.crypt(password, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"]}', '{}', now(), now(),
    '', '', '', ''
  from logins
  returning id, email
)
insert into auth.identities (user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select id, id::text, 'email', jsonb_build_object('sub', id::text, 'email', email), now(), now(), now()
from users;

update public.people set role = 'admin' where username = 'chini-lucky';
update public.people set role = 'nanny' where username = 'lola';

-- The first pay period's salary, paid in full on pay day.
insert into public.payments (period_end, paid_on, amount, note)
values ('2026-09-27', '2026-09-28', 11000, 'Bank transfer');
