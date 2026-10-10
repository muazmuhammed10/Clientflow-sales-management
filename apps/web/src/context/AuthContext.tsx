import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../api/client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  organizationName: string;
  currency: string;
  timezone: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string; user: User }) => void;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('clientflow_access_token');
      const storedUser = localStorage.getItem('clientflow_user');

      if (storedToken && storedUser) {
        try {
          setUser(JSON.parse(storedUser));
          // Refresh user data from server in background
          const res = await api.get('/auth/me');
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('clientflow_user', JSON.stringify(res.data));
          }
        } catch {
          // In case token is invalid, client.ts handles refresh or logout
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (data: { accessToken: string; refreshToken: string; user: User }) => {
    localStorage.setItem('clientflow_access_token', data.accessToken);
    localStorage.setItem('clientflow_refresh_token', data.refreshToken);
    localStorage.setItem('clientflow_user', JSON.stringify(data.user));
    setUser(data.user);
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('clientflow_refresh_token');
    try {
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore error during logout
    } finally {
      localStorage.removeItem('clientflow_access_token');
      localStorage.removeItem('clientflow_refresh_token');
      localStorage.removeItem('clientflow_user');
      setUser(null);
    }
  };

  const updateUser = (updated: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...updated };
    setUser(newUser);
    localStorage.setItem('clientflow_user', JSON.stringify(newUser));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
