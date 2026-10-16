-- Access to the pay data tables: admin all, nanny read, waiting and anonymous nothing.
begin;
select plan(61);

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newbie@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';
insert into public.confirmations (period_end, snapshot, confirmed_by)
  values ('2030-01-27', '{"total": 22250, "paid": 0}', '00000000-0000-0000-0000-0000000000b1');

set local role authenticated;

-- admin
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok($$insert into public.days (date, ot, note) values ('2030-01-07', '{18:00-20:30}', 'dinner out')$$, 'an admin adds a day');
select lives_ok($$insert into public.payments (period_end, paid_on, amount, note) values ('2030-01-27', '2030-01-28', 22250, 'bank transfer')$$, 'an admin adds a payment');
select lives_ok($$insert into public.rates (effective_from, salary, ot_rate) values ('2030-01-28', 21000, 160)$$, 'an admin adds a rate');
select lives_ok($$insert into public.holidays (date, name) values ('2030-01-01', 'New Year''s Day')$$, 'an admin adds a holiday');
select lives_ok($$insert into public.period_overrides (period_end, salary, note) values ('2030-01-27', 11000, 'agreed')$$, 'an admin adds a period override');
select isnt_empty($$select 1 from public.confirmations$$, 'an admin reads confirmations');
select is_empty($$update public.confirmations set snapshot = '{}' returning 1$$, 'an admin cannot edit a confirmation');
select is_empty($$delete from public.confirmations returning 1$$, 'an admin cannot delete a confirmation');

-- nanny
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select isnt_empty($$select 1 from public.days$$, 'a nanny reads days');
select throws_ok($$insert into public.days (date, leave) values ('2030-01-08', true)$$, '42501', null, 'a nanny cannot add a day');
select is_empty($$update public.days set note = 'late dinner' where date = '2030-01-07' returning 1$$, 'a nanny cannot edit a day');
select is_empty($$delete from public.days where date = '2030-01-07' returning 1$$, 'a nanny cannot delete a day');
select isnt_empty($$select 1 from public.payments$$, 'a nanny reads payments');
select throws_ok($$insert into public.payments (period_end, paid_on, amount) values ('2030-01-27', '2030-01-28', 1)$$, '42501', null, 'a nanny cannot add a payment');
select is_empty($$update public.payments set note = 'cash' where period_end = '2030-01-27' returning 1$$, 'a nanny cannot edit a payment');
select is_empty($$delete from public.payments where period_end = '2030-01-27' returning 1$$, 'a nanny cannot delete a payment');
select isnt_empty($$select 1 from public.rates$$, 'a nanny reads rates');
select throws_ok($$insert into public.rates (effective_from, salary, ot_rate) values ('2030-02-28', 99000, 999)$$, '42501', null, 'a nanny cannot add a rate');
select is_empty($$update public.rates set ot_rate = 170 where effective_from = '2030-01-28' returning 1$$, 'a nanny cannot edit a rate');
select is_empty($$delete from public.rates where effective_from = '2030-01-28' returning 1$$, 'a nanny cannot delete a rate');
select isnt_empty($$select 1 from public.holidays$$, 'a nanny reads holidays');
select throws_ok($$insert into public.holidays (date, name) values ('2030-01-02', 'Day off')$$, '42501', null, 'a nanny cannot add a holiday');
select is_empty($$update public.holidays set name = 'New Year' where date = '2030-01-01' returning 1$$, 'a nanny cannot edit a holiday');
select is_empty($$delete from public.holidays where date = '2030-01-01' returning 1$$, 'a nanny cannot delete a holiday');
select isnt_empty($$select 1 from public.period_overrides$$, 'a nanny reads period overrides');
select throws_ok($$insert into public.period_overrides (period_end, salary) values ('2030-02-27', 1)$$, '42501', null, 'a nanny cannot add a period override');
select is_empty($$update public.period_overrides set salary = 12000 where period_end = '2030-01-27' returning 1$$, 'a nanny cannot edit a period override');
select is_empty($$delete from public.period_overrides where period_end = '2030-01-27' returning 1$$, 'a nanny cannot delete a period override');
select isnt_empty($$select 1 from public.confirmations$$, 'a nanny reads confirmations');

