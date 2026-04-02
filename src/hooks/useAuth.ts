import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AUTH_KEY = 'china-club-user';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  registeredAt?: string;
}

function loadProfileAndSetUser(
  userId: string,
  email: string,
  setUser: (u: User | null) => void
) {
  supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
    .then(({ data: profile }) => {
      if (profile && profile.is_active) {
        const appUser: User = {
          id: userId,
          name: profile.display_name || profile.username,
          email,
          username: profile.username,
          registeredAt: profile.registered_at || undefined,
        };
        setUser(appUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify(appUser));
      } else if (profile && !profile.is_active) {
        supabase.auth.signOut();
        setUser(null);
        localStorage.removeItem(AUTH_KEY);
      }
    });
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(AUTH_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(() => !!localStorage.getItem(AUTH_KEY));

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_OUT' || !session?.user) {
          setUser(null);
          localStorage.removeItem(AUTH_KEY);
          setIsLoading(false);
          return;
        }

        // SIGNED_IN or TOKEN_REFRESHED — fire and forget, no await
        loadProfileAndSetUser(session.user.id, session.user.email || '', setUser);
        setIsLoading(false);
      }
    );

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfileAndSetUser(session.user.id, session.user.email || '', setUser);
      }
      setIsLoading(false);
    });

    const timeout = setTimeout(() => setIsLoading(false), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const normalizedUsername = username.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${normalizedUsername}@kitay.club`,
      password,
    });

    if (error) throw new Error('Неверный логин или пароль');

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('is_active')
      .eq('user_id', data.user.id)
      .maybeSingle();

    if (!profile) {
      await supabase.auth.signOut();
      throw new Error('Аккаунт не найден');
    }

    if (!profile.is_active) {
      await supabase.auth.signOut();
      throw new Error('Аккаунт деактивирован. Обратитесь к администратору.');
    }

    return true;
  };

  const logout = useCallback(async () => {
    // Clear UI first, then sign out
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
    await supabase.auth.signOut();
  }, []);

  return { user, isLoading, login, logout };
}
