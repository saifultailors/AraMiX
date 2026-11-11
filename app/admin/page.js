'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const BUCKET = 'product-images';
const SIZE_LIST = ['S', 'M', 'L', 'XL'];

let uid = 0;
const newColor = () => ({ id: ++uid, name: '', file: null, preview: '' });

async function uploadFile(file, folder) {
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000',
    contentType: file.type,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

export default function AddProductAdmin() {
  const [productName, setProductName] = useState('');
  const [modelNo, setModelNo] = useState('');
  const [regularPrice, setRegularPrice] = useState('');
  const [offerPrice, setOfferPrice] = useState('');
  const [designs, setDesigns] = useState([]); // [{ file, preview }] ডিজাইনের ছবি
  const [colors, setColors] = useState(() => [newColor()]); // প্রতিটি কালারে নাম + একটি ছবি
  const [availableSizes, setAvailableSizes] = useState({ S: true, M: true, L: true, XL: true });
  const [allowCustom, setAllowCustom] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'ok' | 'error', text, id? }

  // ---- ডিজাইনের ছবি ----
  const addDesigns = (fileList) => {
    const added = Array.from(fileList).map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setDesigns((prev) => [...prev, ...added]);
  };
  const removeDesign = (index) => {
    setDesigns((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ---- কালার ----
  const updateColor = (id, patch) => setColors((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const addColor = () => setColors((prev) => [...prev, newColor()]);
  const removeColor = (id) => {
    setColors((prev) => {
      const target = prev.find((c) => c.id === id);
      if (target?.preview) URL.revokeObjectURL(target.preview);
      return prev.filter((c) => c.id !== id);
    });
  };
  const setColorPhoto = (id, file) => {
    if (!file) return;
    setColors((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        if (c.preview) URL.revokeObjectURL(c.preview);
        return { ...c, file, preview: URL.createObjectURL(file) };
      })
    );
  };

  const handleSizeToggle = (size) => setAvailableSizes((prev) => ({ ...prev, [size]: !prev[size] }));

  const validate = () => {
    const regular = parseFloat(regularPrice);
    if (!(regular > 0)) return 'সঠিক রেগুলার প্রাইস দিন।';
    if (offerPrice !== '') {
      const offer = parseFloat(offerPrice);
      if (!(offer > 0) || offer >= regular) return 'অফার প্রাইস রেগুলার প্রাইসের চেয়ে কম হতে হবে।';
    }
    if (designs.length === 0) return 'কমপক্ষে একটি ডিজাইনের ছবি দিন।';
    const names = colors.map((c) => c.name.trim().toLowerCase());
    if (names.some((n) => !n)) return 'প্রতিটি কালারের নাম দিন।';
    if (new Set(names).size !== names.length) return 'একই নামে দুটি কালার দেওয়া যাবে না।';
    const noPhoto = colors.find((c) => !c.file);
    if (noPhoto) return `"${noPhoto.name}" কালারের একটি ছবি দিন।`;
    if (!SIZE_LIST.some((s) => availableSizes[s])) return 'কমপক্ষে একটি সাইজ টিক দিন।';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) return setMessage({ type: 'error', text: problem });

    setLoading(true);
    setMessage(null);
    try {
      const folder = `products/${Date.now()}`;
      const [designUrls, colorsWithUrls] = await Promise.all([
        Promise.all(designs.map((d) => uploadFile(d.file, folder))),
        Promise.all(
          colors.map(async (c) => ({ name: c.name.trim(), image: await uploadFile(c.file, folder) }))
        ),
      ]);

      const { data, error } = await supabase
        .from('products')
        .insert({
          name: productName.trim(),
          model_no: modelNo.trim(),
          price: parseFloat(regularPrice),
          offer_price: offerPrice === '' ? null : parseFloat(offerPrice),
          images: designUrls,
          colors: colorsWithUrls,
          sizes: SIZE_LIST.filter((s) => availableSizes[s]),
          allow_custom: allowCustom,
        })
        .select('id')
        .single();
      if (error) throw error;

      designs.forEach((d) => URL.revokeObjectURL(d.preview));
      colors.forEach((c) => c.preview && URL.revokeObjectURL(c.preview));
      setProductName('');
      setModelNo('');
      setRegularPrice('');
      setOfferPrice('');
      setDesigns([]);
      setColors([newColor()]);
      setMessage({ type: 'ok', text: 'প্রোডাক্ট সফলভাবে পাবলিশ হয়েছে!', id: data.id });
    } catch (err) {
      console.error(err);
     setMessage({\n        type: 'error',\n        text: `আপলোড করা যায়নি। কারণ: ${err?.message || err?.error_description || 'অজানা সমস্যা'}`,\n      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-2xl shadow-lg my-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-3">নতুন পোশাক অ্যাড করুন (অ্যাডমিন প্যানেল)</h2>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">পোশাকের ডিজাইনের ছবি (৩-৪টি)</label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => {
              addDesigns(e.target.files);
              e.target.value = '';
            }}
            className="w-full border p-2 rounded-lg text-sm"
          />
          {designs.length > 0 && (
            <div className="flex gap-2 mt-2 flex-wrap">
              {designs.map((d, idx) => (
                <div key={d.preview} className="relative">
                  <img src={d.preview} alt="" className="w-16 h-16 object-cover rounded-md border" />
                  <button type="button" onClick={() => removeDesign(idx)} aria-label="ছবি সরান" className="absolute -top-2 -right-2 bg-black text-white w-5 h-5 rounded-full text-xs">×</button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">পোশাকের নাম</label>
            <input type="text" value={productName} onChange={(e) => setProductName(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">মডেল নম্বর</label>
            <input type="text" value={modelNo} onChange={(e) => setModelNo(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none" required />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">রেগুলার প্রাইস (টাকা)</label>
            <input type="number" min="1" value={regularPrice} onChange={(e) => setRegularPrice(e.target.value)} className="w-full border p-2.5 rounded-lg outline-none" required />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">অফার প্রাইস (ঐচ্ছিক)</label>
            <input type="number" min="1" value={offerPrice} onChange={(e) => setOfferPrice(e.target.value)} placeholder="অফার না থাকলে খালি রাখুন" className="w-full border p-2.5 rounded-lg outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">কালারের নাম ও সেই কালারের একটি ছবি</label>
          {colors.map((color) => (
            <div key={color.id} className="border rounded-xl p-3 mb-3 bg-gray-50">
              <div className="flex gap-2 items-center">
                <input type="text" placeholder="কালারের নাম (যেমন: কালো)" value={color.name} onChange={(e) => updateColor(color.id, { name: e.target.value })} className="flex-1 border p-2 rounded-lg text-sm bg-white" required />
                {colors.length > 1 && (
                  <button type="button" onClick={() => removeColor(color.id)} className="text-xs text-red-600 font-semibold px-2">মুছুন</button>
                )}
              </div>
              <div className="flex items-center gap-3 mt-3">
                <input type="file" accept="image/*" onChange={(e) => setColorPhoto(color.id, e.target.files[0])} className="flex-1 border p-2 rounded-lg text-sm bg-white" />
                {color.preview && <img src={color.preview} alt="" className="w-14 h-14 object-cover rounded-lg border" />}
              </div>
            </div>
          ))}
          <button type="button" onClick={addColor} className="text-xs text-amber-700 font-semibold mt-1">+ আরেকটি কালার যোগ করুন</button>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">এভেলেবেল সাইজগুলো টিক দিন</label>
          <div className="flex gap-4 flex-wrap">
            {SIZE_LIST.map((size) => (
              <label key={size} className="flex items-center gap-2 cursor-pointer bg-gray-50 px-4 py-2 rounded-lg border">
                <input type="checkbox" checked={availableSizes[size]} onChange={() => handleSizeToggle(size)} className="w-4 h-4 text-amber-600" />
                <span className="font-bold text-gray-800">{size}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-amber-50 p-4 rounded-xl border border-amber-200">
          <div>
            <h4 className="font-semibold text-gray-800 text-sm">কাস্টম সাইজ অপশন এলাউ করবেন?</h4>
            <p className="text-xs text-gray-500">গ্রাহক নির্বাচিত সাইজ থেকে সর্বোচ্চ ১ ইঞ্চি কম/বেশি (হাফ-ইঞ্চি ধাপে) মাপ বদলাতে পারবে কি না।</p>
          </div>
          <input type="checkbox" checked={allowCustom} onChange={(e) => setAllowCustom(e.target.checked)} className="w-6 h-6 text-amber-600 cursor-pointer" />
        </div>

        {message && (
          <div role="status" className={`p-3 rounded-lg text-sm font-medium ${message.type === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}>
            {message.text}
            {message.id && <a href={`/product/${message.id}`} className="ml-2 underline font-semibold">পণ্যটি দেখুন</a>}
          </div>
        )}

        <button type="submit" disabled={loading} className="w-full bg-emerald-600 text-white py-3 rounded-xl font-semibold shadow hover:bg-emerald-700 disabled:opacity-60">
          {loading ? 'আপলোড হচ্ছে...' : 'প্রোডাক্ট পাবলিশ করুন'}
        </button>
      </form>
    </div>
  );
}
