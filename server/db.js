import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PROMOTIONS_FILE = path.join(DATA_DIR, 'promotions.json');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;
const USE_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);
const supabase = USE_SUPABASE ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
// When SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are configured, the server will use Supabase tables
// instead of local JSON files. The expected tables are: products, orders, promotions, store_config.

const initialProducts = [
  {
    id: "NOIR-001",
    name: "Virtu Heavy Graphic Hoodie",
    description: "Premium 450GSM ultra-heavy cotton fleece hoodie. Features high-density screenprinted signature NOIR typography on the front chest and large gothic arch sigil graphics across the back. Dropped shoulders, double-lined hood, and thick ribbed cuffs. Designed for a structured, oversized fit.",
    price: 95.0,
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
    price: 125.0,
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
    price: 45.0,
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
    price: 30.0,
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
    price: 160.0,
    images: ["/images/windbreaker.jpg"],
    sizes: ["S", "M", "L"],
    categories: ["Tops", "Outerwear"],
    stock: 6,
    collections: ["The Eighth Archive", "New Arrivals"]
  }
];

const initialPromotions = [
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
  },
  {
    code: "STREET50",
    type: "fixed",
    value: 50.0,
    active: false,
    description: "Save $50 on any purchase (currently inactive)."
  }
];

const initialStore = {
  name: "NOIR VIRTU FLAGSHIP",
  address: "712 Melrose Ave, Los Angeles, CA 90046",
  phone: "+1 (323) 555-0198",
  currency: "USD",
  taxRate: 8.25,
  shippingFee: 10.0,
  freeShippingThreshold: 150.0
};

function generateInitialOrders() {
  const today = new Date();
  const initialOrders = [];

  const names = [
    "Marcus Vance",
    "Elena Rostova",
    "Kai Tanaka",
    "Chloe Dubois",
    "Jaden Cole",
    "Aria Vance",
    "Darnell Jackson"
  ];
  const emails = [
    "marcus@vance.co",
    "elena.ros@gmail.com",
    "kai@tanakadesign.jp",
    "chloe@dubois.fr",
    "jaden.c@outlook.com",
    "aria@vance.co",
    "darnell@j-style.com"
  ];

  for (let i = 14; i >= 0; i--) {
    const orderDate = new Date();
    orderDate.setDate(today.getDate() - i);
    const ordersToday = i % 3 === 0 ? 2 : i % 5 === 0 ? 0 : 1;

    for (let j = 0; j < ordersToday; j++) {
      const orderId = `NV-${1000 + initialOrders.length}`;
      const clientIndex = initialOrders.length % names.length;
      const numItems = i % 2 === 0 ? 1 : 2;

      let subtotal = 0;
      const items = [];
      for (let k = 0; k < numItems; k++) {
        const product = initialProducts[(i + j + k) % initialProducts.length];
        const qty = 1;
        items.push({
          productId: product.id,
          name: product.name,
          size: ["S", "M", "L", "XL", "One Size"][(i + k) % 5],
          quantity: qty,
          price: product.price
        });
        subtotal += product.price * qty;
      }

      const hasPromo = i % 4 === 0;
      const promoCode = hasPromo ? "NOIR10" : "";
      const discount = hasPromo ? parseFloat((subtotal * 0.1).toFixed(2)) : 0;
      const shipping = subtotal >= 150 ? 0 : 10.0;
      const tax = parseFloat(((subtotal - discount) * 0.0825).toFixed(2));
      const total = parseFloat((subtotal - discount + shipping + tax).toFixed(2));

      initialOrders.push({
        id: orderId,
        customer: {
          name: names[clientIndex],
          email: emails[clientIndex],
          address: "128 W 8th St, Penthouse B",
          city: "Los Angeles",
          state: "CA",
          postalCode: "90014"
        },
        items,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        promoCode,
        paymentMethod: "Visa (Mock)",
        status: i === 0 ? "Pending" : i < 3 ? "Processing" : "Completed",
        date: orderDate.toISOString()
      });
    }
  }

  return initialOrders;
}

async function initSupabase() {
  if (!supabase) {
    throw new Error('Supabase client is not configured');
  }

  const { count: productCount, error: productCountError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true });
  if (productCountError) throw productCountError;

  const { count: promotionCount, error: promotionCountError } = await supabase
    .from('promotions')
    .select('code', { count: 'exact', head: true });
  if (promotionCountError) throw promotionCountError;

  const { count: orderCount, error: orderCountError } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true });
  if (orderCountError) throw orderCountError;

  const { data: storeConfigData, error: storeConfigError } = await supabase
    .from('store_config')
    .select('*')
    .limit(1);
  if (storeConfigError) throw storeConfigError;

  if (!productCount) {
    const { error } = await supabase.from('products').insert(initialProducts);
    if (error) throw error;
  }

  if (!promotionCount) {
    const { error } = await supabase.from('promotions').insert(initialPromotions);
    if (error) throw error;
  }

  if (!orderCount) {
    const orders = generateInitialOrders();
    const { error } = await supabase.from('orders').insert(orders);
    if (error) throw error;
  }

  if (!storeConfigData || storeConfigData.length === 0) {
    const { error } = await supabase.from('store_config').insert([{ id: 1, ...initialStore }]);
    if (error) throw error;
  }

  console.log('Supabase backend initialized');
}

