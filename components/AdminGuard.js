'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AdminGuard({ children }) {
  const router = useRouter();
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;

    const adminId = process.env.NEXT_PUBLIC_ADMIN_UID;

    const checkUser = async () => {
      const { data, error } = await supabase.auth.getUser();

      if (!mounted) return;

      if (
        error ||
        !data.user ||
        data.user.id !== adminId
      ) {
        router.replace('/admin/login');
      } else {
        setAllowed(true);
        setChecking(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      checkUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking || !allowed) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Admin যাচাই করা হচ্ছে...
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end p-3">
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            router.replace('/admin/login');
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Logout
        </button>
      </div>

      {children}
    </>
  );
}
