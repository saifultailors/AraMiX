'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const SIZE_ORDER = ['S', 'M', 'L', 'XL'];
const SIZE_CHARTS = {
  S: { length: 40, body: 38, sleeve: 23, neck: 15, shoulder: 17 },
  M: { length: 42, body: 40, sleeve: 24, neck: 15.5, shoulder: 18 },
  L: { length: 44, body: 42, sleeve: 25, neck: 16, shoulder: 19 },
  XL: { length: 46, body: 44, sleeve: 26, neck: 16.5, shoulder: 20 },
};
const LABELS = { length: 'লম্বা', body: 'বডি', sleeve: 'হাতের লম্বা', neck: 'গলা', shoulder: 'সোল্ডার' };
const hasOffer = (p) => p.offer_price != null && Number(p.offer_price) < Number(p.price);
const STEP = 0.5;
const LIMIT = 1;

export default function ProductPage() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [status, setStatus] = useState('loading'); // loading | ready | notfound | error

  useEffect(() => {
    let active = true;
    (async () => {
      const { data, error } = await supabase.from('products').select('*').eq('id', id).maybeSingle();
      if (!active) return;
      if (error) return setStatus('error');
      if (!data) return setStatus('notfound');
      setProduct(data);
      setStatus('ready');
    })();
    return () => {
      active = false;
    };
  }, [id]);

  if (status === 'loading') return <p className="text-center text-gray-500 py-20">লোড হচ্ছে...</p>;
  if (status === 'error') return <p className="text-center text-red-600 py-20">পণ্য লোড করা যায়নি। আবার চেষ্টা করুন।</p>;
  if (status === 'notfound') return <p className="text-center text-gray-500 py-20">এই পণ্যটি পাওয়া যায়নি।</p>;
  return <ProductDetail product={product} />;
}