// Initialize storage backend on load
async function initDb() {
  if (USE_SUPABASE) {
    try {
      await initSupabase();
      return;
    } catch (err) {
      console.error('Failed to initialize Supabase backend:', err);
      throw err;
    }
  }

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });

    try {
      await fs.access(PRODUCTS_FILE);
    } catch {
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2));
    }

    try {
      await fs.access(PROMOTIONS_FILE);
    } catch {
      await fs.writeFile(PROMOTIONS_FILE, JSON.stringify(initialPromotions, null, 2));
    }

    try {
      await fs.access(STORE_FILE);
    } catch {
      await fs.writeFile(STORE_FILE, JSON.stringify(initialStore, null, 2));
    }

    try {
      await fs.access(ORDERS_FILE);
    } catch {
      await fs.writeFile(ORDERS_FILE, JSON.stringify(generateInitialOrders(), null, 2));
    }

    console.log('Local JSON backend initialized');
  } catch (err) {
    console.error('Failed to initialize database:', err);
  }
}

// Call on load
initDb();

const writeQueue = new Map();

async function enqueueWrite(file, task) {
  const previous = writeQueue.get(file) || Promise.resolve();
  const next = previous.then(task, task);
  writeQueue.set(file, next.finally(() => {
    if (writeQueue.get(file) === next) {
      writeQueue.delete(file);
    }
  }));
  return next;
}

// Reads utility
async function readJson(file) {
  try {
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  } catch (err) {
    console.error(`Error reading file ${file}:`, err);
    return [];
  }
}

// Writes utility
async function writeJson(file, data) {
  return enqueueWrite(file, async () => {
    try {
      const content = JSON.stringify(data, null, 2);
      const tempFile = `${file}.tmp`;
      await fs.writeFile(tempFile, content, 'utf8');
      await fs.rename(tempFile, file);
      return true;
    } catch (err) {
      console.error(`Error writing file ${file}:`, err);
      return false;
    }
  });
}

async function supabaseSelect(table) {
  if (!supabase) throw new Error('Supabase client is not configured');
  const { data, error } = await supabase.from(table).select('*');
  if (error) throw error;
  return data || [];
}

async function supabaseReplace(table, rows, key = 'id') {
  if (!supabase) throw new Error('Supabase client is not configured');
  const { error: deleteError } = await supabase.from(table).delete().neq(key, '');
  if (deleteError) throw deleteError;
  if (!rows || rows.length === 0) return true;
  const { error } = await supabase.from(table).insert(rows);
  if (error) throw error;
  return true;
}

async function supabaseGetStoreConfig() {
  if (!supabase) throw new Error('Supabase client is not configured');
  const { data, error } = await supabase.from('store_config').select('*').limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : {};
}

async function supabaseSaveStoreConfig(config) {
  if (!supabase) throw new Error('Supabase client is not configured');
  const { error } = await supabase.from('store_config').upsert([{ id: 1, ...config }], { onConflict: 'id' });
  if (error) throw error;
  return true;
}

export const db = {
  // Products API
  async getProducts() {
    if (USE_SUPABASE) return await supabaseSelect('products');
    return await readJson(PRODUCTS_FILE);
  },
  async saveProducts(products) {
    if (USE_SUPABASE) return await supabaseReplace('products', products, 'id');
    return await writeJson(PRODUCTS_FILE, products);
  },

  // Orders API
  async getOrders() {
    if (USE_SUPABASE) return await supabaseSelect('orders');
    return await readJson(ORDERS_FILE);
  },
  async saveOrders(orders) {
    if (USE_SUPABASE) return await supabaseReplace('orders', orders, 'id');
    return await writeJson(ORDERS_FILE, orders);
  },

  // Promotions API
  async getPromotions() {
    if (USE_SUPABASE) return await supabaseSelect('promotions');
    return await readJson(PROMOTIONS_FILE);
  },
  async savePromotions(promotions) {
    if (USE_SUPABASE) return await supabaseReplace('promotions', promotions, 'code');
    return await writeJson(PROMOTIONS_FILE, promotions);
  },

  // Store Configuration API
  async getStoreConfig() {
    if (USE_SUPABASE) return await supabaseGetStoreConfig();
    try {
      const content = await fs.readFile(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  },
  async saveStoreConfig(config) {
    if (USE_SUPABASE) return await supabaseSaveStoreConfig(config);
    try {
      await fs.writeFile(STORE_FILE, JSON.stringify(config, null, 2));
      return true;
    } catch {
      return false;
    }
  }
};
