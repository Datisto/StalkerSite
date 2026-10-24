import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/language';
import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../lib/api-client';
import { Plus, User, Edit, CheckCircle, XCircle, Clock, BookOpen, RefreshCw, Ban, Send } from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';
import { DiscordSetupModal } from '../components/DiscordSetupModal';
import { showAlert, showConfirm } from '../utils/modals';

interface Character {
  id: string;
  name: string;
  surname: string;
  patronymic?: string | null;
  nickname?: string | null;
  age: number;
  faction: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'active' | 'archived' | 'dead';
  created_at?: string;
  rejection_reason?: string | null;
}

export default function PlayerCabinet() {
  const tx = useTranslation();
  const { t } = useLanguage();
  const { user, signOut, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeUntilEmission, setTimeUntilEmission] = useState('');
  const [showDiscordModal, setShowDiscordModal] = useState(false);
  const [discordLoading, setDiscordLoading] = useState(false);
  const [discordError, setDiscordError] = useState('');
  const [submittingCharacterId, setSubmittingCharacterId] = useState<string | null>(null);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      const kyivTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Kiev' }));
      const hours = kyivTime.getHours();
      const minutes = kyivTime.getMinutes();
      const seconds = kyivTime.getSeconds();

      const emissionHours = [1, 5, 9, 13, 17, 21];
      let nextEmissionHour = emissionHours.find(h => h > hours);

      if (nextEmissionHour === undefined) {
        nextEmissionHour = emissionHours[0];
      }

      const currentTotalMinutes = hours * 60 + minutes;
      const nextEmissionTotalMinutes = nextEmissionHour * 60;

      let minutesUntilEmission = nextEmissionTotalMinutes - currentTotalMinutes;
      if (minutesUntilEmission <= 0) {
        minutesUntilEmission += 24 * 60;
      }

      const secondsUntilEmission = minutesUntilEmission * 60 - seconds;
      const hoursLeft = Math.floor(secondsUntilEmission / 3600);
      const minutesLeft = Math.floor((secondsUntilEmission % 3600) / 60);
      const secondsLeft = secondsUntilEmission % 60;

      setTimeUntilEmission(
        `${String(hoursLeft).padStart(2, '0')}:${String(minutesLeft).padStart(2, '0')}:${String(secondsLeft).padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (user) {
      if (!user.discord_username) {
        setShowDiscordModal(true);
      }
      loadCharacters();
    }
  }, [user]);

  async function loadCharacters() {
    try {
      setLoading(true);
      const data = await apiClient.characters.list({ steam_id: user!.steam_id });
      setCharacters(data || []);
    } catch (error) {
      console.error('Error loading characters:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDiscordSubmit(discordUsername: string) {
    try {
      setDiscordLoading(true);
      setDiscordError('');

      await apiClient.users.update({ discord_username: discordUsername });

      await refreshUser();

      setShowDiscordModal(false);
    } catch (error) {
      console.error('Error saving Discord ID:', error);
      setDiscordError(error instanceof Error ? error.message : "Помилка збереження Discord ID");
    } finally {
      setDiscordLoading(false);
    }
  }

  async function handleSubmitCharacter(characterId: string) {
    const confirmed = await showConfirm(
      tx("Після відправки анкета буде заблокована для редагування та піде на розгляд адміністрації. Продовжити?"),
      tx("Відправити персонажа"),
      { type: 'warning', confirmText: tx("Відправити"), cancelText: tx("Скасувати") }
    );

    if (!confirmed) {
      return;
    }

    try {
      setSubmittingCharacterId(characterId);
      await apiClient.patch<{ success: boolean }>(`/characters/${characterId}`, {
        status: 'pending',
        submitted_at: new Date().toISOString(),
      });

      await showAlert(tx("Персонажа відправлено на розгляд"), tx("Успіх"), 'success');
      await loadCharacters();
    } catch (error) {
      console.error('Error submitting character:', error);
      await showAlert(
        error instanceof Error ? error.message : tx("Помилка при відправці персонажа"),
        tx("Помилка"),
        'error'
      );
    } finally {
      setSubmittingCharacterId(null);
    }
  }


  const getStatusBadge = (status: string) => {
    const badges = {
      draft: { text: tx("Чернетка"), class: 'bg-gray-600', icon: Edit },
      pending: { text: tx("На розгляді"), class: 'bg-yellow-600', icon: Clock },
      approved: { text: tx("Схвалено"), class: 'bg-green-600', icon: CheckCircle },
      rejected: { text: tx("Відхилений"), class: 'bg-red-600', icon: XCircle },
      active: { text: tx("Активний"), class: 'bg-blue-600', icon: User },
      archived: { text: tx("Архівовано"), class: 'bg-gray-700', icon: User },
      dead: { text: tx("Мертвий"), class: 'bg-black border border-gray-600', icon: XCircle }
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
          <p className="text-gray-300 mb-4">{tx("Завантаження Steam")}</p>
          <a href="/" className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition">
            {t('goHome')}
          </a>
        </div>
      </div>
    );
  }

  if (user.is_banned) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full">
          <div className="bg-gray-800 bg-opacity-90 rounded-lg border-2 border-red-600 p-8 text-center">
            <div className="mb-6">
              <Ban className="w-24 h-24 text-red-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-red-500 mb-2">{tx("Ваш акаунт заблоковано")}</h1>
            </div>

            <div className="bg-gray-900 bg-opacity-60 rounded p-6 mb-6 border border-red-600">
              <h2 className="text-lg font-semibold mb-2 text-gray-300">{tx("Причина блокування:")}</h2>
              <p className="text-gray-100 text-lg whitespace-pre-wrap">{tx("Причина не вказана")}</p>
            </div>

            <p className="text-gray-400 mb-6">
              {tx("Доступ до особистого кабінету обмежено. Якщо ви вважаєте, що це помилка, зверніться до адміністрації сервера в Discord.")}</p>

            <div className="flex justify-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition"
              >
                {t('goHome')}
              </button>
              <button
                onClick={signOut}
                className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded font-semibold transition"
              >
                {t('logout')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-98 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <a href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
              <img src={logoIcon} alt="Eternal ZONE" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold font-stalker">Eternal ZONE</span>
            </a>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 text-sm bg-gray-800 bg-opacity-60 px-4 py-2 rounded border border-red-600">
                <RefreshCw className="w-4 h-4 text-red-500" />
                <span className="text-gray-300">{t('nextEmission')}</span>
                <span className="font-mono text-red-500 font-semibold">{timeUntilEmission}</span>
              </div>
              <a
                href="/rules-test"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <BookOpen className="w-4 h-4" />
                {t('rulesTest')}
              </a>
              <span className="text-sm text-gray-300">{user.steam_nickname}</span>
              <button
                onClick={signOut}
                className="text-sm text-gray-400 hover:text-white transition"
              >
                {t('logout')}
              </button>
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{tx("Особистий кабінет")}</h1>
          <p className="text-gray-400">{tx("Керуйте своїми персонажами")}</p>
          <p className="text-gray-400">{tx("Ваш Steam ID64: ")}{user!.steam_id}</p>
          <p className="text-gray-400">
            {tx("Ваш Discord ID: ")}{user!.discord_username || <span className="text-orange-400">{tx("Не вказано")}</span>}
          </p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">{tx("Мої персонажі")}</h2>
          <div className="flex gap-2">
            <button
              onClick={loadCharacters}
              className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded font-semibold transition"
            >
              <RefreshCw className="w-5 h-5" />
              {t('refresh')}
            </button>
            {(() => {
              const hasPending = characters.some(c => c.status === 'pending');
              const hasActive = characters.some(c => c.status === 'approved' || c.status === 'active');
              const canCreate = !hasPending && !hasActive;

              return canCreate ? (
                <a
                  href="/character/new"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold transition"
                >
                  <Plus className="w-5 h-5" />
                  {t('createCharacter')}
                </a>
              ) : (
                <div className="text-sm text-gray-400 flex items-center">
                  {hasPending && tx("Персонаж на розгляді")}
                  {hasActive && tx("У вас є активний персонаж")}
                </div>
              );
            })()}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        ) : characters.length === 0 ? (
          <div className="bg-gray-800 bg-opacity-60 p-12 rounded-lg border border-gray-700 text-center">
            <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">{tx("У вас ще немає персонажів")}</h3>
            <p className="text-gray-400 mb-6">{tx("Створіть свого першого персонажа, щоб почати гру")}</p>
            <a
              href="/character/new"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded-lg font-semibold transition"
            >
              <Plus className="w-5 h-5" />
              {t('createCharacter')}
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
                      {character.name} {character.patronymic ? `${character.patronymic} ` : ''}{character.surname}
                      {character.nickname && (
                        <span className="text-gray-400 ml-2">"{character.nickname}"</span>
                      )}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {character.age} {tx(" років • ")}{tx(character.faction)}
                    </p>
                  </div>
                  {getStatusBadge(character.status)}
                </div>

                {character.rejection_reason && (
                  <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded">
                    <p className="text-sm text-red-300">
                      <strong>{tx("Причина відхилення:")}</strong> {character.rejection_reason}
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
                      {t('edit')}
                    </a>
                  )}
                  {character.status === 'draft' && (
                    <button
                      onClick={() => handleSubmitCharacter(character.id)}
                      disabled={submittingCharacterId === character.id}
                      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition text-sm disabled:opacity-50"
                    >
                      <Send className="w-4 h-4" />
                      {submittingCharacterId === character.id ? t('sending') : t('submit')}
                    </button>
                  )}
                  <a
                    href={`/character/${character.id}`}
                    className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition text-sm"
                  >
                    <User className="w-4 h-4" />
                    {t('view')}
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <DiscordSetupModal
        isOpen={showDiscordModal}
        onSubmit={handleDiscordSubmit}
        loading={discordLoading}
        error={discordError}
      />
    </div>
  );
}
