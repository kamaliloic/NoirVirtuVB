import express from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { db } from './db.js';

const app = express();
const PORT = process.env.PORT || 5001;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const ALLOWED_ORIGINS = new Set([CLIENT_ORIGIN]);
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'NOIR-VIRTU-ADMIN-KEY';
const adminTokens = new Set();

app.disable('x-powered-by');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || ALLOWED_ORIGINS.has(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Admin-Token']
}));
app.use(express.json({ limit: '10kb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  next();
});

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';
const toPositiveInteger = (value) => {
  const result = parseInt(value, 10);
  return Number.isInteger(result) && result >= 0 ? result : null;
};
const toNonNegativeNumber = (value) => {
  const result = parseFloat(value);
  return Number.isFinite(result) && result >= 0 ? result : null;
};

let orderProcessingQueue = Promise.resolve();

const runSerializedOrderOperation = (task) => {
  const previous = orderProcessingQueue;
  const next = previous.then(task, task);
  orderProcessingQueue = next.catch(() => {});
  return next;
};

const validateProductPayload = (payload, isUpdate = false) => {
  if (!isUpdate && !isNonEmptyString(payload.name)) {
    return 'Product name is required';
  }

  if (payload.name !== undefined && !isNonEmptyString(payload.name)) {
    return 'Product name must be a non-empty string';
  }

  if (payload.description !== undefined && typeof payload.description !== 'string') {
    return 'Product description must be a string';
  }

  if (payload.price !== undefined) {
    const price = toNonNegativeNumber(payload.price);
    if (price === null) return 'Product price must be a valid non-negative number';
  }

  if (payload.stock !== undefined) {
    const stock = toPositiveInteger(payload.stock);
    if (stock === null) return 'Product stock must be a valid non-negative integer';
  }

  if (payload.sizes !== undefined && !Array.isArray(payload.sizes)) {
    return 'Product sizes must be an array';
  }

  if (payload.categories !== undefined && !Array.isArray(payload.categories)) {
    return 'Product categories must be an array';
  }

  if (payload.collections !== undefined && !Array.isArray(payload.collections)) {
    return 'Product collections must be an array';
  }

  if (payload.images !== undefined && !Array.isArray(payload.images)) {
    return 'Product images must be an array of strings';
  }

  return null;
};

const validateOrderPayload = (body) => {
  if (!body || typeof body !== 'object') return 'Invalid order body';
  const { customer, items } = body;
  if (!customer || typeof customer !== 'object') return 'Customer information is required';
  if (!isNonEmptyString(customer.name)) return 'Customer name is required';
  if (!isNonEmptyString(customer.email)) return 'Customer email is required';
  if (!isNonEmptyString(customer.address)) return 'Customer address is required';
  if (!isNonEmptyString(customer.city)) return 'Customer city is required';
  if (!isNonEmptyString(customer.state)) return 'Customer state is required';
  if (!isNonEmptyString(customer.postalCode)) return 'Customer postal code is required';
  if (!Array.isArray(items) || items.length === 0) return 'At least one order item is required';

  for (const item of items) {
    if (!isNonEmptyString(item.productId)) return 'Each order item must include a productId';
    const qty = toPositiveInteger(item.quantity);
    if (qty === null || qty === 0) return 'Each order item quantity must be a positive integer';
  }

  return null;
};

const validatePromotionPayload = (payload, isUpdate = false) => {
  if (!isUpdate && !isNonEmptyString(payload.code)) return 'Promotion code is required';
  if (payload.value !== undefined) {
    const value = toNonNegativeNumber(payload.value);
    if (value === null) return 'Promotion value must be a valid non-negative number';
  }
  if (payload.active !== undefined && typeof payload.active !== 'boolean') {
    return 'Promotion active flag must be a boolean';
  }
  return null;
};

const validateStorePayload = (payload) => {
  if (!payload || typeof payload !== 'object') return 'Invalid store configuration';
  if (payload.taxRate !== undefined && toNonNegativeNumber(payload.taxRate) === null) {
    return 'Sales tax must be a valid non-negative number';
  }
  if (payload.shippingFee !== undefined && toNonNegativeNumber(payload.shippingFee) === null) {
    return 'Shipping fee must be a valid non-negative number';
  }
  if (payload.freeShippingThreshold !== undefined && toNonNegativeNumber(payload.freeShippingThreshold) === null) {
    return 'Free shipping threshold must be a valid non-negative number';
  }
  return null;
};

const getAdminToken = (req) => {
  if (typeof req.headers['x-admin-token'] === 'string' && req.headers['x-admin-token'].trim()) {
    return req.headers['x-admin-token'].trim();
  }

  if (typeof req.headers.authorization === 'string' && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.slice(7).trim();
  }

  if (req.body && typeof req.body.adminToken === 'string' && req.body.adminToken.trim()) {
    return req.body.adminToken.trim();
  }

  return '';
};

const requireAdminAuth = (req, res, next) => {
  const token = getAdminToken(req);
  if (token && adminTokens.has(token)) {
    return next();
  }

  return res.status(401).json({ error: 'Admin access denied' });
};

app.post('/api/admin/login', (req, res) => {
  const { secret } = req.body;
  if (!isNonEmptyString(secret)) {
    return res.status(400).json({ error: 'Admin secret is required' });
  }

  if (secret !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Invalid admin secret' });
  }

  const token = crypto.randomUUID();
  adminTokens.add(token);
  return res.json({ token, expiresInSeconds: 3600 });
});

app.get('/api/admin/verify', requireAdminAuth, (req, res) => {
  return res.json({ authenticated: true });
});

// --- Products Endpoints ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await db.getProducts();
    res.json(products);
  } catch (err) {
    console.error('Failed to retrieve products:', err);
    res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

app.post('/api/products', requireAdminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      images: Array.isArray(req.body.images) && req.body.images.length > 0 ? req.body.images : ['/images/placeholder.jpg'],
      sizes: Array.isArray(req.body.sizes) && req.body.sizes.length > 0 ? req.body.sizes : ['S', 'M', 'L', 'XL'],
      categories: Array.isArray(req.body.categories) && req.body.categories.length > 0 ? req.body.categories : ['Tops'],
      collections: Array.isArray(req.body.collections) ? req.body.collections : []
    };

    const validationError = validateProductPayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const products = await db.getProducts();
    const newProduct = {
      id: isNonEmptyString(payload.id) ? payload.id.trim() : `NOIR-${Math.floor(100 + Math.random() * 900)}`,
      name: payload.name.trim(),
      description: isNonEmptyString(payload.description) ? payload.description.trim() : '',
      price: toNonNegativeNumber(payload.price) ?? 0,
      images: payload.images.map((img) => (isNonEmptyString(img) ? img.trim() : '/images/placeholder.jpg')),
      sizes: payload.sizes.map((size) => size.trim()).filter((size) => size !== ''),
      categories: payload.categories.map((category) => category.trim()).filter((category) => category !== ''),
      stock: toPositiveInteger(payload.stock) ?? 0,
      collections: payload.collections.map((collection) => collection.trim()).filter((collection) => collection !== '')
    };
    
    if (products.some((p) => p.id === newProduct.id)) {
      return res.status(400).json({ error: 'Product ID already exists' });
    }

    products.push(newProduct);
    await db.saveProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error('Failed to create product:', err);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

app.put('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    const products = await db.getProducts();
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const payload = {
      ...req.body,
      images: req.body.images !== undefined ? req.body.images : products[index].images,
      sizes: req.body.sizes !== undefined ? req.body.sizes : products[index].sizes,
      categories: req.body.categories !== undefined ? req.body.categories : products[index].categories,
      collections: req.body.collections !== undefined ? req.body.collections : products[index].collections
    };

    const validationError = validateProductPayload(payload, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const updatedProduct = {
      ...products[index],
      name: req.body.name !== undefined ? req.body.name.trim() : products[index].name,
      description: req.body.description !== undefined ? req.body.description.trim() : products[index].description,
      price: req.body.price !== undefined ? toNonNegativeNumber(req.body.price) : products[index].price,
      images: req.body.images !== undefined ? req.body.images.map((img) => (isNonEmptyString(img) ? img.trim() : '/images/placeholder.jpg')) : products[index].images,
      sizes: req.body.sizes !== undefined ? req.body.sizes.map((size) => size.trim()).filter((size) => size !== '') : products[index].sizes,
      categories: req.body.categories !== undefined ? req.body.categories.map((category) => category.trim()).filter((category) => category !== '') : products[index].categories,
      stock: req.body.stock !== undefined ? toPositiveInteger(req.body.stock) : products[index].stock,
      collections: req.body.collections !== undefined ? req.body.collections.map((collection) => collection.trim()).filter((collection) => collection !== '') : products[index].collections
    };

    products[index] = updatedProduct;
    await db.saveProducts(products);
    res.json(updatedProduct);
  } catch (err) {
    console.error('Failed to update product:', err);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

app.delete('/api/products/:id', requireAdminAuth, async (req, res) => {
  try {
    let products = await db.getProducts();
    const index = products.findIndex((p) => p.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    products = products.filter((p) => p.id !== req.params.id);
    await db.saveProducts(products);
    res.json({ message: 'Product successfully deleted' });
  } catch (err) {
    console.error('Failed to delete product:', err);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});


// --- Orders Endpoints ---
app.get('/api/orders', requireAdminAuth, async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    console.error('Failed to retrieve orders:', err);
    res.status(500).json({ error: 'Failed to retrieve orders' });
  }
});

app.post('/api/orders', async (req, res) => {
  return runSerializedOrderOperation(async () => {
    try {
      const validationError = validateOrderPayload(req.body);
      if (validationError) {
        return res.status(400).json({ error: validationError });
      }

      const { customer, items, promoCode, paymentMethod } = req.body;
      const products = await db.getProducts();
      const promotions = await db.getPromotions();
      const config = await db.getStoreConfig();

      let subtotal = 0;
      const validatedItems = [];

      for (const item of items) {
        const product = products.find((p) => p.id === item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }

        const quantity = toPositiveInteger(item.quantity);
        if (quantity === null || quantity === 0) {
          return res.status(400).json({ error: `Invalid quantity for product ${item.productId}` });
        }

        if (product.stock < quantity) {
          return res.status(400).json({ error: `Insufficient stock for product ${product.name}` });
        }

        product.stock -= quantity;
        subtotal += product.price * quantity;
        validatedItems.push({
          productId: product.id,
          name: product.name,
          size: isNonEmptyString(item.size) ? item.size.trim() : 'M',
          quantity,
          price: product.price
        });
      }

      let discount = 0;
      if (isNonEmptyString(promoCode)) {
        const promo = promotions.find((p) => p.code.toUpperCase() === promoCode.toUpperCase() && p.active);
        if (promo) {
          if (promo.type === 'percent') {
            discount = parseFloat((subtotal * (promo.value / 100)).toFixed(2));
          } else if (promo.type === 'fixed') {
            discount = Math.min(promo.value, subtotal);
          }
        }
      }

      const shipping = subtotal >= (config.freeShippingThreshold || 150) ? 0 : (config.shippingFee || 10.0);
      const taxableAmount = Math.max(0, subtotal - discount);
      const tax = parseFloat((taxableAmount * ((config.taxRate || 8.25) / 100)).toFixed(2));
      const total = parseFloat((taxableAmount + shipping + tax).toFixed(2));

      const orders = await db.getOrders();
      const newOrder = {
        id: `NV-${1000 + orders.length + 1}`,
        customer: {
          name: customer.name.trim(),
          email: customer.email.trim(),
          address: customer.address.trim(),
          city: customer.city.trim(),
          state: customer.state.trim(),
          postalCode: customer.postalCode.trim()
        },
        items: validatedItems,
        subtotal,
        discount,
        tax,
        shipping,
        total,
        promoCode: isNonEmptyString(promoCode) ? promoCode.toUpperCase().trim() : '',
        paymentMethod: isNonEmptyString(paymentMethod) ? paymentMethod.trim() : 'Mock Card',
        status: 'Pending',
        date: new Date().toISOString()
      };

      orders.push(newOrder);
      await db.saveOrders(orders);
      await db.saveProducts(products);

      return res.status(201).json(newOrder);
    } catch (err) {
      console.error('Failed to create order:', err);
      return res.status(500).json({ error: 'Failed to process order' });
    }
  });
});

app.put('/api/orders/:id', requireAdminAuth, async (req, res) => {
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
    console.error('Failed to update order:', err);
    res.status(500).json({ error: 'Failed to update order' });
  }
});


// --- Promotions Endpoints ---
app.get('/api/promotions', async (req, res) => {
  try {
    const promotions = await db.getPromotions();
    res.json(promotions);
  } catch (err) {
    console.error('Failed to retrieve promotions:', err);
    res.status(500).json({ error: 'Failed to retrieve promotions' });
  }
});

app.post('/api/promotions', requireAdminAuth, async (req, res) => {
  try {
    const payload = {
      ...req.body,
      code: isNonEmptyString(req.body.code) ? req.body.code.trim().toUpperCase() : ''
    };

    const validationError = validatePromotionPayload(payload);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const promotions = await db.getPromotions();
    if (promotions.some((p) => p.code === payload.code)) {
      return res.status(400).json({ error: 'Promotion code already exists' });
    }

    const newPromo = {
      code: payload.code,
      type: payload.type || 'percent',
      value: toNonNegativeNumber(payload.value) ?? 0,
      active: payload.active !== undefined ? payload.active : true,
      description: isNonEmptyString(payload.description) ? payload.description.trim() : ''
    };

    promotions.push(newPromo);
    await db.savePromotions(promotions);
    res.status(201).json(newPromo);
  } catch (err) {
    console.error('Failed to create promotion:', err);
    res.status(500).json({ error: 'Failed to create promotion' });
  }
});

app.put('/api/promotions/:code', requireAdminAuth, async (req, res) => {
  try {
    const promotions = await db.getPromotions();
    const code = req.params.code.toUpperCase();
    const index = promotions.findIndex((p) => p.code === code);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Promotion not found' });
    }

    const payload = {
      ...req.body,
      active: req.body.active !== undefined ? req.body.active : promotions[index].active
    };

    const validationError = validatePromotionPayload(payload, true);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    promotions[index] = {
      ...promotions[index],
      type: payload.type !== undefined ? payload.type : promotions[index].type,
      value: payload.value !== undefined ? toNonNegativeNumber(payload.value) : promotions[index].value,
      active: payload.active,
      description: payload.description !== undefined ? payload.description : promotions[index].description
    };

    await db.savePromotions(promotions);
    res.json(promotions[index]);
  } catch (err) {
    console.error('Failed to update promotion:', err);
    res.status(500).json({ error: 'Failed to update promotion' });
  }
});

app.delete('/api/promotions/:code', requireAdminAuth, async (req, res) => {
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
    console.error('Failed to delete promotion:', err);
    res.status(500).json({ error: 'Failed to delete promotion' });
  }
});


