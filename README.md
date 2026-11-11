# aramixbd-shop

Next.js (App Router) + Tailwind CSS + Supabase

## পেজ
- `/` — হোম (কালেকশন, ইনফিনিট স্ক্রল)
- `/product/[id]` — পণ্যের বিবরণ
- `/admin` — নতুন পণ্য যোগ

## চালু করার ধাপ
1. Supabase → SQL Editor-এ `supabase-setup.sql` Run করুন।
2. `.env.example` কপি করে `.env.local` নাম দিন এবং Supabase URL ও anon key বসান।
3. `npm install` তারপর `npm run dev`।

## Vercel
- Framework Preset: Next.js
- Settings → Environment Variables-এ `NEXT_PUBLIC_SUPABASE_URL` ও `NEXT_PUBLIC_SUPABASE_ANON_KEY` যোগ করে Deploy করুন।

## সতর্কতা
`/admin` এখন সবার জন্য খোলা। পাবলিশ করার আগে লগইন যুক্ত করুন।
