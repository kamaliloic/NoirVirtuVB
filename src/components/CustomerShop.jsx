import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils.js';

export default function CustomerShop({ 
  onProductSelect, 
  cartItemsCount, 
  onCartOpen, 
  onNavigateToAdmin, 
  storeConfig,
  products: propProducts = []
}) {
  const [products, setProducts] = useState(propProducts);
  const [loading, setLoading] = useState(propProducts.length === 0);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCollection, setSelectedCollection] = useState('ALL');
  const [badgeBump, setBadgeBump] = useState(false);

  useEffect(() => {
    if (propProducts && propProducts.length > 0) {
      setProducts(propProducts);
      setLoading(false);
    } else {
      fetchProducts();
    }
  }, [propProducts]);

  // Micro-interaction: tactile bump on cart item addition
  useEffect(() => {
    if (cartItemsCount > 0) {
      setBadgeBump(true);
      const timer = setTimeout(() => setBadgeBump(false), 240);
      return () => clearTimeout(timer);
    }
  }, [cartItemsCount]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch catalog');
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError('Could not load streetwear collection. Verify that the local server is running.');
    } finally {
      setLoading(false);
    }
  };

  const categories = ['ALL', 'TOPS', 'BOTTOMS', 'ACCESSORIES'];

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'ALL' || 
      product.categories?.some(c => c.toUpperCase() === selectedCategory);
    const collectionMatch = selectedCollection === 'ALL' || 
      product.collections?.some(c => c.toUpperCase() === selectedCollection);
    return categoryMatch && collectionMatch;
  });

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div 
          className="logo" 
          style={{ cursor: 'pointer' }} 
          onClick={() => { setSelectedCategory('ALL'); setSelectedCollection('ALL'); }}
        >
          NOIR VIRTU
        </div>
        
        <ul className="nav-links">
          <li>
            <a 
              href="#shop-section" 
              className={selectedCollection === 'ALL' && selectedCategory === 'ALL' ? 'active' : ''} 
              onClick={(e) => { 
                e.preventDefault(); 
                setSelectedCategory('ALL'); 
                setSelectedCollection('ALL'); 
                const el = document.getElementById('shop-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Shop All
            </a>
          </li>
          <li>
            <a 
              href="#shop-section" 
              className={selectedCollection === 'THE EIGHTH ARCHIVE' ? 'active' : ''} 
              onClick={(e) => { 
                e.preventDefault(); 
                setSelectedCollection('THE EIGHTH ARCHIVE'); 
                const el = document.getElementById('shop-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              The Eighth Archive
            </a>
          </li>
          <li>
            <a 
              href="#shop-section" 
              className={selectedCollection === 'NEW ARRIVALS' ? 'active' : ''} 
              onClick={(e) => { 
                e.preventDefault(); 
                setSelectedCollection('NEW ARRIVALS'); 
                const el = document.getElementById('shop-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              New Arrivals
            </a>
          </li>
          <li>
            <a 
              href="#shop-section" 
              className={selectedCollection === 'BEST SELLERS' ? 'active' : ''} 
              onClick={(e) => { 
                e.preventDefault(); 
                setSelectedCollection('BEST SELLERS'); 
                const el = document.getElementById('shop-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Best Sellers
            </a>
          </li>
        </ul>

        <div className="nav-actions">
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.75rem' }} onClick={onNavigateToAdmin}>
            Admin Portal
          </button>
          
          <button 
            className="nav-btn" 
            onClick={onCartOpen} 
            aria-label="Open Shopping Bag"
            style={{
              transform: badgeBump ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 180ms var(--ease-spring)'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartItemsCount > 0 && (
              <span 
                className="cart-count-badge"
                style={{
                  transform: badgeBump ? 'scale(1.2)' : 'scale(1)',
                  transition: 'transform 180ms var(--ease-spring)'
                }}
              >
                {cartItemsCount}
              </span>
            )}
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* HERO HEADER */}
        <section className="hero-section">
          <div className="hero-subtitle">NOIR VIRTU // KIGALI ARCHIVE</div>
          <h1 className="hero-title">
            THE ARCHITECTURE <span>OF SILENT REBELLION</span>
          </h1>
          <button 
            className="btn" 
            onClick={() => {
              const el = document.getElementById('shop-section');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
          >
            Explore Capsule Drop
          </button>
        </section>

        {/* CATALOG SECTION */}
        <section id="shop-section" className="shop-container">
          <div className="filter-bar">
            <div className="category-filters">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`filter-chip ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
            
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              Showing {filteredProducts.length} items {selectedCollection !== 'ALL' && `[${selectedCollection}]`}
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              <span className="spinner" style={{ display: 'inline-block', width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.6s linear infinite', marginBottom: '1rem' }}></span>
              <div>Loading streetwear capsule collections...</div>
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--danger)', fontFamily: 'var(--font-mono)' }}>
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
              No capsule items found in this category.
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((product, idx) => (
                <div 
                  key={product.id} 
                  className="product-card" 
                  onClick={() => onProductSelect(product)}
                  style={{ cursor: 'pointer', animationDelay: `${Math.min(idx * 45, 360)}ms` }}
                >
                  <div className="product-image-container">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="product-card-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    
                    {/* Tags */}
                    {product.stock <= 0 ? (
                      <span className="product-badge" style={{ backgroundColor: 'var(--danger)', color: 'white' }}>
                        Sold Out
                      </span>
                    ) : product.stock <= 5 ? (
                      <span className="product-stock-warning">
                        Only {product.stock} Left
                      </span>
                    ) : product.collections?.includes('Best Sellers') ? (
                      <span className="product-badge">
                        Best Seller
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="product-info">
                    <div className="product-collection">
                      {product.collections?.[0] || 'NOIR VIRTU'}
                    </div>
                    <h3 className="product-title">{product.name}</h3>
                    <div className="product-price">{formatPrice(product.price, storeConfig.currency)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer style={{ padding: '4rem 2.5rem', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-secondary)', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
        <p style={{ letterSpacing: '0.15em', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem', textTransform: 'uppercase' }}>
          NOIR VIRTU KIGALI
        </p>
        <p style={{ marginBottom: '0.5rem' }}>© {new Date().getFullYear()} NOIR VIRTU. ALL RIGHTS RESERVED.</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
          KIGALI HEIGHTS, 2ND FLOOR // STREETWEAR ARCHIVE
        </p>
      </footer>
    </div>
  );
}
