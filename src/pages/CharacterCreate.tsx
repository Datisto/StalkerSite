import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChevronRight, ChevronLeft, Save, Send } from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

interface CharacterData {
  name: string;
  surname: string;
  nickname: string;
  age: number;
  gender: 'male' | 'female';
  origin_country: string;
  citizenship: string;
  faction: string;
  biography: string;
  appearance: string;
  psychological_portrait: string;
}

const FACTIONS = [
  'Вільний сталкер',
  'Свобода',
  'Duty',
  'Торгівці',
  'Бандити',
  'Найманці',
  'Вчені',
  'Монолітівці'
];

export default function CharacterCreate() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>(1);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CharacterData>({
    name: '',
    surname: '',
    nickname: '',
    age: 25,
    gender: 'male',
    origin_country: 'Україна',
    citizenship: 'Україна',
    faction: '',
    biography: '',
    appearance: '',
    psychological_portrait: ''
  });

  const updateField = (field: keyof CharacterData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.name && formData.surname && formData.age >= 18 && formData.age <= 80;
      case 2:
        return formData.origin_country && formData.citizenship && formData.faction;
      case 3:
        return formData.biography.length >= 300 && formData.biography.length <= 1500;
      case 4:
        return formData.appearance && formData.psychological_portrait;
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
        status,
        ...formData,
        submitted_at: status === 'pending' ? new Date().toISOString() : null
      };

      const { error } = await supabase
        .from('characters')
        .insert(characterData);

      if (error) throw error;

      alert(status === 'draft' ? 'Персонаж збережено як чернетку' : 'Персонаж відправлено на розгляд');
      window.location.href = '/cabinet';
    } catch (error) {
      console.error('Error saving character:', error);
      alert('Помилка при збереженні персонажа');
    } finally {
      setSaving(false);
    }
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
            <a href="/cabinet" className="text-sm text-gray-400 hover:text-white transition">
              Назад до кабінету
            </a>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Створення персонажа</h1>
          <p className="text-gray-400">Крок {step} з 4</p>
        </div>

        <div className="mb-8">
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((s) => (
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
              <h2 className="text-2xl font-semibold mb-4">Основна інформація</h2>

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

              <div>
                <label className="block text-sm font-medium mb-2">Позивний (необов'язково)</label>
                <input
                  type="text"
                  value={formData.nickname}
                  onChange={(e) => updateField('nickname', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  placeholder="Сірий"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Вік (18-80) *</label>
                  <input
                    type="number"
                    min="18"
                    max="80"
                    value={formData.age}
                    onChange={(e) => updateField('age', parseInt(e.target.value))}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Стать *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => updateField('gender', e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                  >
                    <option value="male">Чоловік</option>
                    <option value="female">Жінка</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Походження та фракція</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Країна походження *</label>
                <input
                  type="text"
                  value={formData.origin_country}
                  onChange={(e) => updateField('origin_country', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Громадянство *</label>
                <input
                  type="text"
                  value={formData.citizenship}
                  onChange={(e) => updateField('citizenship', e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                />
              </div>

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
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Біографія</h2>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Біографія персонажа (300-1500 символів) *
                </label>
                <textarea
                  value={formData.biography}
                  onChange={(e) => updateField('biography', e.target.value)}
                  rows={12}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Розкажіть історію вашого персонажа: звідки він, чому потрапив до Зони, що шукає..."
                />
                <p className="text-sm text-gray-400 mt-2">
                  Символів: {formData.biography.length} / 1500
                  {formData.biography.length < 300 && (
                    <span className="text-yellow-500 ml-2">
                      (мінімум 300)
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-4">Зовнішність та характер</h2>

              <div>
                <label className="block text-sm font-medium mb-2">Зовнішність *</label>
                <textarea
                  value={formData.appearance}
                  onChange={(e) => updateField('appearance', e.target.value)}
                  rows={6}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Опишіть зовнішність: зріст, статура, колір волосся та очей, особливі прикмети..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Психологічний портрет *</label>
                <textarea
                  value={formData.psychological_portrait}
                  onChange={(e) => updateField('psychological_portrait', e.target.value)}
                  rows={6}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                  placeholder="Опишіть характер, звички, переконання, страхи та мрії персонажа..."
                />
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
              <button
                onClick={() => saveCharacter('draft')}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded transition disabled:opacity-50"
              >
                <Save className="w-5 h-5" />
                Зберегти
              </button>

              {step < 4 ? (
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
