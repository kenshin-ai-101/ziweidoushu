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
  const [user, setUser] = useState<PublicUser | null>(() => readCachedUser());
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
