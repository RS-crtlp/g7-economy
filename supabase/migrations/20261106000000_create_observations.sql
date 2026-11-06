-- Economic observations for G7 countries (e.g. GDP, inflation, unemployment).
create table public.observations (
  id         bigint generated always as identity primary key,
  country    text    not null,
  indicator  text    not null,
  year       integer not null check (year between 1800 and 2200),
  value      double precision,
  unique (country, indicator, year)
);

create index observations_country_indicator_idx
  on public.observations (country, indicator);

-- Public can read, nobody but the service role can write.
alter table public.observations enable row level security;

create policy "Public read access"
  on public.observations
  for select
  to anon, authenticated
  using (true);

-- Belt and braces: strip write privileges from public roles at the grant level too.
revoke insert, update, delete, truncate on public.observations from anon, authenticated;
grant select on public.observations to anon, authenticated;
