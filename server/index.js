import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// --- Products Endpoints ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    const newProduct = {
      id: req.body.id || `NOIR-${Math.floor(100 + Math.random() * 900)}`,
      name: req.body.name,
      description: req.body.description || '',
      price: parseFloat(req.body.price) || 0,
      images: req.body.images || ['/images/placeholder.jpg'],
      sizes: req.body.sizes || ['S', 'M', 'L', 'XL'],
      categories: req.body.categories || ['Tops'],
      stock: parseInt(req.body.stock) || 0,
      collections: req.body.collections || []
    };
    
    // Check if ID already exists
    if (products.some(p => p.id === newProduct.id)) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    products.push(newProduct);
    await db.saveProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const products = await db.getProducts();
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const updatedProduct = {
      ...products[index],
      name: req.body.name !== undefined ? req.body.name : products[index].name,
      description: req.body.description !== undefined ? req.body.description : products[index].description,
      price: req.body.price !== undefined ? parseFloat(req.body.price) : products[index].price,
      images: req.body.images !== undefined ? req.body.images : products[index].images,
      sizes: req.body.sizes !== undefined ? req.body.sizes : products[index].sizes,
      categories: req.body.categories !== undefined ? req.body.categories : products[index].categories,
      stock: req.body.stock !== undefined ? parseInt(req.body.stock) : products[index].stock,
      collections: req.body.collections !== undefined ? req.body.collections : products[index].collections
    };

    products[index] = updatedProduct;
    await db.saveProducts(products);
    res.json(updatedProduct);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    let products = await db.getProducts();
    const index = products.findIndex(p => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products = products.filter(p => p.id !== req.params.id);
    await db.saveProducts(products);
    res.json({ message: 'Product successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete product' });
  }
});


// --- Orders Endpoints ---
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const { customer, items, promoCode, paymentMethod } = req.body;
    
    if (!customer || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer information and items are required' });
    }

    const products = await db.getProducts();
    const promotions = await db.getPromotions();
    const config = await db.getStoreConfig();

    let subtotal = 0;
    const validatedItems = [];

    // Verify stock and calculate subtotal
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return res.status(400).json({ error: `Product ${item.productId} not found` });
      }

      if (product.stock < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
      }

      // Deduct stock
      product.stock -= item.quantity;
      
      subtotal += product.price * item.quantity;
      validatedItems.push({
        productId: product.id,
        name: product.name,
        size: item.size || 'M',
        quantity: item.quantity,
        price: product.price
      });
    }

    // Apply promotions if present
    let discount = 0;
    if (promoCode) {
      const promo = promotions.find(p => p.code.toUpperCase() === promoCode.toUpperCase() && p.active);
      if (promo) {
        if (promo.type === 'percent') {
          discount = parseFloat((subtotal * (promo.value / 100)).toFixed(2));
        } else if (promo.type === 'fixed') {
          discount = Math.min(promo.value, subtotal);
        }
      }
    }

    // Shipping and Tax configurations
    const shipping = subtotal >= (config.freeShippingThreshold || 150) ? 0 : (config.shippingFee || 10.00);
    const taxableAmount = Math.max(0, subtotal - discount);
    const tax = parseFloat((taxableAmount * ((config.taxRate || 8.25) / 100)).toFixed(2));
    const total = parseFloat((taxableAmount + shipping + tax).toFixed(2));

    // Create the order object
    const orders = await db.getOrders();
    const newOrder = {
      id: `NV-${1000 + orders.length + 1}`,
      customer,
      items: validatedItems,
      subtotal,
      discount,
      tax,
      shipping,
      total,
      promoCode: promoCode || '',
      paymentMethod: paymentMethod || 'Mock Card',
      status: 'Pending',
      date: new Date().toISOString()
    };

    orders.push(newOrder);
    await db.saveOrders(orders);
    await db.saveProducts(products); // Save updated stock levels
    
    res.status(201).json(newOrder);
  } catch (err) {
    console.error('Failed to create order:', err);
    res.status(500).json({ error: 'Failed to process order' });
  }
});

