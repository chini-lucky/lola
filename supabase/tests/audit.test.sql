begin;
select plan(13);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newbie@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';

select results_eq(
  $$select op, new ->> 'username', new ->> 'role' from public.audit_log
    where tbl = 'people' and new ->> 'username' = 'nan' order by id limit 1$$,
  $$values ('insert', 'nan', 'waiting')$$,
  'a sign-up is logged'
);

insert into public.confirmations (period_end, snapshot, confirmed_by)
  values ('2030-01-27', '{"total": 22250, "paid": 0}', '00000000-0000-0000-0000-0000000000b1');
select results_eq(
  $$select tbl, op from public.audit_log order by id desc limit 1$$,
  $$values ('confirmations', 'insert')$$,
  'a confirmation is logged'
);

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';

insert into public.days (date, ot, note) values ('2030-01-07', '{18:00-20:30}', 'dinner out');
select results_eq(
  $$select tbl, op, actor, new ->> 'note' from public.audit_log order by id desc limit 1$$,
  $$values ('days', 'insert', '00000000-0000-0000-0000-0000000000a1'::uuid, 'dinner out')$$,
  'adding a day is logged with who did it'
);

insert into public.payments (period_end, paid_on, amount) values ('2030-01-27', '2030-01-28', 22250);
update public.payments set amount = 20000 where period_end = '2030-01-27';
select results_eq(
  $$select tbl, op, old ->> 'amount', new ->> 'amount' from public.audit_log order by id desc limit 1$$,
  $$values ('payments', 'update', '22250', '20000')$$,
  'editing a payment logs the before and after'
);

insert into public.holidays (date, name) values ('2030-01-01', 'New Year''s Day');
delete from public.holidays where date = '2030-01-01';
select results_eq(
  $$select tbl, op, old ->> 'name', new from public.audit_log order by id desc limit 1$$,
  $$values ('holidays', 'delete', 'New Year''s Day', null::jsonb)$$,
  'deleting a holiday logs what was removed'
);

insert into public.rates (effective_from, salary, ot_rate) values ('2030-01-28', 21000, 160);
select results_eq(
  $$select tbl, op from public.audit_log order by id desc limit 1$$,
  $$values ('rates', 'insert')$$,
  'adding a rate is logged'
);

insert into public.period_overrides (period_end, salary) values ('2030-01-27', 11000);
select results_eq(
  $$select tbl, op from public.audit_log order by id desc limit 1$$,
  $$values ('period_overrides', 'insert')$$,
  'adding a period override is logged'
);

select public.set_role('00000000-0000-0000-0000-0000000000b1', 'admin');
select results_eq(
  $$select tbl, op, actor, old ->> 'role', new ->> 'role' from public.audit_log order by id desc limit 1$$,
  $$values ('people', 'update', '00000000-0000-0000-0000-0000000000a1'::uuid, 'nanny', 'admin')$$,
  'a role change is logged with who did it'
);

select throws_ok(
  $$insert into public.audit_log (tbl, op) values ('days', 'delete')$$,
  '42501',
  null,
  'an admin cannot write the change log directly'
);
select is_empty(
  $$delete from public.audit_log returning 1$$,
  'an admin cannot erase the change log'
);

reset role;
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select is_empty($$select 1 from public.audit_log$$, 'a nanny cannot read the change log');

set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select is_empty($$select 1 from public.audit_log$$, 'a waiting person cannot read the change log');

reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty($$select 1 from public.audit_log$$, 'anonymous visitors cannot read the change log');

select * from finish();
rollback;
