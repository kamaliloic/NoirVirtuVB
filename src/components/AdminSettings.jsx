import React, { useState } from 'react';

export default function AdminSettings({ adminToken, storeConfig, onConfigUpdated }) {
  const [formData, setFormData] = useState({
    name: storeConfig.name || 'NOIR VIRTU FLAGSHIP',
    address: storeConfig.address || '712 Melrose Ave, Los Angeles, CA 90046',
    phone: storeConfig.phone || '+1 (323) 555-0198',
    currency: storeConfig.currency || 'USD',
    taxRate: storeConfig.taxRate !== undefined ? storeConfig.taxRate : 8.25,
    shippingFee: storeConfig.shippingFee !== undefined ? storeConfig.shippingFee : 10.00,
    freeShippingThreshold: storeConfig.freeShippingThreshold !== undefined ? storeConfig.freeShippingThreshold : 150.00
  });

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage('');
      
      const payload = {
        ...formData,
        taxRate: parseFloat(formData.taxRate) || 0,
        shippingFee: parseFloat(formData.shippingFee) || 0,
        freeShippingThreshold: parseFloat(formData.freeShippingThreshold) || 0
      };

      const res = await fetch('/api/store', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(adminToken ? { 'x-admin-token': adminToken } : {})
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error('Failed to save settings');
      const updated = await res.json();
      onConfigUpdated(updated);
      setMessage('Store configurations saved successfully.');
    } catch (err) {
      alert(err.message || 'Saving configuration failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-panel" style={{ maxWidth: '750px' }}>
      <div className="panel-header">
        <h3 className="panel-title">Store Configuration Settings</h3>
      </div>

      <form onSubmit={handleSubmit} className="checkout-form" style={{ marginTop: '1rem' }}>
        <div className="form-group">
          <label htmlFor="store-name">Store Name (Brand Name)</label>
          <input 
            type="text" 
            name="name" 
            id="store-name"
            className="form-input" 
            required 
            value={formData.name}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="store-phone">Store Phone</label>
            <input 
              type="text" 
              name="phone" 
              id="store-phone"
              className="form-input" 
              required 
              value={formData.phone}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="store-currency">Currency Code</label>
            <input 
              type="text" 
              name="currency" 
              id="store-currency"
              className="form-input" 
              required 
              maxLength="3"
              value={formData.currency}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="store-address">Flagship Address</label>
          <input 
            type="text" 
            name="address" 
            id="store-address"
            className="form-input" 
            required 
            value={formData.address}
            onChange={handleInputChange}
          />
        </div>

        <div className="form-row" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="store-tax">Sales Tax Percentage (%)</label>
            <input 
              type="number" 
              step="0.001"
              name="taxRate" 
              id="store-tax"
              className="form-input" 
              required 
              value={formData.taxRate}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="store-shipping">Flat Shipping Rate ($)</label>
            <input 
              type="number" 
              step="0.01"
              name="shippingFee" 
              id="store-shipping"
              className="form-input" 
              required 
              value={formData.shippingFee}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="store-threshold">Free Shipping Order Threshold ($)</label>
          <input 
            type="number" 
            step="0.01"
            name="freeShippingThreshold" 
            id="store-threshold"
            className="form-input" 
            required 
            value={formData.freeShippingThreshold}
            onChange={handleInputChange}
          />
        </div>

        {message && (
          <div style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 'bold', marginTop: '0.5rem' }}>
            {message}
          </div>
        )}

        <div className="modal-actions" style={{ justifyContent: 'flex-start' }}>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Saving Configurations...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
