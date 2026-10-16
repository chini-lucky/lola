begin;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newbie@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select results_eq(
  $$select username from public.people$$,
  $$values ('newbie')$$,
  'a waiting person sees only their own row'
);
select is_empty(
  $$update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000c1' returning 1$$,
  'a waiting person cannot approve themselves'
);
select throws_ok(
  $$insert into public.people (id, username) values ('00000000-0000-0000-0000-0000000000c1', 'sneaky')$$,
  '42501',
  null,
  'nobody adds people directly'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select results_eq(
  $$select username from public.people$$,
  $$values ('nan')$$,
  'a nanny sees only their own row'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select results_eq(
  $$select username from public.people where username in ('boss', 'nan', 'newbie') order by username$$,
  $$values ('boss'), ('nan'), ('newbie')$$,
  'an admin sees everyone'
);
select is_empty(
  $$update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000c1' returning 1$$,
  'an admin changes roles only through set_role, not directly'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty($$select 1 from public.people$$, 'anonymous visitors see nobody');

select * from finish();
rollback;
