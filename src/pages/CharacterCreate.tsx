import { translateZoneReason } from '../i18n/character';
import { useTranslation } from '../hooks/useTranslation';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { useLanguage } from '../contexts/language';
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, Save, Copy } from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';
import { showAlert } from '../utils/modals';
import FaceModelSelector from '../components/FaceModelSelector';
import {
  FACTIONS,
  HAIR_COLORS,
  EYE_COLORS,
  BODY_TYPES,
  MILITARY_EXPERIENCE,
  CHARACTER_TRAITS,
  TRAIT_CATEGORIES,
  ZONE_ENTRY_REASONS,
  generateHeightOptions,
  generateWeightOptions,
  generateAgeOptions,
} from '../data/characterConstants';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;
type TraitCategory = keyof typeof CHARACTER_TRAITS;

interface CharacterData {
  steam_id: string;
  discord_id: string;
  name: string;
  surname: string;
  patronymic: string;
  nickname: string;
  gender: 'male' | 'female';
  age: number;
  face_model: string;
  hair_color: string;
  eye_color: string;
  special_features: string;
  height: number;
  weight: number;
  body_type: string;
  physical_features: string;
  character_traits: string[];
  phobias: string;
  character_values: string;
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
}

interface CharacterStatusRecord {
  status: string;
}

