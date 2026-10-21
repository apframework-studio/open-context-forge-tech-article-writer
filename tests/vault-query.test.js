const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { queryVault } = require('../scripts/vault-query');

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-vault-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  return root;
}

function write(root, file, content) {
  const target = path.join(root, file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
}

test('searches new vault wiki using Chinese terms and keeps raw separate', (t) => {
  const root = fixture(t);
  write(root, '.ocf/vault.json', JSON.stringify({ format_version: 1, vault_id: 'test', paths: { wiki: 'wiki', sources: 'raw/sources' } }));
  write(root, 'wiki/index.md', '# Index\nAgent 记忆');
  write(root, 'wiki/claims/context-memory.md', '# 上下文记忆\nAgent 记忆需要可追溯来源。');
  write(root, 'raw/sources/only.md', '# Agent 记忆原文');

  const report = queryVault({ vault: root, query: 'Agent 记忆' });
  assert.equal(report.layout, 'ocf-profile');
  assert.deepEqual(report.results.map((item) => item.file), ['wiki/claims/context-memory.md']);
  const withSources = queryVault({ vault: root, query: 'Agent 记忆', includeSources: true });
  assert.ok(withSources.results.some((item) => item.file === 'raw/sources/only.md' && item.layer === 'source'));
});

test('searches legacy wiki without assuming a new profile', (t) => {
  const root = fixture(t);
  write(root, '20-wiki/claims/skill.md', '# Skills 是能力包\n可以复用。');
  write(root, '10-raw/source.md', '# Skills 来源');
  const report = queryVault({ vault: root, query: 'Skills' });
  assert.equal(report.layout, 'legacy-ocf');
  assert.deepEqual(report.results.map((item) => item.file), ['20-wiki/claims/skill.md']);
});

test('rejects profile paths that escape the selected vault', (t) => {
  const root = fixture(t);
  write(root, '.ocf/vault.json', JSON.stringify({ format_version: 1, vault_id: 'test', paths: { wiki: '../other-vault', sources: 'raw/sources' } }));
  assert.throws(() => queryVault({ vault: root, query: 'test' }), /outside selected vault/);
});

test('rejects a legacy wiki symlink outside the selected vault', (t) => {
  const root = fixture(t);
  const outside = fixture(t);
  write(outside, 'claim.md', '# Secret claim');
  fs.symlinkSync(outside, path.join(root, '20-wiki'));
  assert.throws(() => queryVault({ vault: root, query: 'Secret' }), /outside selected vault/);
});

test('excludes hidden metadata from a root-wiki profile', (t) => {
  const root = fixture(t);
  write(root, '.ocf/vault.json', JSON.stringify({ format_version: 1, vault_id: 'test', paths: { wiki: '.', sources: 'raw/sources' } }));
  write(root, '.obsidian/plugins/note.md', '# Agent Memory');
  write(root, 'raw/sources/source.md', '# Agent Memory');
  write(root, 'notes/claim.md', '# Agent Memory');
  const report = queryVault({ vault: root, query: 'Agent Memory' });
  assert.deepEqual(report.results.map((item) => item.file), ['notes/claim.md']);
});
