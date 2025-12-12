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
        try {
          const userData = await apiClient.auth.getCurrentUser();
          setUser({ ...userData, token });
        } catch (error: any) {
          if (error.message?.includes('401') || error.message?.includes('Invalid')) {
            setUser(null);
            apiClient.setToken(null);
          } else {
            throw error;
          }
        }
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error checking user:', error);
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
