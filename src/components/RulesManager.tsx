import { useTranslation } from '../hooks/useTranslation';
import BilingualTextField from './BilingualTextField';
import { useEffect, useState } from 'react';
import { apiClient } from '../lib/api-client';
import { Plus, Edit, Trash2, Save, X, ChevronUp, ChevronDown, ChevronRight } from 'lucide-react';
import { showAlert, showConfirm } from '../utils/modals';

interface RuleCategory {
  id: string;
  title: string;
  title_en?: string | null;
  slug: string;
  order_index: number;
}

interface Rule {
  id: string;
  category_id: string;
  parent_id?: string | null;
  number: string;
  title: string;
  title_en?: string | null;
  content: string;
  content_en?: string | null;
  order_index: number;
  subitems?: Rule[];
}

export default function RulesManager() {
  const tx = useTranslation();
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ title: '', title_en: '', slug: '' });
  const [newRule, setNewRule] = useState({
    category_id: '',
    parent_id: '',
    number: '',
    title: '',
    title_en: '',
    content: '',
    content_en: '',
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRule, setShowAddRule] = useState<string | null>(null);
  const [expandedRules, setExpandedRules] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadCategories();
    loadRules();
  }, []);

  async function loadCategories() {
    try {
      const data = await apiClient.rules.categories.list();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async function loadRules() {
    try {
      const data = await apiClient.rules.list();
      setRules(data);
    } catch (error) {
      console.error('Error loading rules:', error);
    }
  }

  async function handleSaveCategory(category: RuleCategory) {
    try {
      await apiClient.rules.categories.update(category.id, {
        title: category.title,
        title_en: category.title_en ?? null,
        slug: category.slug,
        updated_at: new Date().toISOString(),
      });

      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      await showAlert(
        tx("Помилка збереження: ") + (error instanceof Error ? tx(error.message) : tx("Невідома помилка")),
        tx("Помилка"),
        'error'
      );
    }
  }

  async function handleAddCategory() {
    try {
      const maxOrder = Math.max(...categories.map((c) => c.order_index), 0);
      await apiClient.rules.categories.create({
        ...newCategory,
        order_index: maxOrder + 1,
      });

      setNewCategory({ title: '', title_en: '', slug: '' });
      setShowAddCategory(false);
      loadCategories();
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }

  async function handleDeleteCategory(id: string) {
    const confirmed = await showConfirm(tx("Видалити категорію та всі правила в ній?"), tx("Підтвердження"), { type: 'danger', confirmText: tx("Видалити"), cancelText: tx("Скасувати") });
    if (!confirmed) return;
    try {
      await apiClient.rules.categories.delete(id);
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  function updateRule(id: string, changes: Partial<Rule>) {
    const updateTree = (items: Rule[]): Rule[] => items.map((item) => ({
      ...item,
      ...(item.id === id ? changes : {}),
      subitems: item.subitems ? updateTree(item.subitems) : undefined,
    }));
    setRules((current) => updateTree(current));
  }

  async function handleSaveRule(rule: Rule) {
    try {
      await apiClient.rules.update(rule.id, {
        number: rule.number,
        title: rule.title,
        title_en: rule.title_en ?? null,
        content: rule.content,
        content_en: rule.content_en ?? null,
        updated_at: new Date().toISOString(),
      });

      setEditingRule(null);
      loadRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      await showAlert(
        tx("Помилка збереження: ") + (error instanceof Error ? tx(error.message) : tx("Невідома помилка")),
        tx("Помилка"),
        'error'
      );
    }
  }

  async function handleAddRule() {
    try {
      const categoryRules = rules.filter((r) => r.category_id === newRule.category_id && !r.parent_id);
      const maxOrder = Math.max(...categoryRules.map((r) => r.order_index), 0);

      await apiClient.rules.create({
        ...newRule,
        order_index: maxOrder + 1,
      });

      setNewRule({ category_id: '', parent_id: '', number: '', title: '', title_en: '', content: '', content_en: '' });
      setShowAddRule(null);
      loadRules();
    } catch (error) {
      console.error('Error adding rule:', error);
    }
  }

  async function handleDeleteRule(id: string) {
    const confirmed = await showConfirm(tx("Видалити це правило?"), tx("Підтвердження"), { type: 'danger', confirmText: tx("Видалити"), cancelText: tx("Скасувати") });
    if (!confirmed) return;
    try {
      await apiClient.rules.delete(id);
      loadRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
    }
  }

  async function moveCategory(id: string, direction: 'up' | 'down') {
    const index = categories.findIndex((c) => c.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === categories.length - 1)
    )
      return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const updatedCategories = [...categories];
    [updatedCategories[index], updatedCategories[newIndex]] = [
      updatedCategories[newIndex],
      updatedCategories[index],
    ];

    try {
      await Promise.all(
        updatedCategories.map((cat, idx) =>
          apiClient.rules.categories.update(cat.id, { order_index: idx + 1 })
        )
      );

      loadCategories();
    } catch (error) {
      console.error('Error moving category:', error);
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-400">{tx("Українська — основна мова. Англійські поля можна заповнювати поступово; порожнє поле означає, що перекладу ще немає.")}</p>
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">{tx("Управління правилами")}</h2>
        <button
          onClick={() => setShowAddCategory(true)}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          {tx("Додати категорію")}</button>
      </div>

      {showAddCategory && (
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="font-semibold mb-3">{tx("Нова категорія")}</h3>
          <div className="space-y-3">
            <BilingualTextField
              label={tx("Назва категорії")}
              value={newCategory.title}
              englishValue={newCategory.title_en}
              onChange={(value) => setNewCategory({ ...newCategory, title: value })}
              onEnglishChange={(value) => setNewCategory({ ...newCategory, title_en: value })}
            />
            <input
              type="text"
              placeholder={tx("URL (slug, наприклад: main-rules)")}
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
              >
                {tx("Зберегти")}</button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ title: '', title_en: '', slug: '' });
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                {tx("Скасувати")}</button>
            </div>
          </div>
        </div>
      )}

      {categories.map((category, catIndex) => (
        <div key={category.id} className="bg-gray-800 p-4 rounded border border-gray-700">
          {editingCategory === category.id ? (
            <div className="space-y-3 mb-4">
              <BilingualTextField
                label={tx("Назва категорії")}
                value={category.title}
                englishValue={category.title_en}
                onChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, title: value } : item))}
                onEnglishChange={(value) => setCategories((current) => current.map((item) => item.id === category.id ? { ...item, title_en: value } : item))}
              />
              <input
                type="text"
                value={category.slug}
                onChange={(e) => {
                  const updated = [...categories];
                  updated[catIndex].slug = e.target.value;
                  setCategories(updated);
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveCategory(category)}
                  className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded inline-flex items-center gap-1"
                >
                  <Save className="w-4 h-4" />
                  {tx("Зберегти")}</button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    loadCategories();
                  }}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  {tx("Скасувати")}</button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
                <p className="text-sm text-gray-400">/{category.slug}</p>
                <p className="text-sm text-gray-400" lang="en">EN: {category.title_en || tx("Переклад відсутній")}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => moveCategory(category.id, 'up')}
                  disabled={catIndex === 0}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveCategory(category.id, 'down')}
                  disabled={catIndex === categories.length - 1}
                  className="p-1 hover:bg-gray-700 rounded disabled:opacity-30"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setEditingCategory(category.id)}
                  className="p-1 hover:bg-gray-700 rounded"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(category.id)}
                  className="p-1 hover:bg-gray-700 rounded text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-2 mb-3">
            {rules
              .filter((r) => r.category_id === category.id && !r.parent_id)
              .map((rule) => (
                <div key={rule.id}>
                  <div className="bg-gray-900 p-3 rounded border border-gray-700">
                    {editingRule === rule.id ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={rule.number}
                          onChange={(e) => updateRule(rule.id, { number: e.target.value })}
                          placeholder={tx("Номер правила")}
                          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                        />
                        <BilingualTextField
                          label={tx("Назва")}
                          value={rule.title}
                          englishValue={rule.title_en}
                          onChange={(value) => updateRule(rule.id, { title: value })}
                          onEnglishChange={(value) => updateRule(rule.id, { title_en: value })}
                        />
                        <BilingualTextField
                          label={tx("Текст")}
                          value={rule.content}
                          englishValue={rule.content_en}
                          onChange={(value) => updateRule(rule.id, { content: value })}
                          onEnglishChange={(value) => updateRule(rule.id, { content_en: value })}
                          multiline
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveRule(rule)}
                            className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                          >
                            {tx("Зберегти")}</button>
                          <button
                            onClick={() => {
                              setEditingRule(null);
                              loadRules();
                            }}
                            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                          >
                            {tx("Скасувати")}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="font-semibold text-sm text-gray-400 mb-1">
                            {rule.number}
                          </div>
                          <div className="font-medium mb-1">{rule.title}</div>
                          <div className="text-sm text-gray-300">{rule.content}</div>
                          <p className="mt-2 text-xs text-gray-400">EN: {rule.title_en?.trim() && rule.content_en?.trim() ? tx("Переклад готовий") : rule.title_en?.trim() || rule.content_en?.trim() ? tx("Частковий переклад") : tx("Переклад відсутній")}</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              const newSet = new Set(expandedRules);
                              if (newSet.has(rule.id)) {
                                newSet.delete(rule.id);
                              } else {
                                newSet.add(rule.id);
                              }
                              setExpandedRules(newSet);
                            }}
                            className="p-1 hover:bg-gray-800 rounded"
                          >
                            <ChevronRight
                              className={`w-4 h-4 transition-transform ${
                                expandedRules.has(rule.id) ? 'rotate-90' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={() => setEditingRule(rule.id)}
                            className="p-1 hover:bg-gray-800 rounded"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 hover:bg-gray-800 rounded text-red-500"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {expandedRules.has(rule.id) && (
                    <div className="ml-4 mt-2 space-y-2">
                      {rule.subitems && rule.subitems.length > 0 && (
                        <>
                          {rule.subitems.map((subitem) => (
                            <div key={subitem.id} className="bg-gray-850 p-3 rounded border border-gray-600">
                              {editingRule === subitem.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={subitem.number}
                                    onChange={(e) => updateRule(subitem.id, { number: e.target.value })}
                                    placeholder={tx("Номер підпункту")}
                                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                                  />
                                  <BilingualTextField
                                    label={tx("Назва")}
                                    value={subitem.title}
                                    englishValue={subitem.title_en}
                                    onChange={(value) => updateRule(subitem.id, { title: value })}
                                    onEnglishChange={(value) => updateRule(subitem.id, { title_en: value })}
                                  />
                                  <BilingualTextField
                                    label={tx("Текст")}
                                    value={subitem.content}
                                    englishValue={subitem.content_en}
                                    onChange={(value) => updateRule(subitem.id, { content: value })}
                                    onEnglishChange={(value) => updateRule(subitem.id, { content_en: value })}
                                    multiline
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => handleSaveRule(subitem)}
                                      className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                                    >
                                      {tx("Зберегти")}</button>
                                    <button
                                      onClick={() => {
                                        setEditingRule(null);
                                        loadRules();
                                      }}
                                      className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                                    >
                                      {tx("Скасувати")}</button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <div className="font-semibold text-sm text-gray-500 mb-1">
                                      {subitem.number}
                                    </div>
                                    <div className="font-medium text-sm mb-1">{subitem.title}</div>
                                    <div className="text-xs text-gray-400">{subitem.content}</div>
                                    <p className="mt-2 text-xs text-gray-400">EN: {subitem.title_en?.trim() && subitem.content_en?.trim() ? tx("Переклад готовий") : subitem.title_en?.trim() || subitem.content_en?.trim() ? tx("Частковий переклад") : tx("Переклад відсутній")}</p>
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => setEditingRule(subitem.id)}
                                      className="p-1 hover:bg-gray-800 rounded"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRule(subitem.id)}
                                      className="p-1 hover:bg-gray-800 rounded text-red-500"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </>
                      )}
                      {showAddRule === rule.id && newRule.parent_id === rule.id ? (
                        <div className="bg-gray-800 p-3 rounded border border-gray-700 mt-2">
                          <h5 className="font-semibold text-sm mb-2">{tx("Новий підпункт")}</h5>
                          <div className="space-y-2">
                            <input
                              type="text"
                              placeholder={tx("Номер (наприклад: 1.1)")}
                              value={newRule.number}
                              onChange={(e) => setNewRule({ ...newRule, number: e.target.value })}
                              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm"
                            />
                            <BilingualTextField
                              label={tx("Назва")}
                              value={newRule.title}
                              englishValue={newRule.title_en}
                              onChange={(value) => setNewRule({ ...newRule, title: value })}
                              onEnglishChange={(value) => setNewRule({ ...newRule, title_en: value })}
                            />
                            <BilingualTextField
                              label={tx("Текст")}
                              value={newRule.content}
                              englishValue={newRule.content_en}
                              onChange={(value) => setNewRule({ ...newRule, content: value })}
                              onEnglishChange={(value) => setNewRule({ ...newRule, content_en: value })}
                              multiline
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleAddRule}
                                className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-xs"
                              >
                                {tx("Додати")}</button>
                              <button
                                onClick={() => {
                                  setShowAddRule(null);
                                  setNewRule({ category_id: '', parent_id: '', number: '', title: '', title_en: '', content: '', content_en: '' });
                                }}
                                className="bg-gray-600 hover:bg-gray-500 px-3 py-1 rounded text-xs"
                              >
                                {tx("Скасувати")}</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setNewRule({ category_id: category.id, parent_id: rule.id, number: '', title: '', title_en: '', content: '', content_en: '' });
                            setShowAddRule(rule.id);
                          }}
                          className="text-xs text-gray-500 hover:text-gray-300 inline-flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          {tx("Додати підпункт")}</button>
                      )}
                    </div>
                  )}
                </div>
              ))}
          </div>

          {showAddRule === category.id && !newRule.parent_id ? (
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <h4 className="font-semibold mb-2">{tx("Нове правило")}</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={tx("Номер (наприклад: 1.1)")}
                  value={newRule.number}
                  onChange={(e) => setNewRule({ ...newRule, number: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
                <BilingualTextField
                  label={tx("Назва")}
                  value={newRule.title}
                  englishValue={newRule.title_en}
                  onChange={(value) => setNewRule({ ...newRule, title: value })}
                  onEnglishChange={(value) => setNewRule({ ...newRule, title_en: value })}
                />
                <BilingualTextField
                  label={tx("Текст")}
                  value={newRule.content}
                  englishValue={newRule.content_en}
                  onChange={(value) => setNewRule({ ...newRule, content: value })}
                  onEnglishChange={(value) => setNewRule({ ...newRule, content_en: value })}
                  multiline
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRule}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                  >
                    {tx("Додати")}</button>
                  <button
                    onClick={() => {
                      setShowAddRule(null);
                      setNewRule({ category_id: '', parent_id: '', number: '', title: '', title_en: '', content: '', content_en: '' });
                    }}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    {tx("Скасувати")}</button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setNewRule({ category_id: category.id, parent_id: '', number: '', title: '', title_en: '', content: '', content_en: '' });
                setShowAddRule(category.id);
              }}
              className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              {tx("Додати правило")}</button>
          )}
        </div>
      ))}
    </div>
  );
}
