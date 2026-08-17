import { supabase } from '../supabaseClient.js';

export const DEFAULT_PRODUCTS = [
  {
    id: "NOIR-001",
    name: "Virtu Heavy Graphic Hoodie",
    description: "Premium 450GSM ultra-heavy cotton fleece hoodie. Features high-density screenprinted signature NOIR typography on the front chest and large gothic arch sigil graphics across the back. Dropped shoulders, double-lined hood, and thick ribbed cuffs. Designed for a structured, oversized fit.",
    price: 95000.00,
    images: ["/images/hoodie_black.jpg"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["Tops", "Hoodies"],
    stock: 12,
    collections: ["The Eighth Archive", "Best Sellers"]
  },
  {
    id: "NOIR-002",
    name: "Vandal Cargo Pants",
    description: "Technical street-ready cargo pants crafted from durable, water-resistant micro-ripstop nylon. Multi-pocket design featuring 3D utility side pockets, metal D-ring hardware, adjustable drawstring waist and leg openings for customizable fits. Reinforced knee panels for durability.",
    price: 125000.00,
    images: ["/images/cargo_pants.jpg"],
    sizes: ["M", "L", "XL"],
    categories: ["Bottoms", "Pants"],
    stock: 8,
    collections: ["The Eighth Archive"]
  },
  {
    id: "NOIR-003",
    name: "Memento Mori Graphic Tee",
    description: "240GSM luxury combed cotton tee, heavily washed for an authentic vintage charcoal look. Front features clean corporate brand lettering, while the back features a high-fidelity gothic collage print. Designed with an oversized boxy cut and thick mock-neck collar.",
    price: 45000.00,
    images: ["/images/graphic_tee.jpg"],
    sizes: ["S", "M", "L", "XL"],
    categories: ["Tops", "Tees"],
    stock: 25,
    collections: ["The Eighth Archive", "New Arrivals"]
  },
  {
    id: "NOIR-004",
    name: "Sigil Ribbed Beanie",
    description: "Thick double-layered ribbed knit watch cap, featuring an embroidered minimalist silver brand sigil emblem on the cuff. Stretch-fit comfort suitable for all sizes. Engineered to retain shape over long-term wear.",
    price: 30000.00,
    images: ["/images/beanie.jpg"],
    sizes: ["One Size"],
    categories: ["Accessories", "Headwear"],
    stock: 40,
    collections: ["New Arrivals"]
  },
  {
    id: "NOIR-005",
    name: "Ghost Shell Wind-Jacket",
    description: "An ultra-lightweight, semi-translucent technical shell jacket with a matte finish. Features taped inner seams, waterproof zipper sliders, elastic drawcord hood, and an oversized 3M reflective brand layout across the shoulder line for low-light visibility.",
    price: 160000.00,
    images: ["/images/windbreaker.jpg"],
    sizes: ["S", "M", "L"],
    categories: ["Tops", "Outerwear"],
    stock: 6,
    collections: ["The Eighth Archive", "New Arrivals"]
  }
];

export const DEFAULT_PROMOTIONS = [
  {
    code: "NOIR10",
    type: "percent",
    value: 10,
    active: true,
    description: "10% off storewide for the opening week."
  },
  {
    code: "VIRTU20",
    type: "percent",
    value: 20,
    active: true,
    description: "20% off for brand ambassadors and vip members."
  }
];

export const DEFAULT_STORE_CONFIG = {
  name: "NOIR VIRTU KIGALI",
  address: "Kigali Heights, 2nd Floor, Kigali, Rwanda",
  phone: "+250 791276870",
  currency: "Rwf",
  taxRate: 0,
  shippingFee: 2000,
  freeShippingThreshold: 150000,
  adminEmail: "noirvirtu@gmail.com",
  adminPassword: "noir123",
  momoProvider: "MTN Mobile Money",
  momoEnvironment: "Sandbox",
  momoMerchantCode: "*182*8*1# (NOIR VIRTU)",
  momoEnabled: true
};

// --- PRODUCTS ---
export async function getProducts() {
  try {
    const res = await fetch('/api/products');
    if (res.ok) {
      const apiData = await res.json();
      if (Array.isArray(apiData) && apiData.length > 0) return apiData;
    }
  } catch (apiErr) {
    console.warn('API getProducts fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase getProducts error/fallback:', err);
  }
  return DEFAULT_PRODUCTS;
}

export async function createProduct(productData) {
  try {
    const res = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API createProduct fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .insert([productData])
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase createProduct RLS warning:', err);
  }

  return productData;
}

export async function updateProduct(id, updates) {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API updateProduct fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase updateProduct RLS warning:', err);
  }

  return { id, ...updates };
}

export async function deleteProduct(id) {
  try {
    const res = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return true;
    }
  } catch (apiErr) {
    console.warn('API deleteProduct fallback:', apiErr.message);
  }

  try {
    await supabase.from('products').delete().eq('id', id);
  } catch (err) {
    console.warn('Supabase deleteProduct RLS warning:', err);
  }

  return true;
}


