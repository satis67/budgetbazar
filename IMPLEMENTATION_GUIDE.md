# Budget Bazar - Implementation & Setup Guide

## Phase 1: Database Setup (Critical Path)

### Step 1.1: Create Supabase Schema

Create these tables in your Supabase project:

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller', 'admin')),
  balance DECIMAL DEFAULT 50000,
  points INTEGER DEFAULT 0,
  onboarded BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL NOT NULL,
  original_price DECIMAL NOT NULL,
  category TEXT NOT NULL,
  sub_category TEXT,
  rating DECIMAL,
  reviews INTEGER DEFAULT 0,
  description TEXT,
  image TEXT,
  images TEXT[],
  seller_id TEXT NOT NULL,
  seller_name TEXT,
  specs JSONB,
  stock INTEGER DEFAULT 0,
  sold INTEGER DEFAULT 0,
  badge TEXT,
  tags TEXT[],
  delivery_days INTEGER DEFAULT 3,
  free_delivery BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  total DECIMAL NOT NULL,
  status TEXT DEFAULT 'placed' CHECK (status IN ('placed', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  delivery_date DATE,
  shipping_address JSONB
);

-- Auctions table
CREATE TABLE auctions (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  product_name TEXT,
  product_image TEXT,
  start_price DECIMAL NOT NULL,
  current_bid DECIMAL NOT NULL,
  lead_bidder_id UUID,
  ends_at BIGINT,
  bids INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Auction bids table (for history)
CREATE TABLE auction_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id TEXT NOT NULL REFERENCES auctions(id),
  bidder_id UUID NOT NULL REFERENCES users(id),
  bid_amount DECIMAL NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sellers table
CREATE TABLE sellers (
  id TEXT PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id),
  name TEXT NOT NULL,
  rating DECIMAL DEFAULT 4.5,
  total_sales INTEGER DEFAULT 0,
  joined_at DATE DEFAULT CURRENT_DATE,
  level TEXT DEFAULT 'Bronze' CHECK (level IN ('Bronze', 'Silver', 'Gold', 'Platinum')),
  products INTEGER DEFAULT 0,
  revenue DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Wishlist table
CREATE TABLE wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Create indexes for common queries
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_seller_id ON products(seller_id);
CREATE INDEX idx_auctions_status ON auctions(status);
CREATE INDEX idx_wishlist_user_id ON wishlist(user_id);
```

### Step 1.2: Enable Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can see own data"
ON users FOR SELECT
USING (auth.uid() = id);

-- Orders RLS
CREATE POLICY "Users can see own orders"
ON orders FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders"
ON orders FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Wishlist RLS
CREATE POLICY "Users can see own wishlist"
ON wishlist FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own wishlist"
ON wishlist FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist"
ON wishlist FOR DELETE
USING (auth.uid() = user_id);
```

---

## Phase 2: API Implementation

### Step 2.1: Update `/api/products/route.ts`

Replace mock data with real database query:

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 20;
    const offset = (page - 1) * limit;

    let query = supabase.from('products').select('*');

    if (category && category !== 'All') {
      query = query.eq('category', category);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,tags.cs.{${search}}`);
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({
      products: data,
      total: count,
      page,
      pageSize: limit,
      totalPages: Math.ceil((count || 0) / limit)
    });
  } catch (error: any) {
    console.error('Products API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 2.2: Create `/api/orders/create/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { items, total, userId, shippingAddress } = await request.json();

    // Get the current user
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create order in database
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: session.user.id,
        items: items,
        total: total,
        status: 'placed',
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ order });
  } catch (error: any) {
    console.error('Orders API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 2.3: Create `/api/orders/verify/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = await request.json();

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      );
    }

    // Update order status
    const { data, error } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        razorpay_order_id,
        razorpay_payment_id,
      })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    console.error('Verification Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 2.4: Create `/api/auctions/subscribe/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
  try {
    const { auctionId, bidAmount } = await request.json();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check current bid
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('current_bid')
      .eq('id', auctionId)
      .single();

    if (auctionError) throw auctionError;

    if (bidAmount <= auction.current_bid) {
      return NextResponse.json(
        { error: 'Bid must be higher than current bid' },
        { status: 400 }
      );
    }

    // Place bid
    const { error: bidError } = await supabase
      .from('auction_bids')
      .insert({
        auction_id: auctionId,
        bidder_id: session.user.id,
        bid_amount: bidAmount,
      });

    if (bidError) throw bidError;

    // Update auction current bid
    const { data: updatedAuction, error: updateError } = await supabase
      .from('auctions')
      .update({
        current_bid: bidAmount,
        lead_bidder_id: session.user.id,
        bids: auction.bids + 1,
      })
      .eq('id', auctionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({ auction: updatedAuction });
  } catch (error: any) {
    console.error('Auction Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

---

## Phase 3: Frontend Integration


### Step 3.1: Update `lib/store.tsx` to use Supabase cloud sync

> **Note:** As of v2.0, all state (cart, wishlist, compare, user) is cloud-synced with Supabase for logged-in users. Guests use localStorage fallback. This enables seamless experience across devices and real-time updates.

```typescript
// Example: Add to cart (cloud sync)
const addToCart = async (item: CartItem) => {
  setState(prev => { /* ...update local state... */ });
  if (supabase && state.user) {
    await supabase.from('users').update({ cart: /* new cart array */ }).eq('id', state.user.id);
  }
};
// Similar logic for wishlist, compare, and user profile
```

### Step 3.2: Create `hooks/useProducts.ts`

```typescript
import { useState, useEffect } from 'react';
import { Product } from '@/lib/types';

export function useProducts(category?: string, search?: string, page?: number) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        if (category && category !== 'All') params.append('category', category);
        if (search) params.append('search', search);
        if (page) params.append('page', String(page));

        const response = await fetch(`/api/products?${params}`);
        const data = await response.json();

        if (!response.ok) throw new Error(data.error);

        setProducts(data.products);
        setTotal(data.total);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, [category, search, page]);

  return { products, loading, error, total };
}
```

### Step 3.3: Update `CheckoutButton.tsx` for payment verification

```typescript
const handlePayment = async () => {
  setLoading(true);
  try {
    // 1. Create order
    const orderResponse = await fetch('/api/orders/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        items: cart, 
        total: cartTotal,
        shippingAddress: {} // Add from user input
      }),
    });
    
    const order = await orderResponse.json();

    // 2. Create Razorpay order
    const razorpayResponse = await fetch('/api/checkout/razorpay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, productId }),
    });
    
    const razorpayOrder = await razorpayResponse.json();

    // 3. Open Razorpay
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      order_id: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: "INR",
      name: "Budget Bazar",
      handler: async (response: any) => {
        // 4. Verify payment
        const verifyResponse = await fetch('/api/orders/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: order.order.id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });

        const verified = await verifyResponse.json();
        if (verified.success) {
          alert('Payment successful! Order confirmed.');
          // Clear cart and redirect
          router.push(`/order/${order.order.id}`);
        }
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (error) {
    console.error("Payment failed", error);
    alert("Payment failed. Please try again.");
  } finally {
    setLoading(false);
  }
};
```

---

## Phase 4: Authentication & User Profile

### Step 4.1: Update AuthContext to sync user data

```typescript
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      // Create or update in Supabase
      const { data: existingUser } = await supabase
        .from('users')
        .select('*')
        .eq('id', firebaseUser.uid)
        .single();

      if (!existingUser) {
        // Create new user
        await supabase.from('users').insert({
          id: firebaseUser.uid,
          email: firebaseUser.email,
          name: firebaseUser.displayName,
          avatar_url: firebaseUser.photoURL,
        });
      }
    }
    setUser(firebaseUser);
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
```

### Step 4.2: Create `/app/profile/page.tsx`

```typescript
'use client';
import { useAuth } from '@/context/AuthContext';
import { useStore } from '@/lib/store';
import { useState } from 'react';

export default function ProfilePage() {
  const { user } = useAuth();
  const { user: storeUser, setUser } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: user?.phoneNumber || '',
  });

  const handleUpdate = async () => {
    // Update user profile
    // Call API to save
    setIsEditing(false);
  };

  return (
    <div className="page">
      <div className="container" style={{ paddingTop: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '2rem' }}>👤 My Profile</h1>
        
        <div className="card p-4">
          {/* Profile section with edit button */}
          {/* Orders section */}
          {/* Wishlist section */}
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 5: Real-time Features

### Step 5.1: Update auction subscription in `lib/supabase.ts`

```typescript
export const subscribeToAuction = (auctionId: string, callback: (payload: any) => void) => {
  if (!supabase) return { unsubscribe: () => {} };
  
  return supabase
    .channel(`auction:${auctionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'auctions',
        filter: `id=eq.${auctionId}`
      },
      callback
    )
    .subscribe();
};

// Also subscribe to new bids
export const subscribeToBids = (auctionId: string, callback: (payload: any) => void) => {
  if (!supabase) return { unsubscribe: () => {} };
  
  return supabase
    .channel(`bids:${auctionId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'auction_bids',
        filter: `auction_id=eq.${auctionId}`
      },
      callback
    )
    .subscribe();
};
```

### Step 5.2: Update auction page to use subscriptions

```typescript
'use client';
import { useEffect, useState } from 'react';
import { subscribeToAuction, subscribeToBids } from '@/lib/supabase';

export default function AuctionPage() {
  const [auction, setAuction] = useState(null);

  useEffect(() => {
    // Subscribe to auction updates
    const auctionSub = subscribeToAuction('AUCTION_ID', (payload) => {
      setAuction(payload.new);
    });

    // Subscribe to new bids
    const bidsSub = subscribeToBids('AUCTION_ID', (payload) => {
      // Update UI with new bid
    });

    return () => {
      auctionSub.unsubscribe();
      bidsSub.unsubscribe();
    };
  }, []);

  // Render auction details
}
```

---

## Environment Variables Checklist

Update `.env.local.example`:

```bash
# AI Chat (Optional - works with mock data if not provided)
GROQ_API_KEY=your_groq_api_key

# Supabase (Required for real database)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Firebase (Required for authentication)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Razorpay (Required for payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

---

## Testing Checklist

- [ ] All API endpoints return real data
- [ ] Supabase queries work correctly
- [ ] Payment flow completes end-to-end
- [ ] Real-time auction updates work
- [ ] User authentication syncs to database
- [ ] Orders persist to database
- [ ] Wishlist management works
- [ ] Cart reflects user data

---

## Deployment Checklist

1. [ ] Remove all API keys from version control
2. [ ] Set environment variables in deployment platform
3. [ ] Test Razorpay webhook in production
4. [ ] Enable HTTPS everywhere
5. [ ] Set up database backups
6. [ ] Configure CORS properly
7. [ ] Set up monitoring and logging
8. [ ] Test payment flow end-to-end
9. [ ] Verify auth flow in production
10. [ ] Load testing

---

## Support & Troubleshooting

### Supabase Connection Issues
```typescript
// Test connection
const { data, error } = await supabase.from('users').select('*').limit(1);
if (error) console.error('Connection failed:', error);
```

### Payment Webhook Not Triggering
- Verify webhook URL in Razorpay dashboard
- Check firewall/security group settings
- Test with Razorpay's test keys first

### Real-time Not Working
- Verify RLS policies are correct
- Check Supabase logs for errors
- Ensure subscription is actively listening

### Firebase Auth Issues
- Verify Firebase credentials are correct
- Check that Firestore is initialized
- Ensure reCAPTCHA is configured for phone auth