app.put('/api/orders/:id', async (req, res) => {
  try {
    const orders = await db.getOrders();
    const index = orders.findIndex(o => o.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    orders[index].status = req.body.status || orders[index].status;
    await db.saveOrders(orders);
    res.json(orders[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});


// --- Promotions Endpoints ---
app.get('/api/promotions', async (req, res) => {
  try {
    const promotions = await db.getPromotions();
    res.json(promotions);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve promotions' });
  }
});

app.post('/api/promotions', async (req, res) => {
  try {
    const promotions = await db.getPromotions();
    const code = req.body.code.toUpperCase();

    if (promotions.some(p => p.code === code)) {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }

    const newPromo = {
      code,
      type: req.body.type || 'percent',
      value: parseFloat(req.body.value) || 0,
      active: req.body.active !== undefined ? req.body.active : true,
      description: req.body.description || ''
    };

    promotions.push(newPromo);
    await db.savePromotions(promotions);
    res.status(201).json(newPromo);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

app.put('/api/promotions/:code', async (req, res) => {
  try {
    const promotions = await db.getPromotions();
    const code = req.params.code.toUpperCase();
    const index = promotions.findIndex(p => p.code === code);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    promotions[index] = {
      ...promotions[index],
      type: req.body.type !== undefined ? req.body.type : promotions[index].type,
      value: req.body.value !== undefined ? parseFloat(req.body.value) : promotions[index].value,
      active: req.body.active !== undefined ? req.body.active : promotions[index].active,
      description: req.body.description !== undefined ? req.body.description : promotions[index].description
    };

    await db.savePromotions(promotions);
    res.json(promotions[index]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

app.delete('/api/promotions/:code', async (req, res) => {
  try {
    let promotions = await db.getPromotions();
    const code = req.params.code.toUpperCase();
    const index = promotions.findIndex(p => p.code === code);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    promotions = promotions.filter(p => p.code !== code);
    await db.savePromotions(promotions);
    res.json({ message: 'Promotion successfully deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});


// --- Store Configuration Endpoints ---
app.get('/api/store', async (req, res) => {
  try {
    const config = await db.getStoreConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve store configuration' });
  }
});

app.put('/api/store', async (req, res) => {
  try {
    const config = await db.getStoreConfig();
    const updatedConfig = {
      ...config,
      name: req.body.name || config.name,
      address: req.body.address || config.address,
      phone: req.body.phone || config.phone,
      currency: req.body.currency || config.currency,
      taxRate: req.body.taxRate !== undefined ? parseFloat(req.body.taxRate) : config.taxRate,
      shippingFee: req.body.shippingFee !== undefined ? parseFloat(req.body.shippingFee) : config.shippingFee,
      freeShippingThreshold: req.body.freeShippingThreshold !== undefined ? parseFloat(req.body.freeShippingThreshold) : config.freeShippingThreshold,
      adminEmail: req.body.adminEmail !== undefined ? req.body.adminEmail : (config.adminEmail || 'admin@noirvirtu.com'),
      adminPassword: req.body.adminPassword !== undefined ? req.body.adminPassword : (config.adminPassword || 'admin')
    };

    await db.saveStoreConfig(updatedConfig);
    res.json(updatedConfig);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update store configuration' });
  }
});

// --- Admin Authentication Endpoint ---
app.post('/api/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const config = await db.getStoreConfig();
    
    const expectedEmail = config.adminEmail || 'admin@noirvirtu.com';
    const expectedPassword = config.adminPassword || 'admin';
    
    if (email === expectedEmail && password === expectedPassword) {
      res.json({ success: true, token: 'nv-session-tok-' + Date.now() });
    } else {
      res.status(401).json({ error: 'Invalid email or password' });
    }
  } catch (err) {
    res.status(500).json({ error: 'Authentication failed' });
  }
});


// --- Analytics Endpoints ---
app.get('/api/analytics', async (req, res) => {
  try {
    const orders = await db.getOrders();
    const promotions = await db.getPromotions();

    // 1. Core KPIs
    let totalRevenue = 0;
    let completedOrders = 0;
    
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        totalRevenue += o.total;
        completedOrders++;
      }
    });

    const averageOrderValue = completedOrders > 0 ? parseFloat((totalRevenue / completedOrders).toFixed(2)) : 0;
    const activePromos = promotions.filter(p => p.active).length;

    // 2. Weekly Trend - Last 14 days
    const trendMap = {};
    const today = new Date();
    
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      trendMap[dateString] = { date: dateString, revenue: 0, orders: 0 };
    }

    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        const orderDateStr = o.date.split('T')[0];
        if (trendMap[orderDateStr]) {
          trendMap[orderDateStr].revenue += o.total;
          trendMap[orderDateStr].orders += 1;
        }
      }
    });

    const weeklyTrend = Object.values(trendMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Hot Selling Items
    const productSales = {};
    orders.forEach(o => {
      if (o.status !== 'Cancelled') {
        o.items.forEach(item => {
          if (!productSales[item.productId]) {
            productSales[item.productId] = { name: item.name, quantity: 0, revenue: 0 };
          }
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.price * item.quantity;
        });
      }
    });

    const hotItems = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // 4. Promo code usage counts
    const promoUsage = {};
    orders.forEach(o => {
      if (o.status !== 'Cancelled' && o.promoCode) {
        promoUsage[o.promoCode] = (promoUsage[o.promoCode] || 0) + 1;
      }
    });

    res.json({
      summary: {
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        ordersCount: completedOrders,
        averageOrderValue,
        activePromos
      },
      weeklyTrend,
      hotItems,
      promoUsage
    });
  } catch (err) {
    console.error('Failed to aggregate analytics:', err);
    res.status(500).json({ error: 'Failed to retrieve analytics data' });
  }
});

// --- File Upload Endpoint ---
app.post('/api/upload', async (req, res) => {
  try {
    const { name, data } = req.body;
    if (!name || !data) {
      return res.status(400).json({ error: 'Missing name or data' });
    }

    const buffer = Buffer.from(data, 'base64');
    const uploadDir = path.join(process.cwd(), 'public', 'images', 'uploads');
    
    // Create directory if it does not exist
    await fs.promises.mkdir(uploadDir, { recursive: true });

    // Generate unique safe name
    const sanitizedName = name.replace(/[^a-zA-Z0-9.\-_]/g, '');
    const filename = `${Date.now()}-${sanitizedName}`;
    const filePath = path.join(uploadDir, filename);

    // Save buffer as file
    await fs.promises.writeFile(filePath, buffer);

    // Return the relative Vite public asset path
    res.json({ url: `/images/uploads/${filename}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Failed to process file upload' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
