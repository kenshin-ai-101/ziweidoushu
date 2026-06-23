'use client';

import { useEffect, useState } from 'react';
import {
  fetchCurrentUser,
  isProUser,
  readCachedUser,
  subscribeAuth,
} from '@/lib/auth/client';
import type { PublicUser } from '@/lib/auth/types';

export function useAuth() {
  // Start null on server and client so SSR markup matches the first client render.
  // readCachedUser() runs in useEffect only — avoids hydration mismatch on isPro styling.
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const cached = readCachedUser();
    if (cached) {
      setUser(cached);
      setLoading(false);
    }

    const refresh = () => {
      const cached = readCachedUser();
      if (cached) {
        setUser(cached);
        setLoading(false);
      }
      fetchCurrentUser().then(next => {
        if (active) {
          setUser(next);
          setLoading(false);
        }
      });
    };

    refresh();
    const unsubscribe = subscribeAuth(refresh);
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  return {
    user,
    loading,
    isLoggedIn: Boolean(user),
    isPro: isProUser(user),
  };
}
