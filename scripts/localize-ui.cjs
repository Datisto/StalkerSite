// Read-only inventory of Ukrainian source text. Never modifies application files.
const ts = require('typescript');
const fs = require('node:fs');
const path = require('node:path');
const CYRILLIC = /[А-Яа-яІіЇїЄєҐґ]/;
const root = path.resolve(__dirname, '..');

function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    return entry.isDirectory() ? files(full) : /\.(ts|tsx)$/.test(full) ? [full] : [];
  });
}

function jsxText(value) {
  const lines = value.split(/\r\n|\n|\r/);
  let last = 0;
  lines.forEach((line, index) => { if (/[^ \t]/.test(line)) last = index; });
  return lines.map((line, index) => {
    let part = line.replace(/\t/g, ' ');
    if (index !== 0) part = part.replace(/^ +/, '');
    if (index !== lines.length - 1) part = part.replace(/ +$/, '');
    return part ? part + (index !== last ? ' ' : '') : '';
  }).join('');
}

function template(node) {
  return node.head.text + node.templateSpans.map((span, i) => `{${i}}` + span.literal.text).join('');
}

const inventory = new Map();
const parsed = files(path.join(root, 'src')).filter((file) => !file.includes(path.sep + 'i18n' + path.sep)).map((file) => {
  const source = fs.readFileSync(file, 'utf8');
  const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  function visit(node) {
    const raw = ts.isJsxText(node) ? jsxText(node.text)
      : ts.isTemplateExpression(node) ? template(node)
        : ts.isStringLiteralLike(node) ? node.text : '';
    if (CYRILLIC.test(raw)) {
      const text = raw.trim();
      const entry = inventory.get(text) || [];
      entry.push({ file: path.relative(root, file).replaceAll('\\', '/'), line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1, kind: ts.SyntaxKind[node.parent.kind] });
      inventory.set(text, entry);
    }
    ts.forEachChild(node, visit);
  }
  visit(ast);
  return { file, source, ast };
});

// Read-only inventory. Translation coverage is checked by ui-translations.test.js.
process.stdout.write(JSON.stringify([...inventory].map(([text, locations], id) => ({ id, text, locations })), null, 2));
