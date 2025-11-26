import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../contexts/AdminAuthContext';
import { Shield, Lock, User } from 'lucide-react';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(username, password);

    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.error || 'Помилка входу');
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md px-4">
        <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700">
          <div className="flex items-center justify-center mb-8">
            <Shield className="w-12 h-12 text-red-500 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">Адмін-панель</h1>
              <p className="text-sm text-gray-400">STALKER RP Management</p>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Логін
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                placeholder="admin"
                required
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Lock className="w-4 h-4 inline mr-2" />
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-500 py-3 rounded font-semibold transition disabled:opacity-50"
            >
              {loading ? 'Вхід...' : 'Увійти'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-sm text-gray-400 hover:text-white transition">
              На головну сторінку
            </a>
          </div>

          <div className="mt-8 p-4 bg-gray-900 rounded border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">
              <strong>Для тестування:</strong>
            </p>
            <p className="text-xs text-gray-500">
              Створіть адміна в базі даних через SQL:
            </p>
            <code className="block mt-2 text-xs bg-black p-2 rounded text-green-400">
              INSERT INTO admins (username, password_hash, role, is_active)
              <br />
              VALUES ('admin', 'admin123', 'super_admin', true);
            </code>
            <p className="text-xs text-gray-500 mt-2">
              Логін: <strong>admin</strong>, Пароль: <strong>admin123</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
