-- PRIME TONE PAINTING V4
-- Run once in Supabase SQL Editor.
-- This schema supports: customer inquiries/quote requests, customer reviews,
-- published projects, project photos, and a private admin dashboard.

create extension if not exists pgcrypto;

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null check (length(trim(name)) between 2 and 100),
  phone text not null check (length(trim(phone)) between 5 and 40),
  email text not null check (length(trim(email)) between 5 and 254),
  property_type text,
  project_type text,
  suburb text,
  preferred_date text,
  message text check (coalesce(length(message),0) <= 5000),
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','contacted','quoted','won','closed')),
  notification_sent boolean not null default false
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text not null check (length(trim(customer_name)) between 2 and 100),
  email text,
  rating integer not null check (rating between 1 and 5),
  comment text not null check (length(trim(comment)) between 5 and 2000),
  project_type text,
  approved boolean not null default false,
  notification_sent boolean not null default false
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  title text not null,
  category text not null default 'Residential',
  project_type text not null default 'Interior',
  suburb text,
  description text,
  completed_date date,
  published boolean not null default false
);

create table if not exists public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  storage_path text not null,
  image_type text not null default 'gallery' check (image_type in ('cover','before','after','gallery')),
  sort_order integer not null default 0
);

alter table public.inquiries enable row level security;
alter table public.comments enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;

-- Public visitors may INSERT inquiries and reviews only.
drop policy if exists "public_insert_inquiries" on public.inquiries;
create policy "public_insert_inquiries" on public.inquiries
for insert to anon, authenticated
with check (true);

drop policy if exists "public_insert_comments" on public.comments;
create policy "public_insert_comments" on public.comments
for insert to anon, authenticated
with check (true);

-- Public visitors may only read published projects and their image records.
drop policy if exists "public_read_published_projects" on public.projects;
create policy "public_read_published_projects" on public.projects
for select to anon, authenticated
using (published = true);

drop policy if exists "public_read_published_project_images" on public.project_images;
create policy "public_read_published_project_images" on public.project_images
for select to anon, authenticated
using (exists (
  select 1 from public.projects p
  where p.id = project_id and p.published = true
));

-- Dashboard access: only authenticated users.
-- IMPORTANT: create only your own admin user and disable public sign-ups in
-- Supabase Authentication settings after creating it.
drop policy if exists "admin_read_inquiries" on public.inquiries;
create policy "admin_read_inquiries" on public.inquiries
for select to authenticated using (true);

drop policy if exists "admin_update_inquiries" on public.inquiries;
create policy "admin_update_inquiries" on public.inquiries
for update to authenticated using (true) with check (true);

drop policy if exists "admin_read_comments" on public.comments;
create policy "admin_read_comments" on public.comments
for select to authenticated using (true);

drop policy if exists "admin_update_comments" on public.comments;
create policy "admin_update_comments" on public.comments
for update to authenticated using (true) with check (true);

drop policy if exists "admin_delete_comments" on public.comments;
create policy "admin_delete_comments" on public.comments
for delete to authenticated using (true);

drop policy if exists "admin_manage_projects" on public.projects;
create policy "admin_manage_projects" on public.projects
for all to authenticated using (true) with check (true);

drop policy if exists "admin_manage_project_images" on public.project_images;
create policy "admin_manage_project_images" on public.project_images
for all to authenticated using (true) with check (true);

-- Storage bucket for project photos.
insert into storage.buckets (id, name, public)
values ('project-images','project-images',true)
on conflict (id) do update set public = true;

drop policy if exists "admin_upload_project_images" on storage.objects;
create policy "admin_upload_project_images" on storage.objects
for insert to authenticated
with check (bucket_id = 'project-images');

drop policy if exists "admin_update_project_images" on storage.objects;
create policy "admin_update_project_images" on storage.objects
for update to authenticated
using (bucket_id = 'project-images') with check (bucket_id = 'project-images');

drop policy if exists "admin_delete_project_images" on storage.objects;
create policy "admin_delete_project_images" on storage.objects
for delete to authenticated
using (bucket_id = 'project-images');

drop policy if exists "public_read_project_images" on storage.objects;
create policy "public_read_project_images" on storage.objects
for select to anon, authenticated
using (bucket_id = 'project-images');
