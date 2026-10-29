const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

function projectFile(project) {
  if (!project) throw new Error('--project is required');
  const resolved = path.resolve(project);
  return fs.statSync(resolved).isDirectory() ? path.join(resolved, 'project.md') : resolved;
}

function readProjectState(project) {
  const file = projectFile(project);
  const text = fs.readFileSync(file, 'utf8');
  const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`project.md needs YAML-style scalar frontmatter: ${file}`);
  const fields = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (!line.trim()) continue;
    const item = line.match(/^([a-z][a-z0-9_]*):\s*(.*?)\s*$/);
    if (!item) throw new Error(`project.md frontmatter must use simple scalar key: value lines: ${file}`);
    fields[item[1]] = item[2].replace(/^['"]|['"]$/g, '');
  }
  return { file, text, fields, frontmatter: match[0], body: text.slice(match[0].length) };
}

function articleDigest(project) {
  const file = path.join(path.dirname(projectFile(project)), 'article.md');
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function deriveReadiness(fields) {
  if (fields.output_intent === 'internal_note') return 'internal-note';
  const articleReady = fields.content_status === 'ready'
    && fields.evidence_status === 'ready'
    && ['ready', 'not-needed'].includes(fields.visual_status)
    && fields.render_status === 'passed'
    && fields.editorial_status === 'passed';
  const sourceReady = fields.public_source_status === 'ready';
  if (articleReady && sourceReady) return 'public-ready';
  if (articleReady) return 'article-ready';
  if (sourceReady) return 'public-source-ready';
  return 'in-progress';
}

const INVALIDATIONS = {
  body: { content_status: 'drafting', editorial_status: 'needs-revision', render_status: 'not-run', reviewed_article_sha256: '', rendered_article_sha256: '' },
  sources: { evidence_status: 'needs-review', public_source_status: 'needs-review', editorial_status: 'needs-revision', reviewed_article_sha256: '' },
  images: { visual_status: 'in-progress', editorial_status: 'needs-revision', render_status: 'not-run', reviewed_article_sha256: '', rendered_article_sha256: '' },
  mode: { content_status: 'drafting', evidence_status: 'needs-review', public_source_status: 'needs-review', editorial_status: 'needs-revision', render_status: 'not-run', reviewed_article_sha256: '', rendered_article_sha256: '' },
  title: { content_status: 'drafting', editorial_status: 'needs-revision', render_status: 'not-run', reviewed_article_sha256: '', rendered_article_sha256: '' },
  summary: { content_status: 'drafting', editorial_status: 'needs-revision', render_status: 'not-run', reviewed_article_sha256: '', rendered_article_sha256: '' },
};

function updateProjectState({ project, change, set = {} } = {}) {
  const current = readProjectState(project);
  if (current.fields.edit_scope === 'read-only') throw new Error('project is read-only; no files or state may be changed');
  if (Object.hasOwn(set, 'publication_status')) throw new Error('publication_status belongs to Publisher evidence, not Writer');
  if (change && !INVALIDATIONS[change]) throw new Error(`Unknown change type: ${change}`);
  if (change && (set.render_status === 'passed' || set.editorial_status === 'passed')) {
    throw new Error('a changed article can be marked passed only after separate review and rendering steps');
  }
  const fields = { ...current.fields, ...(change ? INVALIDATIONS[change] : {}), ...set };
  if (change === 'mode' && current.fields.visual_status === 'ready') fields.visual_status = 'in-progress';
  if (fields.render_status === 'passed' && (set.render_status === 'passed' || !fields.rendered_article_sha256)) {
    fields.rendered_article_sha256 = articleDigest(project);
  }
  if (fields.editorial_status === 'passed' && (set.editorial_status === 'passed' || !fields.reviewed_article_sha256)) {
    fields.reviewed_article_sha256 = articleDigest(project);
  }
  if (fields.render_status !== 'passed') fields.rendered_article_sha256 = '';
  if (fields.editorial_status !== 'passed') fields.reviewed_article_sha256 = '';
  fields.public_readiness_status = deriveReadiness(fields);
  const frontmatter = `---\n${Object.entries(fields).map(([key, value]) => `${key}: ${value}`).join('\n')}\n---\n`;
  fs.writeFileSync(current.file, frontmatter + current.body);
  return { file: current.file, fields };
}

if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    const option = (flag) => { const index = args.indexOf(flag); return index < 0 ? undefined : args[index + 1]; };
    const set = {};
    for (let i = 0; i < args.length; i++) {
      if (args[i] !== '--set') continue;
      const pair = args[++i] || '';
      const index = pair.indexOf('=');
      if (index < 1) throw new Error('--set requires key=value');
      set[pair.slice(0, index)] = pair.slice(index + 1);
    }
    const result = updateProjectState({ project: option('--project'), change: option('--change'), set });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { readProjectState, deriveReadiness, updateProjectState, articleDigest };