function ProductDetail({ product }) {
  const colors = product.colors || []; // [{ name, image }]
  const images = product.images || []; // ডিজাইনের ছবি
  const sizes = SIZE_ORDER.filter((s) => (product.sizes || []).includes(s));

  const [colorIdx, setColorIdx] = useState(0);
  const [imgIdx, setImgIdx] = useState(0);
  const [showColor, setShowColor] = useState(false); // কালার বাছলে বড় ছবিতে সেই কালারের ছবি দেখাবে
  const [selectedSize, setSelectedSize] = useState(sizes[0]);
  const [isCustom, setIsCustom] = useState(false);
  const [customMeasurements, setCustomMeasurements] = useState(SIZE_CHARTS[sizes[0]]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [draft, setDraft] = useState(SIZE_CHARTS[sizes[0]]);
  const [orderMessage, setOrderMessage] = useState('');

  const color = colors[colorIdx]; // কালার না থাকলে undefined
  const mainImage = showColor && color ? color.image : images[imgIdx];
  const baseChart = SIZE_CHARTS[selectedSize];
  const measurements = isCustom ? customMeasurements : baseChart;

  const handleColorSelect = (idx) => {
    setColorIdx(idx);
    setShowColor(true);
    setOrderMessage('');
  };
  const nextImage = () => {
    if (!images.length) return;
    if (showColor) return setShowColor(false);
    setImgIdx((p) => (p + 1) % images.length);
  };
  const prevImage = () => {
    if (!images.length) return;
    if (showColor) return setShowColor(false);
    setImgIdx((p) => (p - 1 + images.length) % images.length);
  };

  const handleSizeSelect = (size) => {
    setSelectedSize(size);
    setIsCustom(false);
    setCustomMeasurements(SIZE_CHARTS[size]);
    setOrderMessage('');
  };

  const openModal = () => {
    setDraft({ ...measurements });
    setIsModalOpen(true);
  };
  const minOf = (key) => baseChart[key] - LIMIT;
  const maxOf = (key) => baseChart[key] + LIMIT;

  const handleCustomChange = (key, action) => {
    setDraft((prev) => {
      const next = action === 'inc' ? prev[key] + STEP : prev[key] - STEP;
      if (next > maxOf(key) || next < minOf(key)) return prev;
      return { ...prev, [key]: next };
    });
  };

  const handleSaveCustom = () => {
    const changed = Object.keys(baseChart).some((k) => draft[k] !== baseChart[k]);
    setCustomMeasurements(draft);
    setIsCustom(changed);
    setIsModalOpen(false);
    setOrderMessage('');
  };

  const handleOrder = () => {
    const orderPayload = {
      productId: product.id,
      productName: product.name,
      modelNo: product.model_no,
      color: color?.name || null,
      sizeType: isCustom ? `Custom (${selectedSize} ভিত্তিক)` : selectedSize,
      measurements,
      regularPrice: product.price,
      price: hasOffer(product) ? product.offer_price : product.price,
    };
    console.log('Order Data:', orderPayload); // TODO: orders টেবিলে সেভ করা
    setOrderMessage(isCustom ? 'আপনার কাস্টম মাপসহ অর্ডার সেভ হয়েছে!' : `সাইজ ${selectedSize} সহ অর্ডার সেভ হয়েছে!`);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 md:flex gap-8 bg-white rounded-xl shadow-md my-6">
      <div className="md:w-1/2 flex flex-col items-center">
        <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
          {mainImage ? (
            <img
              src={mainImage}
              alt={showColor && color ? `${product.name} - ${color.name}` : product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <p className="text-gray-400 text-sm">ছবি নেই</p>
          )}
          {images.length > 1 && (
            <>
              <button onClick={prevImage} aria-label="আগের ছবি" className="absolute left-2 bg-black/50 text-white p-2 rounded-full">❮</button>
              <button onClick={nextImage} aria-label="পরের ছবি" className="absolute right-2 bg-black/50 text-white p-2 rounded-full">❯</button>
            </>
          )}
        </div>
        <div className="flex gap-2 mt-4 flex-wrap justify-center">
          {images.map((img, idx) => (
            <img
              key={img}
              src={img}
              alt={`ছবি ${idx + 1}`}
              onClick={() => {
                setImgIdx(idx);
                setShowColor(false);
              }}
              className={`w-16 h-16 object-cover rounded-md cursor-pointer border-2 ${!showColor && imgIdx === idx ? 'border-amber-700 scale-105' : 'border-transparent'}`}
            />
          ))}
        </div>
      </div>

      <div className="md:w-1/2 flex flex-col justify-between mt-6 md:mt-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            মডেল নাম্বার: <span className="font-semibold text-gray-700">{product.model_no}</span>
          </p>
          <div className="mt-2 flex items-baseline gap-3 flex-wrap">
            {hasOffer(product) ? (
              <>
                <span className="text-2xl font-bold text-amber-600">৳ {Number(product.offer_price).toLocaleString('bn-BD')}</span>
                <span className="text-base text-gray-400 line-through">৳ {Number(product.price).toLocaleString('bn-BD')}</span>
                <span className="text-xs font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  {Math.round((1 - product.offer_price / product.price) * 100)}% ছাড়
                </span>
              </>
            ) : (
              <span className="text-2xl font-bold text-amber-600">৳ {Number(product.price).toLocaleString('bn-BD')}</span>
            )}
          </div>
          <hr className="my-4" />

          {colors.length > 0 && (
            <div className="mb-4">
              কালার: <span className="font-semibold">{color.name}</span>
              <div className="flex gap-3 mt-2 flex-wrap">
                {colors.map((col, idx) => (
                  <button key={col.name} onClick={() => handleColorSelect(idx)} aria-label={col.name} className="flex flex-col items-center gap-1">
                    <img
                      src={col.image}
                      alt=""
                      className={`w-14 h-14 object-cover rounded-lg border-2 ${colorIdx === idx ? 'border-black ring-2 ring-amber-500' : 'border-gray-300'}`}
                    />
                    <span className="text-xs text-gray-700">{col.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sizes.length > 0 && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700">সাইজ নির্বাচন করুন:</span>
                {product.allow_custom && (
                  <button onClick={openModal} className="text-xs bg-amber-600 text-white px-3 py-1 rounded-md shadow hover:bg-amber-700">
                    কাস্টম সাইজ (Custom)
                  </button>
                )}
              </div>
              <div className="flex gap-3">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeSelect(size)}
                    className={`w-12 h-12 rounded-lg font-bold border transition ${selectedSize === size && !isCustom ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {baseChart && (
            <div className="bg-gray-50 p-3 rounded-lg border text-sm text-gray-600">
              <p className="font-semibold text-gray-800 mb-1">
                {isCustom ? `কাস্টম মাপ (${selectedSize} ভিত্তিক):` : `নির্বাচিত সাইজের পরিমাপ (${selectedSize}):`}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(LABELS).map((key) => (
                  <p key={key} className={measurements[key] !== baseChart[key] ? 'text-amber-700 font-semibold' : ''}>
                    {LABELS[key]}: {measurements[key]} ইঞ্চি
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <button onClick={handleOrder} className="mt-6 w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700">
            অর্ডার কনফার্ম করুন
          </button>
          {orderMessage && <p role="status" className="mt-3 text-center text-sm font-medium text-emerald-700">{orderMessage}</p>}
        </div>
      </div>

      {isModalOpen && baseChart && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div role="dialog" aria-modal="true" className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-800 mb-2">কাস্টম সাইজ মডিফিকেশন</h3>
            <p className="text-xs text-gray-500 mb-4">
              প্রতি ক্লিকে আধা ইঞ্চি করে বাড়াতে বা কমাতে পারবেন। সাইজ {selectedSize}-এর মাপ থেকে সর্বোচ্চ ১ ইঞ্চি বেশি বা কম করা যাবে।
            </p>
            <div className="space-y-3">
              {Object.keys(LABELS).map((key) => (
                <div key={key} className="bg-gray-50 p-2.5 rounded-lg border">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">{LABELS[key]}:</span>
                    <div className="flex items-center gap-3">
                      <button onClick={() => handleCustomChange(key, 'dec')} disabled={draft[key] <= minOf(key)} aria-label={`${LABELS[key]} কমান`} className="w-8 h-8 bg-gray-200 rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed">-</button>
                      <span className="font-bold w-14 text-center">{draft[key]}"</span>
                      <button onClick={() => handleCustomChange(key, 'inc')} disabled={draft[key] >= maxOf(key)} aria-label={`${LABELS[key]} বাড়ান`} className="w-8 h-8 bg-gray-200 rounded font-bold disabled:opacity-30 disabled:cursor-not-allowed">+</button>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">সর্বনিম্ন {minOf(key)}" – সর্বোচ্চ {maxOf(key)}"</p>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-200 py-2.5 rounded-xl">বাতিল</button>
              <button onClick={handleSaveCustom} className="flex-1 bg-amber-600 text-white py-2.5 rounded-xl">সেভ করুন</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
