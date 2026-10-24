// Run: node --experimental-vm-modules --test server/tests/content-translations.test.js
// Actual route handlers run with an in-memory SQL adapter; no database is contacted.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { SourceTextModule, SyntheticModule } from 'node:vm';
import { translationFields } from '../src/utils/content-translations.js';
import ts from 'typescript';

test('public content uses English only when present and always keeps Ukrainian as the default', async () => {
  const source = await readFile(new URL('../../src/i18n/content.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } });
  const module = new SourceTextModule(outputText);
  await module.link(() => { throw new Error('Unexpected runtime import'); });
  await module.evaluate();
  const { localizedText } = module.namespace;
  assert.equal(localizedText('Правило', 'Rule', 'uk'), 'Правило');
  assert.equal(localizedText('Правило', 'Rule', 'en'), 'Rule');
  for (const missing of [undefined, null, '', '   ']) {
    assert.equal(localizedText('Правило', missing, 'en'), 'Правило');
  }
});

async function fixture(routeName) {
  const routes = new Map();
  const tables = new Map();
  const writes = [];
  const admin = () => {};
  const optionalAuth = () => {};
  const router = Object.fromEntries(['get', 'post', 'patch', 'delete'].map((method) => [
    method, (path, ...handlers) => routes.set(`${method} ${path}`, handlers),
  ]));
  const query = async (sql, values = []) => {
    assert.equal((sql.match(/\?/g) || []).length, values.length, 'SQL bind count');
    const table = sql.match(/(?:FROM|INTO|UPDATE) (\w+)/)?.[1];
    const rows = tables.get(table) || [];
    if (sql.startsWith('SELECT')) {
      return rows.filter((row) =>
        (!sql.includes('WHERE is_active = TRUE') || row.is_active) &&
        (!sql.includes('WHERE is_published = TRUE') || row.is_published) &&
        (!sql.includes('WHERE id = ?') || row.id === values[0]) &&
        (!sql.includes('WHERE steam_id = ?') || row.steam_id === values[0])
      ).map((row) => ({ ...row }));
    }
    writes.push({ sql, values });
    if (sql.startsWith('INSERT')) {
      const columns = sql.match(/\(([^)]+)\) VALUES/)[1].split(', ').slice(1);
      const row = Object.fromEntries(columns.map((column, index) => [column, values[index]]));
      row.id = `${table}-${rows.length + 1}`;
      tables.set(table, [...rows, row]);
    } else if (sql.startsWith('UPDATE')) {
      const row = rows.find((item) => item.id === values.at(-1));
      assert.ok(row, 'row exists');
      const columns = [...sql.matchAll(/(\w+) = \?/g)].map((match) => match[1]).slice(0, -1);
      columns.forEach((column, index) => { row[column] = values[index]; });
    }
    return { affectedRows: 1 };
  };
  const module = new SourceTextModule(await readFile(new URL(`../src/routes/${routeName}.js`, import.meta.url), 'utf8'));
  await module.link(async (specifier) => {
    const exports = specifier === 'express' ? { default: { Router: () => router } }
      : specifier.endsWith('database.js') ? { query }
        : specifier.endsWith('auth.js') ? { authenticateAdmin: admin, optionalAuth }
          : specifier.endsWith('content-translations.js') ? { translationFields } : null;
    assert.ok(exports, `unexpected dependency: ${specifier}`);
    return new SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    });
  });
  await module.evaluate();
  return {
    tables, writes,
    isAdminOnly: (method, path) => routes.get(`${method} ${path}`)?.[0] === admin,
    async call(method, path, body = {}, id = '') {
      const handlers = routes.get(`${method} ${path}`);
      assert.ok(handlers, `route ${method} ${path}`);
      const response = { statusCode: 200, body: null };
      response.status = (code) => { response.statusCode = code; return response; };
      response.json = (payload) => { response.body = JSON.parse(JSON.stringify(payload)); };
      await handlers.at(-1)({ body, params: { id }, query: {}, user: { id: 'user-1' } }, response);
      return response;
    },
  };
}

test('categories round-trip English names without changing Ukrainian URLs', async () => {
  const api = await fixture('rules');
  assert.ok(api.isAdminOnly('post', '/categories'));
  assert.equal((await api.call('post', '/categories', { title: 'Основні правила', title_en: 'General rules' })).statusCode, 201);
  const before = (await api.call('get', '/categories')).body[0];
  assert.equal(before.title, 'Основні правила');
  assert.equal(before.title_en, 'General rules');
  await api.call('patch', '/categories/:id', { title_en: 'Updated rules' }, before.id);
  const after = (await api.call('get', '/categories')).body[0];
  assert.equal(after.title_en, 'Updated rules');
  assert.equal(after.slug, before.slug);
  assert.equal(after.title, before.title);
});

