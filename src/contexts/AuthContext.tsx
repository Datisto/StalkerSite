import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';

interface User {
  id: string;
  steam_id: string;
  steam_nickname: string;
  discord_id?: string;
  discord_username?: string;
  is_banned: boolean;
  rules_passed?: boolean;
  token?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const token = apiClient.getToken();

      if (token) {
        const userData = await apiClient.auth.getCurrentUser();
        setUser({ ...userData, token });
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
      apiClient.setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  async function refreshUser() {
    await checkUser();
  }

  async function signOut() {
    apiClient.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
