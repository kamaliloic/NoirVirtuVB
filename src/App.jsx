import React, { useState, useEffect } from 'react';
import CustomerShop from './components/CustomerShop';
import ProductDetail from './components/ProductDetail';
import Checkout, { CartDrawer } from './components/Checkout';
import Receipt from './components/Receipt';
import AdminDashboard from './components/AdminDashboard';
import AdminProducts from './components/AdminProducts';
import AdminOrders from './components/AdminOrders';
import AdminPromotions from './components/AdminPromotions';
import AdminSettings from './components/AdminSettings';

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

  useEffect(() => {
    // Initial fetch of vital data
    fetchStoreConfig();
    fetchProducts();
    fetchPromotions();
  }, []);

  // Fetch when going into admin view
  useEffect(() => {
    if (view === 'admin') {
      fetchOrders();
      fetchAnalytics();
      fetchProducts();
      fetchPromotions();
    }
  }, [view, adminTab]);

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

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/orders');
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

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics');
      const data = await res.json();
      setAnalyticsData(data);
    } catch (err) {
      console.error('Failed to aggregate analytics', err);
    } finally {
      setLoading(false);
    }
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
            onProductCreated={handleProductCreated}
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
          />
        );
      case 'orders':
        return (
          <AdminOrders 
            orders={orders} 
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
            onPromoCreated={handlePromoCreated}
            onPromoUpdated={handlePromoUpdated}
            onPromoDeleted={handlePromoDeleted}
          />
        );
      case 'settings':
        return <AdminSettings storeConfig={storeConfig} onConfigUpdated={handleConfigUpdated} />;
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
          {/* SIDEBAR */}
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
            </header>
            
            {renderAdminTab()}
          </main>
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
