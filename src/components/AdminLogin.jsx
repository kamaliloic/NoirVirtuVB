import React, { useState, useEffect } from 'react';
import { getStoreConfig, DEFAULT_STORE_CONFIG } from '../services/supabaseService.js';

export default function AdminLogin({ onLoginSuccess, onCancel, storeConfig: initialConfig }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeStatus, setStoreStatus] = useState(initialConfig || null);

  useEffect(() => {
    fetchStoreConfig();
  }, []);

  const fetchStoreConfig = async () => {
    try {
      let data;
      try {
        const res = await fetch('/api/store');
        if (res.ok) data = await res.json();
      } catch (err) {
        console.warn('API /api/store unavailable, falling back to Supabase service');
      }

      if (!data) {
        data = await getStoreConfig();
      }
      setStoreStatus(data || DEFAULT_STORE_CONFIG);
    } catch (err) {
      console.error('Failed to load store config in login:', err);
      setStoreStatus(DEFAULT_STORE_CONFIG);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let successData;
      try {
        const res = await fetch('/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (res.ok) {
          successData = await res.json();
        } else {
          const errRes = await res.json();
          throw new Error(errRes.error || 'Invalid email or password');
        }
      } catch (err) {
        if (err.message === 'Invalid email or password' || err.message === 'Invalid credentials') throw err;
        console.warn('API login unavailable, checking Supabase/local config:', err);
      }

      if (!successData) {
        const config = storeStatus || (await getStoreConfig()) || DEFAULT_STORE_CONFIG;
        const cleanEmail = email.trim().toLowerCase();
        const expectedEmail = (config.adminEmail || 'noirvirtu@gmail.com').trim().toLowerCase();
        const expectedPassword = config.adminPassword || 'noir123';

        if (cleanEmail === expectedEmail && password === expectedPassword) {
          successData = { token: 'nv-session-tok-' + Date.now() };
        } else {
          throw new Error('Invalid email or password');
        }
      }

      onLoginSuccess(successData.token);
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
        maxWidth: '440px',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        padding: '3rem 2.5rem',
        boxShadow: 'var(--shadow-premium)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem',
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
            padding: '0.85rem',
            fontSize: '0.8rem',
            color: 'var(--danger)',
            textAlign: 'center',
            fontWeight: '500',
            animation: 'fadeIn 0.2s ease'
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* STANDARD EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="checkout-form" style={{ gap: '1.1rem' }}>
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
              marginTop: '0.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              height: '46px',
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
              height: '46px',
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
