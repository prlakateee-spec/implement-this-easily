import { useState, useEffect } from 'react';

const AUTH_KEY = 'china-club-user';

export interface User {
  id: string;
  name: string;
  email: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem(AUTH_KEY);
    if (saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (email: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Mock login - any credentials work
        const mockUser: User = {
          id: crypto.randomUUID(),
          name: email.split('@')[0],
          email,
        };
        setUser(mockUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));
        resolve(true);
      }, 800);
    });
  };

  const register = (name: string, email: string, password: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        const mockUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
        };
        setUser(mockUser);
        localStorage.setItem(AUTH_KEY, JSON.stringify(mockUser));
        resolve(true);
      }, 800);
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  return {
    user,
    isLoading,
    login,
    register,
    logout,
  };
}
