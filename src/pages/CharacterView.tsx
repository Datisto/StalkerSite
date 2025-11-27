import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, User, MapPin, Heart, Brain, Sword, Edit2, Send, Edit } from 'lucide-react';

interface Character {
  id: string;
  user_id: string;
  steam_id: string;
  name: string;
  surname: string;
  nickname: string;
  discord_id: string;
  age: number;
  gender: string;
  face_model: string;
  hair_color: string;
  eye_color: string;
  beard_style: string;
  special_features: string;
  height: number;
  weight: number;
  body_type: string;
  physical_features: string;
  character_traits: string[];
  phobias: string;
  values: string;
  faction: string;
  education: string;
  scientific_profile: string;
  research_motivation: string;
  military_experience: string;
  military_rank: string;
  military_join_reason: string;
  backstory: string;
  zone_motivation: string;
  character_goals: string;
  status: string;
  created_at: string;
  rejection_reason: string;
}

export default function CharacterView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = localStorage.getItem('admin_logged_in') === 'true';

  useEffect(() => {
    if (id) {
      loadCharacter();
    }
  }, [id]);

  async function loadCharacter() {
    try {
      console.log('CharacterView: Loading character with id:', id);
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error) {
        console.error('CharacterView: Error from Supabase:', error);
        throw error;
      }

      if (!data) {
        console.log('CharacterView: Character not found');
        alert('Персонаж не знайдено');
        navigate('/cabinet');
        return;
      }

      console.log('CharacterView: Character loaded successfully');

      setCharacter(data);
    } catch (error) {
      console.error('Error loading character:', error);
      alert('Помилка завантаження персонажа');
      navigate('/cabinet');
    } finally {
      setLoading(false);
    }
  }

  async function submitForReview() {
    if (!character) return;

    if (!confirm('Подати персонажа на розгляд? Після цього ви не зможете редагувати персонажа до рішення адміністрації.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .update({
          status: 'pending',
          submitted_at: new Date().toISOString()
        })
        .eq('id', character.id);

      if (error) throw error;

      alert('Персонажа відправлено на розгляд!');
      navigate('/cabinet');
    } catch (error) {
      console.error('Error submitting character:', error);
      alert('Помилка при відправці персонажа');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Завантаження...</p>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/cabinet')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад до кабінету
            </button>
            {character?.status === 'draft' && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigate(`/character/edit/${character.id}`)}
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
                >
                  <Edit className="w-4 h-4" />
                  Редагувати
                </button>
                <button
                  onClick={submitForReview}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition text-sm font-semibold"
                >
                  <Send className="w-4 h-4" />
                  Подати на розгляд
                </button>
              </div>
            )}
            {character?.status === 'rejected' && (
              <button
                onClick={() => navigate(`/character/edit/${character.id}`)}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
              >
                <Edit className="w-4 h-4" />
                Редагувати
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-900 to-gray-900 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {character.name} {character.surname}
                </h1>
                {character.nickname && (
                  <p className="text-xl text-gray-300">"{character.nickname}"</p>
                )}
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="bg-black bg-opacity-30 px-3 py-1 rounded">
                    {character.age} років
                  </span>
                  <span className="bg-black bg-opacity-30 px-3 py-1 rounded">
                    {character.gender === 'male' ? 'Чоловік' : 'Жінка'}
                  </span>
                  <span className="bg-red-600 bg-opacity-60 px-3 py-1 rounded">
                    {character.faction}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className={`inline-block px-4 py-2 rounded font-semibold ${
                    character.status === 'approved'
                      ? 'bg-green-600'
                      : character.status === 'pending'
                      ? 'bg-yellow-600'
                      : character.status === 'rejected'
                      ? 'bg-red-600'
                      : 'bg-gray-600'
                  }`}
                >
                  {character.status === 'pending' && 'На розгляді'}
                  {character.status === 'approved' && 'Схвалено'}
                  {character.status === 'rejected' && 'Відхилено'}
                  {character.status === 'draft' && 'Чернетка'}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {character.rejection_reason && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 p-4 rounded">
                <p className="font-semibold mb-2">Причина відхилення:</p>
                <p className="text-gray-300">{character.rejection_reason}</p>
              </div>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">Зовнішність</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-900 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-400">Модель обличчя</p>
                  <p className="font-semibold">{character.face_model || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Колір волосся</p>
                  <p className="font-semibold">{character.hair_color || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Колір очей</p>
                  <p className="font-semibold">{character.eye_color || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Борода / Вуса</p>
                  <p className="font-semibold">{character.beard_style || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Зріст</p>
                  <p className="font-semibold">{character.height} см</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Вага</p>
                  <p className="font-semibold">{character.weight} кг</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Статура</p>
                  <p className="font-semibold">{character.body_type || 'Не вказано'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Discord ID</p>
                  <p className="font-semibold">{character.discord_id || 'Не вказано'}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-sm text-gray-400">Steam ID (тільки для адмінів)</p>
                    <p className="font-semibold text-yellow-400">{character.steam_id}</p>
                  </div>
                )}
              </div>
              {character.special_features && (
                <div className="mt-4 bg-gray-900 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-2">Особливі прикмети</p>
                  <p className="text-gray-300">{character.special_features}</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">Характер</h2>
              </div>
              {character.character_traits && character.character_traits.length > 0 && (
                <div className="bg-gray-900 p-4 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">Риси характеру</p>
                  <div className="flex flex-wrap gap-2">
                    {character.character_traits.map((trait, i) => (
                      <span key={i} className="bg-red-900 bg-opacity-30 px-3 py-1 rounded text-sm">
                        {trait}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.values && (
                <div className="bg-gray-900 p-4 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-2">Життєві цінності</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{character.values}</p>
                </div>
              )}
              {character.phobias && (
                <div className="bg-gray-900 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-2">Фобії та слабкості</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{character.phobias}</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sword className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">Фракція</h2>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <p className="text-xl font-semibold mb-4">{character.faction}</p>

                {character.faction === 'Учений' && (
                  <div className="space-y-3">
                    {character.education && (
                      <div>
                        <p className="text-sm text-gray-400">Освіта / спеціальність</p>
                        <p className="text-gray-300">{character.education}</p>
                      </div>
                    )}
                    {character.scientific_profile && (
                      <div>
                        <p className="text-sm text-gray-400">Науковий профіль</p>
                        <p className="text-gray-300">{character.scientific_profile}</p>
                      </div>
                    )}
                    {character.research_motivation && (
                      <div>
                        <p className="text-sm text-gray-400">Мотивація дослідження Зони</p>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {character.research_motivation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {character.faction === 'Військовий' && (
                  <div className="space-y-3">
                    {character.military_experience && (
                      <div>
                        <p className="text-sm text-gray-400">Військовий досвід</p>
                        <p className="text-gray-300">{character.military_experience}</p>
                      </div>
                    )}
                    {character.military_rank && (
                      <div>
                        <p className="text-sm text-gray-400">Звання</p>
                        <p className="text-gray-300">{character.military_rank}</p>
                      </div>
                    )}
                    {character.military_join_reason && (
                      <div>
                        <p className="text-sm text-gray-400">Причина вступу</p>
                        <p className="text-gray-300 whitespace-pre-wrap">
                          {character.military_join_reason}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h2 className="text-2xl font-bold">Квента (Біографія)</h2>
                </div>
                {character.status === 'approved' && (
                  <button
                    onClick={() => navigate(`/character/edit-story/${character.id}`)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded transition text-sm"
                  >
                    <Edit2 className="w-4 h-4" />
                    Редагувати квенту
                  </button>
                )}
              </div>

              {character.backstory && (
                <div className="bg-gray-900 p-6 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">Передісторія</p>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {character.backstory}
                  </p>
                </div>
              )}

              {character.zone_motivation && (
                <div className="bg-gray-900 p-6 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">Мотивація приходу в Зону</p>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {character.zone_motivation}
                  </p>
                </div>
              )}

              {character.character_goals && (
                <div className="bg-gray-900 p-6 rounded">
                  <p className="text-sm text-gray-400 mb-3">Цілі персонажа</p>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {character.character_goals}
                  </p>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
