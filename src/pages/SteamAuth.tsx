import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';

export default function SteamAuth() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    handleSteamCallback();
  }, []);

  async function handleSteamCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      if (!urlParams.has('openid.claimed_id')) {
        setError('Не вдалося отримати Steam ID');
        setLoading(false);
        return;
      }

      const response = await apiClient.auth.verify(urlParams);

      if (response.error) {
        if (response.error === 'Account is banned') {
          setError(`Ваш акаунт заблоковано. Причина: ${response.reason || 'Не вказано'}`);
        } else {
          setError(response.error);
        }
        setLoading(false);
        return;
      }

      navigate('/cabinet');
    } catch (error: any) {
      console.error('Steam auth error:', error);
      setError(`Помилка авторизації: ${error?.message || 'Невідома помилка'}`);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Авторизація через Steam...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
        <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Помилка</h2>
          <p className="text-gray-300 mb-6">{error}</p>
          <a
            href="/"
            className="inline-block bg-red-600 hover:bg-red-500 px-6 py-3 rounded transition w-full text-center"
          >
            На головну
          </a>
        </div>
      </div>
    );
  }

  return null;
}
