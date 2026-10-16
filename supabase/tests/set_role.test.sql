begin;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select throws_ok(
  $$select public.set_role('00000000-0000-0000-0000-0000000000c1', 'nanny')$$,
  '42501',
  'only an admin can change roles',
  'a waiting person cannot approve themselves'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select throws_ok(
  $$select public.set_role('00000000-0000-0000-0000-0000000000c1', 'nanny')$$,
  '42501',
  'only an admin can change roles',
  'a nanny cannot approve anyone'
);

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select throws_ok(
  $$select public.set_role('00000000-0000-0000-0000-0000000000a1', 'nanny')$$,
  '42501',
  'you cannot change your own role',
  'an admin cannot change their own role'
);
select throws_ok(
  $$select public.set_role('00000000-0000-0000-0000-0000000000c1', 'waiting')$$,
  '22023',
  'role must be admin or nanny',
  'nobody can be sent back to waiting'
);
select public.set_role('00000000-0000-0000-0000-0000000000c1', 'nanny');
select results_eq(
  $$select role from public.people where id = '00000000-0000-0000-0000-0000000000c1'$$,
  $$values ('nanny')$$,
  'an admin approves a waiting person as a nanny'
);
select public.set_role('00000000-0000-0000-0000-0000000000b1', 'admin');
select results_eq(
  $$select role from public.people where id = '00000000-0000-0000-0000-0000000000b1'$$,
  $$values ('admin')$$,
  'an admin makes a nanny an admin'
);

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$select public.set_role('00000000-0000-0000-0000-0000000000c1', 'admin')$$,
  '42501',
  null,
  'anonymous visitors cannot call set_role'
);

select * from finish();
rollback;
