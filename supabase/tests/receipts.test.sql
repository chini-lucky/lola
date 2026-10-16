-- Receipt files in the private receipts bucket: admin writes, nanny reads only, waiting and anonymous nothing.
-- Rows inserted into storage.objects by SQL stand in for files (no real file is stored).
begin;
select plan(18);
-- Let SQL deletes reach the policies, as the Storage API does (storage blocks them by default).
set local storage.allow_delete_query = 'true';

insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'boss@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000b1', 'nan@lola.invalid', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000c1', 'newcomer@lola.invalid', 'authenticated', 'authenticated');
update public.people set role = 'admin' where id = '00000000-0000-0000-0000-0000000000a1';
update public.people set role = 'nanny' where id = '00000000-0000-0000-0000-0000000000b1';

select is(
  (select public from storage.buckets where id = 'receipts'),
  false,
  'the receipts bucket is private'
);

set local role authenticated;

-- admin
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000a1","role":"authenticated"}';
select lives_ok($$insert into storage.objects (bucket_id, name) values ('receipts', '2030-01-27/p1/slip.jpg'), ('receipts', '2030-01-27/p1/kbank.pdf')$$, 'an admin uploads receipts');
select isnt_empty($$select 1 from storage.objects where bucket_id = 'receipts'$$, 'an admin reads receipts');
select isnt_empty($$update storage.objects set name = '2030-01-27/p1/slip-2.jpg' where bucket_id = 'receipts' and name = '2030-01-27/p1/slip.jpg' returning 1$$, 'an admin replaces a receipt');
select isnt_empty($$delete from storage.objects where bucket_id = 'receipts' and name = '2030-01-27/p1/slip-2.jpg' returning 1$$, 'an admin removes a receipt');

-- nanny
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000b1","role":"authenticated"}';
select isnt_empty($$select 1 from storage.objects where bucket_id = 'receipts'$$, 'a nanny reads receipts');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('receipts', '2030-01-27/p1/fake.jpg')$$, '42501', null, 'a nanny cannot upload a receipt');
select is_empty($$update storage.objects set name = '2030-01-27/p1/x.pdf' where bucket_id = 'receipts' returning 1$$, 'a nanny cannot replace a receipt');
select is_empty($$delete from storage.objects where bucket_id = 'receipts' returning 1$$, 'a nanny cannot remove a receipt');

-- a waiting person
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-0000000000c1","role":"authenticated"}';
select is_empty($$select 1 from storage.objects where bucket_id = 'receipts'$$, 'a waiting person sees no receipts');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('receipts', '2030-01-27/p1/fake.jpg')$$, '42501', null, 'a waiting person cannot upload a receipt');
select is_empty($$update storage.objects set name = '2030-01-27/p1/x.pdf' where bucket_id = 'receipts' returning 1$$, 'a waiting person cannot replace a receipt');
select is_empty($$delete from storage.objects where bucket_id = 'receipts' returning 1$$, 'a waiting person cannot remove a receipt');

-- anonymous
reset request.jwt.claims;
set local role anon;
select is_empty($$select 1 from storage.objects where bucket_id = 'receipts'$$, 'an anonymous visitor sees no receipts');
select throws_ok($$insert into storage.objects (bucket_id, name) values ('receipts', '2030-01-27/p1/fake.jpg')$$, '42501', null, 'an anonymous visitor cannot upload a receipt');
select is_empty($$update storage.objects set name = '2030-01-27/p1/x.pdf' where bucket_id = 'receipts' returning 1$$, 'an anonymous visitor cannot replace a receipt');
select is_empty($$delete from storage.objects where bucket_id = 'receipts' returning 1$$, 'an anonymous visitor cannot remove a receipt');

-- still there for the people who may see it
reset role;
select is(
  (select count(*)::int from storage.objects where bucket_id = 'receipts'),
  1,
  'only the admin''s remove took a receipt away'
);

select * from finish();
rollback;