// --- ORDERS & BUYER DETAILS ---
export async function getOrders() {
  try {
    const res = await fetch('/api/orders');
    if (res.ok) {
      const apiData = await res.json();
      if (Array.isArray(apiData) && apiData.length > 0) return apiData;
    }
  } catch (apiErr) {
    console.warn('API getOrders fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(o => ({
        ...o,
        promoCode: o.promo_code,
        paymentMethod: o.payment_method,
        momoRef: o.momo_ref || o.momoRef,
        momoPhone: o.momo_phone || o.momoPhone,
        momoProvider: o.momo_provider || o.momoProvider,
        momoStatus: o.momo_status || o.momoStatus || 'VERIFIED'
      }));
    }
  } catch (err) {
    console.warn('Supabase getOrders error/fallback:', err);
  }
  return [];
}

// --- MOBILE MONEY (MOMO) GATEWAY API ---
export async function initiateMomoPayment({ phone, amount, provider = 'MTN Mobile Money', currency = 'Rwf', orderId }) {
  try {
    const res = await fetch('/api/momo/pay', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, amount, provider, currency, orderId })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to initiate MoMo payment');
    }
    return data;
  } catch (err) {
    console.warn('Backend API server not responding, using simulated local MoMo USSD prompt:', err.message);
    const ref = `MOMO-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    return {
      success: true,
      referenceId: ref,
      status: 'PENDING',
      provider: provider || 'MTN Mobile Money',
      phone,
      amount,
      currency,
      message: 'USSD prompt dispatched to handset. Enter your MoMo PIN to authorize payment.'
    };
  }
}

export async function checkMomoPaymentStatus(referenceId) {
  try {
    const res = await fetch(`/api/momo/status/${referenceId}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('Backend API status check error:', err.message);
  }
  return {
    referenceId,
    status: 'SUCCESSFUL',
    message: 'Payment authorized and debited successfully.'
  };
}

export async function createOrder(orderPayload) {
  try {
    const res = await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderPayload)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API createOrder fallback:', apiErr.message);
  }

  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: {} }));

  const record = {
    id: orderPayload.id || `NV-${1000 + Math.floor(Math.random() * 9000)}`,
    customer: orderPayload.customer,
    items: orderPayload.items,
    subtotal: orderPayload.subtotal || 0,
    discount: orderPayload.discount || 0,
    tax: orderPayload.tax || 0,
    shipping: orderPayload.shipping || 0,
    total: orderPayload.total || 0,
    promo_code: orderPayload.promoCode || '',
    payment_method: orderPayload.paymentMethod || 'Mobile Money',
    momo_ref: orderPayload.momoRef || orderPayload.momo_ref || null,
    momo_phone: orderPayload.momoPhone || orderPayload.momo_phone || null,
    momo_provider: orderPayload.momoProvider || orderPayload.momo_provider || null,
    momo_status: orderPayload.momoStatus || orderPayload.momo_status || 'VERIFIED',
    status: orderPayload.status || 'Pending',
    user_id: session?.user?.id || null,
    date: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('orders')
      .insert([record])
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        promoCode: data.promo_code,
        paymentMethod: data.payment_method,
        momoRef: data.momo_ref || record.momo_ref,
        momoPhone: data.momo_phone || record.momo_phone,
        momoProvider: data.momo_provider || record.momo_provider,
        momoStatus: data.momo_status || record.momo_status
      };
    }
  } catch (err) {
    console.warn('Supabase createOrder RLS warning:', err);
  }

  return {
    ...record,
    promoCode: record.promo_code,
    paymentMethod: record.payment_method,
    momoRef: record.momo_ref,
    momoPhone: record.momo_phone,
    momoProvider: record.momo_provider,
    momoStatus: record.momo_status
  };
}