test('rule and subitem translations survive cache reloads, partial updates and clearing', async () => {
  const api = await fixture('rules');
  assert.ok(api.isAdminOnly('patch', '/:id'));
  const base = { category_id: 'category-1', number: '1', title: 'Правило', content: 'Український текст', title_en: 'Rule', content_en: 'English text' };
  await api.call('post', '/', base);
  const parent = api.tables.get('rules')[0];
  await api.call('post', '/', { ...base, parent_id: parent.id, number: '1.1', title_en: 'Subitem' });
  let tree = (await api.call('get', '/')).body;
  assert.equal(tree[0].subitems[0].title_en, 'Subitem');
  const childId = tree[0].subitems[0].id;
  await api.call('patch', '/:id', { content_en: 'New English text' }, childId);
  tree = (await api.call('get', '/')).body;
  assert.equal(tree[0].subitems[0].content_en, 'New English text');
  assert.equal(tree[0].subitems[0].content, base.content);
  assert.equal(tree[0].subitems[0].title_en, 'Subitem');
  await api.call('patch', '/:id', { content_en: '   ' }, childId);
  assert.equal((await api.call('get', '/')).body[0].subitems[0].content_en, null);
});

test('old create requests remain valid and default missing English fields to null', async () => {
  const api = await fixture('questions');
  assert.equal((await api.call('post', '/', { question_text: 'Питання?' })).statusCode, 201);
  const question = (await api.call('get', '/')).body[0];
  assert.equal(question.question_text, 'Питання?');
  assert.equal(question.question_text_en, null);
  assert.equal(question.category_en, null);
});

test('inactive questions remain translatable only through the admin list', async () => {
  const api = await fixture('questions');
  assert.ok(api.isAdminOnly('get', '/manage'));
  await api.call('post', '/', { question_text: 'Питання?', question_text_en: 'Question?', category: 'Правила', category_en: 'Rules', is_active: false });
  assert.equal((await api.call('get', '/')).body.length, 0);
  const row = (await api.call('get', '/manage')).body[0];
  await api.call('patch', '/:id', { question_text_en: 'Updated question?' }, row.id);
  const updated = (await api.call('get', '/manage')).body[0];
  assert.equal(updated.question_text_en, 'Updated question?');
  assert.equal(updated.question_text, 'Питання?');
  assert.equal(updated.category_en, 'Rules');
  await api.call('patch', '/:id', { question_text_en: null }, row.id);
  assert.equal((await api.call('get', '/manage')).body[0].question_text_en, null);
});

test('invalid English field types and oversized names fail before writing', async () => {
  const rules = await fixture('rules');
  const questions = await fixture('questions');
  assert.equal((await rules.call('post', '/', { title_en: [] })).statusCode, 400);
  assert.equal((await rules.call('post', '/categories', { title_en: 'x'.repeat(256) })).statusCode, 400);
  assert.equal((await questions.call('post', '/', { question_text_en: {} })).statusCode, 400);
  assert.equal((await questions.call('patch', '/:id', { category_en: 'x'.repeat(256) })).statusCode, 400);
  assert.equal(rules.writes.length + questions.writes.length, 0);
});

test('test submissions preserve displayed question snapshots and selected language', async () => {
  const api = await fixture('test-submissions');
  const questions = ['English question?', 'Питання без перекладу?'];
  await api.call('post', '/', { steam_id: 'steam-1', language: 'en', questions, answers: ['Answer', 'Відповідь'] });
  const row = api.tables.get('rules_test_submissions')[0];
  assert.equal(row.language, 'en');
  assert.deepEqual(JSON.parse(row.answers).questions, questions);
  await api.call('post', '/', { steam_id: 'steam-2' });
  assert.equal(api.tables.get('rules_test_submissions')[1].language, 'uk');
  assert.equal((await api.call('post', '/', { language: 'de' })).statusCode, 400);
  assert.equal(api.tables.get('rules_test_submissions').length, 2);
});

