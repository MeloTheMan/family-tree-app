'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Session, LoginCredentials } from '@/lib/types';

interface UseAuthReturn {
  session: Session | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const checkSession = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/session');
      const result = await response.json();

      if (response.ok && result.success) {
        setSession(result.data);
      } else {
        setSession(null);
      }
    } catch (err) {
      console.error('Error checking session:', err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error?.message || 'Erreur lors de la connexion');
        return false;
      }

      setSession(result.data);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inattendue';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      setSession(null);
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Check session on mount
  useEffect(() => {
    checkSession();
  }, [checkSession]);

  return {
    session,
    loading,
    error,
    login,
    logout,
    checkSession,
  };
}
