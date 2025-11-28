import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Edit, Trash2, Save, X, ChevronUp, ChevronDown } from 'lucide-react';

interface RuleCategory {
  id: string;
  title: string;
  slug: string;
  order_index: number;
}

interface Rule {
  id: string;
  category_id: string;
  number: string;
  title: string;
  content: string;
  order_index: number;
}

export default function RulesManager() {
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editingRule, setEditingRule] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState({ title: '', slug: '' });
  const [newRule, setNewRule] = useState({
    category_id: '',
    number: '',
    title: '',
    content: '',
  });
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddRule, setShowAddRule] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
    loadRules();
  }, []);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('rule_categories')
      .select('*')
      .order('order_index');
    if (!error && data) setCategories(data);
  }

  async function loadRules() {
    const { data, error } = await supabase
      .from('rules')
      .select('*')
      .order('category_id, order_index');
    if (!error && data) setRules(data);
  }

  async function handleSaveCategory(category: RuleCategory) {
    const { error } = await supabase
      .from('rule_categories')
      .update({
        title: category.title,
        slug: category.slug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', category.id);

    if (!error) {
      setEditingCategory(null);
      loadCategories();
    }
  }

  async function handleAddCategory() {
    const maxOrder = Math.max(...categories.map((c) => c.order_index), 0);
    const { error } = await supabase.from('rule_categories').insert({
      ...newCategory,
      order_index: maxOrder + 1,
    });

    if (!error) {
      setNewCategory({ title: '', slug: '' });
      setShowAddCategory(false);
      loadCategories();
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('Видалити категорію та всі правила в ній?')) return;
    const { error } = await supabase.from('rule_categories').delete().eq('id', id);
    if (!error) loadCategories();
  }

  async function handleSaveRule(rule: Rule) {
    const { error } = await supabase
      .from('rules')
      .update({
        number: rule.number,
        title: rule.title,
        content: rule.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', rule.id);

    if (!error) {
      setEditingRule(null);
      loadRules();
    }
  }

  async function handleAddRule() {
    const categoryRules = rules.filter((r) => r.category_id === newRule.category_id);
    const maxOrder = Math.max(...categoryRules.map((r) => r.order_index), 0);

    const { error } = await supabase.from('rules').insert({
      ...newRule,
      order_index: maxOrder + 1,
    });

    if (!error) {
      setNewRule({ category_id: '', number: '', title: '', content: '' });
      setShowAddRule(null);
      loadRules();
    }
  }

  async function handleDeleteRule(id: string) {
    if (!confirm('Видалити це правило?')) return;
    const { error } = await supabase.from('rules').delete().eq('id', id);
    if (!error) loadRules();
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

    await Promise.all(
      updatedCategories.map((cat, idx) =>
        supabase
          .from('rule_categories')
          .update({ order_index: idx + 1 })
          .eq('id', cat.id)
      )
    );

    loadCategories();
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Управління правилами</h2>
        <button
          onClick={() => setShowAddCategory(true)}
          className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Додати категорію
        </button>
      </div>

      {showAddCategory && (
        <div className="bg-gray-800 p-4 rounded border border-gray-700">
          <h3 className="font-semibold mb-3">Нова категорія</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Назва категорії"
              value={newCategory.title}
              onChange={(e) => setNewCategory({ ...newCategory, title: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
            <input
              type="text"
              placeholder="URL (slug, наприклад: main-rules)"
              value={newCategory.slug}
              onChange={(e) => setNewCategory({ ...newCategory, slug: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="bg-green-600 hover:bg-green-500 px-4 py-2 rounded"
              >
                Зберегти
              </button>
              <button
                onClick={() => {
                  setShowAddCategory(false);
                  setNewCategory({ title: '', slug: '' });
                }}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded"
              >
                Скасувати
              </button>
            </div>
          </div>
        </div>
      )}

      {categories.map((category, catIndex) => (
        <div key={category.id} className="bg-gray-800 p-4 rounded border border-gray-700">
          {editingCategory === category.id ? (
            <div className="space-y-3 mb-4">
              <input
                type="text"
                value={category.title}
                onChange={(e) => {
                  const updated = [...categories];
                  updated[catIndex].title = e.target.value;
                  setCategories(updated);
                }}
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2"
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
                  Зберегти
                </button>
                <button
                  onClick={() => {
                    setEditingCategory(null);
                    loadCategories();
                  }}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded inline-flex items-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Скасувати
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-semibold">{category.title}</h3>
                <p className="text-sm text-gray-400">/{category.slug}</p>
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
              .filter((r) => r.category_id === category.id)
              .map((rule) => (
                <div
                  key={rule.id}
                  className="bg-gray-900 p-3 rounded border border-gray-700"
                >
                  {editingRule === rule.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={rule.number}
                        onChange={(e) => {
                          const updated = [...rules];
                          const idx = updated.findIndex((r) => r.id === rule.id);
                          updated[idx].number = e.target.value;
                          setRules(updated);
                        }}
                        placeholder="Номер правила"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                      />
                      <input
                        type="text"
                        value={rule.title}
                        onChange={(e) => {
                          const updated = [...rules];
                          const idx = updated.findIndex((r) => r.id === rule.id);
                          updated[idx].title = e.target.value;
                          setRules(updated);
                        }}
                        placeholder="Назва правила"
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                      />
                      <textarea
                        value={rule.content}
                        onChange={(e) => {
                          const updated = [...rules];
                          const idx = updated.findIndex((r) => r.id === rule.id);
                          updated[idx].content = e.target.value;
                          setRules(updated);
                        }}
                        placeholder="Опис правила"
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleSaveRule(rule)}
                          className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                        >
                          Зберегти
                        </button>
                        <button
                          onClick={() => {
                            setEditingRule(null);
                            loadRules();
                          }}
                          className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                        >
                          Скасувати
                        </button>
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
                      </div>
                      <div className="flex gap-2">
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
              ))}
          </div>

          {showAddRule === category.id ? (
            <div className="bg-gray-900 p-3 rounded border border-gray-700">
              <h4 className="font-semibold mb-2">Нове правило</h4>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Номер (наприклад: 1.1)"
                  value={newRule.number}
                  onChange={(e) => setNewRule({ ...newRule, number: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
                <input
                  type="text"
                  placeholder="Назва правила"
                  value={newRule.title}
                  onChange={(e) => setNewRule({ ...newRule, title: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
                <textarea
                  placeholder="Опис правила"
                  value={newRule.content}
                  onChange={(e) => setNewRule({ ...newRule, content: e.target.value })}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddRule}
                    className="bg-green-600 hover:bg-green-500 px-3 py-1 rounded text-sm"
                  >
                    Додати
                  </button>
                  <button
                    onClick={() => {
                      setShowAddRule(null);
                      setNewRule({ category_id: '', number: '', title: '', content: '' });
                    }}
                    className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm"
                  >
                    Скасувати
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => {
                setNewRule({ ...newRule, category_id: category.id });
                setShowAddRule(category.id);
              }}
              className="text-sm text-gray-400 hover:text-white inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Додати правило
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
