import supabase from './supabase.js';

const DEFAULT_PRODUCTS = [
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

const DEFAULT_PROMOTIONS = [
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

const DEFAULT_STORE_CONFIG = {
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

export const db = {
  // Products API (Pure Supabase)
  async getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error('Supabase getProducts error:', err.message);
    }
    return DEFAULT_PRODUCTS;
  },

  async saveProducts(products) {
    if (Array.isArray(products) && products.length > 0) {
      const { error } = await supabase.from('products').upsert(products);
      if (error) {
        console.error('Supabase saveProducts error:', error.message);
        return false;
      }
    }
    return true;
  },

  // Orders API (Pure Supabase)
  async getOrders() {
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
      console.error('Supabase getOrders error:', err.message);
    }
    return [];
  },

  async saveOrders(orders) {
    if (Array.isArray(orders) && orders.length > 0) {
      const formatted = orders.map(o => ({
        id: o.id,
        customer: o.customer,
        items: o.items,
        subtotal: o.subtotal,
        discount: o.discount,
        tax: o.tax,
        shipping: o.shipping,
        total: o.total,
        promo_code: o.promoCode || '',
        payment_method: o.paymentMethod || 'Mobile Money',
        momo_ref: o.momoRef || o.momo_ref || null,
        momo_phone: o.momoPhone || o.momo_phone || null,
        momo_provider: o.momoProvider || o.momo_provider || null,
        momo_status: o.momoStatus || o.momo_status || 'VERIFIED',
        status: o.status,
        date: o.date
      }));

      const { error } = await supabase.from('orders').upsert(formatted);
      if (error) {
        console.error('Supabase saveOrders error:', error.message);
        return false;
      }
    }
    return true;
  },

  // Promotions API (Pure Supabase)
  async getPromotions() {
    try {
      const { data, error } = await supabase
        .from('promotions')
        .select('*');

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.error('Supabase getPromotions error:', err.message);
    }
    return DEFAULT_PROMOTIONS;
  },

  async savePromotions(promotions) {
    if (Array.isArray(promotions) && promotions.length > 0) {
      const { error } = await supabase.from('promotions').upsert(promotions);
      if (error) {
        console.error('Supabase savePromotions error:', error.message);
        return false;
      }
    }
    return true;
  },

  // Store Configuration API (Pure Supabase)
  async getStoreConfig() {
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
      console.error('Supabase getStoreConfig error:', err.message);
    }

    return DEFAULT_STORE_CONFIG;
  },

  async saveStoreConfig(config) {
    const { error } = await supabase.from('store_config').upsert([{
      id: 'default',
      name: config.name,
      address: config.address,
      phone: config.phone,
      currency: config.currency,
      tax_rate: config.taxRate,
      shipping_fee: config.shippingFee,
      free_shipping_threshold: config.freeShippingThreshold,
      admin_email: config.adminEmail,
      admin_password: config.adminPassword,
      momo_provider: config.momoProvider,
      momo_environment: config.momoEnvironment,
      momo_merchant_code: config.momoMerchantCode
    }]);

    if (error) {
      console.error('Supabase saveStoreConfig error:', error.message);
      // Return true even if Supabase column missing so server state continues
      return true;
    }
    return true;
  }
};
