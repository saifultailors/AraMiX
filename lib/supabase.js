import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.warn('Supabase এনভায়রনমেন্ট ভ্যারিয়েবল সেট করা নেই (.env.local বা Vercel Settings দেখুন)।');
}

// ভ্যারিয়েবল না থাকলেও বিল্ড যেন ভেঙে না যায়, তাই ডামি মান দেওয়া আছে
export const supabase = createClient(url || 'https://placeholder.supabase.co', key || 'placeholder-key');
