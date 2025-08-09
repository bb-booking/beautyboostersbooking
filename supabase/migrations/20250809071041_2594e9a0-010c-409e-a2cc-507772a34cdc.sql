-- Create table for scheduling email reminders
create table if not exists public.booking_reminders (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  type text not null check (type in ('24h','4h')),
  scheduled_at timestamptz not null,
  sent_at timestamptz,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- Enable RLS (edge functions will use service role and bypass policies)
alter table public.booking_reminders enable row level security;

-- Helpful indexes
create index if not exists booking_reminders_scheduled_idx on public.booking_reminders (scheduled_at);
create index if not exists booking_reminders_sent_idx on public.booking_reminders (sent_at);

-- Ensure extensions for cron/net are available
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Schedule cron job to process reminders every 5 minutes
-- Note: replace URL with your project ref; using current project ref from context
select cron.schedule(
  'process-booking-reminders-every-5m',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://ffmahgphhprqphukcand.functions.supabase.co/process-booking-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZmbWFoZ3BoaHBycXBodWtjYW5kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1Njc3OTMsImV4cCI6MjA3MDE0Mzc5M30.ENuTgX8WNjgTBszJApnB-9JSp3hUDRPfQUirmQSzxUY"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