test('FAQ categories, questions and answers round-trip both languages, including hidden items', async () => {
  const api = await fixture('faq');
  assert.ok(api.isAdminOnly('get', '/manage'));
  await api.call('post', '/categories', { title: 'Загальне', title_en: 'General' });
  const category = (await api.call('get', '/categories')).body[0];
  assert.equal(category.title_en, 'General');
  await api.call('patch', '/categories/:id', { title_en: 'General information' }, category.id);
  const updatedCategory = (await api.call('get', '/categories')).body[0];
  assert.equal(updatedCategory.slug, category.slug);
  assert.equal(updatedCategory.title_en, 'General information');
  await api.call('post', '/', {
    category_id: category.id, question: 'Як почати?', question_en: 'How do I start?',
    answer: 'Прочитайте правила.', answer_en: 'Read the rules.', is_visible: false,
  });
  assert.equal((await api.call('get', '/')).body.length, 0);
  const hidden = (await api.call('get', '/manage')).body[0];
  assert.equal(hidden.is_visible, false);
  await api.call('patch', '/:id', { answer_en: 'Start with the rules.', is_visible: true }, hidden.id);
  const published = (await api.call('get', '/')).body[0];
  assert.equal(published.answer_en, 'Start with the rules.');
  assert.equal(published.question_en, 'How do I start?');
  assert.equal(published.answer, 'Прочитайте правила.');
  await api.call('patch', '/:id', { answer_en: '' }, hidden.id);
  assert.equal((await api.call('get', '/')).body[0].answer_en, null);
});

test('media title translations preserve the original title and video URL', async () => {
  const api = await fixture('media-videos');
  assert.ok(api.isAdminOnly('patch', '/:id'));
  await api.call('post', '/', { title: 'Трейлер', title_en: 'Trailer', url: 'https://example.com/video', thumbnail_url: '' });
  const row = (await api.call('get', '/')).body[0];
  assert.equal(row.title_en, 'Trailer');
  await api.call('patch', '/:id', { title_en: 'Server trailer' }, row.id);
  const edited = (await api.call('get', '/')).body[0];
  assert.equal(edited.title_en, 'Server trailer');
  assert.equal(edited.title, 'Трейлер');
  assert.equal(edited.url, row.url);
  await api.call('patch', '/:id', { title_en: null }, row.id);
  assert.equal((await api.call('get', '/')).body[0].title_en, null);
});

test('face translations leave stored model identifiers and uniqueness unchanged', async () => {
  const api = await fixture('face-models');
  assert.ok(api.isAdminOnly('get', '/all'));
  await api.call('post', '/', { name: 'Обличчя_01', name_en: 'Face 01', gender: 'male', image_url: '/face.png', is_unique: true, is_active: false });
  assert.equal((await api.call('get', '/')).body.length, 0);
  const model = (await api.call('get', '/all')).body[0];
  await api.call('patch', '/:id', { name_en: 'Veteran' }, model.id);
  const edited = (await api.call('get', '/all')).body[0];
  assert.equal(edited.name_en, 'Veteran');
  assert.equal(edited.name, 'Обличчя_01');
  assert.equal(edited.is_unique, true);
  assert.equal(edited.is_active, false);
  await api.call('patch', '/:id', { name_en: ' ' }, model.id);
  assert.equal((await api.call('get', '/all')).body[0].name_en, null);
});

test('new content routes reject invalid translation types before writing', async () => {
  for (const [route, body] of [
    ['faq', { question_en: [] }],
    ['media-videos', { title_en: 'x'.repeat(256) }],
    ['face-models', { name_en: {} }],
  ]) {
    const api = await fixture(route);
    assert.equal((await api.call('post', '/', body)).statusCode, 400);
    assert.equal(api.writes.length, 0);
  }
});

test('combined migration covers all English schema columns and preserves existing data', async () => {
  const schema = await readFile(new URL('../database/schema.sql', import.meta.url), 'utf8');
  const migration = await readFile(new URL('../database/upgrade_uk_en_all.sql', import.meta.url), 'utf8');
  const expected = [];
  for (const match of schema.matchAll(/CREATE TABLE IF NOT EXISTS (\w+) \(([\s\S]*?)\) ENGINE/g)) {
    for (const column of match[2].matchAll(/^\s+(\w+_en|language)\s+/gm)) expected.push(`${match[1]}.${column[1]}`);
  }
  const migrated = [...migration.matchAll(/ALTER TABLE `dayzstal_eternalzone`\.`(\w+)`\s+ADD COLUMN `(\w+)`/g)].map((match) => `${match[1]}.${match[2]}`);
  assert.deepEqual(migrated.sort(), expected.sort());
  assert.equal((migration.match(/IF NOT EXISTS \(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS/g) || []).length, expected.length);
  assert.equal((migration.match(/ALGORITHM=INSTANT, LOCK=NONE/g) || []).length, expected.length);
  assert.match(migration, /USE `dayzstal_eternalzone`;/);
  assert.match(migration, /DECLARE EXIT HANDLER FOR SQLEXCEPTION/);
  assert.match(migration, /SET SESSION lock_wait_timeout = 5;/);
  assert.match(migration, /SET SESSION lock_wait_timeout = v_saved_lock_wait_timeout;/);
  assert.doesNotMatch(migration, /\b(?:DROP TABLE|DROP COLUMN|TRUNCATE|UPDATE|DELETE FROM)\b/i);
});
