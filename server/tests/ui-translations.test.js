// Run: node --experimental-vm-modules --test server/tests/ui-translations.test.js
// No browser, API, or database is contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const root = fileURLToPath(new URL('../../', import.meta.url));
async function fixture(language = 'uk', savedLanguage) {
  const cache = new Map();
  const storage = new Map(savedLanguage ? [['eternal-zone-language', savedLanguage]] : []);
  const storageMock = { getItem: (key) => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) };
  const synthetic = (exports) => new SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  });
  async function load(file) {
    if (cache.has(file)) return cache.get(file);
    const source = await readFile(file, 'utf8');
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX },
    });
    const module = new SourceTextModule(outputText, {
      identifier: file,
      // Each fixture has independent storage, including the language module's initialization.
      context: undefined,
    });
    cache.set(file, module);
    await module.link(async (specifier) => {
      if (specifier.endsWith('/hooks/useTranslation')) {
        const translations = await load(resolve(root, 'src/i18n/translate.ts'));
        await translations.evaluate();
        return synthetic({ useTranslation: () => (source, params) => translations.namespace.translateText(source, language, params) });
      }
      if (specifier.endsWith('/contexts/language')) {
        const menu = await load(resolve(root, 'src/i18n/menu.ts'));
        await menu.evaluate();
        return synthetic({ useLanguage: () => ({ language, t: (key) => menu.namespace.menuTranslations[language][key], setLanguage: () => {} }) });
      }
      if (specifier.endsWith('/contexts/AuthContext')) return synthetic({ useAuth: () => ({ user: null }) });
      if (specifier.endsWith('/lib/api-client')) return synthetic({ apiClient: {} });
      if (/\.(webp|png)$/.test(specifier)) return synthetic({ default: specifier });
      if (specifier === 'react-router-dom') return synthetic({ Link: ({ to, children, ...props }) => React.createElement('a', { href: to, ...props }, children) });
      if (!specifier.startsWith('.')) return synthetic(await import(specifier));
      let dependency = resolve(dirname(file), specifier);
      if (!extname(dependency)) {
        try { await access(`${dependency}.ts`); dependency += '.ts'; }
        catch { dependency += '.tsx'; }
      }
      return load(dependency);
    });
    return module;
  }
  // Restore the process-global mock immediately after module evaluation.
  return {
    storage,
    async get(relative) {
      const previous = globalThis.localStorage;
      globalThis.localStorage = storageMock;
      try {
        if (relative.endsWith('.tsx')) {
          for (const dependency of ['src/i18n/translate.ts', 'src/i18n/menu.ts']) {
            const module = await load(resolve(root, dependency));
            await module.evaluate();
          }
        }
        const module = await load(resolve(root, relative));
        await module.evaluate();
        return module.namespace;
      } finally {
        if (previous === undefined) delete globalThis.localStorage;
        else globalThis.localStorage = previous;
      }
    },
  };
}

test('every catalog entry has English text and preserves format parameters', async () => {
  const { englishMessages } = await (await fixture()).get('src/i18n/messages.ts');
  assert.ok(Object.keys(englishMessages).length > 750);
  for (const [source, english] of Object.entries(englishMessages)) {
    assert.ok(english.trim(), source);
    assert.doesNotMatch(english, /[А-Яа-яІіЇїЄєҐґ]/, source);
    const params = (text) => [...text.matchAll(/\{\d+\}/g)].map(([value]) => value).sort();
    assert.deepEqual(params(source), params(english), source);
  }
});

