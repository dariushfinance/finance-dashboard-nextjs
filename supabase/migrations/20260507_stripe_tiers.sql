-- User tiers for Stripe-based monetization
create table if not exists user_tiers (
  user_id                uuid primary key references auth.users on delete cascade,
  tier                   text not null default 'free' check (tier in ('free', 'pro', 'pro_max')),
  stripe_customer_id     text unique,
  stripe_subscription_id text unique,
  subscription_status    text,          -- 'active', 'canceled', 'past_due', etc.
  current_period_end     timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table user_tiers enable row level security;

-- Users can read their own tier (used by the dashboard client)
create policy "users_read_own_tier"
  on user_tiers for select
  using (auth.uid() = user_id);

-- Only service role (webhook) can insert / update
create policy "service_role_manage_tiers"
  on user_tiers for all
  using (auth.role() = 'service_role');

-- Auto-insert a free tier row when a new user signs up
create or replace function handle_new_user_tier()
returns trigger language plpgsql security definer as $$
begin
  insert into public.user_tiers (user_id) values (new.id) on conflict do nothing;
  return new;
end;
$$;

create or replace trigger on_auth_user_created_tier
  after insert on auth.users
  for each row execute procedure handle_new_user_tier();
