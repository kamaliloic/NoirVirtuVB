import React from 'react';

export default function AdminDashboard({ analyticsData, loading, onRefresh }) {
  if (loading) {
    return <div style={{ color: 'var(--text-secondary)' }}>Loading business metrics...</div>;
  }

  const { summary = {}, weeklyTrend = [], hotItems = [], promoUsage = {} } = analyticsData || {};

  // Compute SVG Line coordinates for revenue trend
  const getLineCoordinates = () => {
    if (weeklyTrend.length === 0) return '';
    const width = 600;
    const height = 180;
    const padding = 25;
    
    const maxVal = Math.max(...weeklyTrend.map(d => d.revenue), 100);
    const minVal = 0;
    const valRange = maxVal - minVal;

    const coords = weeklyTrend.map((d, index) => {
      const x = padding + (index / (weeklyTrend.length - 1)) * (width - padding * 2);
      // Invert Y coordinate so higher values are drawn higher up
      const y = height - padding - ((d.revenue - minVal) / valRange) * (height - padding * 2);
      return { x, y, val: d.revenue, date: d.date };
    });

    return coords;
  };

  const coords = getLineCoordinates();
  const pathData = coords.length > 0 
    ? `M ${coords.map(c => `${c.x},${c.y}`).join(' L ')}` 
    : '';

  // Calculate hot item max quantity for progress bar scaling
  const maxHotQty = hotItems.length > 0 ? Math.max(...hotItems.map(item => item.quantity)) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Gross Revenue</span>
          <span className="kpi-value">${summary.totalRevenue?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Total Sales Volume</span>
          <span className="kpi-value">{summary.ordersCount || 0} Orders</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Average Ticket Size</span>
          <span className="kpi-value">${summary.averageOrderValue?.toFixed(2) || '0.00'}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Active Promos</span>
          <span className="kpi-value">{summary.activePromos || 0} Coupons</span>
        </div>
      </div>

      {/* CHARTS PANEL */}
      <div className="dashboard-grid">
        {/* REVENUE GRAPH */}
        <div className="admin-panel">
          <div className="panel-header">
            <h3 className="panel-title">14-Day Sales Curve</h3>
            <button className="icon-btn" onClick={onRefresh} title="Refresh Data" style={{ fontSize: '0.85rem', padding: '0.2rem 0.5rem' }}>
              ⟳ Refresh
            </button>
          </div>
          
          <div className="chart-container">
            {coords.length > 0 ? (
              <svg viewBox="0 0 600 180" className="chart-svg">
                {/* Horizontal gridlines */}
                {[0.25, 0.5, 0.75, 1.0].map((ratio, idx) => (
                  <line 
                    key={idx} 
                    x1="25" 
                    y1={25 + ratio * 130} 
                    x2="575" 
                    y2={25 + ratio * 130} 
                    className="chart-gridline" 
                  />
                ))}
                
                {/* Path line */}
                <path d={pathData} className="chart-line" />
                
                {/* Hover dots & Labels */}
                {coords.map((c, idx) => (
                  <g key={idx}>
                    <circle 
                      cx={c.x} 
                      cy={c.y} 
                      r="4" 
                      className="chart-dot"
                    >
                      <title>{`Date: ${c.date}\nRevenue: $${c.val.toFixed(2)}`}</title>
                    </circle>
                    
                    {/* Date label for first, middle, last */}
                    {(idx === 0 || idx === Math.floor(coords.length / 2) || idx === coords.length - 1) && (
                      <text 
                        x={c.x} 
                        y="175" 
                        textAnchor="middle" 
                        className="chart-label"
                      >
                        {c.date.slice(5)} {/* MM-DD */}
                      </text>
                    )}
                  </g>
                ))}
              </svg>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'var(--text-secondary)' }}>
                No trend metrics available
              </div>
            )}
          </div>
        </div>

        {/* BEST SELLERS */}
        <div className="admin-panel">
          <div className="panel-header">
            <h3 className="panel-title">Hot Selling Items</h3>
          </div>
          
          <div className="ranking-list">
            {hotItems.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem 0' }}>
                No products sold yet.
              </div>
            ) : (
              hotItems.map((item, idx) => {
                const fillWidth = (item.quantity / maxHotQty) * 100;
                return (
                  <div key={idx} className="ranking-item">
                    <div className="ranking-meta">
                      <span style={{ fontWeight: '500' }}>{item.name}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {item.quantity} units // ${item.revenue.toFixed(2)}
                      </span>
                    </div>
                    <div className="ranking-bar-bg">
                      <div className="ranking-bar-fill" style={{ width: `${fillWidth}%` }}></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* PROMOTIONS UTILITIES */}
      <div className="admin-panel" style={{ width: '100%' }}>
        <div className="panel-header">
          <h3 className="panel-title">Coupon Usage Statistics</h3>
        </div>
        
        <div className="table-wrapper">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Calculated Usage Frequency</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(promoUsage).length === 0 ? (
                <tr>
                  <td colSpan="2" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No promo codes applied yet.
                  </td>
                </tr>
              ) : (
                Object.entries(promoUsage).map(([code, count]) => (
                  <tr key={code}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 'bold' }}>{code}</td>
                    <td style={{ fontFamily: 'var(--font-mono)' }}>{count} times</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
