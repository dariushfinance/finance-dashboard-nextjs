-- 1. Allow 'advisor' as a valid tier value (was capped at 'free','pro','pro_max')
alter table user_tiers drop constraint if exists user_tiers_tier_check;
alter table user_tiers add  constraint user_tiers_tier_check
  check (tier in ('free', 'pro', 'pro_max', 'advisor'));

-- 2. Advisor legal disclaimer audit trail.
--    Every Advisor signup MUST insert a row here before checkout proceeds.
--    Civil-liability defense: proves the customer explicitly acknowledged
--    Quantfoli provides quantitative analysis, not investment advice.
create table if not exists advisor_disclaimers (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  accepted_at    timestamptz not null default now(),
  terms_version  text not null,
  ip_address     text,
  user_agent     text
);

create index if not exists advisor_disclaimers_user_id_idx
  on advisor_disclaimers (user_id, accepted_at desc);

alter table advisor_disclaimers enable row level security;

-- Users can read their own acceptance log (transparency)
create policy "users_read_own_disclaimers"
  on advisor_disclaimers for select
  using (auth.uid() = user_id);

-- Users can record their own acceptance (the signup flow)
create policy "users_insert_own_disclaimers"
  on advisor_disclaimers for insert
  with check (auth.uid() = user_id);

-- Service role full access (admin reads + civil-case discovery)
create policy "service_role_manage_disclaimers"
  on advisor_disclaimers for all
  using (auth.role() = 'service_role');
