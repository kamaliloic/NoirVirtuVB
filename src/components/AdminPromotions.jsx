import React, { useState } from 'react';
import { formatPrice } from '../utils.js';

export default function AdminPromotions({ promotions, onPromoCreated, onPromoUpdated, onPromoDeleted, storeConfig }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    type: 'percent',
    value: '',
    active: true,
    description: ''
  });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleStatusToggle = async (promo) => {
    try {
      const res = await fetch(`/api/promotions/${promo.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !promo.active })
      });
      if (!res.ok) throw new Error('Failed to toggle promotion status');
      const updated = await res.json();
      onPromoUpdated(updated);
    } catch (err) {
      alert(err.message || 'Status toggle failed');
    }
  };

  const handleDelete = async (code) => {
    if (!confirm(`Are you sure you want to permanently delete coupon code ${code}?`)) return;
    
    try {
      const res = await fetch(`/api/promotions/${code}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete promotion');
      onPromoDeleted(code);
    } catch (err) {
      alert(err.message || 'Deletion failed');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code || !formData.value) return;

    const payload = {
      code: formData.code.toUpperCase().replace(/\s/g, ''),
      type: formData.type,
      value: parseFloat(formData.value) || 0,
      active: formData.active,
      description: formData.description
    };

    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to create promotion');
      }

      const created = await res.json();
      onPromoCreated(created);
      setIsModalOpen(false);
      
      // Reset form
      setFormData({
        code: '',
        type: 'percent',
        value: '',
        active: true,
        description: ''
      });
    } catch (err) {
      alert(err.message || 'Creation failed');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => setIsModalOpen(true)}>
          + Create Coupon
        </button>
      </div>

      {/* PROMOTION LIST */}
      <div className="admin-panel" style={{ width: '100%' }}>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Type</th>
                <th>Discount Value</th>
                <th>Campaign Description</th>
                <th>Active Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {promotions.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No promotion campaigns recorded.
                  </td>
                </tr>
              ) : (
                promotions.map(promo => (
                  <tr key={promo.code}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{promo.code}</td>
                    <td style={{ textTransform: 'uppercase', fontSize: '0.8rem' }}>{promo.type}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>
                      {promo.type === 'percent' ? `${promo.value}%` : formatPrice(promo.value, storeConfig.currency)}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{promo.description || '-'}</td>
                    <td>
                      <span className={`badge ${promo.active ? 'badge-active' : 'badge-inactive'}`}>
                        {promo.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="icon-btn" 
                          onClick={() => handleStatusToggle(promo)}
                          title={promo.active ? 'Deactivate Coupon' : 'Activate Coupon'}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {promo.active ? (
                              <path d="M18.36 6.64a9 9 0 1 1-12.73 0M12 2v10"></path>
                            ) : (
                              <path d="M12 2v10m0 0a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
                            )}
                          </svg>
                        </button>
                        <button 
                          className="icon-btn" 
                          onClick={() => handleDelete(promo.code)}
                          title="Delete Coupon" 
                          style={{ color: 'var(--danger)' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL OVERLAY */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>×</button>
            <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
              Create Discount Coupon
            </h3>

            <form onSubmit={handleSubmit} className="checkout-form">
              <div className="form-group">
                <label htmlFor="promo-code">Coupon Code (Uppercase, No Spaces)</label>
                <input 
                  type="text" 
                  name="code" 
                  id="promo-code"
                  className="form-input" 
                  required 
                  placeholder="e.g. STREET50"
                  value={formData.code}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="promo-type">Discount Type</label>
                  <select 
                    name="type" 
                    id="promo-type"
                    className="form-input"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="percent">Percentage Off (%)</option>
                    <option value="fixed">Fixed Amount Off ({storeConfig.currency})</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="promo-value">Discount Value</label>
                  <input 
                    type="number" 
                    name="value" 
                    id="promo-value"
                    className="form-input" 
                    required 
                    placeholder="15"
                    value={formData.value}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="promo-desc">Campaign Description</label>
                <input 
                  type="text" 
                  name="description" 
                  id="promo-desc"
                  className="form-input" 
                  placeholder="e.g. Opening VIP campaign coupon"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                <input 
                  type="checkbox" 
                  name="active" 
                  id="promo-active"
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  checked={formData.active}
                  onChange={handleInputChange}
                />
                <label htmlFor="promo-active" style={{ cursor: 'pointer', marginBottom: 0 }}>
                  Activate Promotion Code Immediately
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn">
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
