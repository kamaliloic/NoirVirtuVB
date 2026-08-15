import React, { useState, useEffect } from 'react';
import { formatPrice } from '../utils.js';
import { getPromotions, createOrder } from '../services/supabaseService.js';

// Sliding Cart Drawer Component

export function CartDrawer({ isOpen, onClose, cartItems, onUpdateQty, onRemoveItem, onProceedToCheckout, storeConfig }) {
  if (!isOpen) return null;

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const threshold = storeConfig.freeShippingThreshold || 150;
  const isFreeShipping = subtotal >= threshold;
  const shippingFee = subtotal > 0 && !isFreeShipping ? (storeConfig.shippingFee || 10) : 0;

  return (
    <>
      <div className="cart-drawer-backdrop" onClick={onClose}></div>
      <div className="cart-drawer">
        <div className="cart-header">
          <h2 className="cart-title">Your Cart ({cartItems.reduce((sum, i) => sum + i.quantity, 0)})</h2>
          <button className="cart-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="cart-items-list">
          {cartItems.length === 0 ? (
            <div className="cart-empty-message">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ margin: '0 auto' }}>
                <circle cx="9" cy="21" r="1"></circle>
                <circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <p>Your shopping cart is empty.</p>
              <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: '1rem' }}>
                Continue Shopping
              </button>
            </div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={`${item.productId}-${item.size}`} className="cart-item">
                <img 
                  src={item.images?.[0] || '/images/placeholder.jpg'} 
                  alt={item.name} 
                  className="cart-item-img"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=100&q=80';
                  }}
                />
                <div className="cart-item-details">
                  <div>
                    <h4 className="cart-item-name">{item.name}</h4>
                    <div className="cart-item-meta">Size: {item.size}</div>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="cart-item-qty-actions">
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQty(item.productId, item.size, item.quantity - 1)}
                      >
                        -
                      </button>
                      <span className="qty-display">{item.quantity}</span>
                      <button 
                        className="qty-btn" 
                        onClick={() => onUpdateQty(item.productId, item.size, item.quantity + 1)}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-price">{formatPrice(item.price * item.quantity, storeConfig.currency)}</div>
                  </div>

                  <button 
                    className="cart-item-remove" 
                    onClick={() => onRemoveItem(item.productId, item.size)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="cart-footer">
            <div className="summary-row">
              <span>Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal, storeConfig.currency)}</span>
            </div>
            
            <div className="summary-row" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <span>Shipping</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {isFreeShipping ? 'FREE' : formatPrice(shippingFee, storeConfig.currency)}
              </span>
            </div>
            
            {!isFreeShipping && (
              <div style={{ fontSize: '0.75rem', color: 'var(--accent-secondary)', marginTop: '-0.25rem', marginBottom: '0.75rem', textAlign: 'right' }}>
                Add {formatPrice(threshold - subtotal, storeConfig.currency)} more for FREE SHIPPING
              </div>
            )}

            <div className="summary-row total-row">
              <span>Subtotal Estimate</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal + shippingFee, storeConfig.currency)}</span>
            </div>

            <button className="btn checkout-btn" onClick={onProceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// Checkout Form Page Component
export default function Checkout({ cartItems, storeConfig, onOrderSuccess, onCancel }) {
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: ''
  });

  const [momoProvider, setMomoProvider] = useState('MTN Mobile Money');
  const [momoPhone, setMomoPhone] = useState('');
  const [momoName, setMomoName] = useState('');

  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [activePromo, setActivePromo] = useState(null);
  const [promoError, setPromoError] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Calculate discount
  let discount = 0;
  if (activePromo) {
    if (activePromo.type === 'percent') {
      discount = parseFloat((subtotal * (activePromo.value / 100)).toFixed(2));
    } else if (activePromo.type === 'fixed') {
      discount = Math.min(activePromo.value, subtotal);
    }
  }

  const threshold = storeConfig.freeShippingThreshold || 150;
  const shipping = subtotal >= threshold ? 0 : (storeConfig.shippingFee || 10.00);
  const taxableAmount = Math.max(0, subtotal - discount);
  const tax = parseFloat((taxableAmount * ((storeConfig.taxRate || 8.25) / 100)).toFixed(2));
  const total = parseFloat((taxableAmount + shipping + tax).toFixed(2));

  const handleInputChange = (e) => {
    setCustomer({
      ...customer,
      [e.target.name]: e.target.value
    });
  };

  const checkPromo = async (e) => {
    e.preventDefault();
    if (!promoCodeInput) return;
    
    try {
      setPromoError('');
      let promos;
      try {
        const res = await fetch('/api/promotions');
        if (res.ok) promos = await res.json();
      } catch (err) {
        console.warn('API /api/promotions unavailable, using Supabase service');
      }

      if (!promos) {
        promos = await getPromotions();
      }
      
      const found = promos.find(p => p.code.toUpperCase() === promoCodeInput.toUpperCase());
      
      if (!found) {
        setPromoError('Invalid promotion code');
      } else if (!found.active) {
        setPromoError('This promotion is no longer active');
      } else {
        setActivePromo(found);
        setPromoCodeInput('');
      }
    } catch (err) {
      setPromoError('Failed to validate promotion');
    }
  };

  const removePromo = () => {
    setActivePromo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customer.name || !customer.email || !customer.phone || !customer.address || !customer.city) {
      alert('Please fill out all contact and delivery fields.');
      return;
    }

    if (!momoPhone || !momoPhone.trim()) {
      alert('Please enter your Mobile Money (MoMo) registered phone number.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Simulate MoMo USSD prompt verification delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      const orderPayload = {
        customer,
        items: cartItems.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity
        })),
        subtotal,
        discount,
        tax,
        shipping,
        total,
        promoCode: activePromo ? activePromo.code : '',
        paymentMethod: `${momoProvider} (${momoPhone.trim()})`
      };

      let completedOrder;
      try {
        const res = await fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(orderPayload)
        });

        if (res.ok) {
          completedOrder = await res.json();
        }
      } catch (apiErr) {
        console.warn('API /api/orders failed, using Supabase createOrder:', apiErr);
      }

      if (!completedOrder) {
        completedOrder = await createOrder(orderPayload);
      }

      onOrderSuccess(completedOrder);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Mobile Money payment failed. Please check your phone prompt.');
    } finally {

      setProcessing(false);
    }
  };

  return (
    <div className="checkout-container">
      {/* SHIPPING FORM */}
      <div>
        <button 
          className="btn btn-secondary" 
          onClick={onCancel}
          style={{ marginBottom: '2rem', padding: '0.4rem 1rem', fontSize: '0.75rem' }}
        >
          ← Back to Shop
        </button>

        <h2 className="checkout-section-title">Delivery & Contact Information</h2>
        <form onSubmit={handleSubmit} className="checkout-form">
          <div className="form-group">
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              name="name" 
              id="name" 
              className="form-input" 
              required 
              placeholder="e.g. Marcus Vance"
              value={customer.name}
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input 
                type="email" 
                name="email" 
                id="email" 
                className="form-input" 
                required 
                placeholder="e.g. marcus@vance.co"
                value={customer.email}
                onChange={handleInputChange} 
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Contact Phone Number</label>
              <input 
                type="tel" 
                name="phone" 
                id="phone" 
                className="form-input" 
                required 
                placeholder="e.g. 0788 123 456 or +250 788 123 456"
                value={customer.phone}
                onChange={handleInputChange} 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">Delivery Street Address</label>
            <input 
              type="text" 
              name="address" 
              id="address" 
              className="form-input" 
              required 
              placeholder="Street Address, Building, Apt or Suite Number"
              value={customer.address}
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-group">
            <label htmlFor="city">City / District</label>
            <input 
              type="text" 
              name="city" 
              id="city" 
              className="form-input" 
              required 
              placeholder="e.g. Kigali / Kiyovu"
              value={customer.city}
              onChange={handleInputChange} 
            />
          </div>

          {/* MOMO PAYMENT GATEWAY */}
          <h2 className="checkout-section-title" style={{ marginTop: '2.5rem' }}>
            Mobile Money Payment (MoMo Pay)
          </h2>
          <div className="payment-box" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <span className="payment-label" style={{ color: '#f59e0b', fontWeight: '800' }}>
                📲 DIRECT MOBILE MONEY (MOMO PAY)
              </span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: '0.2rem 0.5rem', fontWeight: '700' }}>
                Exclusive Gateway
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label style={{ fontSize: '0.7rem', fontWeight: '600' }}>Select MoMo Network Provider</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginTop: '0.35rem' }}>
                <button
                  type="button"
                  className={`btn ${momoProvider === 'MTN Mobile Money' ? '' : 'btn-secondary'}`}
                  onClick={() => setMomoProvider('MTN Mobile Money')}
                  style={{ fontSize: '0.75rem', padding: '0.6rem 0.5rem', textTransform: 'uppercase', fontWeight: '700' }}
                >
                  🟡 MTN MoMo
                </button>
                <button
                  type="button"
                  className={`btn ${momoProvider === 'Airtel Money' ? '' : 'btn-secondary'}`}
                  onClick={() => setMomoProvider('Airtel Money')}
                  style={{ fontSize: '0.75rem', padding: '0.6rem 0.5rem', textTransform: 'uppercase', fontWeight: '700' }}
                >
                  🔴 Airtel Money
                </button>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="momo-phone">MoMo Registered Phone Number</label>
              <input 
                type="tel" 
                name="momoPhone" 
                id="momo-phone" 
                className="form-input" 
                required 
                placeholder="e.g. 0788 123 456 or +250 788 123 456"
                value={momoPhone}
                onChange={(e) => setMomoPhone(e.target.value)}
                style={{ backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <div className="form-group">
              <label htmlFor="momo-name">Account Holder Name (Optional)</label>
              <input 
                type="text" 
                name="momoName" 
                id="momo-name" 
                className="form-input" 
                placeholder="Name on MoMo Account"
                value={momoName}
                onChange={(e) => setMomoName(e.target.value)}
                style={{ backgroundColor: 'var(--bg-primary)' }}
              />
            </div>

            <div style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: '1px dashed var(--border-color)',
              padding: '0.85rem 1rem',
              marginTop: '1.25rem',
              fontSize: '0.75rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.4'
            }}>
              💡 <strong>How it works:</strong> Upon clicking <em>Pay via MoMo</em>, a USSD push authorization notification will be sent directly to <strong>{momoPhone || 'your phone number'}</strong>. Enter your MoMo PIN to authorize payment of <strong>{formatPrice(total, storeConfig.currency)}</strong>.
            </div>
          </div>

          {error && (
            <div style={{ color: 'var(--danger)', fontSize: '0.9rem', marginTop: '1rem', fontWeight: 'bold' }}>
              Error: {error}
            </div>
          )}

          <button 
            type="submit" 
            className="btn" 
            style={{ width: '100%', padding: '1.25rem', marginTop: '1rem', backgroundColor: '#f59e0b', color: '#000', fontWeight: '800' }} 
            disabled={processing || cartItems.length === 0}
          >
            {processing ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(0,0,0,0.2)', borderTopColor: '#000', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></span>
                Sending MoMo Pay Push Prompt...
              </span>
            ) : (
              `📲 Pay ${formatPrice(total, storeConfig.currency)} via MoMo`
            )}
          </button>
        </form>
      </div>

      {/* ORDER SUMMARY */}
      <div>
        <div className="order-summary-panel">
          <h3 className="checkout-section-title" style={{ fontSize: '1rem', borderBottom: 'none', marginBottom: '1.5rem', paddingBottom: 0 }}>
            Order Summary
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2rem' }}>
            {cartItems.map(item => (
              <div key={`${item.productId}-${item.size}`} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <div>
                  <span style={{ fontWeight: 'bold' }}>{item.name}</span>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.2rem' }}>
                    QTY: {item.quantity} // SIZE: {item.size}
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(item.price * item.quantity, storeConfig.currency)}</span>
              </div>
            ))}
          </div>

          {/* Promotion application */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', marginBottom: '1.5rem' }}>
            <span className="selector-label">Promo / Coupon Code</span>
            <form onSubmit={checkPromo} className="coupon-input-group">
              <input 
                type="text" 
                className="form-input" 
                style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                placeholder="e.g. NOIR10"
                value={promoCodeInput}
                onChange={(e) => setPromoCodeInput(e.target.value)}
              />
              <button type="submit" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>
                Apply
              </button>
            </form>
            {promoError && (
              <div style={{ color: 'var(--danger)', fontSize: '0.75rem', marginTop: '0.4rem' }}>{promoError}</div>
            )}
            
            {activePromo && (
              <div className="promo-tag">
                <span>[PROMO: {activePromo.code}] -{activePromo.type === 'percent' ? `${activePromo.value}%` : formatPrice(activePromo.value, storeConfig.currency)}</span>
                <button type="button" className="promo-remove-btn" onClick={removePromo}>×</button>
              </div>
            )}
          </div>

          {/* Financial Breakdown */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
            <div className="summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(subtotal, storeConfig.currency)}</span>
            </div>
            
            {activePromo && (
              <div className="summary-row" style={{ color: 'var(--success)' }}>
                <span>Discount Applied</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>-{formatPrice(discount, storeConfig.currency)}</span>
              </div>
            )}
            
            <div className="summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Courier Shipping</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping, storeConfig.currency)}
              </span>
            </div>
            
            <div className="summary-row">
              <span style={{ color: 'var(--text-secondary)' }}>Estimated Tax ({storeConfig.taxRate || 8.25}%)</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{formatPrice(tax, storeConfig.currency)}</span>
            </div>
            
            <div className="summary-row total-row" style={{ marginBottom: 0 }}>
              <span>Total Payment Due</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.25rem' }}>{formatPrice(total, storeConfig.currency)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
