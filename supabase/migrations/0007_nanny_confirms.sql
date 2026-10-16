-- A nanny confirms a pay period ("This looks right ✓"), only in her own name.
-- No update or delete policy: a confirmation is never edited; a newer one supersedes it.
create policy "nanny confirms as herself" on public.confirmations for insert to authenticated
  with check ((select public.my_role()) = 'nanny' and confirmed_by = (select auth.uid()));
