import React, { useState } from 'react';

export default function AdminOrders({ orders, onOrderStatusUpdated, onPrintReceipt }) {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error('Failed to update status');
      const updatedOrder = await res.json();
      onOrderStatusUpdated(updatedOrder);
      
      // Update selected order details if open
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(updatedOrder);
      }
    } catch (err) {
      alert(err.message || 'Status update failed');
    }
  };

  const filteredOrders = orders.filter(o => 
    statusFilter === 'ALL' || o.status.toUpperCase() === statusFilter
  );

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'badge badge-pending';
      case 'Processing': return 'badge badge-processing';
      case 'Shipped': return 'badge badge-shipped';
      case 'Completed': return 'badge badge-completed';
      case 'Cancelled': return 'badge badge-cancelled';
      default: return 'badge';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Status Filter tabs */}
        <div className="category-filters">
          {['ALL', 'PENDING', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED'].map(status => (
            <button
              key={status}
              className={`filter-chip ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {status}
            </button>
          ))}
        </div>
        
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          Total {filteredOrders.length} Orders
        </div>
      </div>

      {/* ORDERS LIST */}
      <div className="admin-panel" style={{ width: '100%' }}>
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Items</th>
                <th>Total Paid</th>
                <th>Fulfilment Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No orders recorded under this status.
                  </td>
                </tr>
              ) : (
                filteredOrders.map(o => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{o.id}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{formatDate(o.date)}</td>
                    <td>
                      <div>{o.customer.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{o.customer.email}</div>
                    </td>
                    <td>{o.items.reduce((sum, item) => sum + item.quantity, 0)} items</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: '500' }}>${o.total.toFixed(2)}</td>
                    <td>
                      <span className={getBadgeClass(o.status)}>{o.status}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button className="icon-btn" onClick={() => setSelectedOrder(o)} title="View Details">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                          </svg>
                        </button>
                        <select 
                          className="form-input" 
                          style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem', width: 'auto', background: 'var(--bg-tertiary)' }}
                          value={o.status}
                          onChange={(e) => handleStatusChange(o.id, e.target.value)}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DETAIL MODAL OVERLAY */}
      {selectedOrder && (
        <div className="modal-backdrop" onClick={() => setSelectedOrder(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '650px' }}>
            <button className="modal-close" onClick={() => setSelectedOrder(null)}>×</button>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h3 style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: 'var(--font-display)', fontSize: '1.25rem' }}>
                Order Details: {selectedOrder.id}
              </h3>
              <span className={getBadgeClass(selectedOrder.status)}>{selectedOrder.status}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', fontSize: '0.85rem' }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Customer Profile</h4>
                <p style={{ fontWeight: 'bold' }}>{selectedOrder.customer.name}</p>
                <p>{selectedOrder.customer.email}</p>
                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                  IP/Card: {selectedOrder.paymentMethod}
                </p>
              </div>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Shipping Address</h4>
                <p>{selectedOrder.customer.address}</p>
                <p>{selectedOrder.customer.city}, {selectedOrder.customer.state} {selectedOrder.customer.postalCode}</p>
              </div>
            </div>

            {/* Itemized list */}
            <div>
              <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Itemized Breakdown</h4>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
                <table className="admin-table" style={{ fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--bg-tertiary)' }}>
                      <th>Item Name</th>
                      <th>Size</th>
                      <th>Qty</th>
                      <th>Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 'bold' }}>{item.name}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.size}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>{item.quantity}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>${item.price.toFixed(2)}</td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Financial values */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignSelf: 'flex-end', minWidth: '240px', fontSize: '0.85rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Items Subtotal:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${selectedOrder.subtotal.toFixed(2)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="summary-row" style={{ color: 'var(--success)' }}>
                  <span>Discount ({selectedOrder.promoCode}):</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>-${selectedOrder.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Shipping Charges:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${selectedOrder.shipping.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span style={{ color: 'var(--text-secondary)' }}>Taxes:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${selectedOrder.tax.toFixed(2)}</span>
              </div>
              <div className="summary-row total-row" style={{ marginTop: '0.5rem', paddingTop: '0.5rem' }}>
                <span>Grand Total:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => onPrintReceipt(selectedOrder)}
                style={{ flex: 1 }}
              >
                Print Store Invoice
              </button>
              <button 
                type="button" 
                className="btn" 
                onClick={() => setSelectedOrder(null)}
                style={{ flex: 1 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
