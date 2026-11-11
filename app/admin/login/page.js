'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();

    setLoading(true);
    setError('');

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (error) throw error;

      if (
        data.user.id !== process.env.NEXT_PUBLIC_ADMIN_UID
      ) {
        await supabase.auth.signOut();
        throw new Error('আপনার Admin অনুমতি নেই।');
      }

      router.replace('/admin');

    } catch (err) {
      setError(err.message || 'লগইন করা যায়নি।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">

      <form
        onSubmit={handleLogin}
        className="bg-white p-7 rounded-2xl shadow-lg w-full max-w-md space-y-5"
      >
        <h1 className="text-2xl font-bold text-center">
          Admin Login
        </h1>

        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border p-3 rounded-lg"
          required
        />

        {error && (
          <p className="text-red-600 text-sm">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-emerald-600 text-white p-3 rounded-lg font-bold"
        >
          {loading ? 'লগইন হচ্ছে...' : 'লগইন করুন'}
        </button>

      </form>
    </div>
  );
}
