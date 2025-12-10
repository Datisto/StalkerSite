import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Plus, Edit, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';
import { showAlert, showConfirm } from '../utils/modals';

interface FAQCategory {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface FAQItem {
  id: string;
  category_id: string;
  question: string;
  answer: string;
  order_index: number;
  is_visible: boolean;
}

export default function FAQManager() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [items, setItems] = useState<FAQItem[]>([]);
  const [editingCategory, setEditingCategory] = useState<FAQCategory | null>(null);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ title: '', slug: '' });
  const [itemForm, setItemForm] = useState({
    category_id: '',
    question: '',
    answer: '',
    is_visible: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [categoriesData, itemsData] = await Promise.all([
        apiClient.faq.categories.list(),
        apiClient.faq.list(),
      ]);
      setCategories(categoriesData);
      setItems(itemsData);
    } catch (error) {
      console.error('Error loading FAQ data:', error);
    }
  }

  async function handleSaveCategory() {
    try {
      if (editingCategory) {
        const response = await fetch(`/api/faq/categories/${editingCategory.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...categoryForm, updated_at: new Date().toISOString() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save category');
        }
      } else {
        const maxOrder = Math.max(0, ...categories.map((c) => c.order_index));
        const response = await fetch('/api/faq/categories', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...categoryForm, order_index: maxOrder + 1 }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add category');
        }
      }
      setEditingCategory(null);
      setShowCategoryForm(false);
      setCategoryForm({ title: '', slug: '' });
      await loadData();
    } catch (error: any) {
      console.error('Error saving category:', error);
      await showAlert('Помилка збереження: ' + error.message, 'Помилка', 'error');
    }
  }

  async function handleDeleteCategory(id: string) {
    const confirmed = await showConfirm('Видалити категорію та всі FAQ в ній?', 'Підтвердження', { type: 'danger', confirmText: 'Видалити', cancelText: 'Скасувати' });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/faq/categories/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) await loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  async function moveCategory(id: string, direction: 'up' | 'down') {
    const index = categories.findIndex((c) => c.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categories.length - 1)) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const updates = [
      { id: categories[index].id, order_index: categories[swapIndex].order_index },
      { id: categories[swapIndex].id, order_index: categories[index].order_index },
    ];

    try {
      for (const update of updates) {
        await fetch(`/api/faq/categories/${update.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_index: update.order_index }),
        });
      }
      await loadData();
    } catch (error) {
      console.error('Error moving category:', error);
    }
  }

  async function handleSaveItem() {
    try {
      if (!itemForm.category_id || !itemForm.question || !itemForm.answer) {
        await showAlert('Заповніть всі поля', 'Помилка', 'warning');
        return;
      }

      if (editingItem) {
        const response = await fetch(`/api/faq/${editingItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...itemForm, updated_at: new Date().toISOString() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to save item');
        }
      } else {
        const categoryItems = items.filter((i) => i.category_id === itemForm.category_id);
        const maxOrder = Math.max(0, ...categoryItems.map((i) => i.order_index));
        const response = await fetch('/api/faq/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...itemForm, order_index: maxOrder + 1 }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to add item');
        }
      }
      setEditingItem(null);
      setShowItemForm(false);
      setItemForm({ category_id: '', question: '', answer: '', is_visible: true });
      await loadData();
    } catch (error: any) {
      console.error('Error saving FAQ item:', error);
      await showAlert('Помилка збереження: ' + error.message, 'Помилка', 'error');
    }
  }

  async function handleDeleteItem(id: string) {
    const confirmed = await showConfirm('Видалити цей FAQ?', 'Підтвердження', { type: 'danger', confirmText: 'Видалити', cancelText: 'Скасувати' });
    if (!confirmed) return;
    try {
      const response = await fetch(`/api/faq/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) await loadData();
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  }

  async function moveItem(id: string, direction: 'up' | 'down') {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const categoryItems = items.filter((i) => i.category_id === item.category_id);
    const index = categoryItems.findIndex((i) => i.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === categoryItems.length - 1)) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    const updates = [
      { id: categoryItems[index].id, order_index: categoryItems[swapIndex].order_index },
      { id: categoryItems[swapIndex].id, order_index: categoryItems[index].order_index },
    ];

    try {
      for (const update of updates) {
        await fetch(`/api/faq/${update.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ order_index: update.order_index }),
        });
      }
      await loadData();
    } catch (error) {
      console.error('Error moving item:', error);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">Категорії FAQ</h3>
          <button
            onClick={() => {
              setEditingCategory(null);
              setCategoryForm({ title: '', slug: '' });
              setShowCategoryForm(true);
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Додати категорію
          </button>
        </div>

        {(showCategoryForm || editingCategory) && (
          <div className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700 mb-4">
            <div className="grid gap-3">
              <input
                type="text"
                placeholder="Назва категорії"
                value={categoryForm.title}
                onChange={(e) => setCategoryForm({ ...categoryForm, title: e.target.value })}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
              <input
                type="text"
                placeholder="Slug (наприклад: general)"
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveCategory}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition"
                >
                  <Save className="w-4 h-4" />
                  Зберегти
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setShowCategoryForm(false);
                    setCategoryForm({ title: '', slug: '' });
                  }}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition"
                >
                  <X className="w-4 h-4" />
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {categories.map((category, index) => (
            <div key={category.id} className="bg-gray-900 bg-opacity-60 p-3 rounded border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">{category.title}</h4>
                  <p className="text-sm text-gray-400">/{category.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveCategory(category.id, 'up')}
                    disabled={index === 0}
                    className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveCategory(category.id, 'down')}
                    disabled={index === categories.length - 1}
                    className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingCategory(category);
                      setShowCategoryForm(true);
                      setCategoryForm({ title: category.title, slug: category.slug });
                    }}
                    className="p-1 hover:bg-gray-700 rounded"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDeleteCategory(category.id)} className="p-1 hover:bg-gray-700 rounded text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold">FAQ Питання</h3>
          <button
            onClick={() => {
              setEditingItem(null);
              setShowItemForm(true);
              setItemForm({ category_id: '', question: '', answer: '', is_visible: true });
            }}
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-3 py-2 rounded text-sm transition"
          >
            <Plus className="w-4 h-4" />
            Додати FAQ
          </button>
        </div>

        {(showItemForm || editingItem) && (
          <div className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700 mb-4">
            <div className="grid gap-3">
              <select
                value={itemForm.category_id}
                onChange={(e) => setItemForm({ ...itemForm, category_id: e.target.value })}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              >
                <option value="">Виберіть категорію</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.title}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Питання"
                value={itemForm.question}
                onChange={(e) => setItemForm({ ...itemForm, question: e.target.value })}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
              />
              <textarea
                placeholder="Відповідь (підтримує Markdown)"
                value={itemForm.answer}
                onChange={(e) => setItemForm({ ...itemForm, answer: e.target.value })}
                rows={6}
                className="bg-gray-800 border border-gray-600 rounded px-3 py-2 resize-none"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={itemForm.is_visible}
                  onChange={(e) => setItemForm({ ...itemForm, is_visible: e.target.checked })}
                  className="w-4 h-4"
                />
                <span>Відображати на сайті</span>
              </label>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveItem}
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-500 px-4 py-2 rounded transition"
                >
                  <Save className="w-4 h-4" />
                  Зберегти
                </button>
                <button
                  onClick={() => {
                    setEditingItem(null);
                    setShowItemForm(false);
                    setItemForm({ category_id: '', question: '', answer: '', is_visible: true });
                  }}
                  className="inline-flex items-center gap-2 bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded transition"
                >
                  <X className="w-4 h-4" />
                  Скасувати
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {categories.map((category) => {
            const categoryItems = items.filter((i) => i.category_id === category.id);
            if (categoryItems.length === 0) return null;

            return (
              <div key={category.id} className="bg-gray-900 bg-opacity-60 p-4 rounded border border-gray-700">
                <h4 className="font-semibold mb-3 text-lg">{category.title}</h4>
                <div className="space-y-2">
                  {categoryItems.map((item, index) => (
                    <div key={item.id} className="bg-gray-800 bg-opacity-60 p-3 rounded border border-gray-700">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h5 className="font-medium mb-1">{item.question}</h5>
                          <p className="text-sm text-gray-400 line-clamp-2">{item.answer}</p>
                          {!item.is_visible && <span className="text-xs text-red-400 mt-1 inline-block">Приховано</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => moveItem(item.id, 'up')}
                            disabled={index === 0}
                            className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => moveItem(item.id, 'down')}
                            disabled={index === categoryItems.length - 1}
                            className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingItem(item);
                              setShowItemForm(true);
                              setItemForm({
                                category_id: item.category_id,
                                question: item.question,
                                answer: item.answer,
                                is_visible: item.is_visible,
                              });
                            }}
                            className="p-1 hover:bg-gray-700 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteItem(item.id)} className="p-1 hover:bg-gray-700 rounded text-red-400">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