export default function CharacterCreate() {
  const tx = useTranslation();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [hasExistingCharacter, setHasExistingCharacter] = useState(false);
  const [hasApprovedTest, setHasApprovedTest] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [questType, setQuestType] = useState<'short' | 'full'>('short');
  const [formData, setFormData] = useState<CharacterData>({
    steam_id: '',
    discord_id: '',
    name: '',
    surname: '',
    patronymic: '',
    nickname: '',
    gender: 'male',
    age: 25,
    face_model: '',
    hair_color: '',
    eye_color: '',
    special_features: '',
    height: 175,
    weight: 75,
    body_type: '',
    physical_features: '',
    character_traits: [],
    phobias: '',
    character_values: '',
    faction: '',
    education: '',
    scientific_profile: '',
    research_motivation: '',
    military_experience: '',
    military_rank: '',
    military_join_reason: '',
    backstory: '',
    zone_motivation: '',
    character_goals: '',
  });

  const selectedZoneReason = ZONE_ENTRY_REASONS.find(
    (reason) => `${reason.title}: ${reason.description}` === formData.zone_motivation
  );

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        steam_id: user.steam_id || user.id,
        discord_id: user.discord_username || ''
      }));
      loadInitialData();
    }
  }, [user, id]);

  async function loadInitialData() {
    try {
      setLoading(true);
      await checkApprovedTest();
      if (id) {
        setIsEditMode(true);
        await loadExistingCharacter();
      } else {
        await checkExistingCharacter();
      }
    } finally {
      setLoading(false);
    }
  }

  async function loadExistingCharacter() {
    if (!user || !id) return;
    try {
      const response = await fetch(`/api/characters/${id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        await showAlert(tx("Персонаж не знайдено"), tx("Помилка"), 'error');
        navigate('/cabinet');
        return;
      }

      const data = await response.json();

      if (data.status !== 'draft' && data.status !== 'rejected') {
        await showAlert(tx("Цей персонаж не може бути відредагований"), tx("Помилка"), 'warning');
        navigate('/cabinet');
        return;
      }

      setFormData({
        steam_id: data.steam_id || user.steam_id || user.id,
        discord_id: data.discord_id || '',
        name: data.name || '',
        surname: data.surname || '',
        patronymic: data.patronymic || '',
        nickname: data.nickname || '',
        gender: data.gender || 'male',
        age: data.age || 25,
        face_model: data.face_model || '',
        hair_color: data.hair_color || '',
        eye_color: data.eye_color || '',
        special_features: data.special_features || '',
        height: data.height || 175,
        weight: data.weight || 75,
        body_type: data.body_type || '',
        physical_features: data.physical_features || '',
        character_traits: Array.isArray(data.character_traits) ? data.character_traits : (typeof data.character_traits === 'string' ? JSON.parse(data.character_traits) : []),
        phobias: data.phobias || '',
        character_values: data.character_values || '',
        faction: data.faction || '',
        education: data.education || '',
        scientific_profile: data.scientific_profile || '',
        research_motivation: data.research_motivation || '',
        military_experience: data.military_experience || '',
        military_rank: data.military_rank || '',
        military_join_reason: data.military_join_reason || '',
        backstory: data.backstory || '',
        zone_motivation: data.zone_motivation || '',
        character_goals: data.character_goals || '',
      });
    } catch (error) {
      console.error('Error loading character:', error);
      await showAlert(tx("Помилка завантаження персонажа"), tx("Помилка"), 'error');
      navigate('/cabinet');
    }
  }

  async function checkExistingCharacter() {
    if (!user) return;
    try {
      const response = await fetch(`/api/characters?steam_id=${user.steam_id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        console.error('Error checking character:', response.status);
        return;
      }

      const characters = (await response.json()) as CharacterStatusRecord[];
      const hasActive = characters.some((char) => ['pending', 'approved', 'active'].includes(char.status));
      if (hasActive) {
        setHasExistingCharacter(true);
      }
    } catch (error) {
      console.error('Error checking character:', error);
    }
  }

  async function checkApprovedTest() {
    if (!user) return;
    try {
      const response = await fetch(`/api/users/${user.steam_id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        console.error('Error checking test approval:', response.status);
        return;
      }

      const data = await response.json();
      setHasApprovedTest(!!data.rules_passed);
    } catch (error) {
      console.error('Error checking test approval:', error);
    }
  }

  const updateField = <K extends keyof CharacterData>(field: K, value: CharacterData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTrait = (trait: string, category: TraitCategory) => {
    setFormData((prev) => {
      const traits = prev.character_traits;
      if (traits.includes(trait)) {
        return { ...prev, character_traits: traits.filter((t) => t !== trait) };
      } else {
        const categoryTraits = CHARACTER_TRAITS[category] as readonly string[];
        const selectedInCategory = traits.filter((t) => categoryTraits.includes(t));
        if (selectedInCategory.length < 3) {
          return { ...prev, character_traits: [...traits, trait] };
        }
      }
      return prev;
    });
  };

  const [checkingNickname, setCheckingNickname] = useState(false);

  const canProceed = () => {
    switch (step) {
      case 1:
        return (
          formData.steam_id &&
          formData.discord_id &&
          formData.name &&
          formData.surname &&
          formData.nickname &&
          formData.gender &&
          formData.age >= 16 &&
          formData.age <= 70
        );
      case 2:
        return (
          formData.face_model &&
          formData.hair_color &&
          formData.eye_color
        );
      case 3:
        return formData.height && formData.weight && formData.body_type;
      case 4:
        return formData.character_traits.length >= 3 && formData.character_values;
      case 5:
        if (formData.faction === 'Учений') {
          return (
            formData.faction &&
            formData.education &&
            formData.scientific_profile &&
            formData.research_motivation
          );
        } else if (formData.faction === 'Військовий') {
          return (
            formData.faction &&
            formData.military_experience &&
            formData.military_join_reason
          );
        }
        return formData.faction;
      case 6:
        if (questType === 'short') {
          return formData.backstory.length > 0 && formData.backstory.length <= 500 && formData.zone_motivation;
        } else {
          return formData.backstory.length >= 500 && formData.zone_motivation;
        }
      case 7:
        return true;
      default:
        return false;
    }
  };

  async function handleNext() {
    if (step === 1 && formData.nickname) {
      setCheckingNickname(true);
      try {
        const params = new URLSearchParams({ nickname: formData.nickname });
        if (id) params.set('excludeId', id);
        const response = await fetch(`/api/characters/check-nickname?${params.toString()}`);
        const data = await response.json() as { taken: boolean };
        if (data.taken) {
          await showAlert(
            tx("Позивний \"{0}\" вже зайнятий. Будь ласка, оберіть інший позивний.", [formData.nickname]),
            tx("Позивний недоступний"),
            'error'
          );
          return;
        }
      } catch {
        await showAlert(tx("Помилка перевірки позивного. Спробуйте ще раз."), tx("Помилка"), 'error');
        return;
      } finally {
        setCheckingNickname(false);
      }
    }
    setStep((step + 1) as Step);
  }

  const saveCharacter = async (status: 'draft' | 'pending') => {
    if (!user) return;

    setSaving(true);
    try {
      const characterData = {
        steam_id: user.steam_id,
        status,
        discord_id: formData.discord_id,
        name: formData.name,
        surname: formData.surname,
        patronymic: formData.patronymic || null,
        nickname: formData.nickname,
        gender: formData.gender,
        age: formData.age,
        face_model: formData.face_model,
        hair_color: formData.hair_color,
        eye_color: formData.eye_color,
        special_features: formData.special_features,
        height: formData.height,
        weight: formData.weight,
        body_type: formData.body_type,
        physical_features: formData.physical_features,
        character_traits: formData.character_traits,
        phobias: formData.phobias,
        character_values: formData.character_values,
        faction: formData.faction,
        education: formData.education || null,
        scientific_profile: formData.scientific_profile || null,
        research_motivation: formData.research_motivation || null,
        military_experience: formData.military_experience || null,
        military_rank: formData.military_rank || null,
        military_join_reason: formData.military_join_reason || null,
        backstory: formData.backstory,
        zone_motivation: formData.zone_motivation,
        character_goals: formData.character_goals,
        submitted_at: status === 'pending' ? new Date().toISOString() : null,
      };

      let response;
      if (isEditMode && id) {
        response = await fetch(`/api/characters/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify(characterData),
        });
      } else {
        response = await fetch('/api/characters', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.token}`,
          },
          body: JSON.stringify(characterData),
        });
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save character');
      }

      await showAlert(
        isEditMode
          ? tx("Зміни збережено")
          : status === 'draft'
          ? tx("Персонажа збережено як чернетку")
          : tx("Персонажа відправлено на розгляд"),
        tx("Успіх"),
        'success'
      );
      navigate('/cabinet');
    } catch (error) {
      console.error('Error saving character:', error);
      await showAlert(tx("Помилка при збереженні персонажа"), tx("Помилка"), 'error');
    } finally {
      setSaving(false);
    }
  };

  const copySteamId = async () => {
    navigator.clipboard.writeText(formData.steam_id);
    await showAlert(tx("Steam ID скопійовано!"), tx("Успіх"), 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">{tx("Завантаження Steam")}</p>
          <a
            href="/"
            className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
          >
            {t('goHome')}
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">{t('loading')}</p>
      </div>
    );
  }

  if (!hasApprovedTest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">{tx("Потрібна здача правил")}</h2>
          <p className="text-gray-300 mb-6">
            {tx("Перед створенням персонажа необхідно здати тест на знання правил сервера. Після схвалення адміністрацією ви зможете створити персонажа.")}</p>
          <div className="flex gap-4 justify-center">
            <a
              href="/rules-test"
              className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
            >
              {t('takeRulesTest')}
            </a>
            <a
              href="/cabinet"
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-semibold transition"
            >
              {t('goToCabinet')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (hasExistingCharacter) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">{tx("Обмеження створення")}</h2>
          <p className="text-gray-300 mb-6">
            {tx("У Вас вже є активний персонаж. Зверніться до адміністрації для його видалення.")}</p>
          <a
            href="/cabinet"
            className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
          >
            {t('goToCabinet')}
          </a>
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
            <a
              href="/cabinet"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              {t('backToCabinet')}
            </a>
            <LanguageSwitcher />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{isEditMode ? tx("Редагування персонажа") : tx("Створення персонажа")}</h1>
          <p className="text-gray-400">{tx("Крок ")}{step} {tx(" з 7")}</p>
        </div>

        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((s) => (
              <div
                key={s}
                className={`flex-1 h-2 rounded ${
                  s <= step ? 'bg-red-600' : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700">
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Основні дані персонажа")}</h2>

              <div>
                <label className="block text-sm font-medium mb-2">{tx("СтімID64 *")}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.steam_id}
                    disabled
                    className="flex-1 bg-gray-700 border border-gray-600 rounded px-4 py-2 text-gray-400 cursor-not-allowed"
                  />
                  <button
                    onClick={copySteamId}
                    className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Discord ID *
                  <span className="text-xs text-gray-400 block mt-1">
                    {tx("Автоматично заповнюється з вашого профілю після реєстрації")}</span>
                </label>
                <input
                  type="text"
                  value={formData.discord_id}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-gray-400 cursor-not-allowed"
                  placeholder={tx("Не заповнено")}
                />
                {!formData.discord_id && (
                  <div className="mt-4 space-y-3">
                    <div className="bg-gray-900 p-3 rounded border border-gray-700">
                      <p className="text-xs text-gray-400 mb-2">{tx("Де знайти свій Discord ID:")}</p>
                      <img src="/discordid.png" alt={tx("Як знайти Discord ID")} className="w-full rounded" />
                    </div>
                    <a
                      href="https://discord.gg/eternalzone"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-center bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-semibold transition"
                    >
                      {t('joinDiscord')}
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Ім'я *")}</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder={tx("Олександр")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Прізвище *")}</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => updateField('surname', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder={tx("Коваленко")}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{tx("По батькові")}</label>
                  <input
                    type="text"
                    value={formData.patronymic}
                    onChange={(e) => updateField('patronymic', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder={tx("Іванович")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Псевдонім / Кличка *")}<span className="text-xs text-gray-400 block mt-1">
                    {tx("Має бути унікальним, латиницею, без додаткових знаків. Приклад: \"Holod\" або \"MykolaHolod\"")}</span>
                </label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => updateField('nickname', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  placeholder="Holod"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Стать *")}</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value as 'male' | 'female')}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="male">{tx("Чоловіча")}</option>
                    <option value="female">{tx("Жіноча")}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Вік (16-70) *")}</label>
                  <select
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    {generateAgeOptions().map((age) => (
                      <option key={age} value={age}>
                        {age}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Зовнішність")}</h2>

              <div>
                <label className="block text-sm font-medium mb-4">{tx("Модель обличчя *")}</label>
                <FaceModelSelector
                  selectedModel={formData.face_model}
                  onSelect={(modelName) => updateField('face_model', modelName)}
                  currentCharacterId={id}
                  gender={formData.gender}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Колір волосся *")}</label>
                  <select
                    value={formData.hair_color}
                    onChange={(e) => updateField('hair_color', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="">{tx("Оберіть колір")}</option>
                    {HAIR_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {tx(color)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Колір очей *")}</label>
                  <select
                    value={formData.eye_color}
                    onChange={(e) => updateField('eye_color', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="">{tx("Оберіть колір")}</option>
                    {EYE_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {tx(color)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Додаткові особливості на обличчі")}<span className="text-xs text-gray-400 block mt-1">
                    {tx("Шрами, татуювання, пошкодження тощо")}</span>
                </label>
                <textarea
                  value={formData.special_features}
                  onChange={(e) => updateField('special_features', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("Опишіть особливі прикмети...")}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Фізичні параметри")}</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Зріст (см) *")}</label>
                  <select
                    value={formData.height}
                    onChange={(e) => updateField('height', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    {generateHeightOptions().map((height) => (
                      <option key={height} value={height}>
                        {height} {tx(" см")}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">{tx("Вага (кг) *")}</label>
                  <select
                    value={formData.weight}
                    onChange={(e) => updateField('weight', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    {generateWeightOptions().map((weight) => (
                      <option key={weight} value={weight}>
                        {weight} {tx(" кг")}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tx("Статура *")}</label>
                <select
                  value={formData.body_type}
                  onChange={(e) => updateField('body_type', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                >
                  <option value="">{tx("Оберіть статуру")}</option>
                  {BODY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {tx(type)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Особливі фізичні прикмети")}</label>
                <textarea
                  value={formData.physical_features}
                  onChange={(e) => updateField('physical_features', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("Додаткові фізичні характеристики...")}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Характер і поведінка")}</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Основні риси характеру (максимум 3 з кожної категорії) *")}<span className="text-xs text-gray-400 block mt-1">
                    {tx("Обрано: ")}{formData.character_traits.length} {tx(" (мін. 3)")}</span>
                </label>
                <div className="bg-gray-900 border border-gray-700 rounded p-4 max-h-96 overflow-y-auto space-y-4">
                  {(Object.keys(CHARACTER_TRAITS) as TraitCategory[]).map((category) => {
                    const categoryTraits = CHARACTER_TRAITS[category] as readonly string[];
                    const selectedInCategory = formData.character_traits.filter((t) => categoryTraits.includes(t));

                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide flex justify-between items-center">
                          <span>{tx(TRAIT_CATEGORIES[category])}</span>
                          <span className="text-xs text-gray-400 normal-case">
                            {selectedInCategory.length}/3
                          </span>
                        </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CHARACTER_TRAITS[category].map((trait) => {
                          const categoryTraits = CHARACTER_TRAITS[category] as readonly string[];
                          const selectedInCategory = formData.character_traits.filter((t) => categoryTraits.includes(t));
                          const isSelected = formData.character_traits.includes(trait);
                          const isDisabled = !isSelected && selectedInCategory.length >= 3;

                          return (
                            <button
                              key={trait}
                              onClick={() => toggleTrait(trait, category)}
                              className={`text-left px-3 py-2 rounded text-sm transition ${
                                isSelected
                                  ? 'bg-red-600 text-white'
                                  : isDisabled
                                  ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              }`}
                              disabled={isDisabled}
                            >
                              {tx(trait)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tx("Фобії / Слабкості")}</label>
                <textarea
                  value={formData.phobias}
                  onChange={(e) => updateField('phobias', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("Страхи та слабкості персонажа...")}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Життєві цінності / Переконання *")}</label>
                <textarea
                  value={formData.character_values}
                  onChange={(e) => updateField('character_values', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("У що вірить персонаж, що для нього важливо...")}
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Фракційна приналежність")}</h2>

              <div>
                <label className="block text-sm font-medium mb-2">{tx("Фракція *")}</label>
                <select
                  value={formData.faction}
                  onChange={(e) => updateField('faction', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                >
                  <option value="">{tx("Оберіть фракцію")}</option>
                  {FACTIONS.map((faction) => (
                    <option key={faction} value={faction}>
                      {tx(faction)}
                    </option>
                  ))}
                </select>
              </div>

              {formData.faction === 'Учений' && (
                <div className="space-y-4 bg-gray-900 p-4 rounded border border-gray-700">
                  <p className="text-sm text-yellow-400">
                    {tx("Доступ після схвалення квенти адміністратором")}</p>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {tx("Освіта / спеціальність *")}</label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={(e) => updateField('education', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder={tx("Наприклад: Біологія, Фізика...")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {tx("Науковий профіль / напрямок *")}</label>
                    <input
                      type="text"
                      value={formData.scientific_profile}
                      onChange={(e) => updateField('scientific_profile', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder={tx("Напрямок наукової діяльності...")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {tx("Мотивація дослідження Зони *")}</label>
                    <textarea
                      value={formData.research_motivation}
                      onChange={(e) => updateField('research_motivation', e.target.value)}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                      placeholder={tx("Чому хочете досліджувати Зону...")}
                    />
                  </div>
                </div>
              )}

              {formData.faction === 'Військовий' && (
                <div className="space-y-4 bg-gray-900 p-4 rounded border border-gray-700">
                  <p className="text-sm text-yellow-400">
                    {tx("Доступ після перевірки анкети адміністратором")}</p>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {tx("Попередній військовий досвід *")}</label>
                    <select
                      value={formData.military_experience}
                      onChange={(e) => updateField('military_experience', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    >
                      <option value="">{tx("Оберіть...")}</option>
                      {MILITARY_EXPERIENCE.map((exp) => (
                        <option key={exp} value={exp}>
                          {tx(exp)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">{tx("Звання (якщо було)")}</label>
                    <input
                      type="text"
                      value={formData.military_rank}
                      onChange={(e) => updateField('military_rank', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder={tx("Наприклад: Капітан, Сержант...")}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      {tx("Причина вступу до військових сил у Зоні *")}</label>
                    <textarea
                      value={formData.military_join_reason}
                      onChange={(e) => updateField('military_join_reason', e.target.value)}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                      placeholder={tx("Чому хочете служити у Зоні...")}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Квента (Біографія)")}</h2>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <label className="block text-sm font-medium mb-3">{tx("Оберіть тип анкети *")}</label>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="space-y-2 sm:flex-1">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="questType"
                        checked={questType === 'short'}
                        onChange={() => setQuestType('short')}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{tx("Коротка анкета (до 500 символів)")}</div>
                        <div className="text-xs text-gray-400">
                          {tx("Основні відомості про персонажа без детальної історії")}</div>
                      </div>
                    </label>
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="radio"
                        name="questType"
                        checked={questType === 'full'}
                        onChange={() => setQuestType('full')}
                        className="mt-1"
                      />
                      <div>
                        <div className="font-medium">{tx("Повна квента (більше 500 символів)")}</div>
                        <div className="text-xs text-gray-400">
                          {tx("Детальна біографія та історія персонажа")}</div>
                      </div>
                    </label>
                  </div>
                  {questType === 'full' && (
                    <p role="alert" className="text-lg sm:text-xl font-bold text-red-500 sm:flex-1">
                      {tx("НЕ ОБИРАЙТЕ КВЕНТУ ЯКЩО НЕ РОЗУМІЄТЕ ДЛЯ ЧОГО ВОНА!!!")}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  {tx("Передісторія *")}<span className="text-xs text-gray-400 block mt-1">
                    {questType === 'short' ? tx("Максимум 500 символів") : tx("Мінімум 500 символів")}
                  </span>
                </label>
                <textarea
                  value={formData.backstory}
                  onChange={(e) => updateField('backstory', e.target.value)}
                  rows={12}
                  maxLength={questType === 'short' ? 500 : undefined}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("Розкажіть історію вашого персонажа: звідки він, яке його минуле, як він виріс, що пережив...")}
                />
                <p className="text-sm text-gray-400 mt-2">
                  {tx("Символів: ")}{formData.backstory.length}
                  {questType === 'short' && formData.backstory.length > 500 && (
                    <span className="text-red-500 ml-2">{tx("(перевищено ліміт 500)")}</span>
                  )}
                  {questType === 'full' && formData.backstory.length < 500 && (
                    <span className="text-yellow-500 ml-2">{tx("(потрібно мінімум 500)")}</span>
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="zone-entry-reason" className="block text-sm font-medium mb-2">
                  {questType === 'short' ? tx("Причина походу в Зону") : tx("Мотивація приходу в Зону")} *
                </label>
                {questType === 'short' ? (
                  <>
                    <select
                      id="zone-entry-reason"
                      value={formData.zone_motivation}
                      onChange={(e) => updateField('zone_motivation', e.target.value)}
                      required
                      aria-describedby={formData.zone_motivation ? 'zone-entry-description' : undefined}
                      className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    >
                      <option value="">{tx("Оберіть причину походу в Зону")}</option>
                      {formData.zone_motivation && !selectedZoneReason && (
                        <option value={formData.zone_motivation}>{tx("Раніше збережена причина")}</option>
                      )}
                      {ZONE_ENTRY_REASONS.map((reason, index) => (
                        <option key={reason.title} value={`${reason.title}: ${reason.description}`}>
                          {index + 1}. {tx(reason.title)}
                        </option>
                      ))}
                    </select>
                    {formData.zone_motivation && (
                      <p id="zone-entry-description" className="text-sm text-gray-400 mt-2 whitespace-pre-wrap">
                        {selectedZoneReason ? tx(selectedZoneReason.description) : formData.zone_motivation}
                      </p>
                    )}
                  </>
                ) : (
                  <textarea
                    id="zone-entry-reason"
                    value={formData.zone_motivation}
                    onChange={(e) => updateField('zone_motivation', e.target.value)}
                    rows={5}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                    placeholder={tx("Чому ваш персонаж прийшов до Зони? Що він шукає?")}
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">{tx("Цілі персонажа")}</label>
                <textarea
                  value={formData.character_goals}
                  onChange={(e) => updateField('character_goals', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder={tx("Які цілі має персонаж у Зоні?")}
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">{tx("Перевірка та підтвердження")}</h2>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <h3 className="font-semibold mb-3">{tx("Перевірте ваші дані:")}</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>{tx("Ім'я:")}</strong> {formData.name} {formData.surname}
                  </p>
                  <p>
                    <strong>{tx("Кличка:")}</strong> {formData.nickname}
                  </p>
                  <p>
                    <strong>Discord ID:</strong> {formData.discord_id}
                  </p>
                  <p>
                    <strong>{tx("Вік:")}</strong> {formData.age} {tx(" років")}</p>
                  <p>
                    <strong>{tx("Стать:")}</strong> {formData.gender === 'male' ? tx("Чоловік") : tx("Жінка")}
                  </p>
                  <p>
                    <strong>{tx("Зріст/Вага:")}</strong> {formData.height} {tx(" см / ")}{formData.weight} {tx(" кг")}</p>
                  <p>
                    <strong>{tx("Фракція:")}</strong> {tx(formData.faction)}
                  </p>
                  <p>
                    <strong>{tx("Риси характеру:")}</strong> {formData.character_traits.map((trait) => tx(trait)).join(', ')}
                  </p>
                  <p>
                    <strong>{tx("Біографія:")}</strong> {formData.backstory.length} {tx(" символів")}</p>
                  <p>
                    <strong>{questType === 'short' ? tx("Причина походу в Зону:") : tx("Мотивація приходу в Зону:")}</strong> {translateZoneReason(formData.zone_motivation, tx)}
                  </p>
                </div>
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 p-4 rounded">
                <p className="text-sm text-yellow-300">
                  {tx("На цьому етапі анкета зберігається як чернетка. Відправити її на розгляд можна буде зі списку персонажів у кабінеті.")}</p>
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between">
            <div>
              {step > 1 && (
                <button
                  onClick={() => setStep((step - 1) as Step)}
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                  {t('back')}
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => saveCharacter('draft')}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                {step === 7 ? t('saveDraft') : t('save')}
              </button>

              {step < 7 ? (
                <button
                  onClick={handleNext}
                  disabled={!canProceed() || checkingNickname}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition disabled:opacity-50"
                >
                  {checkingNickname ? t('checking') : t('next')}
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
