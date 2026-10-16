-- A day's OT ranges: each must start before it ends (ranges never cross midnight).
begin;
select plan(3);

select throws_ok(
  $$insert into public.days (date, ot) values ('2030-01-07', '{20:30-18:00}')$$,
  '23514', null,
  'an OT range that ends before it starts is refused'
);
select throws_ok(
  $$insert into public.days (date, ot) values ('2030-01-08', '{07:00-08:00,18:00-18:00}')$$,
  '23514', null,
  'an OT range that ends when it starts is refused'
);
select lives_ok(
  $$insert into public.days (date, ot) values ('2030-01-09', '{07:00-08:00,18:00-20:30}')$$,
  'OT ranges that each start before they end are stored'
);

select * from finish();
rollback;
