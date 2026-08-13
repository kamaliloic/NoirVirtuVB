import React, { useState, useEffect, lazy, Suspense } from 'react';
import CustomerShop from './components/CustomerShop';
import ProductDetail from './components/ProductDetail';
import Checkout, { CartDrawer } from './components/Checkout';
import Receipt from './components/Receipt';
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const AdminProducts = lazy(() => import('./components/AdminProducts'));
const AdminOrders = lazy(() => import('./components/AdminOrders'));
const AdminPromotions = lazy(() => import('./components/AdminPromotions'));
const AdminSettings = lazy(() => import('./components/AdminSettings'));

export default function App() {
  // Navigation & Routing States
  const [view, setView] = useState('shop'); // 'shop' | 'checkout' | 'receipt' | 'admin'
  const [adminTab, setAdminTab] = useState('dashboard'); // 'dashboard' | 'products' | 'orders' | 'promotions' | 'settings'
  
  // Data Caches
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [storeConfig, setStoreConfig] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  
  // Selection / Interactive States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Alert system (toasts)
  const [toasts, setToasts] = useState([]);
  const [adminToken, setAdminToken] = useState(() => window.localStorage.getItem('adminToken') || '');
  const [adminSecretInput, setAdminSecretInput] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');
  const [isAdminAuthLoading, setIsAdminAuthLoading] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchStoreConfig(), fetchProducts(), fetchPromotions()]);
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!adminToken) return;
    const verifyAdmin = async () => {
      try {
        const response = await fetch('/api/admin/verify', {
          headers: { 'x-admin-token': adminToken }
        });
        if (!response.ok) {
          setAdminToken('');
          window.localStorage.removeItem('adminToken');
        }
      } catch {
        setAdminToken('');
        window.localStorage.removeItem('adminToken');
      }
    };
    verifyAdmin();
  }, [adminToken]);

  useEffect(() => {
    if (adminToken) {
      window.localStorage.setItem('adminToken', adminToken);
    } else {
      window.localStorage.removeItem('adminToken');
    }
  }, [adminToken]);

  useEffect(() => {
    if (view === 'admin' && adminToken) {
      fetchOrders();
      fetchAnalytics();
    }
  }, [view, adminToken]);

  const addToast = (text, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch('/api/store');
      const data = await res.json();
      setStoreConfig(data);
    } catch (err) {
      console.error('Failed to load store config', err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products', err);
    }
  };

  const fetchOrders = async (token = adminToken) => {
    try {
      const res = await fetch('/api/orders', {
        headers: token ? { 'x-admin-token': token } : {}
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAdminToken('');
          setAdminLoginError('Admin session expired, please sign in again.');
        }
        throw new Error('Failed to load orders');
      }
      const data = await res.json();
      setOrders(data.reverse()); // Show newest first in lists
    } catch (err) {
      console.error('Failed to load orders', err);
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await fetch('/api/promotions');
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      console.error('Failed to load promotions', err);
    }
  };

  const fetchAnalytics = async (token = adminToken) => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics', {
        headers: token ? { 'x-admin-token': token } : {}
      });
      if (!res.ok) {
        if (res.status === 401) {
          setAdminToken('');
          setAdminLoginError('Admin session expired, please sign in again.');
        }
        throw new Error('Failed to fetch analytics');
      }
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to aggregate analytics', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (secret) => {
    setAdminLoginError('');
    setIsAdminAuthLoading(true);
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Unable to authenticate admin access');
      }

      const { token } = await response.json();
      setAdminToken(token);
      setView('admin');
      addToast('Admin access granted.', 'success');
      await Promise.all([fetchOrders(token), fetchAnalytics(token)]);
    } catch (err) {
      setAdminLoginError(err.message || 'Admin login failed');
    } finally {
      setIsAdminAuthLoading(false);
    }
  };

  const handleAdminLogout = () => {
    setAdminToken('');
    setAdminSecretInput('');
    setAdminLoginError('');
    addToast('Admin portal locked.', 'info');
    setView('shop');
  };

  // Cart operations
  const handleAddToCart = (product, size, qty) => {
    setCart(prevCart => {
      const existingIdx = prevCart.findIndex(
        item => item.productId === product.id && item.size === size
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + qty;
        
        if (newQty > product.stock) {
          addToast(`Cannot add ${qty} more. Insufficient stock in inventory.`, 'error');
          return prevCart;
        }

        updated[existingIdx].quantity = newQty;
        addToast(`Updated quantity for ${product.name} [Size: ${size}]`, 'success');
        return updated;
      } else {
        if (qty > product.stock) {
          addToast(`Cannot add. Insufficient stock in inventory.`, 'error');
          return prevCart;
        }
        addToast(`Added ${product.name} [Size: ${size}] to bag`, 'success');
        return [...prevCart, {
          productId: product.id,
          name: product.name,
          price: product.price,
          images: product.images,
          size: size,
          quantity: qty
        }];
      }
    });
  };

  const handleUpdateCartQty = (productId, size, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId, size);
      return;
    }

    const prod = products.find(p => p.id === productId);
    if (prod && newQty > prod.stock) {
      addToast(`Cannot increase. Stock limit reached (${prod.stock} items left).`, 'error');
      return;
    }

    setCart(prevCart => prevCart.map(item => 
      item.productId === productId && item.size === size
        ? { ...item, quantity: newQty }
        : item
    ));
  };

  const handleRemoveCartItem = (productId, size) => {
    const item = cart.find(i => i.productId === productId && i.size === size);
    setCart(prevCart => prevCart.filter(
      i => !(i.productId === productId && i.size === size)
    ));
    if (item) {
      addToast(`Removed ${item.name} from bag`, 'info');
    }
  };

  const handleOrderSuccess = (newOrder) => {
    setCompletedOrder(newOrder);
    setCart([]); // Clear cart
    setView('receipt');
    addToast('Payment authorized. Order created successfully!', 'success');
    
    // Refresh caches
    fetchProducts();
  };

  // CRUD Sync Callbacks
  const handleProductCreated = (newProd) => {
    setProducts(prev => [newProd, ...prev]);
    addToast(`Product ${newProd.name} added successfully.`, 'success');
  };

  const handleProductUpdated = (updatedProd) => {
    setProducts(prev => prev.map(p => p.id === updatedProd.id ? updatedProd : p));
    addToast(`Product details saved.`, 'success');
  };

  const handleProductDeleted = (deletedId) => {
    setProducts(prev => prev.filter(p => p.id !== deletedId));
    addToast(`Product deleted from archive.`, 'info');
  };

  const handleOrderStatusUpdated = (updatedOrder) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    addToast(`Order ${updatedOrder.id} updated to: ${updatedOrder.status}`, 'success');
  };

  const handlePromoCreated = (newPromo) => {
    setPromotions(prev => [newPromo, ...prev]);
    addToast(`Coupon code ${newPromo.code} created.`, 'success');
  };

  const handlePromoUpdated = (updatedPromo) => {
    setPromotions(prev => prev.map(p => p.code === updatedPromo.code ? updatedPromo : p));
    addToast(`Coupon status updated.`, 'success');
  };

  const handlePromoDeleted = (deletedCode) => {
    setPromotions(prev => prev.filter(p => p.code !== deletedCode));
    addToast(`Coupon code ${deletedCode} deleted.`, 'info');
  };

  const handleConfigUpdated = (newConfig) => {
    setStoreConfig(newConfig);
    addToast(`Settings updated successfully.`, 'success');
  };

  // Render sub panels for admin view
  const renderAdminTab = () => {
    switch (adminTab) {
      case 'dashboard':
        return <AdminDashboard analyticsData={analyticsData} loading={loading} onRefresh={fetchAnalytics} />;
      case 'products':
        return (
          <AdminProducts 
            products={products} 
            adminToken={adminToken}
            onProductCreated={handleProductCreated}
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
          />
        );
      case 'orders':
        return (
          <AdminOrders 
            orders={orders} 
            adminToken={adminToken}
            storeConfig={storeConfig}
            onOrderStatusUpdated={handleOrderStatusUpdated}
            onPrintReceipt={(order) => {
              setCompletedOrder(order);
              setView('receipt');
            }}
          />
        );
      case 'promotions':
        return (
          <AdminPromotions 
            promotions={promotions} 
            adminToken={adminToken}
            onPromoCreated={handlePromoCreated}
            onPromoUpdated={handlePromoUpdated}
            onPromoDeleted={handlePromoDeleted}
          />
        );
      case 'settings':
        return <AdminSettings adminToken={adminToken} storeConfig={storeConfig} onConfigUpdated={handleConfigUpdated} />;
      default:
        return <AdminDashboard analyticsData={analyticsData} loading={loading} onRefresh={fetchAnalytics} />;
    }
  };

  return (
    <>
      {/* 1. CUSTOMER SHOP VIEW */}
      {view === 'shop' && (
        <CustomerShop 
          onProductSelect={(product) => setSelectedProduct(product)} 
          cartItemsCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          onCartOpen={() => setIsCartOpen(true)}
          onNavigateToAdmin={() => setView('admin')}
        />
      )}

      {/* 2. CUSTOMER CHECKOUT VIEW */}
      {view === 'checkout' && (
        <div className="app-container">
          <nav className="navbar" style={{ position: 'static' }}>
            <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setView('shop')}>
              NOIR VIRTU
            </div>
            <div style={{ textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.1em', color: 'var(--text-secondary)' }}>
              Secure checkout gateway
            </div>
          </nav>
          
          <Checkout 
            cartItems={cart} 
            storeConfig={storeConfig} 
            onOrderSuccess={handleOrderSuccess}
            onCancel={() => setView('shop')}
          />
        </div>
      )}

      {/* 3. PRINTABLE INVOICE / RECEIPT VIEW */}
      {view === 'receipt' && (
        <Receipt 
          order={completedOrder} 
          storeConfig={storeConfig} 
          onContinue={() => {
            setCompletedOrder(null);
            setView('shop');
          }}
        />
      )}

      {/* 4. ADMIN PORTAL VIEW */}
      {view === 'admin' && (
        <div className="admin-layout">
          {!adminToken ? (
            <div className="admin-auth-panel" style={{ width: '100%', minHeight: '70vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <div className="admin-panel" style={{ maxWidth: '420px', width: '100%', padding: '2rem' }}>
                <h2 style={{ marginBottom: '1rem', letterSpacing: '0.12em' }}>Admin Access Required</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                  Enter the administrator access key to unlock the portal. This protects inventory management, order tracking, and store settings.
                </p>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAdminLogin(adminSecretInput);
                  }}
                >
                  <div className="form-group">
                    <label htmlFor="admin-secret">Admin Access Key</label>
                    <input
                      id="admin-secret"
                      type="password"
                      className="form-input"
                      value={adminSecretInput}
                      onChange={(e) => setAdminSecretInput(e.target.value)}
                      placeholder="Enter your admin access key"
                      autoFocus
                    />
                  </div>

                  {adminLoginError && (
                    <div style={{ color: 'var(--danger)', marginBottom: '1rem', fontSize: '0.95rem' }}>
                      {adminLoginError}
                    </div>
                  )}

                  <div className="modal-actions" style={{ gap: '0.75rem' }}>
                    <button type="submit" className="btn" disabled={isAdminAuthLoading}>
                      {isAdminAuthLoading ? 'Verifying...' : 'Unlock Admin Portal'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setView('shop')}
                    >
                      Back to Shop
                    </button>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                  <span className="admin-logo">NOIR VIRTU</span>
                  <span className="admin-logo-badge">Admin</span>
                </div>

                <ul className="admin-nav">
                  <li>
                    <button 
                      className={`admin-nav-item ${adminTab === 'dashboard' ? 'active' : ''}`}
                      onClick={() => setAdminTab('dashboard')}
                    >
                      📊 Dashboard Overview
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`admin-nav-item ${adminTab === 'products' ? 'active' : ''}`}
                      onClick={() => setAdminTab('products')}
                    >
                      👕 Products Manager
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`admin-nav-item ${adminTab === 'orders' ? 'active' : ''}`}
                      onClick={() => setAdminTab('orders')}
                    >
                      📦 Orders & Invoices
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`admin-nav-item ${adminTab === 'promotions' ? 'active' : ''}`}
                      onClick={() => setAdminTab('promotions')}
                    >
                      🏷️ VIP Promotions
                    </button>
                  </li>
                  <li>
                    <button 
                      className={`admin-nav-item ${adminTab === 'settings' ? 'active' : ''}`}
                      onClick={() => setAdminTab('settings')}
                    >
                      ⚙️ Store Settings
                    </button>
                  </li>
                </ul>

                <button 
                  className="btn btn-secondary" 
                  style={{ marginTop: 'auto', width: '100%', fontSize: '0.8rem', padding: '0.6rem' }}
                  onClick={() => setView('shop')}
                >
                  ← Back to Shop
                </button>
              </aside>

              {/* MAIN SPACE */}
              <main className="admin-main">
                <header className="admin-header">
                  <div>
                    <h2 className="admin-title">
                      {adminTab === 'dashboard' && 'Dashboard Overview'}
                      {adminTab === 'products' && 'Clothing Catalog Manager'}
                      {adminTab === 'orders' && 'Order Invoicing Tracker'}
                      {adminTab === 'promotions' && 'Promo Code Campaigns'}
                      {adminTab === 'settings' && 'Store Configuration settings'}
                    </h2>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
                      System: ONLINE // DB: LOCAL FS
                    </div>
                  </div>
                  <button className="btn btn-secondary" style={{ height: '2.5rem' }} onClick={handleAdminLogout}>
                    Lock Portal
                  </button>
                </header>
                
                <Suspense fallback={<div style={{ padding: '2rem', color: 'var(--text-secondary)' }}>Loading admin panel…</div>}>
                  {renderAdminTab()}
                </Suspense>
              </main>
            </>
          )}
        </div>
      )}

      {/* --- CART DRAWER OVERLAY --- */}
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cart}
        storeConfig={storeConfig}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setView('checkout');
        }}
      />

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <ProductDetail 
          product={selectedProduct} 
          onClose={() => setSelectedProduct(null)} 
          onAddToCart={handleAddToCart}
        />
      )}

      {/* --- TOAST NOTIFICATIONS --- */}
      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
