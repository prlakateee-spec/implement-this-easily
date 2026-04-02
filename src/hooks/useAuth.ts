import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AUTH_KEY = 'china-club-user';

export interface User {
  id: string;
  name: string;
  email: string;
  username: string;
  registeredAt?: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
    // Map username to internal email
    const email = `${username}@kitay.club`;
    
    // Check if account is active first
    const { data: isActive } = await supabase.rpc('check_user_active', {
      p_username: username,
    });

    if (!isActive) {
      throw new Error('Аккаунт деактивирован. Обратитесь к администратору.');
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error('Неверный логин или пароль');
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
