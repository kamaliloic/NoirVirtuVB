import React, { useState, useEffect } from 'react';

export default function AdminLogin({ onLoginSuccess, onCancel, storeConfig: initialConfig }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [storeStatus, setStoreStatus] = useState(initialConfig || null);

  // Modal for Google / Gmail Auth
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    fetchStoreConfig();
  }, []);

  const fetchStoreConfig = async () => {
    try {
      const res = await fetch('/api/store');
      if (res.ok) {
        const data = await res.json();
        setStoreStatus(data);
      }
    } catch (err) {
      console.error('Failed to load store config in login:', err);
    }
  };

  const isUnclaimed = !storeStatus || !storeStatus.adminEmail || !storeStatus.adminEmail.trim();

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

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      onLoginSuccess(data.token);
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (e) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.trim()) {
      setGoogleError('Please enter a valid Gmail address');
      return;
    }

    setGoogleError('');
    setGoogleLoading(true);

    try {
      const res = await fetch('/api/admin/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: googleEmail, name: googleName })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Google authentication failed');
      }

      setShowGoogleModal(false);
      onLoginSuccess(data.token);
    } catch (err) {
      setGoogleError(err.message || 'Google login failed.');
    } finally {
      setGoogleLoading(false);
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

        {/* First Email Claim Banner */}
        {isUnclaimed ? (
          <div style={{
            backgroundColor: 'rgba(255, 193, 7, 0.08)',
            border: '1px solid rgba(255, 193, 7, 0.3)',
            padding: '0.85rem 1rem',
            fontSize: '0.75rem',
            color: 'var(--text-primary)',
            textAlign: 'center',
            lineHeight: '1.4',
            animation: 'fadeIn 0.3s ease'
          }}>
            <span style={{ fontWeight: '700', color: '#f59e0b', display: 'block', marginBottom: '0.25rem' }}>
              ⚡ FIRST SIGN-IN INITIALIZATION
            </span>
            The first email to sign in (via Password or Gmail) will automatically be registered as the <strong>Store Admin</strong>.
          </div>
        ) : (
          <div style={{
            backgroundColor: 'var(--bg-tertiary)',
            border: '1px solid var(--border-color)',
            padding: '0.6rem 0.8rem',
            fontSize: '0.7rem',
            color: 'var(--text-secondary)',
            textAlign: 'center',
            fontFamily: 'var(--font-mono)'
          }}>
            Registered Admin: <strong style={{ color: 'var(--text-primary)' }}>{storeStatus.adminEmail}</strong>
          </div>
        )}

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

        {/* GOOGLE / GMAIL SIGN-IN BUTTON */}
        <button
          type="button"
          onClick={() => setShowGoogleModal(true)}
          disabled={loading}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem',
            height: '46px',
            backgroundColor: '#ffffff',
            color: '#1f1f1f',
            border: '1px solid #dadce0',
            fontSize: '0.85rem',
            fontWeight: '600',
            fontFamily: 'var(--font-primary)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
          }}
          onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f8f9fa'; }}
          onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#ffffff'; }}
        >
          {/* Official Google G Logo SVG */}
          <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
            <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
          </svg>
          Sign in with Gmail / Google
        </button>

        {/* OR DIVIDER */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          margin: '0.25rem 0'
        }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
          <span style={{
            fontSize: '0.65rem',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontWeight: '600'
          }}>
            or standard password
          </span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-color)' }}></div>
        </div>

        {/* STANDARD EMAIL & PASSWORD FORM */}
        <form onSubmit={handleSubmit} className="checkout-form" style={{ gap: '1.1rem' }}>
          <div className="form-group">
            <label htmlFor="admin-email" style={{ fontSize: '0.7rem', fontWeight: '600' }}>Email Address</label>
            <input
              type="email"
              id="admin-email"
              className="form-input"
              required
              placeholder={isUnclaimed ? "Enter your email to claim Admin" : "admin@noirvirtu.com"}
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
              isUnclaimed ? 'Claim & Log In as Admin' : 'Verify Access'
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

      {/* GMAIL OAUTH MODAL */}
      {showGoogleModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1.5rem',
          animation: 'fadeIn 0.2s ease'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '400px',
            backgroundColor: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            padding: '2.5rem 2rem',
            boxShadow: 'var(--shadow-premium)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.75rem' }}>
                <svg width="32" height="32" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z" />
                </svg>
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: '700', marginBottom: '0.25rem' }}>
                Google Sign-In
              </h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                Authenticate securely using your Google / Gmail account
              </p>
            </div>

            {googleError && (
              <div style={{
                backgroundColor: 'rgba(255, 59, 48, 0.08)',
                border: '1px solid var(--danger)',
                padding: '0.75rem',
                fontSize: '0.75rem',
                color: 'var(--danger)',
                textAlign: 'center'
              }}>
                ⚠️ {googleError}
              </div>
            )}

            <form onSubmit={handleGoogleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: '600' }}>Gmail Address</label>
                <input
                  type="email"
                  className="form-input"
                  required
                  placeholder="yourname@gmail.com"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  disabled={googleLoading}
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.7rem', fontWeight: '600' }}>Display Name (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Alex Admin"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  disabled={googleLoading}
                  style={{ backgroundColor: 'var(--bg-primary)' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ flex: 1, height: '42px' }}
                  onClick={() => setShowGoogleModal(false)}
                  disabled={googleLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn"
                  style={{ flex: 1, height: '42px', backgroundColor: '#4285F4', color: '#fff', border: 'none' }}
                  disabled={googleLoading}
                >
                  {googleLoading ? 'Authenticating...' : 'Sign In with Gmail'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
