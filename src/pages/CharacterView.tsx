import { translateZoneReason } from '../i18n/character';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/language';
import { localizedText } from '../i18n/content';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, User, Heart, Brain, Sword, Send, Edit } from 'lucide-react';
import { showAlert, showConfirm } from '../utils/modals';
import { apiClient } from '../lib/api-client';

interface Character {
  id: string;
  user_id?: string;
  steam_id: string;
  name: string;
  surname: string;
  patronymic?: string | null;
  nickname?: string | null;
  discord_id?: string | null;
  age?: number | null;
  gender?: string | null;
  face_model?: string | null;
  face_model_en?: string | null;
  hair_color?: string | null;
  eye_color?: string | null;
  beard_style?: string | null;
  special_features?: string | null;
  height?: number | null;
  weight?: number | null;
  body_type?: string | null;
  physical_features?: string | null;
  character_traits?: string[] | string;
  phobias?: string | null;
  character_values?: string | null;
  faction: string;
  education?: string | null;
  scientific_profile?: string | null;
  research_motivation?: string | null;
  military_experience?: string | null;
  military_rank?: string | null;
  military_join_reason?: string | null;
  backstory?: string | null;
  zone_motivation?: string | null;
  character_goals?: string | null;
  status: string;
  created_at?: string;
  rejection_reason?: string | null;
}

