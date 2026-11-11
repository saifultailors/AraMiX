-- Supabase > SQL Editor-এ এটি Run করুন (আগে চালিয়ে থাকলেও আবার চালানো যাবে)

create table if not exists products (
  id bigint generated always as identity primary key,
  name text not null,
  model_no text not null,
  price numeric not null,            -- রেগুলার প্রাইস
  offer_price numeric,               -- অফার প্রাইস (না থাকলে খালি)
  sizes text[] not null default '{S,M,L,XL}',
  allow_custom boolean not null default true,
  images text[] not null default '{}',        -- ডিজাইনের ছবি (৩-৪টি)
  -- [{ "name": "কালো", "image": "https://..." }]
  colors jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- আগের টেবিল থাকলে নতুন কলামগুলো যোগ হবে
alter table products add column if not exists offer_price numeric;
alter table products add column if not exists images text[] not null default '{}';

alter table products enable row level security;

drop policy if exists "products_read" on products;
create policy "products_read" on products for select using (true);

-- সতর্কতা: নিচের নিয়মে এখন যে কেউ পণ্য যোগ করতে পারবে।
-- অ্যাডমিন লগইন যুক্ত করার পর এটি শুধু "to authenticated" করে দিন।
drop policy if exists "products_insert" on products;
create policy "products_insert" on products for insert with check (true);

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

drop policy if exists "images_read" on storage.objects;
create policy "images_read" on storage.objects for select using (bucket_id = 'product-images');
drop policy if exists "images_insert" on storage.objects;
create policy "images_insert" on storage.objects for insert with check (bucket_id = 'product-images');
