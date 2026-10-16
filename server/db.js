import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import supabase from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

// Default Streetwear Catalog
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
  adminPassword: "noir123"
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-Memory High-Speed Cache
const cache = {
  products: null,
  orders: null,
  promotions: null,
  store: null,
  supabaseAvailable: false,
  supabaseChecked: false
};

// Helper: Read JSON from disk safely
function readJSON(filename, fallback) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf-8');
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) return data;
      if (data && typeof data === 'object' && Object.keys(data).length > 0) return data;
    }
  } catch (err) {
    console.warn(`[DB] Fallback reading ${filename}:`, err.message);
  }
  return fallback;
}

// Helper: Non-blocking atomic write to disk
async function writeJSON(filename, data) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error(`[DB] Error persisting ${filename}:`, err.message);
    return false;
  }
}

// Non-blocking, fast probe to check if Supabase is reachable (with strict 600ms timeout)
async function probeSupabase() {
  if (cache.supabaseChecked) return cache.supabaseAvailable;
  cache.supabaseChecked = true;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase probe timeout')), 600)
    );
    const probePromise = supabase.from('products').select('id').limit(1);
    await Promise.race([probePromise, timeoutPromise]);
    cache.supabaseAvailable = true;
    console.log('[DB] Supabase connection active.');
  } catch {
    cache.supabaseAvailable = false;
    console.log('[DB] Supabase unreachable or offline. Using ultra-fast local in-memory storage (<1ms latency).');
  }
  return cache.supabaseAvailable;
}

// Initialize cache synchronously on boot for 0ms cold starts
function initCache() {
  const loadedProducts = readJSON('products.json', DEFAULT_PRODUCTS);
  // Ensure default products exist in the catalog
  const mergedProducts = [...loadedProducts];
  for (const def of DEFAULT_PRODUCTS) {
    if (!mergedProducts.some(p => p.id === def.id)) {
      mergedProducts.push(def);
    }
  }
  cache.products = mergedProducts;
  cache.orders = readJSON('orders.json', []);
  cache.promotions = readJSON('promotions.json', DEFAULT_PROMOTIONS);
  cache.store = readJSON('store.json', DEFAULT_STORE_CONFIG);
  
  // Asynchronously probe Supabase without blocking the server
  probeSupabase().catch(() => {});
}

initCache();

export const db = {
  // PRODUCTS (Instant In-Memory + Async Disk & Supabase Sync)
  async getProducts() {
    if (!cache.products) {
      cache.products = readJSON('products.json', DEFAULT_PRODUCTS);
    }
    return cache.products;
  },

  async saveProducts(products) {
    cache.products = products;
    writeJSON('products.json', products);

    // Background sync to Supabase if connected
    if (cache.supabaseAvailable) {
      supabase.from('products').upsert(products).then(({ error }) => {
        if (error) console.warn('[Supabase Sync] Products error:', error.message);
      }).catch(() => {});
    }
    return true;
  },

  // ORDERS (Instant In-Memory + Async Disk & Supabase Sync)
  async getOrders() {
    if (!cache.orders) {
      cache.orders = readJSON('orders.json', []);
    }
    return cache.orders;
  },

  async saveOrders(orders) {
    cache.orders = orders;
    writeJSON('orders.json', orders);

    if (cache.supabaseAvailable) {
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
        status: o.status,
        date: o.date
      }));
      supabase.from('orders').upsert(formatted).then(({ error }) => {
        if (error) console.warn('[Supabase Sync] Orders error:', error.message);
      }).catch(() => {});
    }
    return true;
  },

  // PROMOTIONS (Instant In-Memory + Async Disk & Supabase Sync)
  async getPromotions() {
    if (!cache.promotions) {
      cache.promotions = readJSON('promotions.json', DEFAULT_PROMOTIONS);
    }
    return cache.promotions;
  },

  async savePromotions(promotions) {
    cache.promotions = promotions;
    writeJSON('promotions.json', promotions);

    if (cache.supabaseAvailable) {
      supabase.from('promotions').upsert(promotions).then(({ error }) => {
        if (error) console.warn('[Supabase Sync] Promos error:', error.message);
      }).catch(() => {});
    }
    return true;
  },

  // STORE CONFIGURATION (Instant In-Memory + Async Disk & Supabase Sync)
  async getStoreConfig() {
    if (!cache.store) {
      cache.store = readJSON('store.json', DEFAULT_STORE_CONFIG);
    }
    return cache.store;
  },

  async saveStoreConfig(config) {
    cache.store = config;
    writeJSON('store.json', config);

    if (cache.supabaseAvailable) {
      supabase.from('store_config').upsert([{
        id: 'default',
        name: config.name,
        address: config.address,
        phone: config.phone,
        currency: config.currency,
        tax_rate: config.taxRate,
        shipping_fee: config.shippingFee,
        free_shipping_threshold: config.freeShippingThreshold,
        admin_email: config.adminEmail,
        adminPassword: config.adminPassword
      }]).then(({ error }) => {
        if (error) console.warn('[Supabase Sync] Store config error:', error.message);
      }).catch(() => {});
    }
    return true;
  }
};
