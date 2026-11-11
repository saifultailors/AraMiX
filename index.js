'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

const PAGE_SIZE = 8;
const hasOffer = (p) => p.offerPrice != null && Number(p.offerPrice) < Number(p.price);

async function getProducts(pageNum) {
  const from = (pageNum - 1) * PAGE_SIZE;
  const { data, error } = await supabase
    .from('products')
    .select('id, name, model_no, price, offer_price, images, colors')
    .order('id', { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  if (error) throw error;
  return {
    items: data.map((p) => ({
      id: p.id,
      name: p.name,
      modelNo: p.model_no,
      price: p.price,
      offerPrice: p.offer_price,
      colors: p.colors || [],
      image: p.images?.[0] || '', // প্রথম ডিজাইনের ছবি কভার হবে
    })),
    hasMore: data.length === PAGE_SIZE,
  };
}

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);

  const loaderRef = useRef(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);

  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMoreRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      const { items, hasMore: more } = await getProducts(pageRef.current);
      setProducts((prev) => {
        const seen = new Set(prev.map((p) => p.id));
        return [...prev, ...items.filter((p) => !seen.has(p.id))];
      });
      pageRef.current += 1;
      hasMoreRef.current = more;
      setHasMore(more);
    } catch (err) {
      console.error(err);
      setError('পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।');
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const node = loaderRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !error) loadMore();
      },
      { rootMargin: '300px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, error, hasMore, products.length]);

  return (
    <div className="max-w-6xl mx-auto p-4 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold text-gray-900 mb-8 mt-6">আমাদের কালেকশন</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/product/${product.id}`}
            className="flex flex-col bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition"
          >
            {product.image ? (
              <img src={product.image} alt={product.name} loading="lazy" className="w-full h-64 object-cover bg-gray-100" />
            ) : (
              <div className="w-full h-64 bg-gray-100" />
            )}
            <div className="p-4">
              <h2 className="text-sm font-semibold text-gray-800 line-clamp-2">{product.name}</h2>
              <p className="text-xs text-gray-500 mt-1">মডেল: {product.modelNo}</p>
              <div className="flex gap-1 mt-2">
                {product.colors.map((c) => (
                  <img key={c.name} src={c.image} alt={c.name} title={c.name} className="w-5 h-5 rounded-full border border-gray-300 object-cover" />
                ))}
              </div>
              <div className="mt-2 flex items-baseline gap-2 flex-wrap">
                {hasOffer(product) ? (
                  <>
                    <span className="text-lg font-bold text-amber-600">৳ {Number(product.offerPrice).toLocaleString('bn-BD')}</span>
                    <span className="text-xs text-gray-400 line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</span>
                  </>
                ) : (
                  <span className="text-lg font-bold text-amber-600">৳ {Number(product.price).toLocaleString('bn-BD')}</span>
                )}
              </div>
            </div>
          </Link>
        ))}
      </div>

      {error && (
        <div className="text-center py-10">
          <p className="text-red-600 font-medium mb-3">{error}</p>
          <button onClick={loadMore} className="px-5 py-2 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 transition">
            আবার চেষ্টা করুন
          </button>
        </div>
      )}
      {!error && hasMore && (
        <div ref={loaderRef} className="text-center py-10">
          <p className="text-gray-500 font-medium">{isLoading ? 'লোড হচ্ছে...' : ''}</p>
        </div>
      )}
      {!hasMore && products.length > 0 && <p className="text-center text-gray-400 py-10">সব পণ্য দেখানো হয়েছে</p>}
      {!hasMore && products.length === 0 && !isLoading && (
        <p className="text-center text-gray-500 py-20">এখনো কোনো পণ্য যোগ করা হয়নি।</p>
      )}
    </div>
  );
}
