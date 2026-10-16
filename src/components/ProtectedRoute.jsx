import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient.js';

export default function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    async function checkSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error || !session) {
          window.location.href = '/login';
        } else {
          setHasSession(true);
        }
      } catch (err) {
        window.location.href = '/login';
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: 'var(--text-secondary, #8e8e93)' }}>
        Authenticating session...
      </div>
    );
  }

  return hasSession ? children : null;
}
