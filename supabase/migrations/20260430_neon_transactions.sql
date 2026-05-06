create table if not exists neon_transactions (
  id               bigserial primary key,
  user_id          uuid references auth.users not null,
  date             text not null,
  amount           text not null,
  original_amount  text not null default '',
  exchange_rate    text not null default '',
  description      text not null default '',
  subject          text not null default '',
  category         text not null default '',
  tags             text not null default '',
  wise             boolean not null default false,
  spaces           text not null default '',
  created_at       timestamptz not null default now()
);

alter table neon_transactions enable row level security;

create policy "Users own their neon transactions"
  on neon_transactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index neon_transactions_user_date on neon_transactions (user_id, date desc);
