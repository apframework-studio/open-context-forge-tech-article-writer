const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const { updateProjectState, readProjectState } = require('../scripts/project-state');

function project(t, frontmatter) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ocf-writer-state-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(root, 'article.md'), '# 标题\n正文。\n');
  fs.writeFileSync(path.join(root, 'project.md'), `---\n${frontmatter}\n---\n\n# Project\nKeep this note.\n`);
  return root;
}

test('phase pass stores article hashes and derives public readiness', (t) => {
  const root = project(t, 'output_intent: public_article\nedit_scope: local\ncontent_status: ready\nevidence_status: ready\npublic_source_status: ready\nvisual_status: not-needed\nrender_status: not-run\neditorial_status: needs-revision');
  updateProjectState({ project: root, set: { render_status: 'passed', editorial_status: 'passed' } });
  const state = readProjectState(root).fields;
  const digest = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'article.md'))).digest('hex');
  assert.equal(state.rendered_article_sha256, digest);
  assert.equal(state.reviewed_article_sha256, digest);
  assert.equal(state.public_readiness_status, 'public-ready');
  assert.match(fs.readFileSync(path.join(root, 'project.md'), 'utf8'), /Keep this note/);
});

test('body and source changes invalidate only affected approvals', (t) => {
  const root = project(t, 'output_intent: public_article\nedit_scope: local\ncontent_status: ready\nevidence_status: ready\npublic_source_status: ready\nvisual_status: ready\nrender_status: passed\neditorial_status: passed\nrendered_article_sha256: old\nreviewed_article_sha256: old');
  updateProjectState({ project: root, change: 'body' });
  let state = readProjectState(root).fields;
  assert.equal(state.render_status, 'not-run');
  assert.equal(state.editorial_status, 'needs-revision');
  assert.equal(state.content_status, 'drafting');
  assert.equal(state.public_source_status, 'ready');
  assert.equal(state.rendered_article_sha256, '');
  updateProjectState({ project: root, change: 'sources' });
  state = readProjectState(root).fields;
  assert.equal(state.evidence_status, 'needs-review');
  assert.equal(state.public_source_status, 'needs-review');
  assert.equal(state.visual_status, 'ready');
});

test('image changes reset visual and render status', (t) => {
  const root = project(t, 'output_intent: reviewable_article\nedit_scope: local\ncontent_status: ready\nevidence_status: ready\npublic_source_status: ready\nvisual_status: ready\nrender_status: passed\neditorial_status: passed');
  updateProjectState({ project: root, change: 'images' });
  const state = readProjectState(root).fields;
  assert.equal(state.visual_status, 'in-progress');
  assert.equal(state.render_status, 'not-run');
  assert.equal(state.editorial_status, 'needs-revision');
});

test('read-only scope rejects state writes', (t) => {
  const root = project(t, 'output_intent: reviewable_article\nedit_scope: read-only\ncontent_status: ready');
  assert.throws(() => updateProjectState({ project: root, change: 'body' }), /read-only/);
  assert.throws(() => updateProjectState({ project: root, set: { content_status: 'drafting' } }), /read-only/);
});

test('writer cannot set publication status or claim live', (t) => {
  const root = project(t, 'output_intent: channel_publish\nedit_scope: local');
  assert.throws(() => updateProjectState({ project: root, set: { publication_status: 'live' } }), /Publisher/);
});

test('unknown frontmatter structure is rejected instead of discarded', (t) => {
  const root = project(t, 'output_intent: reviewable_article\nedit_scope: local\nextra:\n  nested: preserve-me');
  assert.throws(() => updateProjectState({ project: root, set: { content_status: 'ready' } }), /simple scalar/);
  assert.match(fs.readFileSync(path.join(root, 'project.md'), 'utf8'), /nested: preserve-me/);
});

test('mode change reopens sources and visual review when a diagram exists', (t) => {
  const root = project(t, 'output_intent: public_article\nedit_scope: structural\ncontent_status: ready\nevidence_status: ready\npublic_source_status: ready\nvisual_status: ready\nrender_status: passed\neditorial_status: passed');
  updateProjectState({ project: root, change: 'mode' });
  const state = readProjectState(root).fields;
  assert.equal(state.public_source_status, 'needs-review');
  assert.equal(state.visual_status, 'in-progress');
});

test('a change cannot be marked passed in the same state update', (t) => {
  const root = project(t, 'output_intent: reviewable_article\nedit_scope: local\ncontent_status: ready\nevidence_status: ready\nvisual_status: not-needed');
  assert.throws(() => updateProjectState({ project: root, change: 'body', set: { render_status: 'passed' } }), /after separate/);
});