export default function CharacterView() {
  const tx = useTranslation();
  const { t, language } = useLanguage();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [character, setCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);
  const isAdmin = localStorage.getItem('admin_logged_in') === 'true';

  useEffect(() => {
    if (id && !authLoading) {
      loadCharacter();
    }
  }, [id, authLoading, user?.token]);

  async function loadCharacter() {
    try {
      const data = await apiClient.characters.get(id!);

      if (!data) {
        await showAlert(tx("Персонаж не знайдено"), tx("Помилка"), 'error');
        navigate('/cabinet');
        return;
      }

      if (!isAdmin && user && data.steam_id !== user.steam_id) {
        await showAlert(tx("Ви не маєте доступу до цього персонажа"), tx("Помилка"), 'error');
        navigate('/cabinet');
        return;
      }

      if (data.character_traits && typeof data.character_traits === 'string') {
        data.character_traits = JSON.parse(data.character_traits);
      }

      setCharacter(data);
    } catch (error) {
      console.error('Error loading character:', error);
      await showAlert(tx("Помилка завантаження персонажа"), tx("Помилка"), 'error');
      navigate('/cabinet');
    } finally {
      setLoading(false);
    }
  }

  async function submitForReview() {
    if (!character) return;

    const confirmed = await showConfirm(
      tx("Подати персонажа на розгляд? Після цього ви не зможете редагувати персонажа до рішення адміністрації."),
      tx("Підтвердження"),
      { type: 'warning', confirmText: tx("Подати"), cancelText: tx("Скасувати") }
    );
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/characters/${character.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.token || ''}`,
        },
        body: JSON.stringify({
          status: 'pending',
          submitted_at: new Date().toISOString()
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to submit character');
      }

      await showAlert(tx("Персонажа відправлено на розгляд!"), tx("Успіх"), 'success');
      navigate('/cabinet');
    } catch (error) {
      console.error('Error submitting character:', error);
      await showAlert(tx("Помилка при відправці персонажа"), tx("Помилка"), 'error');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">{t('loading')}</p>
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
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/cabinet')}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              {t('backToCabinet')}
            </button>
            {character?.status === 'draft' && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => navigate(`/character/edit/${character.id}`)}
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
                >
                  <Edit className="w-4 h-4" />
                  {t('edit')}
                </button>
                <button
                  onClick={submitForReview}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition text-sm font-semibold"
                >
                  <Send className="w-4 h-4" />
                  {t('submitForReview')}
                </button>
              </div>
            )}
            {character?.status === 'rejected' && (
              <button
                onClick={() => navigate(`/character/edit/${character.id}`)}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
              >
                <Edit className="w-4 h-4" />
                {t('edit')}
              </button>
            )}
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 overflow-hidden">
          <div className="bg-gradient-to-r from-red-900 to-gray-900 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold mb-2">
                  {character.name} {character.patronymic ? `${character.patronymic} ` : ''}{character.surname}
                </h1>
                {character.nickname && (
                  <p className="text-xl text-gray-300">"{character.nickname}"</p>
                )}
                <div className="flex gap-4 mt-4 text-sm">
                  <span className="bg-black bg-opacity-30 px-3 py-1 rounded">
                    {character.age} {tx(" років")}</span>
                  <span className="bg-black bg-opacity-30 px-3 py-1 rounded">
                    {character.gender === 'male' ? tx("Чоловік") : tx("Жінка")}
                  </span>
                  <span className="bg-red-600 bg-opacity-60 px-3 py-1 rounded">
                    {tx(character.faction)}
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
                  {character.status === 'pending' && tx("На розгляді")}
                  {character.status === 'approved' && tx("Схвалено")}
                  {character.status === 'rejected' && tx("Відхилено")}
                  {character.status === 'draft' && tx("Чернетка")}
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {character.rejection_reason && (
              <div className="bg-red-900 bg-opacity-30 border border-red-700 p-4 rounded">
                <p className="font-semibold mb-2">{tx("Причина відхилення:")}</p>
                <p className="text-gray-300">{character.rejection_reason}</p>
              </div>
            )}

            <section>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">{tx("Зовнішність")}</h2>
              </div>
              <div className="grid md:grid-cols-2 gap-4 bg-gray-900 p-4 rounded">
                <div>
                  <p className="text-sm text-gray-400">{tx("Модель обличчя")}</p>
                  <p className="font-semibold">{localizedText(character.face_model || tx("Не вказано"), character.face_model_en, language)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Колір волосся")}</p>
                  <p className="font-semibold">{tx(character.hair_color || "Не вказано")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Колір очей")}</p>
                  <p className="font-semibold">{tx(character.eye_color || "Не вказано")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Борода / Вуса")}</p>
                  <p className="font-semibold">{character.beard_style || tx("Не вказано")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Зріст")}</p>
                  <p className="font-semibold">{character.height} {tx(" см")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Вага")}</p>
                  <p className="font-semibold">{character.weight} {tx(" кг")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">{tx("Статура")}</p>
                  <p className="font-semibold">{tx(character.body_type || "Не вказано")}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Discord ID</p>
                  <p className="font-semibold">{character.discord_id || tx("Не вказано")}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-sm text-gray-400">{tx("Steam ID (тільки для адмінів)")}</p>
                    <p className="font-semibold text-yellow-400">{character.steam_id}</p>
                  </div>
                )}
              </div>
              {character.special_features && (
                <div className="mt-4 bg-gray-900 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-2">{tx("Особливі прикмети")}</p>
                  <p className="text-gray-300">{character.special_features}</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">{tx("Характер")}</h2>
              </div>
              {Array.isArray(character.character_traits) && character.character_traits.length > 0 && (
                <div className="bg-gray-900 p-4 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">{tx("Риси характеру")}</p>
                  <div className="flex flex-wrap gap-2">
                    {character.character_traits.map((trait: string, i: number) => (
                      <span key={i} className="bg-red-900 bg-opacity-30 px-3 py-1 rounded text-sm">
                        {tx(trait)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {character.character_values && (
                <div className="bg-gray-900 p-4 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-2">{tx("Життєві цінності")}</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{character.character_values}</p>
                </div>
              )}
              {character.phobias && (
                <div className="bg-gray-900 p-4 rounded">
                  <p className="text-sm text-gray-400 mb-2">{tx("Фобії та слабкості")}</p>
                  <p className="text-gray-300 whitespace-pre-wrap">{character.phobias}</p>
                </div>
              )}
            </section>

            <section>
              <div className="flex items-center gap-2 mb-4">
                <Sword className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">{tx("Фракція")}</h2>
              </div>
              <div className="bg-gray-900 p-4 rounded">
                <p className="text-xl font-semibold mb-4">{tx(character.faction)}</p>

                {character.faction === 'Учений' && (
                  <div className="space-y-3">
                    {character.education && (
                      <div>
                        <p className="text-sm text-gray-400">{tx("Освіта / спеціальність")}</p>
                        <p className="text-gray-300">{character.education}</p>
                      </div>
                    )}
                    {character.scientific_profile && (
                      <div>
                        <p className="text-sm text-gray-400">{tx("Науковий профіль")}</p>
                        <p className="text-gray-300">{character.scientific_profile}</p>
                      </div>
                    )}
                    {character.research_motivation && (
                      <div>
                        <p className="text-sm text-gray-400">{tx("Мотивація дослідження Зони")}</p>
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
                        <p className="text-sm text-gray-400">{tx("Військовий досвід")}</p>
                        <p className="text-gray-300">{tx(character.military_experience)}</p>
                      </div>
                    )}
                    {character.military_rank && (
                      <div>
                        <p className="text-sm text-gray-400">{tx("Звання")}</p>
                        <p className="text-gray-300">{character.military_rank}</p>
                      </div>
                    )}
                    {character.military_join_reason && (
                      <div>
                        <p className="text-sm text-gray-400">{tx("Причина вступу")}</p>
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
              <div className="flex items-center gap-2 mb-4">
                <Heart className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-bold">
                  {character.backstory && character.backstory.length < 500 ? tx("Анкета (Біографія)") : tx("Квента (Біографія)")}
                </h2>
              </div>

              {character.backstory && (
                <div className="bg-gray-900 p-6 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">{tx("Передісторія")}</p>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {character.backstory}
                  </p>
                </div>
              )}

              {character.zone_motivation && (
                <div className="bg-gray-900 p-6 rounded mb-4">
                  <p className="text-sm text-gray-400 mb-3">{tx("Мотивація приходу в Зону")}</p>
                  <p className="text-gray-300 whitespace-pre-wrap leading-relaxed">
                    {translateZoneReason(character.zone_motivation, tx)}
                  </p>
                </div>
              )}

              {character.character_goals && (
                <div className="bg-gray-900 p-6 rounded">
                  <p className="text-sm text-gray-400 mb-3">{tx("Цілі персонажа")}</p>
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
