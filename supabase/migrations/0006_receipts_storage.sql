-- Receipt files: a private bucket. Admin uploads, replaces and removes; the nanny only reads
-- (signed URLs need read). Waiting and anonymous users get nothing.
-- allowed_mime_types: keep in step with RECEIPT_TYPES in src/receipts.ts.
-- Object path: {period_end}/{payment_id}/{file}; payments.receipts lists a payment's paths.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('receipts', 'receipts', false, 10485760,
        array['image/jpeg', 'image/png', 'image/heic', 'application/pdf'])
on conflict (id) do nothing;

create policy receipts_read on storage.objects for select to authenticated
  using (bucket_id = 'receipts' and (select public.my_role()) in ('admin', 'nanny'));
create policy receipts_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'receipts' and (select public.my_role()) = 'admin');
create policy receipts_update on storage.objects for update to authenticated
  using (bucket_id = 'receipts' and (select public.my_role()) = 'admin');
create policy receipts_delete on storage.objects for delete to authenticated
  using (bucket_id = 'receipts' and (select public.my_role()) = 'admin');
