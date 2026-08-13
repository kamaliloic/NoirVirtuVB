import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils.js';

export default function CustomerShop({ onProductSelect, cartItemsCount, onCartOpen, onNavigateToAdmin, storeConfig }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedCollection, setSelectedCollection] = useState('ALL');

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Extract all categories
  const categories = ['ALL', 'TOPS', 'BOTTOMS', 'ACCESSORIES'];
  const collections = ['ALL', 'THE EIGHTH ARCHIVE', 'NEW ARRIVALS', 'BEST SELLERS'];

  const filteredProducts = products.filter(product => {
    const categoryMatch = selectedCategory === 'ALL' || 
      product.categories.some(c => c.toUpperCase() === selectedCategory);
    const collectionMatch = selectedCollection === 'ALL' || 
      product.collections.some(c => c.toUpperCase() === selectedCollection);
    return categoryMatch && collectionMatch;
  });

  return (
    <div className="app-container">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => { setSelectedCategory('ALL'); setSelectedCollection('ALL'); }}>
          NOIR VIRTU
        </div>
        
        <ul className="nav-links">
          <li>
            <a 
              href="#" 
              className={selectedCollection === 'ALL' && selectedCategory === 'ALL' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setSelectedCategory('ALL'); setSelectedCollection('ALL'); }}
            >
              Shop
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={selectedCollection === 'THE EIGHTH ARCHIVE' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setSelectedCollection('THE EIGHTH ARCHIVE'); }}
            >
              The Eighth Archive
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={selectedCollection === 'NEW ARRIVALS' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setSelectedCollection('NEW ARRIVALS'); }}
            >
              New Arrivals
            </a>
          </li>
          <li>
            <a 
              href="#" 
              className={selectedCollection === 'BEST SELLERS' ? 'active' : ''} 
              onClick={(e) => { e.preventDefault(); setSelectedCollection('BEST SELLERS'); }}
            >
              Best Sellers
            </a>
          </li>
        </ul>

        <div className="nav-actions">
          <button className="btn btn-secondary" style={{ padding: '0.5rem 1.25rem' }} onClick={onNavigateToAdmin}>
            Admin Portal
          </button>
          
          <button className="nav-btn" onClick={onCartOpen} aria-label="Open Shopping Bag">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            {cartItemsCount > 0 && (
              <span className="cart-count-badge">{cartItemsCount}</span>
            )}
          </button>
        </div>
      </nav>

      <main className="main-content">
        {/* HERO HEADER */}
        <section className="hero-section">
          <div className="hero-subtitle">NOIR VIRTU // STREETWEAR ARCHIVE</div>
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
            Explore Catalog
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
            
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Showing {filteredProducts.length} items
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
              Loading street capsule collections...
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--danger)' }}>
              {error}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary)' }}>
              No products found in this category.
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map(product => (
                <div 
                  key={product.id} 
                  className="product-card" 
                  onClick={() => onProductSelect(product)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="product-image-container">
                    <img 
                      src={product.images[0]} 
                      alt={product.name} 
                      className="product-card-img"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=400&q=80'; // Fallback street image
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
                    ) : product.collections.includes('Best Sellers') ? (
                      <span className="product-badge">
                        Best Seller
                      </span>
                    ) : null}
                  </div>
                  
                  <div className="product-info">
                    <div className="product-collection">
                      {product.collections[0] || 'NOIR VIRTU'}
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
        <p style={{ letterSpacing: '0.15em', fontWeight: 'bold', color: 'var(--text-primary)', marginBottom: '1rem' }}>NOIR VIRTU</p>
        <p style={{ marginBottom: '0.5rem' }}>© {new Date().getFullYear()} NOIR VIRTU. ALL RIGHTS RESERVED.</p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>DESIGNED IN BLACK // DEVELOPED FOR STRENGTH</p>
      </footer>
    </div>
  );
}
