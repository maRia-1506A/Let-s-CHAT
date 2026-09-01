-- ========================================================
-- Let's CHAT - Supabase Database & Storage Setup Schema
-- Run this entire script in Supabase Dashboard -> SQL Editor
-- ========================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  user_id uuid references auth.users(id) on delete cascade,
  email text,
  display_name text,
  avatar_url text,
  bio text,
  status_message text,
  role text default 'user' check (role in ('admin', 'user')),
  is_online boolean default false,
  last_active timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- ⚠️ AFTER SIGNING UP, run this to make yourself ADMIN:
-- Replace the email below with YOUR email address
-- update public.profiles set role = 'admin' where email = 'your@email.com';

-- Auto-create profile trigger on User Signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, user_id, email, display_name, avatar_url)
  values (
    new.id,
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', '')
  )
  on conflict (id) do update set
    email = excluded.email,
    display_name = coalesce(public.profiles.display_name, excluded.display_name);
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. CONVERSATIONS TABLE
create table if not exists public.conversations (
  id uuid default gen_random_uuid() primary key,
  participant_ids jsonb not null default '[]'::jsonb,
  is_group boolean default false,
  group_name text,
  group_avatar text,
  last_message text,
  last_message_at timestamp with time zone default timezone('utc'::text, now()),
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 3. MESSAGES TABLE
create table if not exists public.messages (
  id uuid default gen_random_uuid() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  sender_name text,
  sender_avatar text,
  content text,
  file_url text,
  file_type text,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. NOTIFICATIONS TABLE
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete cascade,
  sender_name text,
  sender_avatar text,
  type text default 'message',
  title text,
  message text,
  conversation_id uuid,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. CALLS TABLE
create table if not exists public.calls (
  id uuid default gen_random_uuid() primary key,
  initiator_id uuid references public.profiles(id) on delete cascade,
  initiator_name text,
  initiator_avatar text,
  receiver_id uuid references public.profiles(id) on delete cascade,
  receiver_name text,
  receiver_avatar text,
  type text default 'audio',
  status text default 'initiating',
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) & Policies
alter table public.profiles enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;
alter table public.calls enable row level security;

-- Permissive RLS Policies for authenticated users
create policy "Public profile access" on public.profiles for select using (true);
create policy "Users update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Authenticated access to conversations" on public.conversations for all using (auth.role() = 'authenticated');
create policy "Authenticated access to messages" on public.messages for all using (auth.role() = 'authenticated');
create policy "Authenticated access to notifications" on public.notifications for all using (auth.role() = 'authenticated');
create policy "Authenticated access to calls" on public.calls for all using (auth.role() = 'authenticated');

-- Enable Realtime for all tables
alter publication supabase_realtime add table public.profiles;
alter publication supabase_realtime add table public.conversations;
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.calls;

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('chat-attachments', 'chat-attachments', true) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict (id) do nothing;

drop policy if exists "Public Access Chat Attachments" on storage.objects;
create policy "Public Access Chat Attachments" on storage.objects for select using (bucket_id = 'chat-attachments');
drop policy if exists "Authenticated Upload Chat Attachments" on storage.objects;
create policy "Authenticated Upload Chat Attachments" on storage.objects for insert with check (bucket_id = 'chat-attachments');

drop policy if exists "Public Access Avatars" on storage.objects;
create policy "Public Access Avatars" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "Authenticated Upload Avatars" on storage.objects;
create policy "Authenticated Upload Avatars" on storage.objects for insert with check (bucket_id = 'avatars');
