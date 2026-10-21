const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkArticle } = require('../scripts/check-article');

test('reports unfinished text, machine paths and missing local images', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\nTODO: verify\n![图](assets/missing.svg)\n/Users/alice/draft.md\n');
  const report = checkArticle({ file: article });
  assert.equal(report.ok, false);
  assert.deepEqual(new Set(report.issues.map((issue) => issue.code)), new Set(['unfinished-text', 'absolute-path', 'missing-image']));
});

test('accepts a clean article with existing local image', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'assets/flow.svg'), '<svg></svg>');
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n技术判断。\n![流程图](assets/flow.svg)\n');
  assert.equal(checkArticle({ file: article }).ok, true);
});

test('catches temporary local paths and images escaping the article project', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n资料在 /private/tmp/draft.md\n![图](../secret.svg)\n');
  const codes = checkArticle({ file: article }).issues.map((issue) => issue.code);
  assert.ok(codes.includes('absolute-path'));
  assert.ok(codes.includes('image-outside-project'));
});

test('checks reference-style image targets', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![架构图][fig]\n\n[fig]: assets/missing.svg\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'missing-image'));
});

test('catches Linux mount and non-user Windows paths', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n/mnt/data/research.md\nD:\\drafts\\article.md\n');
  assert.equal(checkArticle({ file: article }).issues.filter((issue) => issue.code === 'absolute-path').length, 2);
});

test('does not mistake a web URL path for a local path', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n来源：https://example.org/var/docs/guide\n');
  assert.equal(checkArticle({ file: article }).ok, true);
});

test('checks shortcut reference images', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![架构图]\n\n[架构图]: assets/missing.svg\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'missing-image'));
});

test('detects generic absolute paths without flagging relative image directories', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets/tmp'), { recursive: true });
  fs.writeFileSync(path.join(root, 'assets/tmp/flow.svg'), '<svg></svg>');
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n/data/draft.md\n/workspace/private.md\n![图](assets/tmp/flow.svg)\n');
  assert.equal(checkArticle({ file: article }).issues.filter((issue) => issue.code === 'absolute-path').length, 2);
});
