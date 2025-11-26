import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface Admin {
  id: string;
  username: string;
  role: 'super_admin' | 'moderator' | 'content_manager';
  permissions: string[];
}

interface AdminAuthContextType {
  admin: Admin | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAdminSession();
  }, []);

  async function checkAdminSession() {
    const adminData = localStorage.getItem('admin_session');
    if (adminData) {
      try {
        const parsed = JSON.parse(adminData);
        const { data, error } = await supabase
          .from('admins')
          .select('id, username, role, permissions')
          .eq('id', parsed.id)
          .eq('is_active', true)
          .maybeSingle();

        if (error || !data) {
          localStorage.removeItem('admin_session');
          setAdmin(null);
        } else {
          setAdmin(data);
        }
      } catch (error) {
        localStorage.removeItem('admin_session');
        setAdmin(null);
      }
    }
    setLoading(false);
  }

  async function login(username: string, password: string) {
    try {
      const { data: admins, error } = await supabase
        .from('admins')
        .select('id, username, password_hash, role, permissions, is_active')
        .eq('username', username.trim())
        .eq('is_active', true)
        .maybeSingle();

      if (error || !admins) {
        return { success: false, error: 'Невірний логін або пароль' };
      }

      const passwordMatch = password.trim() === admins.password_hash.trim();

      if (!passwordMatch) {
        return { success: false, error: 'Невірний логін або пароль' };
      }

      const adminData: Admin = {
        id: admins.id,
        username: admins.username,
        role: admins.role,
        permissions: admins.permissions || [],
      };

      await supabase
        .from('admins')
        .update({ last_login: new Date().toISOString() })
        .eq('id', admins.id);

      setAdmin(adminData);
      localStorage.setItem('admin_session', JSON.stringify(adminData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Помилка при вході' };
    }
  }

  function logout() {
    setAdmin(null);
    localStorage.removeItem('admin_session');
  }

  return (
    <AdminAuthContext.Provider value={{ admin, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
