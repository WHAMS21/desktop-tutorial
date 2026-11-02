-- WHAMSY product catalogue and private owner access.
-- Run this once in the Supabase SQL Editor, then follow SUPABASE_SETUP.md.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category text not null check (category in ('REST', 'HOME', 'PLAY', 'DREAMS')),
  description text not null default '',
  price_ksh integer check (price_ksh is null or price_ksh >= 0),
  show_price boolean not null default true,
  image_url text not null default '',
  image_path text,
  materials text not null default '',
  dimensions text not null default '',
  care_instructions text not null default '',
  availability text not null default 'in_stock' check (availability in ('in_stock', 'made_to_order', 'sold_out')),
  is_active boolean not null default false,
  is_featured boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.is_whamsy_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_whamsy_admin() from public;
grant execute on function public.is_whamsy_admin() to authenticated;

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

revoke all on table public.admin_users from anon, authenticated;
grant select on table public.admin_users to authenticated;

drop policy if exists "Admins can read own membership" on public.admin_users;
create policy "Admins can read own membership"
  on public.admin_users for select to authenticated
  using (user_id = (select auth.uid()));

revoke all on table public.products from anon, authenticated;
grant select on table public.products to anon, authenticated;
grant insert, update, delete on table public.products to authenticated;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
  on public.products for select to anon
  using (is_active = true);

drop policy if exists "Signed-in visitors can read active products and admins can read all" on public.products;
create policy "Signed-in visitors can read active products and admins can read all"
  on public.products for select to authenticated
  using (is_active = true or (select public.is_whamsy_admin()));

drop policy if exists "Admins can add products" on public.products;
create policy "Admins can add products"
  on public.products for insert to authenticated
  with check ((select public.is_whamsy_admin()));

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
  on public.products for update to authenticated
  using ((select public.is_whamsy_admin()))
  with check ((select public.is_whamsy_admin()));

drop policy if exists "Admins can remove products" on public.products;
create policy "Admins can remove products"
  on public.products for delete to authenticated
  using ((select public.is_whamsy_admin()));

insert into storage.buckets (id, name, public)
values ('whamsy-products', 'whamsy-products', true)
on conflict (id) do nothing;

drop policy if exists "Public can view WHAMSY product images" on storage.objects;
create policy "Public can view WHAMSY product images"
  on storage.objects for select to anon, authenticated
  using (bucket_id = 'whamsy-products');

drop policy if exists "Admins can upload WHAMSY product images" on storage.objects;
create policy "Admins can upload WHAMSY product images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'whamsy-products' and (select public.is_whamsy_admin()));

drop policy if exists "Admins can replace WHAMSY product images" on storage.objects;
create policy "Admins can replace WHAMSY product images"
  on storage.objects for update to authenticated
  using (bucket_id = 'whamsy-products' and (select public.is_whamsy_admin()))
  with check (bucket_id = 'whamsy-products' and (select public.is_whamsy_admin()));

drop policy if exists "Admins can delete WHAMSY product images" on storage.objects;
create policy "Admins can delete WHAMSY product images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'whamsy-products' and (select public.is_whamsy_admin()));

-- These are only the concepts from the supplied brief. They start hidden from shoppers.
insert into public.products
  (slug, name, category, description, price_ksh, show_price, image_url, materials, dimensions, care_instructions, availability, is_active, is_featured, sort_order)
values
  ('classic-cloud', 'Classic Cloud Pillow', 'REST', 'A calm everyday pillow concept in soft ivory.', 2499, true, 'assets/product-cloud.jpg', '', '', '', 'in_stock', false, false, 10),
  ('sage-cushion', 'Sage Cushion', 'HOME', 'A gentle green accent for a favourite corner.', 2199, true, 'assets/product-sage.jpg', '', '', '', 'in_stock', false, false, 20),
  ('pixel-buddy', 'Pixel Buddy', 'PLAY', 'An original playful character pillow concept.', 2899, true, 'assets/collection-play.jpg', '', '', '', 'in_stock', false, true, 30),
  ('star-dream', 'Star Dream Pillow', 'DREAMS', 'A playful star-shaped idea for dreamy spaces.', 1999, true, 'assets/product-star.jpg', '', '', '', 'in_stock', false, false, 40),
  ('royal-cloud', 'Royal Cloud Pillow', 'DREAMS', 'A little cloud character with a golden crown.', 2799, true, 'assets/product-royal.jpg', '', '', '', 'in_stock', false, false, 50),
  ('cloud-rest', 'Cloud Rest Pillow', 'REST', 'A soft, simple sleeping-pillow concept.', 2399, true, 'assets/collection-rest.jpg', '', '', '', 'in_stock', false, false, 60),
  ('layered-home', 'Layered Home Cushion', 'HOME', 'A mix-and-match cushion styling concept.', 2299, true, 'assets/collection-home.jpg', '', '', '', 'in_stock', false, false, 70),
  ('moon-dream', 'Moon Dream Pillow', 'DREAMS', 'A celestial shape concept for a softer room.', 2599, true, 'assets/collection-dreams.jpg', '', '', '', 'in_stock', false, false, 80)
on conflict (slug) do nothing;
