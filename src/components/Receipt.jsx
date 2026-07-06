import React from 'react';
import { formatPrice } from '../utils.js';

export default function Receipt({ order, storeConfig, onContinue }) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="receipt-wrapper">
      <div className="thermal-receipt">
        <div className="receipt-header">
          <h1 className="receipt-logo">{storeConfig.name || 'NOIR VIRTU'}</h1>
          <p>{storeConfig.address || '712 Melrose Ave, Los Angeles, CA'}</p>
          <p>TEL: {storeConfig.phone || '+1 (323) 555-0198'}</p>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-grid">
          <span>TICKET:</span>
          <span style={{ fontWeight: 'bold' }}>{order.id}</span>
        </div>
        <div className="receipt-grid">
          <span>DATE:</span>
          <span>{formatDate(order.date)}</span>
        </div>
        <div className="receipt-grid">
          <span>CLIENT:</span>
          <span>{order.customer.name}</span>
        </div>
        <div className="receipt-grid">
          <span>EMAIL:</span>
          <span>{order.customer.email}</span>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-items">
          <div className="receipt-grid" style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>
            <span>DESCRIPTION</span>
            <span>TOTAL</span>
          </div>
          
          {order.items.map((item, idx) => (
            <div key={`${item.productId}-${idx}`} className="receipt-item-row">
              <div className="receipt-item-details">
                <span>{item.name}</span>
                <span>{formatPrice(item.price * item.quantity, storeConfig.currency)}</span>
              </div>
              <div style={{ color: '#555', fontSize: '0.75rem', paddingLeft: '0.5rem' }}>
                QTY: {item.quantity} @ {formatPrice(item.price, storeConfig.currency)} // SIZE: {item.size}
              </div>
            </div>
          ))}
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-grid">
          <span>SUBTOTAL</span>
          <span>{formatPrice(order.subtotal, storeConfig.currency)}</span>
        </div>
        
        {order.discount > 0 && (
          <div className="receipt-grid">
            <span>PROMO DISCOUNT ({order.promoCode})</span>
            <span>-{formatPrice(order.discount, storeConfig.currency)}</span>
          </div>
        )}

        <div className="receipt-grid">
          <span>COURIER SHIPPING</span>
          <span>{formatPrice(order.shipping, storeConfig.currency)}</span>
        </div>
        
        <div className="receipt-grid">
          <span>SALES TAX ({storeConfig.taxRate || 8.25}%)</span>
          <span>{formatPrice(order.tax, storeConfig.currency)}</span>
        </div>

        <div className="receipt-divider"></div>

        <div className="receipt-grid" style={{ fontSize: '1rem', fontWeight: 'bold' }}>
          <span>TOTAL PAID</span>
          <span>{formatPrice(order.total, storeConfig.currency)}</span>
        </div>

        <div className="receipt-divider"></div>

        <div style={{ fontSize: '0.75rem', marginBottom: '0.2rem' }}>
          PAYMENT METHOD: {order.paymentMethod}
        </div>
        <div style={{ fontSize: '0.75rem' }}>
          SHIPPING TO: {order.customer.address}, {order.customer.city}, {order.customer.state} {order.customer.postalCode}
        </div>

        {/* Barcode simulation */}
        <div className="receipt-barcode">
          <div className="barcode-stripes"></div>
          <span className="barcode-text">*{order.id}*</span>
        </div>

        <div className="receipt-footer-msg">
          <p>AUTHENTIC STREET APPAREL</p>
          <p>NO RETURNS ON ARCHIVE GOODS</p>
          <p>THANK YOU FOR SHOPPING WITH NOIR VIRTU</p>
        </div>
      </div>

      <div className="print-actions">
        <button className="btn" onClick={handlePrint}>
          Print Physical Receipt
        </button>
        <button className="btn btn-secondary" onClick={onContinue}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
}
