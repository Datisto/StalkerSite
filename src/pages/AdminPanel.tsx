import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, Users, FileText, Settings, Search, CheckCircle, XCircle, Eye } from 'lucide-react';

interface Character {
  id: string;
  name: string;
  surname: string;
  nickname: string | null;
  age: number;
  gender: string;
  faction: string;
  biography: string;
  status: string;
  created_at: string;
  user_id: string;
  user?: {
    steam_nickname: string;
  };
}

export default function AdminPanel() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  useEffect(() => {
    loadCharacters();
  }, [filter]);

  async function loadCharacters() {
    setLoading(true);
    try {
      let query = supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateCharacterStatus(
    characterId: string,
    status: 'approved' | 'rejected',
    rejectionReason?: string
  ) {
    try {
      const updates: any = {
        status,
        ...(status === 'approved' && { approved_at: new Date().toISOString() }),
        ...(status === 'rejected' && { rejection_reason: rejectionReason })
      };

      const { error } = await supabase
        .from('characters')
        .update(updates)
        .eq('id', characterId);

      if (error) throw error;

      await loadCharacters();
      setSelectedCharacter(null);
      alert(`Персонаж ${status === 'approved' ? 'схвалено' : 'відхилено'}`);
    } catch (error) {
      console.error('Error updating character:', error);
      alert('Помилка при оновленні персонажа');
    }
  }

  const filteredCharacters = characters.filter(char =>
    char.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    char.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (char.nickname && char.nickname.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-red-500" />
              <div>
                <h1 className="text-xl font-bold">Адмін-панель</h1>
                <p className="text-xs text-gray-400">STALKER RP Management</p>
              </div>
            </div>
            <a href="/" className="text-sm text-gray-400 hover:text-white transition">
              На головну
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">На розгляді</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {characters.filter(c => c.status === 'pending').length}
                </p>
              </div>
              <FileText className="w-8 h-8 text-yellow-500" />
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Схвалено</p>
                <p className="text-2xl font-bold text-green-500">
                  {characters.filter(c => c.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Відхилено</p>
                <p className="text-2xl font-bold text-red-500">
                  {characters.filter(c => c.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>

          <div className="bg-gray-800 bg-opacity-60 p-4 rounded-lg border border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Всього гравців</p>
                <p className="text-2xl font-bold text-blue-500">
                  {new Set(characters.map(c => c.user_id)).size}
                </p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Пошук персонажів..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded pl-10 pr-4 py-2 focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex gap-2">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded transition ${
                    filter === f
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {f === 'all' && 'Всі'}
                  {f === 'pending' && 'На розгляді'}
                  {f === 'approved' && 'Схвалені'}
                  {f === 'rejected' && 'Відхилені'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Завантаження...</p>
            </div>
          ) : filteredCharacters.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Персонажі не знайдено</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCharacters.map((character) => (
                <div
                  key={character.id}
                  className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700 hover:border-gray-600 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-1">
                        {character.name} {character.surname}
                        {character.nickname && (
                          <span className="text-gray-400 ml-2">"{character.nickname}"</span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-400">
                        {character.age} років • {character.gender === 'male' ? 'Чоловік' : 'Жінка'} • {character.faction}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Створено: {new Date(character.created_at).toLocaleDateString('uk-UA')}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedCharacter(character)}
                        className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                      >
                        <Eye className="w-4 h-4" />
                        Переглянути
                      </button>
                      {character.status === 'pending' && (
                        <>
                          <button
                            onClick={() => updateCharacterStatus(character.id, 'approved')}
                            className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Схвалити
                          </button>
                          <button
                            onClick={() => {
                              const reason = prompt('Причина відхилення:');
                              if (reason) {
                                updateCharacterStatus(character.id, 'rejected', reason);
                              }
                            }}
                            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition"
                          >
                            <XCircle className="w-4 h-4" />
                            Відхилити
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedCharacter && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-2xl font-bold mb-2">
                    {selectedCharacter.name} {selectedCharacter.surname}
                  </h2>
                  {selectedCharacter.nickname && (
                    <p className="text-gray-400">"{selectedCharacter.nickname}"</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedCharacter(null)}
                  className="text-gray-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Вік</p>
                    <p className="font-semibold">{selectedCharacter.age} років</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Стать</p>
                    <p className="font-semibold">
                      {selectedCharacter.gender === 'male' ? 'Чоловік' : 'Жінка'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Фракція</p>
                    <p className="font-semibold">{selectedCharacter.faction}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Статус</p>
                    <p className="font-semibold">{selectedCharacter.status}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-400 mb-2">Біографія</p>
                  <div className="bg-gray-900 p-4 rounded border border-gray-700">
                    <p className="whitespace-pre-wrap">{selectedCharacter.biography}</p>
                  </div>
                </div>

                {selectedCharacter.status === 'pending' && (
                  <div className="flex gap-2 pt-4">
                    <button
                      onClick={() => {
                        updateCharacterStatus(selectedCharacter.id, 'approved');
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition"
                    >
                      Схвалити персонажа
                    </button>
                    <button
                      onClick={() => {
                        const reason = prompt('Причина відхилення:');
                        if (reason) {
                          updateCharacterStatus(selectedCharacter.id, 'rejected', reason);
                        }
                      }}
                      className="flex-1 bg-red-600 hover:bg-red-500 py-3 rounded font-semibold transition"
                    >
                      Відхилити персонажа
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
