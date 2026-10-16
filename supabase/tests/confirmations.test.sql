-- Confirmations: only a nanny adds one, only as herself; nobody edits or deletes one.
begin;
select plan(7);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';

set local role authenticated;

-- nanny
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select lives_ok(
  $$insert into public.confirmations (period_end, snapshot) values ('2030-01-27', '{"total": 22250, "paid": 0}')$$,
  'a nanny confirms a pay period as herself'
);
select throws_ok(
  $$insert into public.confirmations (period_end, snapshot, confirmed_by)
    values ('2030-01-27', '{"total": 22250, "paid": 0}', '00000000-0000-0000-0000-0000000000a1')$$,
  '42501', null, 'a nanny cannot confirm in someone else''s name'
);
select is_empty($$update public.confirmations set snapshot = '{}' returning 1$$, 'a nanny cannot edit a confirmation');
select is_empty($$delete from public.confirmations returning 1$$, 'a nanny cannot delete a confirmation');

-- admin
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select throws_ok(
  $$insert into public.confirmations (period_end, snapshot) values ('2030-01-27', '{"total": 22250, "paid": 0}')$$,
  '42501', null, 'an admin cannot confirm a pay period'
);

-- a waiting person
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select throws_ok(
  $$insert into public.confirmations (period_end, snapshot) values ('2030-01-27', '{"total": 22250, "paid": 0}')$$,
  '42501', null, 'a waiting person cannot confirm a pay period'
);

-- an anonymous visitor
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok(
  $$insert into public.confirmations (period_end, snapshot) values ('2030-01-27', '{"total": 22250, "paid": 0}')$$,
  '42501', null, 'an anonymous visitor cannot confirm a pay period'
);

select * from finish();
rollback;