test('Ukrainian defaults, English persistence and shared-root notifications', async () => {
  const basic = await fixture();
  const store = await basic.get('src/i18n/language-store.ts');
  assert.equal(store.getLanguage(), 'uk');
  const en = await (await fixture('en', 'en')).get('src/i18n/language-store.ts');
  assert.equal(en.getLanguage(), 'en');
  const invalid = await (await fixture('uk', 'invalid')).get('src/i18n/language-store.ts');
  assert.equal(invalid.getLanguage(), 'uk');
  let notifications = 0;
  const unsubscribe = store.subscribeLanguage(() => notifications++);
  const previous = globalThis.localStorage;
  globalThis.localStorage = { setItem: (key, value) => basic.storage.set(key, value) };
  try { store.setLanguage('en'); }
  finally {
    if (previous === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previous;
  }
  assert.equal(basic.storage.get('eternal-zone-language'), 'en');
  assert.equal(store.getLanguage(), 'en');
  assert.equal(notifications, 1);
  store.setLanguage('en');
  assert.equal(notifications, 1);
  unsubscribe();
  store.setLanguage('uk');
  assert.equal(notifications, 1);
});

test('translation preserves spacing, parameters, custom content and API semantics', async () => {
  const { translateText } = await (await fixture()).get('src/i18n/translate.ts');
  assert.equal(translateText(' Приєднуйся до спільноти ', 'en'), ' Join the community ');
  assert.equal(translateText('Правильно: {0}/{1}', 'en', [12, 15]), 'Correct: 12/15');
  assert.equal(translateText('Правильно: {0}/{1}', 'uk', [12, 15]), 'Правильно: 12/15');
  assert.equal(translateText('Моя власна біографія', 'en'), 'Моя власна біографія');
  assert.equal(translateText('Invalid credentials', 'uk'), 'Невірний логін або пароль');
  assert.equal(translateText('Invalid credentials', 'en'), 'Invalid credentials');
  assert.equal(translateText('title_en exceeds 255 characters', 'uk'), 'Поле title_en перевищує ліміт 255 символів');
});

test('predefined character choices translate while custom reasons and stored definitions stay intact', async () => {
  const f = await fixture();
  const choices = await f.get('src/data/characterConstants.ts');
  const { translateText } = await f.get('src/i18n/translate.ts');
  const { translateZoneReason } = await f.get('src/i18n/character.ts');
  const original = JSON.stringify(choices);
  const tx = (value) => translateText(value, 'en');
  for (const name of ['FACTIONS', 'HAIR_COLORS', 'EYE_COLORS', 'BODY_TYPES', 'MILITARY_EXPERIENCE']) {
    for (const choice of choices[name]) assert.doesNotMatch(tx(choice), /[А-Яа-яІіЇїЄєҐґ]/);
  }
  for (const traits of Object.values(choices.CHARACTER_TRAITS)) {
    for (const choice of traits) assert.doesNotMatch(tx(choice), /[А-Яа-яІіЇїЄєҐґ]/);
  }
  for (const reason of choices.ZONE_ENTRY_REASONS) {
    const value = `${reason.title}: ${reason.description}`;
    assert.equal(translateZoneReason(value, (source) => translateText(source, 'uk')), value);
    assert.doesNotMatch(translateZoneReason(value, tx), /[А-Яа-яІіЇїЄєҐґ]/);
  }
  assert.equal(translateZoneReason('Власна причина гравця', tx), 'Власна причина гравця');
  assert.equal(JSON.stringify(choices), original);
});

async function sourceFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory()
    ? sourceFiles(resolve(directory, entry.name))
    : /\.tsx?$/.test(entry.name) ? [resolve(directory, entry.name)] : []))).flat();
}

test('display lookups exist and option values never depend on the display translator', async () => {
  const { englishMessages } = await (await fixture()).get('src/i18n/messages.ts');
  for (const file of await sourceFiles(resolve(root, 'src'))) {
    const source = await readFile(file, 'utf8');
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true);
    function visit(node) {
      if (ts.isCallExpression(node) && node.expression.getText() === 'tx' && ts.isStringLiteral(node.arguments[0])) {
        const key = node.arguments[0].text.trim();
        if (/[А-Яа-яІіЇїЄєҐґ]/.test(key)) assert.ok(Object.hasOwn(englishMessages, key), `${file}: ${key}`);
      }
      if (ts.isJsxText(node)) assert.doesNotMatch(node.text, /[А-Яа-яІіЇїЄєҐґ]/, file);
      if (ts.isJsxAttribute(node) && node.name.text === 'value') {
        assert.doesNotMatch(node.getText(), /\b(?:tx|translateZoneReason)\(/, file);
      }
      ts.forEachChild(node, visit);
    }
    visit(ast);
  }
});

test('landing page and independently mounted dialogs render English, including Discord', async () => {
  for (const language of ['uk', 'en']) {
    const f = await fixture(language);
    const { default: LandingPage } = await f.get('src/pages/LandingPage.tsx');
    const html = renderToStaticMarkup(React.createElement(LandingPage));
    assert.ok(html.includes(language === 'en' ? 'Join the community' : 'Приєднуйся до спільноти'));
    assert.ok(html.includes(language === 'en' ? 'Our Discord server is a place' : 'Наш Discord-сервер'));
    if (language === 'en') assert.doesNotMatch(html, /[А-Яа-яІіЇїЄєҐґ]/);
    const { ConfirmModal } = await f.get('src/components/Modal.tsx');
    const dialog = renderToStaticMarkup(React.createElement(ConfirmModal, {
      isOpen: true, onClose: () => {}, onConfirm: () => {}, title: 'Підтвердження', message: 'Зміни збережено',
    }));
    assert.ok(dialog.includes(language === 'en' ? 'Confirm' : 'Підтвердити'));
    if (language === 'en') assert.doesNotMatch(dialog, /[А-Яа-яІіЇїЄєҐґ]/);
  }
});