// --- Store Configuration Endpoints ---
app.get('/api/store', async (req, res) => {
  try {
    const config = await db.getStoreConfig();
    res.json(config);
  } catch (err) {
    console.error('Failed to retrieve store configuration:', err);
    res.status(500).json({ error: 'Failed to retrieve store configuration' });
  }
});

app.put('/api/store', requireAdminAuth, async (req, res) => {
  try {
    const validationError = validateStorePayload(req.body);
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    const config = await db.getStoreConfig();
    const updatedConfig = {
      ...config,
      name: isNonEmptyString(req.body.name) ? req.body.name.trim() : config.name,
      address: isNonEmptyString(req.body.address) ? req.body.address.trim() : config.address,
      phone: isNonEmptyString(req.body.phone) ? req.body.phone.trim() : config.phone,
      currency: isNonEmptyString(req.body.currency) ? req.body.currency.trim().toUpperCase() : config.currency,
      taxRate: req.body.taxRate !== undefined ? toNonNegativeNumber(req.body.taxRate) : config.taxRate,
      shippingFee: req.body.shippingFee !== undefined ? toNonNegativeNumber(req.body.shippingFee) : config.shippingFee,
      freeShippingThreshold: req.body.freeShippingThreshold !== undefined ? toNonNegativeNumber(req.body.freeShippingThreshold) : config.freeShippingThreshold
    };

    await db.saveStoreConfig(updatedConfig);
    res.json(updatedConfig);
  } catch (err) {
    console.error('Failed to update store configuration:', err);
    res.status(500).json({ error: 'Failed to update store configuration' });
  }
});


// --- Analytics Endpoints ---
app.get('/api/analytics', requireAdminAuth, async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
