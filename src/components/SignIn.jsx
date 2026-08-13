import React, { useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
      } else if (!data?.session) {
        // If data.session is null, don't redirect to the dashboard
        setError("Check your email and confirm your account before logging in.");
      } else {
        // Only redirect when a real session exists after login
        window.location.href = '/';
      }
    } catch (err) {
      setError(err.message || 'An unexpected error occurred during sign in.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '80vh',
      padding: '2rem',
      backgroundColor: 'var(--bg-primary, #0d0d0d)',
      color: 'var(--text-primary, #f5f5f7)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        backgroundColor: 'var(--bg-secondary, #161618)',
        border: '1px solid var(--border-color, rgba(255, 255, 255, 0.1))',
        padding: '3rem 2.5rem',
        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.75rem'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{
            fontFamily: 'var(--font-display, sans-serif)',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            fontSize: '1.5rem',
            fontWeight: '800',
            marginBottom: '0.5rem'
          }}>
            Sign In
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary, #8e8e93)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Access Your Account
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-primary, #0d0d0d)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                backgroundColor: 'var(--bg-primary, #0d0d0d)',
                border: '1px solid var(--border-color, rgba(255, 255, 255, 0.15))',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.9rem',
                outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              height: '46px',
              backgroundColor: 'var(--text-primary, #ffffff)',
              color: 'var(--bg-primary, #000000)',
              border: 'none',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '0.8rem',
              transition: 'opacity 0.2s ease'
            }}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>

          {error && (
            <div style={{
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              padding: '0.75rem 1rem',
              fontSize: '0.8rem',
              color: '#ff453a',
              textAlign: 'center',
              marginTop: '0.5rem'
            }}>
              ⚠️ {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
