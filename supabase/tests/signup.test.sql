begin;
select plan(2);

insert into auth.users (id, email, aud, role)
values ('00000000-0000-0000-0000-0000000000c1', 'newcomer@lola.invalid', 'authenticated', 'authenticated');

select results_eq(
  $$select username, role from public.people where id = '00000000-0000-0000-0000-0000000000c1'$$,
  $$values ('newcomer', 'waiting')$$,
  'a new sign-up is a waiting person named after their username'
);

select throws_ok(
  $$insert into auth.users (id, email, aud, role)
    values ('00000000-0000-0000-0000-0000000000c2', 'no_way@lola.invalid', 'authenticated', 'authenticated')$$,
  '23514',
  null,
  'a sign-up with a username outside a-z, 0-9 and - is refused'
);

select * from finish();
rollback;
