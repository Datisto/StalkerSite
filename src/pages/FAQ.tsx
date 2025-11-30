import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, HelpCircle, Home } from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';

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

export default function FAQ() {
  const [categories, setCategories] = useState<FAQCategory[]>([]);
  const [items, setItems] = useState<FAQItem[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase.from('faq_categories').select('*').order('order_index'),
      supabase.from('faq_items').select('*').eq('is_visible', true).order('category_id, order_index'),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (itemsResult.data) setItems(itemsResult.data);
    setLoading(false);
  }

  function toggleCategory(categoryId: string) {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  }

  function toggleItem(itemId: string) {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  }

  function expandAll() {
    setExpandedCategories(new Set(categories.map((c) => c.id)));
    setExpandedItems(new Set(items.map((i) => i.id)));
  }

  function collapseAll() {
    setExpandedCategories(new Set());
    setExpandedItems(new Set());
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <header className="border-b border-gray-700 bg-black bg-opacity-90 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
              <img src={logoIcon} alt="Eternal ZONE" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold font-stalker">Eternal ZONE</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <Home className="w-4 h-4" />
                Головна
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 font-stalker flex items-center gap-3">
            <HelpCircle className="w-10 h-10 text-red-500" />
            FAQ - Часті питання
          </h1>
          <p className="text-gray-400 text-lg">
            Відповіді на найпоширеніші питання про сервер
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto"></div>
            <p className="text-gray-400 mt-4">Завантаження...</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6">
              <button
                onClick={expandAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
              >
                Розгорнути все
              </button>
              <button
                onClick={collapseAll}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition text-sm"
              >
                Згорнути все
              </button>
            </div>

            <div className="space-y-6">
              {categories.map((category) => {
                const categoryItems = items.filter((item) => item.category_id === category.id);
                if (categoryItems.length === 0) return null;

                const isExpanded = expandedCategories.has(category.id);

                return (
                  <div
                    key={category.id}
                    id={`category-${category.id}`}
                    className="bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700 overflow-hidden"
                  >
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-6 hover:bg-gray-700 hover:bg-opacity-30 transition"
                    >
                      <h2 className="text-2xl font-bold font-stalker text-left">{category.title}</h2>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">{categoryItems.length} питань</span>
                        {isExpanded ? (
                          <ChevronUp className="w-6 h-6 text-red-500" />
                        ) : (
                          <ChevronDown className="w-6 h-6 text-red-500" />
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-700">
                        {categoryItems.map((item) => {
                          const isItemExpanded = expandedItems.has(item.id);

                          return (
                            <div
                              key={item.id}
                              className="border-b border-gray-700 last:border-b-0"
                            >
                              <button
                                onClick={() => toggleItem(item.id)}
                                className="w-full flex items-center justify-between p-4 hover:bg-gray-700 hover:bg-opacity-30 transition text-left"
                              >
                                <h3 className="text-lg font-semibold pr-4">{item.question}</h3>
                                {isItemExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-red-500 flex-shrink-0" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-red-500 flex-shrink-0" />
                                )}
                              </button>

                              {isItemExpanded && (
                                <div className="px-4 pb-4">
                                  <div className="bg-gray-900 bg-opacity-60 rounded p-4 border-l-4 border-red-500">
                                    <div
                                      className="prose prose-invert max-w-none prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-red-400 prose-strong:text-gray-200 prose-ul:text-gray-300 prose-ol:text-gray-300"
                                      dangerouslySetInnerHTML={{
                                        __html: item.answer.replace(/\n/g, '<br />'),
                                      }}
                                    />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {categories.length === 0 && (
              <div className="text-center py-12 bg-gray-800 bg-opacity-60 rounded-lg border border-gray-700">
                <HelpCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">FAQ поки що порожній</p>
              </div>
            )}
          </>
        )}
      </main>

      <style>{`
        @keyframes highlightFade {
          0% { background-color: rgba(239, 68, 68, 0.3); }
          100% { background-color: transparent; }
        }
        .highlight-item {
          animation: highlightFade 2s ease-out;
        }
      `}</style>
    </div>
  );
}
