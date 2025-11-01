create table if not exists users (
  id serial primary key,
  address text not null,
  chain text not null check (chain in ('sol','evm')),
  unlocked boolean not null default false,
  created_at timestamptz not null default now(),
  unique(address, chain)
);

create table if not exists payment_intents (
  id uuid primary key,
  address text not null,
  chain text not null check (chain in ('sol','evm')),
  amount numeric not null,
  status text not null check (status in ('created','processing','paid','failed')) default 'created',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- simple index
create index if not exists idx_users_address_chain on users(address, chain);
create index if not exists idx_intents_address_chain on payment_intents(address, chain);
