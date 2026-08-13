import React, { useState } from 'react';
import { formatPrice } from '../utils.js';

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
            cartItems.map((item) => (
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
    address: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [card, setCard] = useState({
    number: '',
    expiry: '',
    cvv: ''
  });

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

  const handleCardChange = (e) => {
    let val = e.target.value;
    if (e.target.name === 'number') {
      // Add spaces for card formatting
      val = val.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim();
    }
    setCard({
      ...card,
      [e.target.name]: val
    });
  };

  const checkPromo = async (e) => {
    e.preventDefault();
    if (!promoCodeInput) return;
    
    try {
      setPromoError('');
      const res = await fetch('/api/promotions');
      const promos = await res.json();
      
      const found = promos.find(p => p.code.toUpperCase() === promoCodeInput.toUpperCase());
      
      if (!found) {
        setPromoError('Invalid promotion code');
      } else if (!found.active) {
        setPromoError('This promotion is no longer active');
      } else {
        setActivePromo(found);
        setPromoCodeInput('');
      }
    } catch {
      setPromoError('Failed to validate promotion');
    }
  };

  const removePromo = () => {
    setActivePromo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (!customer.name || !customer.email || !customer.address || !customer.city || !customer.state || !customer.postalCode) {
      alert('Please fill out all shipping fields.');
      return;
    }

    if (!card.number || !card.expiry || !card.cvv) {
      alert('Please fill out card details.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Simulate payment processing delays
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderPayload = {
        customer,
        items: cartItems.map(item => ({
          productId: item.productId,
          size: item.size,
          quantity: item.quantity
        })),
        promoCode: activePromo ? activePromo.code : '',
        paymentMethod: `Visa Ending ${card.number.slice(-4)}`
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Checkout transaction failed');
      }

      const completedOrder = await res.json();
      onOrderSuccess(completedOrder);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Checkout failed. Please inspect logs.');
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

        <h2 className="checkout-section-title">Shipping Address</h2>
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
            <label htmlFor="address">Delivery Address</label>
            <input 
              type="text" 
              name="address" 
              id="address" 
              className="form-input" 
              required 
              placeholder="Street Address, Apt or Suite Number"
              value={customer.address}
              onChange={handleInputChange} 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="city">City</label>
              <input 
                type="text" 
                name="city" 
                id="city" 
                className="form-input" 
                required 
                placeholder="e.g. Los Angeles"
                value={customer.city}
                onChange={handleInputChange} 
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="state">State</label>
                <input 
                  type="text" 
                  name="state" 
                  id="state" 
                  className="form-input" 
                  required 
                  placeholder="CA"
                  maxLength="2"
                  value={customer.state}
                  onChange={handleInputChange} 
                />
              </div>
              <div className="form-group">
                <label htmlFor="postalCode">Zip Code</label>
                <input 
                  type="text" 
                  name="postalCode" 
                  id="postalCode" 
                  className="form-input" 
                  required 
                  placeholder="90014"
                  value={customer.postalCode}
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>

          {/* PAYMENT BOX */}
          <h2 className="checkout-section-title" style={{ marginTop: '2.5rem' }}>Secure Payment</h2>
          <div className="payment-box">
            <span className="payment-label">MOCK PAYMENT CARD PROCESSOR</span>
            
            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
              <label htmlFor="card-number">Card Number</label>
              <input 
                type="text" 
                name="number" 
                id="card-number" 
                className="form-input" 
                required 
                maxLength="19"
                placeholder="4000 1234 5678 9010"
                value={card.number}
                onChange={handleCardChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="card-expiry">Expiry Date</label>
                <input 
                  type="text" 
                  name="expiry" 
                  id="card-expiry" 
                  className="form-input" 
                  required 
                  maxLength="5"
                  placeholder="MM/YY"
                  value={card.expiry}
                  onChange={handleCardChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="card-cvv">CVV</label>
                <input 
                  type="password" 
                  name="cvv" 
                  id="card-cvv" 
                  className="form-input" 
                  required 
                  maxLength="3"
                  placeholder="***"
                  value={card.cvv}
                  onChange={handleCardChange}
                />
              </div>
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
            style={{ width: '100%', padding: '1.25rem', marginTop: '1rem' }} 
            disabled={processing || cartItems.length === 0}
          >
            {processing ? 'Processing Secure Checkout...' : `Authorize & Pay ${formatPrice(total, storeConfig.currency)}`}
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
