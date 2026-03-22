'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { CartItem, User } from '../lib/types';
import { supabase } from './supabase';

interface StoreState {
  cart: CartItem[];
  user: User | null;
  wishlist: string[];
  compareList: string[];
  budget: number;
}
interface StoreCtx extends StoreState {
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, qty: number) => void;
  clearCart: () => void;
  toggleWishlist: (id: string) => void;
  toggleCompare: (id: string) => void;
  setUser: (u: User | null) => void;
  setBudget: (n: number) => void;
  cartTotal: number;
  cartCount: number;
}

const Ctx = createContext<StoreCtx | null>(null);

const INITIAL: StoreState = { cart: [], user: null, wishlist: [], compareList: [], budget: 50000 };

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(INITIAL);

  useEffect(() => {
    const loadCart = async (userId: string) => {
      if (!supabase) return;
      const { data, error } = await supabase
        .from('users')
        .select('cart')
        .eq('id', userId)
        .single();
      if (!error && data?.cart) {
        setState(prev => ({ ...prev, cart: data.cart }));
      }
    };

    const saved = localStorage.getItem('bb_store_v2');
    if (saved) try { setState(JSON.parse(saved)); } catch {}

    if (supabase) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
        if (session?.user) {
          // Fetch user data and cart from Supabase
          const { data: userData } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();
          if (userData) {
            setUser(userData);
            setState(prev => ({ ...prev, user: userData }));
            await loadCart(session.user.id);
          }
        } else {
          setUser(null);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  const addToCart = async (item: CartItem) => {
    setState(prev => {
      const existing = prev.cart.find(c => c.id === item.id);
      const cart = existing
        ? prev.cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c)
        : [...prev.cart, { ...item, qty: 1 }];
      const newState = { ...prev, cart };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    // Sync to Supabase if logged in
    if (supabase && state.user) {
      await supabase.from('users').update({ cart: [...state.cart, { ...item, qty: 1 }] }).eq('id', state.user.id);
    }
  };

  const removeFromCart = async (id: string) => {
    setState(prev => {
      const newState = { ...prev, cart: prev.cart.filter(c => c.id !== id) };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && state.user) {
      await supabase.from('users').update({ cart: state.cart.filter(c => c.id !== id) }).eq('id', state.user.id);
    }
  };

  const updateQty = async (id: string, qty: number) => {
    if (qty <= 0) return removeFromCart(id);
    setState(prev => {
      const newState = { ...prev, cart: prev.cart.map(c => c.id === id ? { ...c, qty } : c) };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && state.user) {
      await supabase.from('users').update({ cart: state.cart.map(c => c.id === id ? { ...c, qty } : c) }).eq('id', state.user.id);
    }
  };

  const clearCart = async () => {
    setState(prev => {
      const newState = { ...prev, cart: [] };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && state.user) {
      await supabase.from('users').update({ cart: [] }).eq('id', state.user.id);
    }
  };

  const toggleWishlist = async (id: string) => {
    setState(prev => {
      const wishlist = prev.wishlist.includes(id) 
        ? prev.wishlist.filter(w => w !== id) 
        : [...prev.wishlist, id];
      const newState = { ...prev, wishlist };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && state.user) {
      // Upsert wishlist in Supabase (wishlist is a separate table)
      if (state.wishlist.includes(id)) {
        // Remove from wishlist
        await supabase.from('wishlist').delete().match({ user_id: state.user.id, product_id: id });
      } else {
        // Add to wishlist
        await supabase.from('wishlist').insert({ user_id: state.user.id, product_id: id });
      }
    }
  };

  const toggleCompare = async (id: string) => {
    setState(prev => {
      let compareList = prev.compareList;
      if (prev.compareList.includes(id)) {
        compareList = prev.compareList.filter(c => c !== id);
      } else if (prev.compareList.length < 2) {
        compareList = [...prev.compareList, id];
      }
      const newState = { ...prev, compareList };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && state.user) {
      // Store compareList as a user column (array) in Supabase
      await supabase.from('users').update({ compare_list: state.compareList.includes(id)
        ? state.compareList.filter(c => c !== id)
        : [...state.compareList, id] }).eq('id', state.user.id);
    }
  };

  const setUser = async (user: User | null) => {
    setState(prev => {
      const newState = { ...prev, user };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
    if (supabase && user) {
      // Upsert user info in Supabase
      await supabase.from('users').upsert({
        id: user.id,
        email: user.email,
        name: user.name,
        avatar_url: user.avatar,
        role: user.role,
        balance: user.balance,
        points: user.points,
        onboarded: user.onboarded
      });
    }
  };

  const setBudget = (budget: number) => {
    setState(prev => {
      const newState = { ...prev, budget };
      localStorage.setItem('bb_store_v2', JSON.stringify(newState));
      return newState;
    });
  };

  const cartTotal = state.cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = state.cart.reduce((s, i) => s + i.qty, 0);

  return (
    <Ctx.Provider value={{ ...state, addToCart, removeFromCart, updateQty, clearCart, toggleWishlist, toggleCompare, setUser, setBudget, cartTotal, cartCount }}>
      {children}
    </Ctx.Provider>
  );
}

export const useStore = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore must be inside StoreProvider');
  return ctx;
};
