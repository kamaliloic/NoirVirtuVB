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
  adminPassword: "noir123"
};

// --- PRODUCTS ---
export async function getProducts() {
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
  const { data, error } = await supabase
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) {
    console.error('Supabase createProduct error:', error);
    throw error;
  }
  return data;
}

export async function updateProduct(id, updates) {
  const { data, error } = await supabase
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateProduct error:', error);
    throw error;
  }
  return data;
}

export async function deleteProduct(id) {
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Supabase deleteProduct error:', error);
    throw error;
  }
  return true;
}


// --- ORDERS & BUYER DETAILS ---
export async function getOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map(o => ({
        ...o,
        promoCode: o.promo_code,
        paymentMethod: o.payment_method
      }));
    }
  } catch (err) {
    console.warn('Supabase getOrders error/fallback:', err);
  }
  return [];
}

export async function createOrder(orderPayload) {
  const { data: { session } } = await supabase.auth.getSession();

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
    status: orderPayload.status || 'Pending',
    user_id: session?.user?.id || null,
    date: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('orders')
    .insert([record])
    .select()
    .single();

  if (error) {
    console.error('Supabase createOrder error:', error);
    throw error;
  }

  // Convert snake_case back to camelCase for frontend consistency
  return {
    ...data,
    promoCode: data.promo_code,
    paymentMethod: data.payment_method
  };
}

export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Supabase updateOrderStatus error:', error);
    throw error;
  }

  return {
    ...data,
    promoCode: data.promo_code,
    paymentMethod: data.payment_method
  };
}


// --- PROMOTIONS ---
export async function getPromotions() {
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
  const { data, error } = await supabase
    .from('promotions')
    .insert([promoData])
    .select()
    .single();

  if (error) {
    console.error('Supabase createPromotion error:', error);
    throw error;
  }
  return data;
}

export async function updatePromotion(code, updates) {
  const { data, error } = await supabase
    .from('promotions')
    .update(updates)
    .eq('code', code)
    .select()
    .single();

  if (error) {
    console.error('Supabase updatePromotion error:', error);
    throw error;
  }
  return data;
}

export async function deletePromotion(code) {
  const { error } = await supabase
    .from('promotions')
    .delete()
    .eq('code', code);

  if (error) {
    console.error('Supabase deletePromotion error:', error);
    throw error;
  }
  return true;
}


// --- STORE CONFIG ---
export async function getStoreConfig() {
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
        adminPassword: data.admin_password
      };
    }
  } catch (err) {
    console.warn('Supabase getStoreConfig error/fallback:', err);
  }

  return DEFAULT_STORE_CONFIG;
}

export async function saveStoreConfig(config) {
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

  const { data, error } = await supabase
    .from('store_config')
    .upsert([record])
    .select()
    .single();

  if (error) {
    console.error('Supabase saveStoreConfig error:', error);
    throw error;
  }

  return {
    ...data,
    taxRate: data.tax_rate,
    shippingFee: data.shipping_fee,
    freeShippingThreshold: data.free_shipping_threshold,
    adminEmail: data.admin_email,
    adminPassword: data.admin_password
  };
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