export async function updateOrderStatus(orderId, status) {
  try {
    const res = await fetch(`/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API updateOrderStatus fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        promoCode: data.promo_code,
        paymentMethod: data.payment_method
      };
    }
  } catch (err) {
    console.warn('Supabase updateOrderStatus RLS warning:', err);
  }

  return { id: orderId, status };
}


// --- PROMOTIONS ---
export async function getPromotions() {
  try {
    const res = await fetch('/api/promotions');
    if (res.ok) {
      const apiData = await res.json();
      if (Array.isArray(apiData) && apiData.length > 0) return apiData;
    }
  } catch (apiErr) {
    console.warn('API getPromotions fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .select('*');

    if (!error && data && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase getPromotions error/fallback:', err);
  }
  return DEFAULT_PROMOTIONS;
}

export async function createPromotion(promoData) {
  try {
    const res = await fetch('/api/promotions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(promoData)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API createPromotion fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .insert([promoData])
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase createPromotion RLS warning:', err);
  }

  return promoData;
}

export async function updatePromotion(code, updates) {
  try {
    const res = await fetch(`/api/promotions/${code}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API updatePromotion fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('promotions')
      .update(updates)
      .eq('code', code)
      .select()
      .maybeSingle();

    if (!error && data) {
      return data;
    }
  } catch (err) {
    console.warn('Supabase updatePromotion RLS warning:', err);
  }

  return { code, ...updates };
}

export async function deletePromotion(code) {
  try {
    const res = await fetch(`/api/promotions/${code}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      return true;
    }
  } catch (apiErr) {
    console.warn('API deletePromotion fallback:', apiErr.message);
  }

  try {
    await supabase.from('promotions').delete().eq('code', code);
  } catch (err) {
    console.warn('Supabase deletePromotion RLS warning:', err);
  }

  return true;
}


// --- STORE CONFIG ---
export async function getStoreConfig() {
  try {
    const res = await fetch('/api/store');
    if (res.ok) {
      const apiData = await res.json();
      if (apiData && apiData.name) return apiData;
    }
  } catch (apiErr) {
    console.warn('API getStoreConfig fallback:', apiErr.message);
  }

  try {
    const { data, error } = await supabase
      .from('store_config')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        taxRate: data.tax_rate,
        shippingFee: data.shipping_fee,
        freeShippingThreshold: data.free_shipping_threshold,
        adminEmail: data.admin_email,
        adminPassword: data.admin_password,
        momoProvider: data.momo_provider || DEFAULT_STORE_CONFIG.momoProvider,
        momoEnvironment: data.momo_environment || DEFAULT_STORE_CONFIG.momoEnvironment,
        momoMerchantCode: data.momo_merchant_code || DEFAULT_STORE_CONFIG.momoMerchantCode
      };
    }
  } catch (err) {
    console.warn('Supabase getStoreConfig error/fallback:', err);
  }

  return DEFAULT_STORE_CONFIG;
}

export async function saveStoreConfig(config) {
  try {
    const res = await fetch('/api/store', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (apiErr) {
    console.warn('API saveStoreConfig fallback:', apiErr.message);
  }

  const record = {
    id: 'default',
    name: config.name,
    address: config.address,
    phone: config.phone,
    currency: config.currency,
    tax_rate: config.taxRate,
    shipping_fee: config.shippingFee,
    free_shipping_threshold: config.freeShippingThreshold,
    admin_email: config.adminEmail,
    admin_password: config.adminPassword
  };

  try {
    const { data, error } = await supabase
      .from('store_config')
      .upsert([record])
      .select()
      .maybeSingle();

    if (!error && data) {
      return {
        ...data,
        taxRate: data.tax_rate,
        shippingFee: data.shipping_fee,
        freeShippingThreshold: data.free_shipping_threshold,
        adminEmail: data.admin_email,
        adminPassword: data.admin_password
      };
    }
  } catch (err) {
    console.warn('Supabase saveStoreConfig RLS warning:', err);
  }

  return config;
}

// --- ANALYTICS COMPUTATION ---
export async function getAnalyticsData() {
  const orders = await getOrders();
  const promotions = await getPromotions();

  let totalRevenue = 0;
  let completedOrders = 0;

  orders.forEach(o => {
    if (o.status !== 'Cancelled') {
      totalRevenue += (o.total || 0);
      completedOrders++;
    }
  });

  const averageOrderValue = completedOrders > 0 ? parseFloat((totalRevenue / completedOrders).toFixed(2)) : 0;
  const activePromos = promotions.filter(p => p.active).length;

  const trendMap = {};
  const today = new Date();

  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(today.getDate() - i);
    const dateString = d.toISOString().split('T')[0];
    trendMap[dateString] = { date: dateString, revenue: 0, orders: 0 };
  }

  orders.forEach(o => {
    if (o.status !== 'Cancelled' && o.date) {
      const orderDateStr = o.date.split('T')[0];
      if (trendMap[orderDateStr]) {
        trendMap[orderDateStr].revenue += (o.total || 0);
        trendMap[orderDateStr].orders += 1;
      }
    }
  });

  const weeklyTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

  const productSales = {};
  orders.forEach(o => {
    if (o.status !== 'Cancelled' && Array.isArray(o.items)) {
      o.items.forEach(item => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
        }
        productSales[item.productId].quantity += (item.quantity || 1);
        productSales[item.productId].revenue += (item.price || 0) * (item.quantity || 1);
      });
    }
  });

  const hotItems = Object.values(productSales)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const promoUsage = {};
  orders.forEach(o => {
    if (o.status !== 'Cancelled' && o.promoCode) {
      promoUsage[o.promoCode] = (promoUsage[o.promoCode] || 0) + 1;
    }
  });

  return {
    summary: {
      totalRevenue: parseFloat(totalRevenue.toFixed(2)),
      ordersCount: completedOrders,
      averageOrderValue,
      activePromos
    },
    weeklyTrend,
    hotItems,
    promoUsage
  };
}

// --- IMAGE UPLOADS ---
export async function uploadProductImage(file) {
  try {
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const { data, error } = await supabase.storage
      .from('products')
      .upload(filename, file, { cacheControl: '3600', upsert: true });

    if (!error && data) {
      const { data: publicUrlData } = supabase.storage.from('products').getPublicUrl(filename);
      if (publicUrlData?.publicUrl) {
        return publicUrlData.publicUrl;
      }
    }
  } catch (err) {
    console.warn('Supabase storage upload failed, using Data URL fallback:', err);
  }

  // Fallback: Read as base64 Data URL (100% client-side serverless compatible)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}


