'use client';
import { useState, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CATEGORIES } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import ProductCard from '../../components/ProductCard';

const SORT_OPTIONS = ['Relevance', 'Price: Low to High', 'Price: High to Low', 'Best Rating', 'Most Reviews'];
const PRICE_RANGES = [
  { label: 'Under ₹1,000', max: 1000 },
  { label: '₹1,000 – ₹10,000', min: 1000, max: 10000 },
  { label: '₹10,000 – ₹50,000', min: 10000, max: 50000 },
  { label: '₹50,000 – ₹1,50,000', min: 50000, max: 150000 },
  { label: 'Above ₹1,50,000', min: 150000 },
];

function MarketplaceContent() {
  const params = useSearchParams();
  const [search, setSearch] = useState(params.get('search') || '');
  const [category, setCategory] = useState(params.get('category') || 'All');
  const [sort, setSort] = useState('Relevance');
  const [priceRange, setPriceRange] = useState<any>(null);
  const [rating, setRating] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      let query = supabase.from('products').select('*');
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      if (category && category !== 'All') {
        query = query.eq('category', category);
      }
      // Add more filters as needed
      const { data, error } = await query;
      if (!error && data) {
        let list = data;
        if (priceRange) {
          list = list.filter((p: any) => {
            let match = true;
            if (priceRange.min && p.price < priceRange.min) match = false;
            if (priceRange.max && p.price > priceRange.max) match = false;
            return match;
          });
        }
        if (rating) {
          list = list.filter((p: any) => p.rating >= rating);
        }
        if (sort === 'Price: Low to High') list.sort((a, b) => a.price - b.price);
        else if (sort === 'Price: High to Low') list.sort((a, b) => b.price - a.price);
        else if (sort === 'Best Rating') list.sort((a, b) => b.rating - a.rating);
        else if (sort === 'Most Reviews') list.sort((a, b) => b.reviews - a.reviews);
        setProducts(list);
      } else {
        setProducts([]);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [search, category, sort, priceRange, rating]);

  return (
    <div className="min-h-screen bg-[#0f172a] text-white">
      <div className="container mx-auto px-4 py-8">

        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">Marketplace</h1>
            <p className="text-gray-400 text-sm font-medium">{products.length} Premium Products Found</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative group">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-indigo-400 transition-colors">🔍</span>
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Search products..." 
                className="w-full sm:w-64 bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>
            <select 
              value={sort} 
              onChange={e => setSort(e.target.value)} 
              className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer transition-all"
            >
              {SORT_OPTIONS.map(s => <option key={s} value={s} className="bg-[#1e293b]">{s}</option>)}
            </select>
          </div>
        </div>

        {/* Categories Scroller */}
        <div className="flex gap-3 overflow-x-auto pb-6 mb-8 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button 
              key={cat} 
              onClick={() => setCategory(cat)} 
              className={`px-6 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                category === cat 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' 
                : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Sidebar */}
          <aside className="w-full lg:w-72 sticky top-24 space-y-8">
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-6 rounded-3xl space-y-8">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5">Price Range</h3>
                <div className="space-y-2">
                  {PRICE_RANGES.map(r => (
                    <button 
                      key={r.label} 
                      onClick={() => setPriceRange(priceRange?.label === r.label ? null : r)}
                      className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        priceRange?.label === r.label 
                        ? 'bg-indigo-600/20 border border-indigo-500/50 text-indigo-400' 
                        : 'bg-white/5 border border-transparent text-gray-400 hover:border-white/10'
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-500 mb-5">Min Rating</h3>
                <div className="flex flex-wrap gap-2">
                  {[4, 3, 2].map(r => (
                    <button 
                      key={r} 
                      onClick={() => setRating(rating === r ? 0 : r)}
                      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        rating === r 
                        ? 'bg-yellow-500/20 border border-yellow-500/50 text-yellow-500' 
                        : 'bg-white/5 border border-transparent text-gray-400 hover:border-white/10'
                      }`}
                    >
                      {r}★ <span className="text-[10px] font-medium">& up</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Product Grid */}
          <main className="flex-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl mb-6">⏳</div>
                <h3 className="text-2xl font-bold text-white mb-2">Loading Products...</h3>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-3xl flex items-center justify-center text-4xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-white mb-2">No Products Found</h3>
                <p className="text-gray-500 max-w-sm">We couldn't find anything matching your current filters. Try adjusting them.</p>
                <button 
                  onClick={() => {setSearch(''); setCategory('All'); setPriceRange(null); setRating(0);}}
                  className="mt-8 text-indigo-400 font-bold hover:underline"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <MarketplaceContent />
    </Suspense>
  );
}
