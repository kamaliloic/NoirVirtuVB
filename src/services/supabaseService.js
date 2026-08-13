import { supabase } from '../supabaseClient.js';

// --- PRODUCTS ---
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Supabase getProducts error:', error);
    throw error;
  }
  return data || [];
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
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .order('date', { ascending: false });

  if (error) {
    console.error('Supabase getOrders error:', error);
    throw error;
  }
  return data || [];
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
  const { data, error } = await supabase
    .from('promotions')
    .select('*');

  if (error) {
    console.error('Supabase getPromotions error:', error);
    throw error;
  }
  return data || [];
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
  const { data, error } = await supabase
    .from('store_config')
    .select('*')
    .eq('id', 'default')
    .maybeSingle();

  if (error) {
    console.error('Supabase getStoreConfig error:', error);
  }
  
  if (data) {
    return {
      ...data,
      taxRate: data.tax_rate,
      shippingFee: data.shipping_fee,
      freeShippingThreshold: data.free_shipping_threshold,
      adminEmail: data.admin_email,
      adminPassword: data.admin_password
    };
  }

  return null;
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
