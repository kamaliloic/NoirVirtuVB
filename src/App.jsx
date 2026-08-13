import React, { useState, useEffect } from "react";
import CustomerShop from "./components/CustomerShop";
import ProductDetail from "./components/ProductDetail";
import Checkout, { CartDrawer } from "./components/Checkout";
import Receipt from "./components/Receipt";
import AdminDashboard from "./components/AdminDashboard";
import AdminProducts from "./components/AdminProducts";
import AdminOrders from "./components/AdminOrders";
import AdminPromotions from "./components/AdminPromotions";
import AdminSettings from "./components/AdminSettings";
import AdminLogin from "./components/AdminLogin";
// Local file system is used as the primary database

export default function App() {
  // Navigation & Routing States
  const [view, setView] = useState("shop"); // 'shop' | 'checkout' | 'receipt' | 'admin'
  const [adminTab, setAdminTab] = useState("dashboard"); // 'dashboard' | 'products' | 'orders' | 'promotions' | 'settings'
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(() => {
    return sessionStorage.getItem("noir_admin_authenticated") === "true";
  });

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
    if (view === "admin") {
      fetchOrders();
      fetchAnalytics();
      fetchProducts();
      fetchPromotions();
    }
  }, [view, adminTab]);

  const addToast = (text, type = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, text, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch("/api/store");
      if (!res.ok) throw new Error("Failed to fetch store config");
      const data = await res.json();
      setStoreConfig(data);
    } catch (err) {
      console.error("Failed to load store config", err);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error("Failed to load products", err);
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/orders");
      if (!res.ok) throw new Error("Failed to fetch orders");
      const data = await res.json();
      setOrders(data || []);
    } catch (err) {
      console.error("Failed to load orders", err);
    }
  };

  const fetchPromotions = async () => {
    try {
      const res = await fetch("/api/promotions");
      if (!res.ok) throw new Error("Failed to fetch promotions");
      const data = await res.json();
      setPromotions(data);
    } catch (err) {
      console.error("Failed to load promotions", err);
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/analytics");
      if (!res.ok) throw new Error("Failed to fetch analytics");
      const data = await res.json();
      setAnalyticsData(data || {});
    } catch (err) {
      console.error("Failed to aggregate analytics", err);
    } finally {
      setLoading(false);
    }
  };

  // Cart operations
  const handleAddToCart = (product, size, qty) => {
    setCart((prevCart) => {
      const existingIdx = prevCart.findIndex(
        (item) => item.productId === product.id && item.size === size,
      );

      if (existingIdx > -1) {
        const updated = [...prevCart];
        const newQty = updated[existingIdx].quantity + qty;

        if (newQty > product.stock) {
          addToast(
            `Cannot add ${qty} more. Insufficient stock in inventory.`,
            "error",
          );
          return prevCart;
        }

        updated[existingIdx].quantity = newQty;
        addToast(
          `Updated quantity for ${product.name} [Size: ${size}]`,
          "success",
        );
        return updated;
      } else {
        if (qty > product.stock) {
          addToast(`Cannot add. Insufficient stock in inventory.`, "error");
          return prevCart;
        }
        addToast(`Added ${product.name} [Size: ${size}] to bag`, "success");
        return [
          ...prevCart,
          {
            productId: product.id,
            name: product.name,
            price: product.price,
            images: product.images,
            size: size,
            quantity: qty,
          },
        ];
      }
    });
  };

  const handleUpdateCartQty = (productId, size, newQty) => {
    if (newQty <= 0) {
      handleRemoveCartItem(productId, size);
      return;
    }

    const prod = products.find((p) => p.id === productId);
    if (prod && newQty > prod.stock) {
      addToast(
        `Cannot increase. Stock limit reached (${prod.stock} items left).`,
        "error",
      );
      return;
    }

    setCart((prevCart) =>
      prevCart.map((item) =>
        item.productId === productId && item.size === size
          ? { ...item, quantity: newQty }
          : item,
      ),
    );
  };

  const handleRemoveCartItem = (productId, size) => {
    const item = cart.find((i) => i.productId === productId && i.size === size);
    setCart((prevCart) =>
      prevCart.filter((i) => !(i.productId === productId && i.size === size)),
    );
    if (item) {
      addToast(`Removed ${item.name} from bag`, "info");
    }
  };

  const handleOrderSuccess = (newOrder) => {
    setCompletedOrder(newOrder);
    setCart([]); // Clear cart
    setView("receipt");
    addToast("Payment authorized. Order created successfully!", "success");

    // Refresh caches
    fetchProducts();
  };

  // CRUD Sync Callbacks
  const handleProductCreated = (newProd) => {
    setProducts((prev) => [newProd, ...prev]);
    addToast(`Product ${newProd.name} added successfully.`, "success");
  };

  const handleProductUpdated = (updatedProd) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)),
    );
    addToast(`Product details saved.`, "success");
  };

  const handleProductDeleted = (deletedId) => {
    setProducts((prev) => prev.filter((p) => p.id !== deletedId));
    addToast(`Product deleted from archive.`, "info");
  };

  const handleOrderStatusUpdated = (updatedOrder) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
    );
    addToast(
      `Order ${updatedOrder.id} updated to: ${updatedOrder.status}`,
      "success",
    );
  };

  const handlePromoCreated = (newPromo) => {
    setPromotions((prev) => [newPromo, ...prev]);
    addToast(`Coupon code ${newPromo.code} created.`, "success");
  };

  const handlePromoUpdated = (updatedPromo) => {
    setPromotions((prev) =>
      prev.map((p) => (p.code === updatedPromo.code ? updatedPromo : p)),
    );
    addToast(`Coupon status updated.`, "success");
  };

  const handlePromoDeleted = (deletedCode) => {
    setPromotions((prev) => prev.filter((p) => p.code !== deletedCode));
    addToast(`Coupon code ${deletedCode} deleted.`, "info");
  };

  const handleConfigUpdated = (newConfig) => {
    setStoreConfig(newConfig);
    addToast(`Settings updated successfully.`, "success");
  };

  // Render sub panels for admin view
  const renderAdminTab = () => {
    switch (adminTab) {
      case "dashboard":
        return (
          <AdminDashboard
            analyticsData={analyticsData}
            loading={loading}
            onRefresh={fetchAnalytics}
            storeConfig={storeConfig}
          />
        );
      case "products":
        return (
          <AdminProducts
            products={products}
            onProductCreated={handleProductCreated}
            onProductUpdated={handleProductUpdated}
            onProductDeleted={handleProductDeleted}
            storeConfig={storeConfig}
          />
        );
      case "orders":
        return (
          <AdminOrders
            orders={orders}
            storeConfig={storeConfig}
            onOrderStatusUpdated={handleOrderStatusUpdated}
            onPrintReceipt={(order) => {
              setCompletedOrder(order);
              setView("receipt");
            }}
          />
        );
      case "promotions":
        return (
          <AdminPromotions
            promotions={promotions}
            onPromoCreated={handlePromoCreated}
            onPromoUpdated={handlePromoUpdated}
            onPromoDeleted={handlePromoDeleted}
            storeConfig={storeConfig}
          />
        );
      case "settings":
        return (
          <AdminSettings
            storeConfig={storeConfig}
            onConfigUpdated={handleConfigUpdated}
          />
        );
      default:
        return (
          <AdminDashboard
            analyticsData={analyticsData}
            loading={loading}
            onRefresh={fetchAnalytics}
            storeConfig={storeConfig}
          />
        );
    }
  };

  return (
    <>
      {/* 1. CUSTOMER SHOP VIEW */}
      {view === "shop" && (
        <CustomerShop
          onProductSelect={(product) => setSelectedProduct(product)}
          cartItemsCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
          onCartOpen={() => setIsCartOpen(true)}
          onNavigateToAdmin={() => setView("admin")}
          storeConfig={storeConfig}
        />
      )}

      {/* 2. CUSTOMER CHECKOUT VIEW */}
      {view === "checkout" && (
        <div className="app-container">
          <nav className="navbar" style={{ position: "static" }}>
            <div
              className="logo"
              style={{ cursor: "pointer" }}
              onClick={() => setView("shop")}
            >
              NOIR VIRTU
            </div>
            <div
              style={{
                textTransform: "uppercase",
                fontSize: "0.8rem",
                letterSpacing: "0.1em",
                color: "var(--text-secondary)",
              }}
            >
              Secure checkout gateway
            </div>
          </nav>

          <Checkout
            cartItems={cart}
            storeConfig={storeConfig}
            onOrderSuccess={handleOrderSuccess}
            onCancel={() => setView("shop")}
          />
        </div>
      )}

      {/* 3. PRINTABLE INVOICE / RECEIPT VIEW */}
      {view === "receipt" && (
        <Receipt
          order={completedOrder}
          storeConfig={storeConfig}
          onContinue={() => {
            setCompletedOrder(null);
            setView("shop");
          }}
        />
      )}

      {/* 4. ADMIN PORTAL VIEW */}
      {view === "admin" &&
        (!isAdminAuthenticated ? (
          <AdminLogin
            storeConfig={storeConfig}
            onLoginSuccess={() => {
              setIsAdminAuthenticated(true);
              sessionStorage.setItem("noir_admin_authenticated", "true");
              fetchStoreConfig();
              addToast("Welcome, Administrator.", "success");
            }}
            onCancel={() => setView("shop")}
          />
        ) : (
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
                    className={`admin-nav-item ${adminTab === "dashboard" ? "active" : ""}`}
                    onClick={() => setAdminTab("dashboard")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <line x1="18" y1="20" x2="18" y2="10"></line>
                      <line x1="12" y1="20" x2="12" y2="4"></line>
                      <line x1="6" y1="20" x2="6" y2="14"></line>
                    </svg>
                    Dashboard Overview
                  </button>
                </li>
                <li>
                  <button
                    className={`admin-nav-item ${adminTab === "products" ? "active" : ""}`}
                    onClick={() => setAdminTab("products")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M12 2a3 3 0 0 0-3 3h6a3 3 0 0 0-3-3z" />
                      <path d="M22 10a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v3z" />
                      <path d="M12 14v7" />
                      <path d="M9 21h6" />
                    </svg>
                    Products Manager
                  </button>
                </li>
                <li>
                  <button
                    className={`admin-nav-item ${adminTab === "orders" ? "active" : ""}`}
                    onClick={() => setAdminTab("orders")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
                      <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
                      <line x1="12" y1="22.08" x2="12" y2="12"></line>
                    </svg>
                    Orders & Invoices
                  </button>
                </li>
                <li>
                  <button
                    className={`admin-nav-item ${adminTab === "promotions" ? "active" : ""}`}
                    onClick={() => setAdminTab("promotions")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
                      <line x1="7" y1="7" x2="7.01" y2="7"></line>
                    </svg>
                    VIP Promotions
                  </button>
                </li>
                <li>
                  <button
                    className={`admin-nav-item ${adminTab === "settings" ? "active" : ""}`}
                    onClick={() => setAdminTab("settings")}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ flexShrink: 0 }}
                    >
                      <circle cx="12" cy="12" r="3"></circle>
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                    Store Settings
                  </button>
                </li>
              </ul>

              <div className="admin-sidebar-footer">
                <button
                  className="btn btn-secondary"
                  style={{
                    width: "100%",
                    fontSize: "0.8rem",
                    padding: "0.6rem",
                  }}
                  onClick={() => setView("shop")}
                >
                  ← Back to Shop
                </button>
                <button
                  className="btn"
                  style={{
                    width: "100%",
                    fontSize: "0.8rem",
                    padding: "0.6rem",
                    backgroundColor: "var(--bg-tertiary)",
                    border: "1px solid var(--border-color)",
                    color: "var(--text-secondary)",
                    cursor: "pointer",
                  }}
                  onClick={() => {
                    setIsAdminAuthenticated(false);
                    sessionStorage.removeItem("noir_admin_authenticated");
                    setView("shop");
                    addToast("Logged out of Admin Portal.", "info");
                  }}
                >
                  Log Out
                </button>
              </div>
            </aside>

            {/* MAIN SPACE */}
            <main className="admin-main">
              <header className="admin-header">
                <h2 className="admin-title">
                  {adminTab === "dashboard" && "Dashboard Overview"}
                  {adminTab === "products" && "Clothing Catalog Manager"}
                  {adminTab === "orders" && "Order Invoicing Tracker"}
                  {adminTab === "promotions" && "Promo Code Campaigns"}
                  {adminTab === "settings" && "Store Configuration settings"}
                </h2>
                <div
                  style={{
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  System: ONLINE // DB: LOCAL FS
                </div>
              </header>

              {renderAdminTab()}
            </main>
          </div>
        ))}

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
          setView("checkout");
        }}
      />

      {/* --- PRODUCT DETAIL MODAL --- */}
      {selectedProduct && (
        <ProductDetail
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          storeConfig={storeConfig}
        />
      )}

      {/* --- TOAST NOTIFICATIONS --- */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast toast-${toast.type}`}>
            <span>{toast.text}</span>
          </div>
        ))}
      </div>
    </>
  );
}
