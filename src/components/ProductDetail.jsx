import React, { useState } from 'react';
import { formatPrice } from '../utils.js';

export default function ProductDetail({ product, onClose, onAddToCart, storeConfig }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  if (!product) return null;

  const handleAdd = () => {
    if (product.sizes.length > 0 && !selectedSize) {
      alert('Please select a size');
      return;
    }
    onAddToCart(product, selectedSize || 'One Size', qty);
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="detail-image-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#141416', padding: '1.5rem', justifyContent: 'center' }}>
          <img 
            src={product.images && product.images[activeImageIdx] ? product.images[activeImageIdx] : '/images/placeholder.jpg'} 
            alt={product.name} 
            className="detail-img"
            style={{ width: '100%', height: 'auto', maxHeight: '420px', objectFit: 'cover', border: '1px solid var(--border-color)' }}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';
            }}
          />
          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {product.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt=""
                  onClick={() => setActiveImageIdx(idx)}
                  style={{
                    width: '50px',
                    height: '60px',
                    objectFit: 'cover',
                    border: activeImageIdx === idx ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    opacity: activeImageIdx === idx ? 1 : 0.6,
                    transition: 'var(--transition-smooth)'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="detail-info-section">
          <div className="detail-id">{product.id}</div>
          <h2 className="detail-name">{product.name}</h2>
          <div className="detail-price">{formatPrice(product.price, storeConfig.currency)}</div>
          
          <p className="detail-description">{product.description}</p>
          
          {/* Size Selector */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="size-selector">
              <span className="selector-label">Select Size</span>
              <div className="size-chips">
                {product.sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`size-chip ${selectedSize === size ? 'selected' : ''}`}
                    onClick={() => setSelectedSize(size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity and Add To Cart */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
            {product.stock > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="selector-label" style={{ marginBottom: 0 }}>Qty:</span>
                  <div className="cart-item-qty-actions">
                    <button 
                      type="button"
                      className="qty-btn" 
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                    >
                      -
                    </button>
                    <span className="qty-display">{qty}</span>
                    <button 
                      type="button"
                      className="qty-btn" 
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    ({product.stock} items left in inventory)
                  </span>
                </div>
                
                <button 
                  className="btn" 
                  style={{ width: '100%', marginTop: '1.5rem' }} 
                  onClick={handleAdd}
                >
                  Add To Bag
                </button>
              </>
            ) : (
              <button className="btn" style={{ width: '100%' }} disabled>
                Out of Stock
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
