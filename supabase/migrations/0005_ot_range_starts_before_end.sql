-- Each OT range "HH:MM-HH:MM" must start before it ends (ranges never cross midnight).
-- Zero-padded HH:MM strings sort like times, so a text comparison is enough.
create function public.ot_ranges_start_before_end(ot text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(bool_and(split_part(range, '-', 1) < split_part(range, '-', 2)), true)
  from unnest(ot) as range
$$;

alter table public.days
  add constraint ot_ranges_start_before_end check (public.ot_ranges_start_before_end(ot));
