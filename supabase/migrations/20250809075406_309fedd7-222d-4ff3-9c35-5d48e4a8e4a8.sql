-- Fix linter issues: move extensions to extensions schema and add RLS deny-all policies

-- Move extensions to the recommended schema
alter extension if exists pg_cron set schema extensions;
alter extension if exists pg_net set schema extensions;

-- Add explicit deny-all RLS policies for booking_reminders
create policy if not exists "No public select booking_reminders" on public.booking_reminders
for select using (false);

create policy if not exists "No public insert booking_reminders" on public.booking_reminders
for insert with check (false);

create policy if not exists "No public update booking_reminders" on public.booking_reminders
for update using (false);

create policy if not exists "No public delete booking_reminders" on public.booking_reminders
for delete using (false);
