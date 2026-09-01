-- Defense-in-depth RLS. The FastAPI layer is the primary access control; these
-- policies ensure a leaked anon key still cannot read another user's trips.
-- Run in the Supabase SQL editor AFTER `alembic upgrade head`.

alter table trips enable row level security;
alter table itinerary_days enable row level security;
alter table itinerary_items enable row level security;

-- trips: owner only
create policy "trips_owner" on trips
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- days: reachable only through an owned trip
create policy "days_via_trip" on itinerary_days
  for all
  using (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()))
  with check (exists (select 1 from trips t where t.id = trip_id and t.user_id = auth.uid()));

-- items: reachable only through an owned day -> trip
create policy "items_via_day" on itinerary_items
  for all
  using (exists (
    select 1 from itinerary_days d
    join trips t on t.id = d.trip_id
    where d.id = day_id and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from itinerary_days d
    join trips t on t.id = d.trip_id
    where d.id = day_id and t.user_id = auth.uid()
  ));

-- NOTE: the backend connects as the Postgres role (bypasses RLS). If you later
-- switch the backend to the Supabase client with the user's JWT, these policies
-- become the live enforcement path.
