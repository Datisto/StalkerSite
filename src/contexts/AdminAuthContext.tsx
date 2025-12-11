import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient } from '../lib/api-client';

interface Admin {
  id: string;
  username: string;
  role: 'super_admin' | 'moderator' | 'content_manager';
  permissions: string[];
  token: string;
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
        if (parsed.token) {
          apiClient.setToken(parsed.token);
          setAdmin(parsed);
        } else {
          localStorage.removeItem('admin_session');
          setAdmin(null);
        }
      } catch (error) {
        localStorage.removeItem('admin_session');
        apiClient.setToken(null);
        setAdmin(null);
      }
    }
    setLoading(false);
  }

  async function login(username: string, password: string) {
    try {
      const response = await apiClient.admin.login(username, password);

      const adminData: Admin = {
        id: response.admin.id,
        username: response.admin.username,
        role: response.admin.role,
        permissions: response.admin.permissions || [],
        token: response.token,
      };

      setAdmin(adminData);
      localStorage.setItem('admin_session', JSON.stringify(adminData));

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Невірний логін або пароль' };
    }
  }

  function logout() {
    setAdmin(null);
    localStorage.removeItem('admin_session');
    apiClient.setToken(null);
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
