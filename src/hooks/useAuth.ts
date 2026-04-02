import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AUTH_KEY = 'china-club-user';
const SESSION_CACHE_KEY = 'china-club-session-cache';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  registeredAt?: string;
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
  const [isLoading, setIsLoading] = useState(() => {
    return !localStorage.getItem(AUTH_KEY);
  });

  // Restore session on mount
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Load profile
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (profile && profile.is_active) {
            const appUser: User = {
              id: session.user.id,
              name: profile.display_name || profile.username,
              email: session.user.email || '',
              username: profile.username,
              registeredAt: profile.registered_at || undefined,
            };
            setUser(appUser);
            localStorage.setItem(AUTH_KEY, JSON.stringify(appUser));
          } else if (profile && !profile.is_active) {
            // Account deactivated
            await supabase.auth.signOut();
            setUser(null);
            localStorage.removeItem(AUTH_KEY);
          }
        } else {
          setUser(null);
          localStorage.removeItem(AUTH_KEY);
        }
        setIsLoading(false);
      }
    );

    // Check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (profile && profile.is_active) {
          const appUser: User = {
            id: session.user.id,
            name: profile.display_name || profile.username,
            email: session.user.email || '',
            username: profile.username,
            registeredAt: profile.registered_at || undefined,
          };
          setUser(appUser);
          localStorage.setItem(AUTH_KEY, JSON.stringify(appUser));
        } else if (profile && !profile.is_active) {
          await supabase.auth.signOut();
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    const normalizedUsername = username.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${normalizedUsername}@kitay.club`,
      password,
    });

    if (error) {
      throw new Error('Неверный логин или пароль');
    }

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

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return {
    user,
    isLoading,
    login,
    logout,
  };
}
