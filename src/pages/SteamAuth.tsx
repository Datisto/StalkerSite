import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function SteamAuth() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [needsDiscord, setNeedsDiscord] = useState(false);
  const [discordUsername, setDiscordUsername] = useState('');
  const [pendingSteamData, setPendingSteamData] = useState<{ steamId: string; personaname: string } | null>(null);

  useEffect(() => {
    handleSteamCallback();
  }, []);

  async function completeRegistration() {
    if (!discordUsername.trim() || !pendingSteamData) {
      setError('Будь ласка, введіть Discord username');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          steam_id: pendingSteamData.steamId,
          steam_nickname: pendingSteamData.personaname,
          discord_username: discordUsername.trim(),
          is_banned: false,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert user error:', insertError);
        setError(`Помилка створення користувача: ${insertError.message}`);
        setLoading(false);
        return;
      }

      localStorage.setItem('mock_user_id', newUser.id);
      localStorage.setItem('mock_steam_id', pendingSteamData.steamId);
      localStorage.setItem('mock_steam_nickname', pendingSteamData.personaname);
      localStorage.setItem('mock_discord_username', discordUsername.trim());

      navigate('/cabinet');
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(`Помилка реєстрації: ${error?.message || 'Невідома помилка'}`);
      setLoading(false);
    }
  }

  async function handleSteamCallback() {
    try {
      const urlParams = new URLSearchParams(window.location.search);

      let steamId: string | null = null;
      let personaname: string | null = null;

      if (urlParams.has('steamid') && urlParams.has('steamname')) {
        steamId = urlParams.get('steamid');
        personaname = urlParams.get('steamname');
        console.log('Manual login:', { steamId, personaname });
      } else if (urlParams.has('openid.claimed_id')) {
        const verifyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/steam-auth?mode=verify&${urlParams.toString()}`;

        const response = await fetch(verifyUrl);
        const data = await response.json();

        if (!response.ok || data.error) {
          setError(data.error || 'Помилка верифікації Steam');
          setLoading(false);
          return;
        }

        steamId = data.steamId;
        personaname = data.personaname;
      }

      if (!steamId) {
        setError('Не вдалося отримати Steam ID');
        setLoading(false);
        return;
      }

      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('id, steam_id, is_banned')
        .eq('steam_id', steamId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Fetch user error:', fetchError);
        setError(`Помилка отримання користувача: ${fetchError.message}`);
        setLoading(false);
        return;
      }

      if (existingUser?.is_banned) {
        setError('Ваш акаунт заблоковано');
        setLoading(false);
        return;
      }

      let userId = existingUser?.id;

      if (!existingUser) {
        // Новий користувач - потрібен Discord username
        setPendingSteamData({ steamId, personaname: personaname || 'Unknown' });
        setNeedsDiscord(true);
        setLoading(false);
        return;
      } else {
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('steam_id', steamId);
      }

      localStorage.setItem('mock_user_id', userId);
      localStorage.setItem('mock_steam_id', steamId);
      localStorage.setItem('mock_steam_nickname', personaname || 'Unknown');

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

  if (needsDiscord) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center p-4">
        <div className="bg-gray-800 bg-opacity-60 p-8 rounded-lg border border-gray-700 max-w-md w-full">
          <h2 className="text-2xl font-bold mb-4">Завершення реєстрації</h2>
          <p className="text-gray-300 mb-6">
            Вітаємо! Для завершення реєстрації вкажіть ваш Discord username.
          </p>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Discord Username
              <span className="text-red-500 ml-1">*</span>
            </label>
            <input
              type="text"
              value={discordUsername}
              onChange={(e) => setDiscordUsername(e.target.value)}
              placeholder="username#0000"
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 text-gray-100 focus:outline-none focus:border-red-500"
              disabled={loading}
            />
            <p className="text-sm text-gray-400 mt-2">
              Введіть ваш Discord username, який відображається під вашим нікнеймом
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900 bg-opacity-50 border border-red-700 rounded text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={completeRegistration}
            disabled={loading || !discordUsername.trim()}
            className="w-full bg-red-600 hover:bg-red-500 px-6 py-3 rounded transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Реєстрація...' : 'Завершити реєстрацію'}
          </button>
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
