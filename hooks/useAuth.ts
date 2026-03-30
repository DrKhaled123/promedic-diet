/**
 * useAuth Hook - React integration for PocketBase authentication
 * 
 * Features:
 * - Automatic authentication on mount
 * - Token refresh management
 * - Auth state tracking
 * - Loading states
 * - Error handling
 */

import { useState, useEffect } from 'react';
import { ensureAuth, refreshIfNeeded, isAuthenticated, getCurrentUserId, pb } from '../services/pocketbase';

interface AuthState {
  isReady: boolean;
  isAuthenticated: boolean;
  userId: string | null;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    isReady: false,
    isAuthenticated: isAuthenticated(),
    userId: getCurrentUserId(),
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        // First, try to refresh if needed
        await refreshIfNeeded();
        
        if (isMounted) {
          setState({
            isReady: true,
            isAuthenticated: isAuthenticated(),
            userId: getCurrentUserId(),
            error: null,
          });
        }
      } catch (err) {
        if (isMounted) {
          setState({
            isReady: true,
            isAuthenticated: false,
            userId: null,
            error: err instanceof Error ? err : new Error('Authentication failed'),
          });
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}

/**
 * Hook to get current user ID reactively
 */
export function useCurrentUser(): { userId: string | null; isAuthenticated: boolean } {
  const [userId, setUserId] = useState<string | null>(getCurrentUserId());
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  useEffect(() => {
    // Listen for auth changes
    const unsubscribe = pb.authStore.onChange((_token, model) => {
      setUserId(model?.id ?? null);
      setIsAuth(pb.authStore.isValid);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return { userId, isAuthenticated: isAuth };
}
