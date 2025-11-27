import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, ToggleLeft, ToggleRight } from 'lucide-react';

interface Question {
  id: string;
  question_text: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

export default function QuestionsManager() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState<Partial<Question>>({
    question_text: '',
    category: '',
    is_active: true,
  });

  useEffect(() => {
    loadQuestions();
  }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('rules_questions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error) {
      console.error('Error loading questions:', error);
      alert('Помилка завантаження питань');
    } finally {
      setLoading(false);
    }
  }

  async function saveQuestion() {
    try {
      if (!formData.question_text) {
        alert('Введіть текст питання');
        return;
      }

      const questionData = {
        question_text: formData.question_text,
        category: formData.category || 'Загальні',
        is_active: formData.is_active !== false,
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('rules_questions')
          .update(questionData)
          .eq('id', editingQuestion.id);

        if (error) throw error;
        alert('Питання оновлено');
      } else {
        const { error } = await supabase.from('rules_questions').insert(questionData);

        if (error) throw error;
        alert('Питання додано');
      }

      resetForm();
      await loadQuestions();
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Помилка збереження питання');
    }
  }

  async function deleteQuestion(id: string) {
    if (!confirm('Видалити це питання?')) return;

    try {
      const { error } = await supabase.from('rules_questions').delete().eq('id', id);

      if (error) throw error;
      alert('Питання видалено');
      await loadQuestions();
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Помилка видалення питання');
    }
  }

  async function toggleActive(id: string, currentState: boolean) {
    try {
      const { error } = await supabase
        .from('rules_questions')
        .update({ is_active: !currentState })
        .eq('id', id);

      if (error) throw error;
      await loadQuestions();
    } catch (error) {
      console.error('Error toggling question:', error);
      alert('Помилка зміни статусу');
    }
  }

  function startEdit(question: Question) {
    setEditingQuestion(question);
    setFormData({
      question_text: question.question_text,
      category: question.category,
      is_active: question.is_active,
    });
    setShowAddForm(true);
  }

  function resetForm() {
    setFormData({
      question_text: '',
      category: '',
      is_active: true,
    });
    setEditingQuestion(null);
    setShowAddForm(false);
  }


  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Банк питань</h2>
          <p className="text-gray-400 text-sm mt-1">Всього: {questions.length} питань</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition"
        >
          <Plus className="w-5 h-5" />
          Додати питання
        </button>
      </div>

      {showAddForm && (
        <div className="bg-gray-900 p-6 rounded-lg border border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">
              {editingQuestion ? 'Редагувати питання' : 'Нове питання'}
            </h3>
            <button onClick={resetForm} className="text-gray-400 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Текст питання *</label>
              <textarea
                value={formData.question_text || ''}
                onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500 resize-none"
                placeholder="Введіть питання..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Категорія</label>
              <input
                type="text"
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-2 focus:outline-none focus:border-red-500"
                placeholder="Наприклад: Основні правила"
              />
            </div>

            <div className="bg-blue-900 bg-opacity-30 border border-blue-700 p-3 rounded">
              <p className="text-blue-200 text-sm">
                <strong>Увага:</strong> Це питання з відкритою відповіддю. Гравець напише свою відповідь, а адміністрація перевірить її вручну.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active !== false}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="is_active" className="text-sm">
                Активне (використовується в тесті)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={saveQuestion}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 py-2 rounded transition"
              >
                <Save className="w-5 h-5" />
                {editingQuestion ? 'Оновити' : 'Зберегти'}
              </button>
              <button
                onClick={resetForm}
                className="flex-1 bg-gray-700 hover:bg-gray-600 py-2 rounded transition"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-12 bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700">
            <p className="text-gray-400">Питань ще немає</p>
          </div>
        ) : (
          questions.map((question) => (
            <div
              key={question.id}
              className={`bg-gray-900 p-4 rounded border transition ${
                question.is_active ? 'border-gray-700' : 'border-gray-800 opacity-60'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold mb-2">{question.question_text}</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="bg-gray-800 px-2 py-1 rounded">{question.category}</span>
                    <span className="bg-blue-800 px-2 py-1 rounded">Відкрита відповідь</span>
                  </div>
                </div>

                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => toggleActive(question.id, question.is_active)}
                    className="text-gray-400 hover:text-white transition"
                    title={question.is_active ? 'Деактивувати' : 'Активувати'}
                  >
                    {question.is_active ? (
                      <ToggleRight className="w-6 h-6 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-6 h-6" />
                    )}
                  </button>
                  <button
                    onClick={() => startEdit(question)}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => deleteQuestion(question.id)}
                    className="text-red-400 hover:text-red-300 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
