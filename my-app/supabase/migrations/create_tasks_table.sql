create extension if not exists "uuid-ossp";


create table public.tasks (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  completed boolean default false,
  created_at timestamptz default now()
);