-- a waiting person
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select is_empty($$select 1 from public.days$$, 'a waiting person sees no days');
select throws_ok($$insert into public.days (date, leave) values ('2030-01-08', true)$$, '42501', null, 'a waiting person cannot add a day');
select is_empty($$select 1 from public.payments$$, 'a waiting person sees no payments');
select throws_ok($$insert into public.payments (period_end, paid_on, amount) values ('2030-01-27', '2030-01-28', 1)$$, '42501', null, 'a waiting person cannot add a payment');
select is_empty($$select 1 from public.rates$$, 'a waiting person sees no rates');
select throws_ok($$insert into public.rates (effective_from, salary, ot_rate) values ('2030-02-28', 99000, 999)$$, '42501', null, 'a waiting person cannot add a rate');
select is_empty($$select 1 from public.holidays$$, 'a waiting person sees no holidays');
select throws_ok($$insert into public.holidays (date, name) values ('2030-01-02', 'Day off')$$, '42501', null, 'a waiting person cannot add a holiday');
select is_empty($$select 1 from public.period_overrides$$, 'a waiting person sees no period overrides');
select throws_ok($$insert into public.period_overrides (period_end, salary) values ('2030-02-27', 1)$$, '42501', null, 'a waiting person cannot add a period override');
select is_empty($$select 1 from public.confirmations$$, 'a waiting person sees no confirmations');

-- an anonymous visitor
reset role;
set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select is_empty($$select 1 from public.days$$, 'an anonymous visitor sees no days');
select throws_ok($$insert into public.days (date, leave) values ('2030-01-08', true)$$, '42501', null, 'an anonymous visitor cannot add a day');
select is_empty($$select 1 from public.payments$$, 'an anonymous visitor sees no payments');
select throws_ok($$insert into public.payments (period_end, paid_on, amount) values ('2030-01-27', '2030-01-28', 1)$$, '42501', null, 'an anonymous visitor cannot add a payment');
select is_empty($$select 1 from public.rates$$, 'an anonymous visitor sees no rates');
select throws_ok($$insert into public.rates (effective_from, salary, ot_rate) values ('2030-02-28', 99000, 999)$$, '42501', null, 'an anonymous visitor cannot add a rate');
select is_empty($$select 1 from public.holidays$$, 'an anonymous visitor sees no holidays');
select throws_ok($$insert into public.holidays (date, name) values ('2030-01-02', 'Day off')$$, '42501', null, 'an anonymous visitor cannot add a holiday');
select is_empty($$select 1 from public.period_overrides$$, 'an anonymous visitor sees no period overrides');
select throws_ok($$insert into public.period_overrides (period_end, salary) values ('2030-02-27', 1)$$, '42501', null, 'an anonymous visitor cannot add a period override');
select is_empty($$select 1 from public.confirmations$$, 'an anonymous visitor sees no confirmations');

-- admin edits and deletes
reset role;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select isnt_empty($$update public.days set note = 'late dinner' where date = '2030-01-07' returning 1$$, 'an admin edits a day');
select isnt_empty($$delete from public.days where date = '2030-01-07' returning 1$$, 'an admin deletes a day');
select isnt_empty($$update public.payments set note = 'cash' where period_end = '2030-01-27' returning 1$$, 'an admin edits a payment');
select isnt_empty($$delete from public.payments where period_end = '2030-01-27' returning 1$$, 'an admin deletes a payment');
select isnt_empty($$update public.rates set ot_rate = 170 where effective_from = '2030-01-28' returning 1$$, 'an admin edits a rate');
select isnt_empty($$delete from public.rates where effective_from = '2030-01-28' returning 1$$, 'an admin deletes a rate');
select isnt_empty($$update public.holidays set name = 'New Year' where date = '2030-01-01' returning 1$$, 'an admin edits a holiday');
select isnt_empty($$delete from public.holidays where date = '2030-01-01' returning 1$$, 'an admin deletes a holiday');
select isnt_empty($$update public.period_overrides set salary = 12000 where period_end = '2030-01-27' returning 1$$, 'an admin edits a period override');
select isnt_empty($$delete from public.period_overrides where period_end = '2030-01-27' returning 1$$, 'an admin deletes a period override');

select * from finish();
rollback;
