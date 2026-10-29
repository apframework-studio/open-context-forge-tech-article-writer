const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { checkArticle } = require('../scripts/check-article');
const ONE_PIXEL_PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9cV2cAAAAASUVORK5CYII=', 'base64');

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

test('accepts a relative HTML image inside figure and ignores closing figure tags', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'assets/flow.png'), ONE_PIXEL_PNG);
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n<figure>\n<img src="./assets/flow.png" alt="流程">\n<figcaption>图 1：任务流程</figcaption>\n</figure>\n');
  assert.deepEqual(checkArticle({ file: article }).issues, []);
});

test('checks the file referenced by an HTML img element', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '<figure><img src="assets/missing.png"></figure>\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'missing-image'));
});

test('parses parentheses in a relative Markdown image destination', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'assets/flow(1).png'), ONE_PIXEL_PNG);
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![流程](assets/flow(1).png)\n');
  assert.deepEqual(checkArticle({ file: article }).issues, []);
});

test('reports malformed Markdown image syntax instead of silently skipping it', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![流程](assets/flow.png\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'invalid-image-syntax'));
});

test('rejects a PNG with invalid file structure', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(root, 'assets/broken.png'), 'not a png');
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![坏图](assets/broken.png)\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'invalid-image-file'));
});

test('rejects a local image symlink that leaves the article project', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-outside-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'assets'));
  fs.writeFileSync(path.join(outside, 'flow.svg'), '<svg xmlns="http://www.w3.org/2000/svg"></svg>');
  fs.symlinkSync(path.join(outside, 'flow.svg'), path.join(root, 'assets/flow.svg'));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![图](assets/flow.svg)\n');
  assert.ok(checkArticle({ file: article }).issues.some((issue) => issue.code === 'image-outside-project'));
});

test('does not treat fenced image examples as embedded article images', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 示例\n```html\n<img src="assets/example.png">\n![示例](assets/example.png)\n```\n正文。\n');
  assert.deepEqual(checkArticle({ file: article }).issues, []);
});

test('public intent catches internal references and unresolved public syntax outside code', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n见 [[Graphify]] 与 20-wiki/graphify.md，详见 <https://example.org/guide>。\n```md\n[[example]]\n20-wiki/example.md\n<https://example.org/code>\n```\n');
  const report = checkArticle({ file: article, intent: 'reviewable_article' });
  assert.deepEqual(new Set(report.issues.map((issue) => issue.code)), new Set(['unresolved-wikilink', 'internal-reference', 'bare-angle-url']));
  assert.ok(report.issues.every((issue) => issue.severity === 'P0'));
  assert.equal(report.counts.P0, 3);
});

test('internal note permits internal paths and wikilinks', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'note.md');
  fs.writeFileSync(article, '# 内部记录\n[[Graphify]]\n/Users/alice/vault/20-wiki/example.md\n');
  assert.equal(checkArticle({ file: article, intent: 'internal_note' }).ok, true);
});

test('project check detects stale render and editorial proof', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n正文。\n');
  fs.writeFileSync(path.join(root, 'project.md'), '---\ncontent_status: ready\nevidence_status: ready\npublic_source_status: ready\nvisual_status: not-needed\nrender_status: passed\neditorial_status: passed\nrendered_article_sha256: old\nreviewed_article_sha256: old\npublic_readiness_status: public-ready\n---\n');
  const report = checkArticle({ file: article, intent: 'public_article', project: root });
  assert.deepEqual(report.issues.filter((issue) => issue.code === 'stale-check').length, 2);
  assert.equal(report.ok, false);
});

test('public project requires public source readiness', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n正文。\n');
  fs.writeFileSync(path.join(root, 'project.md'), '---\ncontent_status: ready\nevidence_status: ready\npublic_source_status: needs-review\nvisual_status: not-needed\nrender_status: not-run\neditorial_status: needs-revision\npublic_readiness_status: public-ready\n---\n');
  const report = checkArticle({ file: article, intent: 'public_article', project: root });
  assert.ok(report.issues.some((issue) => issue.code === 'public-source-not-ready'));
  assert.ok(report.issues.some((issue) => issue.code === 'readiness-mismatch'));
});

test('public image without alt is P1 and does not block mechanical P0 result', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'image.png'), ONE_PIXEL_PNG);
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n![](image.png)\n');
  const report = checkArticle({ file: article, intent: 'reviewable_article' });
  assert.equal(report.ok, true);
  assert.ok(report.issues.some((issue) => issue.code === 'missing-image-alt' && issue.severity === 'P1'));
});

test('public readiness check requires project state', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n正文。\n');
  const report = checkArticle({ file: article, intent: 'public_article' });
  assert.ok(report.issues.some((issue) => issue.code === 'missing-project-state' && issue.severity === 'P0'));
  assert.equal(report.ok, false);
});

test('a passed state requires review records for the current project', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-article-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const article = path.join(root, 'article.md');
  fs.writeFileSync(article, '# 标题\n正文。\n');
  const digest = require('node:crypto').createHash('sha256').update(fs.readFileSync(article)).digest('hex');
  fs.writeFileSync(path.join(root, 'project.md'), `---\ncontent_status: ready\nevidence_status: ready\npublic_source_status: not-run\nvisual_status: not-needed\nrender_status: passed\neditorial_status: passed\nrendered_article_sha256: ${digest}\nreviewed_article_sha256: ${digest}\npublic_readiness_status: article-ready\n---\n`);
  const report = checkArticle({ file: article, intent: 'reviewable_article', project: root });
  assert.equal(report.issues.filter((issue) => issue.code === 'missing-review-record').length, 2);
});
