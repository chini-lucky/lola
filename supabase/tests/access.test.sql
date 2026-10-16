begin;
select plan(1);

set local role anon;
select throws_ok(
  'select * from auth.users',
  '42501',
  null,
  'anon cannot read accounts'
);

select * from finish();
rollback;
