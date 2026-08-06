import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const PROMOTIONS_FILE = path.join(DATA_DIR, 'promotions.json');
const STORE_FILE = path.join(DATA_DIR, 'store.json');

// Initialize database files if they don't exist
async function initDb() {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    
    // 1. Initial Products
    try {
      await fs.access(PRODUCTS_FILE);
    } catch {
      const initialProducts = [
        {
          id: "NOIR-001",
          name: "Virtu Heavy Graphic Hoodie",
          description: "Premium 450GSM ultra-heavy cotton fleece hoodie. Features high-density screenprinted signature NOIR typography on the front chest and large gothic arch sigil graphics across the back. Dropped shoulders, double-lined hood, and thick ribbed cuffs. Designed for a structured, oversized fit.",
          price: 95.00,
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
          price: 125.00,
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
          price: 45.00,
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
          price: 30.00,
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
          price: 160.00,
          images: ["/images/windbreaker.jpg"],
          sizes: ["S", "M", "L"],
          categories: ["Tops", "Outerwear"],
          stock: 6,
          collections: ["The Eighth Archive", "New Arrivals"]
        }
      ];
      await fs.writeFile(PRODUCTS_FILE, JSON.stringify(initialProducts, null, 2));
    }

    // 2. Initial Promotions
    try {
      await fs.access(PROMOTIONS_FILE);
    } catch {
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
          value: 50.00,
          active: false,
          description: "Save $50 on any purchase (currently inactive)."
        }
      ];
      await fs.writeFile(PROMOTIONS_FILE, JSON.stringify(initialPromotions, null, 2));
    }

    // 3. Initial Store Settings
    try {
      await fs.access(STORE_FILE);
    } catch {
      const initialStore = {
        name: "NOIR VIRTU FLAGSHIP",
        address: "712 Melrose Ave, Los Angeles, CA 90046",
        phone: "+1 (323) 555-0198",
        currency: "USD",
        taxRate: 8.25, // percentage
        shippingFee: 10.00, // flat rate
        freeShippingThreshold: 150.00
      };
      await fs.writeFile(STORE_FILE, JSON.stringify(initialStore, null, 2));
    }

    // 4. Initial Orders (to populate analytics charts immediately)
    try {
      await fs.access(ORDERS_FILE);
    } catch {
      // Generate some mock orders spanning the past week
      const today = new Date();
      const initialOrders = [];
      
      const names = ["Marcus Vance", "Elena Rostova", "Kai Tanaka", "Chloe Dubois", "Jaden Cole", "Aria Vance", "Darnell Jackson"];
      const emails = ["marcus@vance.co", "elena.ros@gmail.com", "kai@tanakadesign.jp", "chloe@dubois.fr", "jaden.c@outlook.com", "aria@vance.co", "darnell@j-style.com"];
      const products = [
        { id: "NOIR-001", price: 95.00, name: "Virtu Heavy Graphic Hoodie" },
        { id: "NOIR-002", price: 125.00, name: "Vandal Cargo Pants" },
        { id: "NOIR-003", price: 45.00, name: "Memento Mori Graphic Tee" },
        { id: "NOIR-004", price: 30.00, name: "Sigil Ribbed Beanie" }
      ];

      for (let i = 14; i >= 0; i--) {
        const orderDate = new Date();
        orderDate.setDate(today.getDate() - i);
        // Vary the number of orders per day
        const ordersToday = (i % 3 === 0) ? 2 : (i % 5 === 0) ? 0 : 1;
        
        for (let j = 0; j < ordersToday; j++) {
          const orderId = `NV-${1000 + initialOrders.length}`;
          const clientIndex = (initialOrders.length) % names.length;
          const numItems = (i % 2 === 0) ? 1 : 2;
          
          let subtotal = 0;
          const items = [];
          for (let k = 0; k < numItems; k++) {
            const product = products[(i + j + k) % products.length];
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

          const hasPromo = (i % 4 === 0);
          const promoCode = hasPromo ? "NOIR10" : "";
          const discount = hasPromo ? parseFloat((subtotal * 0.1).toFixed(2)) : 0;
          const shipping = subtotal >= 150 ? 0 : 10.00;
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

      await fs.writeFile(ORDERS_FILE, JSON.stringify(initialOrders, null, 2));
    }
    
    console.log("Database files successfully initialized");
  } catch (err) {
    console.error("Failed to initialize database:", err);
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

export const db = {
  // Products API
  async getProducts() {
    return await readJson(PRODUCTS_FILE);
  },
  async saveProducts(products) {
    return await writeJson(PRODUCTS_FILE, products);
  },

  // Orders API
  async getOrders() {
    return await readJson(ORDERS_FILE);
  },
  async saveOrders(orders) {
    return await writeJson(ORDERS_FILE, orders);
  },

  // Promotions API
  async getPromotions() {
    return await readJson(PROMOTIONS_FILE);
  },
  async savePromotions(promotions) {
    return await writeJson(PROMOTIONS_FILE, promotions);
  },

  // Store Configuration API
  async getStoreConfig() {
    try {
      const content = await fs.readFile(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    } catch {
      return {};
    }
  },
  async saveStoreConfig(config) {
    try {
      await fs.writeFile(STORE_FILE, JSON.stringify(config, null, 2));
      return true;
    } catch {
      return false;
    }
  }
};
