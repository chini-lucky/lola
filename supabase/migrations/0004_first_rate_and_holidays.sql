-- Real data, not seed: the agreed rates from the start date, the first pay period's salary,
-- and Thai public holidays 2026–2027 (admin adds or removes later ones in Settings).
-- Holidays are the nationwide days off including substitute days; government-only and
-- regional special days are left out.

insert into public.rates (effective_from, salary, ot_rate) values ('2026-09-14', 20000, 150);

insert into public.period_overrides (period_end, salary, note)
  values ('2026-09-27', 11000, 'first part-month, agreed');

insert into public.holidays (date, name) values
  ('2026-01-01', 'New Year''s Day'),
  ('2026-03-03', 'Makha Bucha Day'),
  ('2026-04-06', 'Chakri Day'),
  ('2026-04-13', 'Songkran'),
  ('2026-04-14', 'Songkran'),
  ('2026-04-15', 'Songkran'),
  ('2026-05-01', 'National Labour Day'),
  ('2026-05-04', 'Coronation Day'),
  ('2026-05-31', 'Visakha Bucha Day'),
  ('2026-06-01', 'Visakha Bucha Day (substitute)'),
  ('2026-06-03', 'Queen Suthida''s Birthday'),
  ('2026-07-28', 'King''s Birthday'),
  ('2026-07-29', 'Asahna Bucha Day'),
  ('2026-08-12', 'Mother''s Day'),
  ('2026-10-13', 'King Bhumibol Memorial Day'),
  ('2026-10-23', 'Chulalongkorn Day'),
  ('2026-12-05', 'Father''s Day'),
  ('2026-12-07', 'Father''s Day (substitute)'),
  ('2026-12-10', 'Constitution Day'),
  ('2026-12-31', 'New Year''s Eve'),
  ('2027-01-01', 'New Year''s Day'),
  ('2027-02-21', 'Makha Bucha Day'),
  ('2027-02-22', 'Makha Bucha Day (substitute)'),
  ('2027-04-06', 'Chakri Day'),
  ('2027-04-13', 'Songkran'),
  ('2027-04-14', 'Songkran'),
  ('2027-04-15', 'Songkran'),
  ('2027-05-01', 'National Labour Day'),
  ('2027-05-03', 'National Labour Day (substitute)'),
  ('2027-05-04', 'Coronation Day'),
  ('2027-05-20', 'Visakha Bucha Day'),
  ('2027-06-03', 'Queen Suthida''s Birthday'),
  ('2027-07-18', 'Asahna Bucha Day'),
  ('2027-07-19', 'Asahna Bucha Day (substitute)'),
  ('2027-07-28', 'King''s Birthday'),
  ('2027-08-12', 'Mother''s Day'),
  ('2027-10-13', 'King Bhumibol Memorial Day'),
  ('2027-10-23', 'Chulalongkorn Day'),
  ('2027-10-25', 'Chulalongkorn Day (substitute)'),
  ('2027-12-05', 'Father''s Day'),
  ('2027-12-06', 'Father''s Day (substitute)'),
  ('2027-12-10', 'Constitution Day'),
  ('2027-12-31', 'New Year''s Eve');
