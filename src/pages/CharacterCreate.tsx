import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronRight, ChevronLeft, Save, Send, Copy } from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';
import { showAlert } from '../utils/modals';
import FaceModelSelector from '../components/FaceModelSelector';
import {
  FACTIONS,
  FACE_MODELS,
  HAIR_COLORS,
  EYE_COLORS,
  BODY_TYPES,
  MILITARY_EXPERIENCE,
  CHARACTER_TRAITS,
  TRAIT_CATEGORIES,
  generateHeightOptions,
  generateWeightOptions,
  generateAgeOptions,
} from '../data/characterConstants';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface CharacterData {
  steam_id: string;
  discord_id: string;
  name: string;
  surname: string;
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
}

export default function CharacterCreate() {
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
    values: '',
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

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        steam_id: user.steam_id || user.id,
        discord_id: user.discord_username || ''
      }));
      checkApprovedTest();
      if (id) {
        setIsEditMode(true);
        loadExistingCharacter();
      } else {
        checkExistingCharacter();
      }
    }
  }, [user, id]);

  async function loadExistingCharacter() {
    if (!user || !id) return;
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        await showAlert('Персонаж не знайдено', 'Помилка', 'error');
        navigate('/cabinet');
        return;
      }

      if (data.status !== 'draft' && data.status !== 'rejected') {
        await showAlert('Цей персонаж не може бути відредагований', 'Помилка', 'warning');
        navigate('/cabinet');
        return;
      }

      setFormData({
        steam_id: data.steam_id || user.steam_id || user.id,
        discord_id: data.discord_id || '',
        name: data.name || '',
        surname: data.surname || '',
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
        character_traits: data.character_traits || [],
        phobias: data.phobias || '',
        values: data.values || '',
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
      await showAlert('Помилка завантаження персонажа', 'Помилка', 'error');
      navigate('/cabinet');
    } finally {
      setLoading(false);
    }
  }

  async function checkExistingCharacter() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('id, status')
        .eq('steam_id', user.steam_id)
        .in('status', ['pending', 'approved', 'active']);

      if (error) throw error;
      if (data && data.length > 0) {
        setHasExistingCharacter(true);
      }
    } catch (error) {
      console.error('Error checking character:', error);
    } finally {
      setLoading(false);
    }
  }

  async function checkApprovedTest() {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('users')
        .select('rules_passed')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;
      setHasApprovedTest(!!data?.rules_passed);
    } catch (error) {
      console.error('Error checking test approval:', error);
    }
  }

  const updateField = (field: keyof CharacterData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleTrait = (trait: string) => {
    setFormData((prev) => {
      const traits = prev.character_traits;
      if (traits.includes(trait)) {
        return { ...prev, character_traits: traits.filter((t) => t !== trait) };
      } else if (traits.length < 5) {
        return { ...prev, character_traits: [...traits, trait] };
      }
      return prev;
    });
  };

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
        return formData.character_traits.length >= 3 && formData.values;
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

  const saveCharacter = async (status: 'draft' | 'pending') => {
    if (!user) return;

    setSaving(true);
    try {
      const characterData = {
        user_id: user.id,
        steam_id: user.steam_id,
        status,
        discord_id: formData.discord_id,
        name: formData.name,
        surname: formData.surname,
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
        values: formData.values,
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

      let error;

      if (isEditMode && id) {
        const result = await supabase
          .from('characters')
          .update(characterData)
          .eq('id', id);
        error = result.error;
      } else {
        const result = await supabase
          .from('characters')
          .insert(characterData);
        error = result.error;
      }

      if (error) throw error;

      await showAlert(
        isEditMode
          ? 'Зміни збережено'
          : status === 'draft'
          ? 'Персонажа збережено як чернетку'
          : 'Персонажа відправлено на розгляд',
        'Успіх',
        'success'
      );
      navigate('/cabinet');
    } catch (error) {
      console.error('Error saving character:', error);
      await showAlert('Помилка при збереженні персонажа', 'Помилка', 'error');
    } finally {
      setSaving(false);
    }
  };

  const copySteamId = async () => {
    navigator.clipboard.writeText(formData.steam_id);
    await showAlert('Steam ID скопійовано!', 'Успіх', 'success');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-300 mb-4">Будь ласка, увійдіть через Steam</p>
          <a
            href="/"
            className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
          >
            На головну
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Завантаження...</p>
      </div>
    );
  }

  if (!hasApprovedTest) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-lg border border-gray-700 max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-500">Потрібна здача правил</h2>
          <p className="text-gray-300 mb-6">
            Перед створенням персонажа необхідно здати тест на знання правил сервера. Після схвалення адміністрацією ви зможете створити персонажа.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="/rules-test"
              className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
            >
              Здати правила
            </a>
            <a
              href="/cabinet"
              className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded font-semibold transition"
            >
              До кабінету
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
          <h2 className="text-2xl font-bold mb-4 text-red-500">Обмеження створення</h2>
          <p className="text-gray-300 mb-6">
            У Вас вже є активний персонаж. Зверніться до адміністрації для його видалення.
          </p>
          <a
            href="/cabinet"
            className="bg-red-600 hover:bg-red-500 px-6 py-2 rounded font-semibold transition"
          >
            До кабінету
          </a>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-98 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
              <img src={logoIcon} alt="Eternal ZONE" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold font-stalker">Eternal ZONE</span>
            </a>
            <a
              href="/cabinet"
              className="text-sm text-gray-400 hover:text-white transition"
            >
              Назад до кабінету
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{isEditMode ? 'Редагування персонажа' : 'Створення персонажа'}</h1>
          <p className="text-gray-400">Крок {step} з 7</p>
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
              <h2 className="text-2xl font-semibold mb-4">Основні дані персонажа</h2>

              <div>
                <label className="block text-sm font-medium mb-2">СтімID64 *</label>
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
                    Автоматично заповнюється з вашого профілю після реєстрації
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.discord_id}
                  disabled
                  className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2 text-gray-400 cursor-not-allowed"
                  placeholder="Не заповнено"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Ім'я *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="Олександр"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Прізвище *</label>
                  <input
                    type="text"
                    value={formData.surname}
                    onChange={(e) => updateField('surname', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    placeholder="Коваленко"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Псевдонім / Кличка *
                  <span className="text-xs text-gray-400 block mt-1">
                    Має бути унікальним, латиницею, без додаткових знаків. Приклад: "Holod" або
                    "MykolaHolod"
                  </span>
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
                  <label className="block text-sm font-medium mb-2">Стать *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value as 'male' | 'female')}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="male">Чоловіча</option>
                    <option value="female">Жіноча</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Вік (16-70) *</label>
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
              <h2 className="text-2xl font-semibold mb-4">Зовнішність</h2>

              <div>
                <label className="block text-sm font-medium mb-4">Модель обличчя *</label>
                <FaceModelSelector
                  selectedModel={formData.face_model}
                  onSelect={(modelName) => updateField('face_model', modelName)}
                  currentCharacterId={id}
                  gender={formData.gender}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Колір волосся *</label>
                  <select
                    value={formData.hair_color}
                    onChange={(e) => updateField('hair_color', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Оберіть колір</option>
                    {HAIR_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Колір очей *</label>
                  <select
                    value={formData.eye_color}
                    onChange={(e) => updateField('eye_color', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="">Оберіть колір</option>
                    {EYE_COLORS.map((color) => (
                      <option key={color} value={color}>
                        {color}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Додаткові особливості
                  <span className="text-xs text-gray-400 block mt-1">
                    Шрами, татуювання, пошкодження тощо
                  </span>
                </label>
                <textarea
                  value={formData.special_features}
                  onChange={(e) => updateField('special_features', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Опишіть особливі прикмети..."
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Фізичні параметри</h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Зріст (см) *</label>
                  <select
                    value={formData.height}
                    onChange={(e) => updateField('height', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    {generateHeightOptions().map((height) => (
                      <option key={height} value={height}>
                        {height} см
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Вага (кг) *</label>
                  <select
                    value={formData.weight}
                    onChange={(e) => updateField('weight', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    {generateWeightOptions().map((weight) => (
                      <option key={weight} value={weight}>
                        {weight} кг
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Статура *</label>
                <select
                  value={formData.body_type}
                  onChange={(e) => updateField('body_type', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                >
                  <option value="">Оберіть статуру</option>
                  {BODY_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Особливі фізичні прикмети
                </label>
                <textarea
                  value={formData.physical_features}
                  onChange={(e) => updateField('physical_features', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Додаткові фізичні характеристики..."
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Характер і поведінка</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Основні риси характеру (оберіть 3-5) *
                  <span className="text-xs text-gray-400 block mt-1">
                    Обрано: {formData.character_traits.length}/5
                  </span>
                </label>
                <div className="bg-gray-900 border border-gray-700 rounded p-4 max-h-96 overflow-y-auto space-y-4">
                  {(Object.keys(CHARACTER_TRAITS) as Array<keyof typeof CHARACTER_TRAITS>).map((category) => (
                    <div key={category}>
                      <h3 className="text-sm font-semibold text-red-400 mb-2 uppercase tracking-wide">
                        {TRAIT_CATEGORIES[category]}
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {CHARACTER_TRAITS[category].map((trait) => (
                          <button
                            key={trait}
                            onClick={() => toggleTrait(trait)}
                            className={`text-left px-3 py-2 rounded text-sm transition ${
                              formData.character_traits.includes(trait)
                                ? 'bg-red-600 text-white'
                                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                            }`}
                            disabled={
                              !formData.character_traits.includes(trait) &&
                              formData.character_traits.length >= 5
                            }
                          >
                            {trait}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Фобії / Слабкості</label>
                <textarea
                  value={formData.phobias}
                  onChange={(e) => updateField('phobias', e.target.value)}
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Страхи та слабкості персонажа..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Життєві цінності / Переконання *
                </label>
                <textarea
                  value={formData.values}
                  onChange={(e) => updateField('values', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="У що вірить персонаж, що для нього важливо..."
                />
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Фракційна приналежність</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Фракція *</label>
                <select
                  value={formData.faction}
                  onChange={(e) => updateField('faction', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                >
                  <option value="">Оберіть фракцію</option>
                  {FACTIONS.map((faction) => (
                    <option key={faction} value={faction}>
                      {faction}
                    </option>
                  ))}
                </select>
              </div>

              {formData.faction === 'Учений' && (
                <div className="space-y-4 bg-gray-900 p-4 rounded border border-gray-700">
                  <p className="text-sm text-yellow-400">
                    Доступ після схвалення квенти адміністратором
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Освіта / спеціальність *
                    </label>
                    <input
                      type="text"
                      value={formData.education}
                      onChange={(e) => updateField('education', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder="Наприклад: Біологія, Фізика..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Науковий профіль / напрямок *
                    </label>
                    <input
                      type="text"
                      value={formData.scientific_profile}
                      onChange={(e) => updateField('scientific_profile', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder="Напрямок наукової діяльності..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Мотивація дослідження Зони *
                    </label>
                    <textarea
                      value={formData.research_motivation}
                      onChange={(e) => updateField('research_motivation', e.target.value)}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Чому хочете досліджувати Зону..."
                    />
                  </div>
                </div>
              )}

              {formData.faction === 'Військовий' && (
                <div className="space-y-4 bg-gray-900 p-4 rounded border border-gray-700">
                  <p className="text-sm text-yellow-400">
                    Доступ після перевірки анкети адміністратором
                  </p>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Попередній військовий досвід *
                    </label>
                    <select
                      value={formData.military_experience}
                      onChange={(e) => updateField('military_experience', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                    >
                      <option value="">Оберіть...</option>
                      {MILITARY_EXPERIENCE.map((exp) => (
                        <option key={exp} value={exp}>
                          {exp}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Звання (якщо було)</label>
                    <input
                      type="text"
                      value={formData.military_rank}
                      onChange={(e) => updateField('military_rank', e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                      placeholder="Наприклад: Капітан, Сержант..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Причина вступу до військових сил у Зоні *
                    </label>
                    <textarea
                      value={formData.military_join_reason}
                      onChange={(e) => updateField('military_join_reason', e.target.value)}
                      rows={4}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                      placeholder="Чому хочете служити у Зоні..."
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Квента (Біографія)</h2>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <label className="block text-sm font-medium mb-3">Оберіть тип анкети *</label>
                <div className="space-y-2">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="questType"
                      checked={questType === 'short'}
                      onChange={() => setQuestType('short')}
                      className="mt-1"
                    />
                    <div>
                      <div className="font-medium">Коротка анкета (до 500 символів)</div>
                      <div className="text-xs text-gray-400">
                        Основні відомості про персонажа без детальної історії
                      </div>
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
                      <div className="font-medium">Повна квента (більше 500 символів)</div>
                      <div className="text-xs text-gray-400">
                        Детальна біографія та історія персонажа
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Передісторія *
                  <span className="text-xs text-gray-400 block mt-1">
                    {questType === 'short' ? 'Максимум 500 символів' : 'Мінімум 500 символів'}
                  </span>
                </label>
                <textarea
                  value={formData.backstory}
                  onChange={(e) => updateField('backstory', e.target.value)}
                  rows={12}
                  maxLength={questType === 'short' ? 500 : undefined}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Розкажіть історію вашого персонажа: звідки він, яке його минуле, як він виріс, що пережив..."
                />
                <p className="text-sm text-gray-400 mt-2">
                  Символів: {formData.backstory.length}
                  {questType === 'short' && formData.backstory.length > 500 && (
                    <span className="text-red-500 ml-2">(перевищено ліміт 500)</span>
                  )}
                  {questType === 'full' && formData.backstory.length < 500 && (
                    <span className="text-yellow-500 ml-2">(потрібно мінімум 500)</span>
                  )}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Мотивація приходу в Зону *
                </label>
                <textarea
                  value={formData.zone_motivation}
                  onChange={(e) => updateField('zone_motivation', e.target.value)}
                  rows={5}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Чому ваш персонаж прийшов до Зони? Що він шукає?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Цілі персонажа</label>
                <textarea
                  value={formData.character_goals}
                  onChange={(e) => updateField('character_goals', e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Які цілі має персонаж у Зоні?"
                />
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Перевірка та підтвердження</h2>

              <div className="bg-gray-900 p-4 rounded border border-gray-700">
                <h3 className="font-semibold mb-3">Перевірте ваші дані:</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <strong>Ім'я:</strong> {formData.name} {formData.surname}
                  </p>
                  <p>
                    <strong>Кличка:</strong> {formData.nickname}
                  </p>
                  <p>
                    <strong>Discord ID:</strong> {formData.discord_id}
                  </p>
                  <p>
                    <strong>Вік:</strong> {formData.age} років
                  </p>
                  <p>
                    <strong>Стать:</strong> {formData.gender === 'male' ? 'Чоловік' : 'Жінка'}
                  </p>
                  <p>
                    <strong>Зріст/Вага:</strong> {formData.height} см / {formData.weight} кг
                  </p>
                  <p>
                    <strong>Фракція:</strong> {formData.faction}
                  </p>
                  <p>
                    <strong>Риси характеру:</strong> {formData.character_traits.join(', ')}
                  </p>
                  <p>
                    <strong>Біографія:</strong> {formData.backstory.length} символів
                  </p>
                </div>
              </div>

              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 p-4 rounded">
                <p className="text-sm text-yellow-300">
                  Після відправки анкета буде заблокована для редагування та відправлена на
                  розгляд адміністрації. Переконайтесь, що всі дані заповнені правильно.
                </p>
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
                  Назад
                </button>
              )}
            </div>

            <div className="flex gap-2">
              {step < 7 && (
                <button
                  onClick={() => saveCharacter('draft')}
                  disabled={saving}
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  Зберегти
                </button>
              )}

              {step < 7 ? (
                <button
                  onClick={() => setStep((step + 1) as Step)}
                  disabled={!canProceed()}
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-4 py-2 rounded transition disabled:opacity-50"
                >
                  Далі
                  <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button
                  onClick={() => saveCharacter('pending')}
                  disabled={!canProceed() || saving}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                  Відправити на розгляд
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
