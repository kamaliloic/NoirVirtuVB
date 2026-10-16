import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { formatPrice } from '../utils.js';

export default function ProductDetail({ product, onClose, onAddToCart, storeConfig }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isImgTransitioning, setIsImgTransitioning] = useState(false);

  // Keyboard accessibility: dismiss on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const handleAdd = () => {
    if (product.sizes?.length > 0 && !selectedSize) {
      toast.error('Please select an available size first.');
      return;
    }
    onAddToCart(product, selectedSize || 'One Size', qty);
    onClose();
  };

  const handleThumbnailClick = (idx) => {
    if (idx === activeImageIdx) return;
    setIsImgTransitioning(true);
    setTimeout(() => {
      setActiveImageIdx(idx);
      setIsImgTransitioning(false);
    }, 120);
  };

  return (
    <motion.div 
      className="modal-backdrop" 
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
    >
      <motion.div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ type: "spring", duration: 0.34, bounce: 0 }}
      >
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="detail-image-section" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', background: '#121215', padding: '1.5rem', justifyContent: 'center' }}>
          <div style={{ overflow: 'hidden', position: 'relative', width: '100%', minHeight: '380px' }}>
            <img 
              src={product.images && product.images[activeImageIdx] ? product.images[activeImageIdx] : '/images/placeholder.jpg'} 
              alt={product.name} 
              className="detail-img"
              style={{
                width: '100%',
                height: '100%',
                maxHeight: '440px',
                objectFit: 'cover',
                border: '1px solid var(--border-color)',
                filter: isImgTransitioning ? 'blur(4px)' : 'blur(0)',
                opacity: isImgTransitioning ? 0.7 : 1,
                transition: 'filter 140ms ease, opacity 140ms ease'
              }}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=600&q=80';
              }}
            />
          </div>

          {product.images && product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', overflowX: 'auto', paddingBottom: '0.25rem' }}>
              {product.images.map((img, idx) => (
                <img 
                  key={idx}
                  src={img} 
                  alt=""
                  onClick={() => handleThumbnailClick(idx)}
                  style={{
                    width: '54px',
                    height: '66px',
                    objectFit: 'cover',
                    border: activeImageIdx === idx ? '2px solid var(--text-primary)' : '1px solid var(--border-color)',
                    cursor: 'pointer',
                    opacity: activeImageIdx === idx ? 1 : 0.5,
                    transform: activeImageIdx === idx ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 140ms var(--ease-out), opacity 140ms ease, border-color 140ms ease'
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
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <span className="qty-display">{qty}</span>
                    <button 
                      type="button"
                      className="qty-btn" 
                      onClick={() => setQty(q => Math.min(product.stock, q + 1))}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>
                    ({product.stock} left in stock)
                  </span>
                </div>
                
                <button 
                  className="btn" 
                  style={{ width: '100%', marginTop: '1.25rem' }} 
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
      </motion.div>
    </motion.div>
  );
}
