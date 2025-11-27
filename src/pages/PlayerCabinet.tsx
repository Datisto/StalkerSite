import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Plus, User, Edit, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  surname: string;
  nickname: string | null;
  age: number;
  faction: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived' | 'dead';
  created_at: string;
  rejection_reason: string | null;
}

export default function PlayerCabinet() {
  const { user, signOut } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadCharacters();
    }
  }, [user]);

  async function loadCharacters() {
    try {
      console.log('Loading characters for steam_id:', user!.steam_id);

      const { data, error } = await supabase
        .from('characters')
        .select('id, name, surname, nickname, age, faction, status, created_at, rejection_reason, steam_id')
        .eq('steam_id', user!.steam_id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error from Supabase:', error);
        throw error;
      }
      console.log('Loaded characters:', data);
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  }


  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { text: 'Чернетка', class: 'bg-gray-600', icon: Edit },
      pending: { text: 'На розгляді', class: 'bg-yellow-600', icon: Clock },
      approved: { text: 'Схвалено', class: 'bg-green-600', icon: CheckCircle },
      rejected: { text: 'Відхилено', class: 'bg-red-600', icon: XCircle },
      active: { text: 'Активний', class: 'bg-blue-600', icon: User },
      archived: { text: 'Архівовано', class: 'bg-gray-700', icon: User },
      dead: { text: 'Мертвий', class: 'bg-black border border-gray-600', icon: XCircle }
    };

    const badge = badges[status as keyof typeof badges];
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${badge.class}`}>
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Будь ласка, увійдіть через Steam</p>
          <a href="/" className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition">
            На головну
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="text-xl font-bold">STALKER RP</a>
            <div className="flex items-center gap-4">
              <a
                href="/rules-test"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <BookOpen className="w-4 h-4" />
                Здача правил
              </a>
              <span className="text-sm text-gray-300">{user.steam_nickname}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                Вийти
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Особистий кабінет</h1>
          <p className="text-gray-400">Керуйте своїми персонажами</p>
          <p className="text-gray-400">Ваш Steam ID64: {user!.steam_id}</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">Мої персонажі</h2>
          {!characters.some(c => c.status === 'pending' || c.status === 'approved' || c.status === 'active') ? (
            <a
              href="/character/new"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              Створити персонажа
            </a>
          ) : (
            <div className="text-sm text-gray-400">
              {characters.some(c => c.status === 'pending') && 'Персонаж на розгляді'}
              {characters.some(c => c.status === 'approved' || c.status === 'active') && 'У вас є активний персонаж'}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">Завантаження...</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="bg-gray-800 bg-opacity-60 p-12 rounded-lg border border-gray-700 text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">У вас ще немає персонажів</h3>
            <p className="text-gray-400 mb-6">Створіть свого першого персонажа, щоб почати гру</p>
            <a
              href="/character/new"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              Створити персонажа
            </a>
          </div>
        ) : (
          <div className="grid gap-4">
            {characters.map((character) => (
              <div
                key={character.id}
                className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 hover:border-gray-600 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">
                      {character.name} {character.surname}
                      {character.nickname && (
                        <span className="text-gray-400 ml-2">"{character.nickname}"</span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {character.age} років • {character.faction}
                    </p>
                  </div>
                  {getStatusBadge(character.status)}
                </div>

                {character.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded">
                    <p className="text-sm text-red-300">
                      <strong>Причина відхилення:</strong> {character.rejection_reason}
                    </p>
                  </div>
                )}

                <div className="flex gap-2">
                  {(character.status === 'draft' || character.status === 'rejected') && (
                    <a
                      href={`/character/edit/${character.id}`}
                      className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Редагувати
                    </a>
                  )}
                  <a
                    href={`/character/${character.id}`}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
                  >
                    <User className="w-4 h-4" />
                    Переглянути
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
