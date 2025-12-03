import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ChevronDown, ChevronUp, BookOpen, Home, Link as LinkIcon, FileCheck } from 'lucide-react';
import logoIcon from '../assets/a_7bf503427402fe411e336e01e8f6f15a.webp';
import { AlertModal } from '../components/Modal';
import { useAlertModal } from '../hooks/useModal';
import { useAuth } from '../contexts/AuthContext';

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

export default function Rules() {
  const { slug, ruleNumber } = useParams<{ slug?: string; ruleNumber?: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isOpen: isAlertOpen, config: alertConfig, showAlert, close: closeAlert } = useAlertModal();
  const [categories, setCategories] = useState<RuleCategory[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (slug && categories.length > 0) {
      const category = categories.find((c) => c.slug === slug);
      if (category) {
        setExpandedCategories(new Set([category.id]));
        setTimeout(() => {
          const element = document.getElementById(`category-${category.id}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, [slug, categories]);

  useEffect(() => {
    if (ruleNumber && rules.length > 0) {
      const rule = rules.find((r) => r.number === ruleNumber);
      if (rule) {
        setExpandedCategories(new Set([rule.category_id]));
        setTimeout(() => {
          const element = document.getElementById(`rule-${rule.number}`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element?.classList.add('highlight-rule');
          setTimeout(() => element?.classList.remove('highlight-rule'), 2000);
        }, 100);
      }
    }
  }, [ruleNumber, rules]);

  async function loadData() {
    setLoading(true);
    const [categoriesResult, rulesResult] = await Promise.all([
      supabase.from('rule_categories').select('*').order('order_index'),
      supabase.from('rules').select('*').order('category_id, order_index'),
    ]);

    if (categoriesResult.data) setCategories(categoriesResult.data);
    if (rulesResult.data) setRules(rulesResult.data);
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

  function expandAll() {
    setExpandedCategories(new Set(categories.map((c) => c.id)));
  }

  function collapseAll() {
    setExpandedCategories(new Set());
  }

  function copyRuleLink(ruleNumber: string) {
    const url = `${window.location.origin}/rules/rule/${ruleNumber}`;
    navigator.clipboard.writeText(url);
    showAlert(`Посилання на правило ${ruleNumber} скопійовано!`, 'Успіх', 'success');
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100 flex items-center justify-center">
        <p>Завантаження...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-black text-gray-100">
      <div className="absolute inset-0 opacity-50" style={{
        backgroundImage: 'url(https://i.ibb.co/nqgK0f8B/Screenshot-2025-11-30-032706.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }} />

      <div className="relative">
        <header className="border-b border-gray-700 bg-black bg-opacity-98 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link to="/" className="inline-flex items-center gap-3 hover:opacity-80 transition">
                <img src={logoIcon} alt="Eternal ZONE" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold font-stalker">Eternal ZONE</span>
              </Link>
              <div className="flex gap-2">
                <button
                  onClick={expandAll}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition"
                >
                  Розгорнути все
                </button>
                <button
                  onClick={collapseAll}
                  className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-sm transition"
                >
                  Згорнути все
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-3 mb-4">
              <BookOpen className="w-10 h-10 text-red-500" />
              <h1 className="text-4xl font-bold">Правила сервера</h1>
            </div>
            <p className="text-gray-400">
              Ознайомтесь з правилами перед грою. Натисніть на категорію для розгортання.
            </p>
          </div>

          <div className="space-y-4">
            {categories.map((category) => {
              const categoryRules = rules.filter((r) => r.category_id === category.id);
              const isExpanded = expandedCategories.has(category.id);

              return (
                <div
                  key={category.id}
                  id={`category-${category.id}`}
                  className="bg-gray-800 bg-opacity-90 rounded-lg border border-gray-700 overflow-hidden"
                >
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-700 transition"
                  >
                    <h2 className="text-xl font-semibold text-left">{category.title}</h2>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        {categoryRules.length} {categoryRules.length === 1 ? 'правило' : 'правил'}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="px-6 py-4 border-t border-gray-700 space-y-4">
                      {categoryRules.map((rule) => (
                        <div
                          key={rule.id}
                          id={`rule-${rule.number}`}
                          className="bg-gray-900 p-4 rounded border border-gray-700 rule-item"
                        >
                          <div className="flex items-start justify-between gap-4 mb-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-red-500 font-bold">{rule.number}</span>
                                <h3 className="font-semibold">{rule.title}</h3>
                              </div>
                            </div>
                            <button
                              onClick={() => copyRuleLink(rule.number)}
                              className="p-2 hover:bg-gray-800 rounded transition"
                              title="Скопіювати посилання"
                            >
                              <LinkIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                          <p className="text-gray-300 leading-relaxed">{rule.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-6 bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700">
            <h3 className="text-lg font-semibold mb-2">Важливо</h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Незнання правил не звільняє від відповідальності. Якщо у вас є питання щодо
              правил, звертайтесь до адміністрації сервера в Discord.
            </p>
            {user && (
              <div className="mt-4 text-center">
                <Link
                  to="/rules-test"
                  className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-500 px-6 py-3 rounded font-semibold transition"
                >
                  <FileCheck className="w-5 h-5" />
                  Здати тест на знання правил
                </Link>
              </div>
            )}
            {!user && (
              <div className="mt-4 text-center">
                <p className="text-gray-400 text-sm mb-2">
                  Для здачі тесту на правила увійдіть через Steam
                </p>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded font-semibold transition"
                >
                  На головну
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .highlight-rule {
          animation: highlight 2s ease-out;
        }

        @keyframes highlight {
          0% {
            background-color: rgba(239, 68, 68, 0.3);
            border-color: rgba(239, 68, 68, 0.6);
          }
          100% {
            background-color: transparent;
            border-color: rgb(55, 65, 81);
          }
        }

        .rule-item {
          transition: all 0.3s ease;
        }

        .rule-item:hover {
          border-color: rgba(239, 68, 68, 0.4);
        }
      `}</style>
      <AlertModal
        isOpen={isAlertOpen}
        onClose={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        type={alertConfig.type}
      />
    </div>
  );
}
