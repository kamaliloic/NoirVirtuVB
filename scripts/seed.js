import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
function loadEnv() {
  const envPath = path.join(__dirname, "../.env.local");
  try {
    const envContent = fs.readFileSync(envPath, "utf-8");
    const env = {};
    envContent.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, value] = trimmed.split("=");
        if (key && value) {
          env[key.trim()] = value.trim();
        }
      }
    });
    return env;
  } catch (err) {
    console.error("❌ Error loading .env.local:", err.message);
    return {};
  }
}

const env = loadEnv();

// Initialize Supabase client
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to load JSON files
function loadJSON(filename) {
  const filePath = path.join(__dirname, "../server/data", filename);
  try {
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`❌ Error loading ${filename}:`, err.message);
    return null;
  }
}

async function seedDatabase() {
  try {
    console.log("🌱 Starting Supabase seeding...\n");

    // 1. Seed store config
    console.log("📦 Seeding store configuration...");
    const storeData = loadJSON("store.json");
    if (storeData) {
      const transformedStore = {
        id: 1,
        name: storeData.name,
        address: storeData.address,
        phone: storeData.phone,
        currency: storeData.currency,
        tax_rate: storeData.taxRate,
        shipping_fee: storeData.shippingFee,
        free_shipping_threshold: storeData.freeShippingThreshold,
        admin_email: storeData.adminEmail,
        admin_password: storeData.adminPassword,
      };

      const { error: storeError } = await supabase
        .from("store")
        .upsert([transformedStore], { onConflict: "id" });

      if (storeError) {
        console.error("❌ Store error:", storeError.message);
      } else {
        console.log("✅ Store configuration seeded\n");
      }
    }

    // 2. Seed products
    console.log("🛍️ Seeding products...");
    const productsData = loadJSON("products.json");
    if (productsData && Array.isArray(productsData)) {
      const { error: productsError, data: productsInserted } = await supabase
        .from("products")
        .upsert(productsData, { onConflict: "id" });

      if (productsError) {
        console.error("❌ Products error:", productsError.message);
      } else {
        console.log(
          `✅ ${productsInserted?.length || productsData.length} products seeded\n`,
        );
      }
    }

    // 3. Seed promotions
    console.log("🎁 Seeding promotions...");
    const promotionsData = loadJSON("promotions.json");
    if (promotionsData && Array.isArray(promotionsData)) {
      const { error: promosError, data: promosInserted } = await supabase
        .from("promotions")
        .upsert(promotionsData, { onConflict: "code" });

      if (promosError) {
        console.error("❌ Promotions error:", promosError.message);
      } else {
        console.log(
          `✅ ${promosInserted?.length || promotionsData.length} promotions seeded\n`,
        );
      }
    }

    // 4. Seed orders (optional - transform format if needed)
    console.log("📋 Seeding orders...");
    const ordersData = loadJSON("orders.json");
    if (ordersData && Array.isArray(ordersData)) {
      const transformedOrders = ordersData.map((order) => ({
        id: order.id,
        customer_name: order.customer?.name || "",
        customer_email: order.customer?.email || "",
        customer_address: order.customer?.address || "",
        customer_city: order.customer?.city || "",
        customer_state: order.customer?.state || "",
        customer_postal_code: order.customer?.postalCode || "",
        items: order.items || [],
        subtotal: order.subtotal || 0,
        discount: order.discount || 0,
        tax: order.tax || 0,
        shipping: order.shipping || 0,
        total: order.total || 0,
        promo_code:
          order.promoCode && order.promoCode.trim() ? order.promoCode : null,
        payment_method: order.paymentMethod || "",
        status: order.status || "Pending",
        created_at: order.date,
      }));

      const { error: ordersError, data: ordersInserted } = await supabase
        .from("orders")
        .upsert(transformedOrders, { onConflict: "id" });

      if (ordersError) {
        console.error("❌ Orders error:", ordersError.message);
      } else {
        console.log(
          `✅ ${ordersInserted?.length || transformedOrders.length} orders seeded\n`,
        );
      }
    }

    console.log("✅ Database seeding complete!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
    process.exit(1);
  }
}

seedDatabase();
