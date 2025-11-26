import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Save } from 'lucide-react';

interface CharacterStory {
  backstory: string;
  zone_motivation: string;
  character_goals: string;
}

export default function EditCharacterStory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<CharacterStory>({
    backstory: '',
    zone_motivation: '',
    character_goals: '',
  });

  useEffect(() => {
    if (id) {
      loadCharacter();
    }
  }, [id]);

  async function loadCharacter() {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('user_id, status, backstory, zone_motivation, character_goals')
        .eq('id', id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        alert('Персонаж не знайдено');
        navigate('/cabinet');
        return;
      }

      if (data.user_id !== user?.id) {
        alert('Ви не маєте доступу до цього персонажа');
        navigate('/cabinet');
        return;
      }

      if (data.status !== 'approved') {
        alert('Редагувати можна тільки схвалених персонажів');
        navigate('/cabinet');
        return;
      }

      setFormData({
        backstory: data.backstory || '',
        zone_motivation: data.zone_motivation || '',
        character_goals: data.character_goals || '',
      });
    } catch (error) {
      console.error('Error loading character:', error);
      alert('Помилка завантаження персонажа');
      navigate('/cabinet');
    } finally {
      setLoading(false);
    }
  }

  async function saveStory() {
    if (!formData.backstory || formData.backstory.length < 500) {
      alert('Біографія повинна містити мінімум 500 символів');
      return;
    }

    if (!formData.zone_motivation) {
      alert('Заповніть мотивацію приходу в Зону');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          backstory: formData.backstory,
          zone_motivation: formData.zone_motivation,
          character_goals: formData.character_goals,
        })
        .eq('id', id);

      if (error) throw error;

      alert('Квенту оновлено');
      navigate(`/character/${id}`);
    } catch (error) {
      console.error('Error saving story:', error);
      alert('Помилка збереження');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <p className="text-gray-300">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-60 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(`/character/${id}`)}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              Назад до персонажа
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Редагування квенти</h1>
          <p className="text-gray-400">
            Ви можете редагувати тільки біографію персонажа. Фізичні параметри змінити не можна.
          </p>
        </div>

        <div className="bg-gray-800 bg-opacity-60 p-6 rounded-lg border border-gray-700 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Передісторія *
              <span className="text-xs text-gray-400 block mt-1">Мінімум 500 символів</span>
            </label>
            <textarea
              value={formData.backstory}
              onChange={(e) => setFormData({ ...formData, backstory: e.target.value })}
              rows={12}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
              placeholder="Розкажіть історію вашого персонажа..."
            />
            <p className="text-sm text-gray-400 mt-2">
              Символів: {formData.backstory.length}
              {formData.backstory.length < 500 && (
                <span className="text-yellow-500 ml-2">(потрібно мінімум 500)</span>
              )}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Мотивація приходу в Зону *</label>
            <textarea
              value={formData.zone_motivation}
              onChange={(e) => setFormData({ ...formData, zone_motivation: e.target.value })}
              rows={5}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
              placeholder="Чому ваш персонаж прийшов до Зони?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Цілі персонажа</label>
            <textarea
              value={formData.character_goals}
              onChange={(e) => setFormData({ ...formData, character_goals: e.target.value })}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
              placeholder="Які цілі має персонаж у Зоні?"
            />
          </div>

          <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 p-4 rounded">
            <p className="text-sm text-yellow-300">
              <strong>Увага:</strong> Ви можете редагувати тільки біографічну частину. Зміни в
              зовнішності, фізичних параметрах та інших даних можливі тільки через звернення до
              адміністрації.
            </p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={saveStory}
              disabled={saving}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-3 rounded font-semibold transition disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Збереження...' : 'Зберегти зміни'}
            </button>
            <button
              onClick={() => navigate(`/character/${id}`)}
              className="flex-1 bg-gray-700 hover:bg-gray-600 py-3 rounded font-semibold transition"
            >
              Скасувати
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
