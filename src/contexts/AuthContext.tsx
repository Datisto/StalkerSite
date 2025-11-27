import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface User {
  id: string;
  steam_id: string;
  steam_nickname: string;
  discord_id?: string;
  discord_username?: string;
  is_banned: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      (() => {
        checkUser();
      })();
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const mockUserId = localStorage.getItem('mock_user_id');
      const mockSteamId = localStorage.getItem('mock_steam_id');

      if (mockUserId && mockSteamId) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', mockUserId)
          .maybeSingle();

        if (userData) {
          setUser(userData);
        } else {
          setUser(null);
          localStorage.removeItem('mock_user_id');
          localStorage.removeItem('mock_steam_id');
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

  async function signOut() {
    localStorage.removeItem('mock_user_id');
    localStorage.removeItem('mock_steam_id');
    localStorage.removeItem('mock_steam_nickname');
    await supabase.auth.signOut();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut }}>
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
