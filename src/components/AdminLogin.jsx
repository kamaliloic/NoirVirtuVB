import React, { useState } from 'react';

export default function AdminLogin({ onLoginSuccess, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Invalid credentials');
      }

      const data = await res.json();
      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '85vh',
      padding: '2rem',
      backgroundColor: 'var(--bg-primary)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '3rem 2.5rem',
        boxShadow: 'var(--shadow-premium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
        animation: 'fadeIn 0.4s ease'
      }}>
        {/* Header Branding */}
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '1.75rem',
            fontWeight: '800',
            marginBottom: '0.5rem',
            color: 'var(--text-primary)'
          }}>
            Noir Virtu
          </h2>
          <div style={{
            fontSize: '0.7rem',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: 'var(--text-secondary)',
            fontWeight: '600'
          }}>
            Admin Gatekeeper
          </div>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'rgba(255, 59, 48, 0.05)',
            border: '1px solid var(--danger)',
            padding: '1rem',
            fontSize: '0.8rem',
            color: 'var(--danger)',
            textAlign: 'center',
            fontWeight: '500',
            animation: 'fadeIn 0.2s ease'
          }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="checkout-form" style={{ gap: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="admin-email" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Email Address</label>
            <input
              type="email"
              id="admin-email"
              className="form-input"
              required
              placeholder="admin@noirvirtu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                borderRadius: '0',
                backgroundColor: 'var(--bg-primary)'
              }}
            />
          </div>

          <div className="form-group">
            <label htmlFor="admin-pass" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Access Passcode</label>
            <input
              type="password"
              id="admin-pass"
              className="form-input"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                borderRadius: '0',
                backgroundColor: 'var(--bg-primary)'
              }}
            />
          </div>

          <button
            type="submit"
            className="btn"
            disabled={loading}
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              height: '48px',
              cursor: 'pointer'
            }}
          >
            {loading ? (
              <>
                <span className="spinner" style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid rgba(255,255,255,0.1)',
                  borderTopColor: 'var(--text-primary)',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite'
                }}></span>
                Verifying Credentials...
              </>
            ) : (
              'Verify Access'
            )}
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={loading}
            style={{
              height: '48px',
              cursor: 'pointer'
            }}
          >
            Return to Storefront
          </button>
        </form>
      </div>
    </div>
  );
}
