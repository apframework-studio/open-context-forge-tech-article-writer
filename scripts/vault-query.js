const fs = require('node:fs');
const path = require('node:path');

function inside(root, relative) {
  if (!relative || path.isAbsolute(relative)) throw new Error(`Path is outside selected vault: ${relative}`);
  const target = path.resolve(root, relative);
  if (target !== root && !target.startsWith(`${root}${path.sep}`)) throw new Error(`Path is outside selected vault: ${relative}`);
  const real = fs.realpathSync(target);
  if (real !== root && !real.startsWith(`${root}${path.sep}`)) throw new Error(`Path is outside selected vault: ${relative}`);
  return real;
}

function layoutFor(root) {
  const profilePath = path.join(root, '.ocf', 'vault.json');
  if (fs.existsSync(profilePath)) {
    const profile = JSON.parse(fs.readFileSync(profilePath, 'utf8'));
    if (profile.format_version !== 1 || !profile.vault_id || !profile.paths?.wiki || !profile.paths?.sources) {
      throw new Error(`Unsupported vault profile: ${profilePath}`);
    }
    const wiki = inside(root, profile.paths.wiki);
    const sources = inside(root, profile.paths.sources);
    if (!fs.statSync(wiki).isDirectory() || !fs.statSync(sources).isDirectory()) throw new Error('Vault wiki or sources path is not a directory');
    return { layout: 'ocf-profile', wiki, sources, index: profile.paths.index, log: profile.paths.log };
  }
  const legacyWiki = path.join(root, '20-wiki');
  if (!fs.existsSync(legacyWiki)) throw new Error('Selected path has neither an OCF profile nor legacy 20-wiki directory');
  const wiki = inside(root, '20-wiki');
  if (!fs.statSync(wiki).isDirectory()) throw new Error('Legacy 20-wiki path is not a directory');
  const legacySources = path.join(root, '10-raw');
  const sources = fs.existsSync(legacySources) ? inside(root, '10-raw') : null;
  return { layout: 'legacy-ocf', wiki, sources };
}

function termsFor(query) {
  const normalized = query.toLocaleLowerCase();
  const terms = new Set([normalized]);
  for (const chunk of normalized.match(/[\p{Script=Han}]+|[\p{L}\p{N}]+/gu) || []) {
    if (/^[\p{Script=Han}]+$/u.test(chunk)) {
      if (chunk.length <= 2) terms.add(chunk);
      else for (let i = 0; i < chunk.length - 1; i += 1) terms.add(chunk.slice(i, i + 2));
    } else if (chunk.length > 1) terms.add(chunk);
  }
  return [...terms].filter(Boolean);
}

function markdownFiles(root, excluded) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isSymbolicLink() || entry.name.startsWith('.')) continue;
      const file = path.join(dir, entry.name);
      if (excluded.some((skip) => file === skip || file.startsWith(`${skip}${path.sep}`))) continue;
      if (entry.isDirectory()) {
        if (!['.git', '.ocf', 'node_modules', 'workspace'].includes(entry.name)) walk(file);
      } else if (entry.isFile() && /\.md$/i.test(entry.name)) files.push(file);
    }
  }
  walk(root);
  return files;
}

function queryVault({ vault, query, limit = 10, includeSources = false } = {}) {
  if (!vault || !query?.trim()) throw new Error('Both --vault and a nonempty --query are required');
  const count = Number(limit);
  if (!Number.isInteger(count) || count < 1 || count > 100) throw new Error('Limit must be an integer from 1 to 100');
  const root = fs.realpathSync(vault);
  const layout = layoutFor(root);
  const terms = termsFor(query.trim());
  const excluded = layout.sources && (layout.wiki === root || layout.sources.startsWith(`${layout.wiki}${path.sep}`)) ? [layout.sources] : [];
  const candidates = markdownFiles(layout.wiki, excluded).map((file) => ({ file, layer: 'wiki' }));
  if (includeSources && layout.sources) candidates.push(...markdownFiles(layout.sources, []).map((file) => ({ file, layer: 'source' })));
  const results = [];
  for (const candidate of candidates) {
    const relative = path.relative(root, candidate.file).split(path.sep).join('/');
    if (candidate.file === layout.index || candidate.file === layout.log || (candidate.layer === 'wiki' && ['index.md', 'log.md'].includes(path.basename(candidate.file).toLowerCase()) && path.dirname(candidate.file) === layout.wiki)) continue;
    const content = fs.readFileSync(candidate.file, 'utf8');
    const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() || path.basename(candidate.file, '.md');
    const heading = `${path.basename(candidate.file, '.md')} ${title}`.toLocaleLowerCase();
    const body = content.toLocaleLowerCase();
    const titleHits = terms.filter((term) => heading.includes(term));
    const bodyHits = terms.filter((term) => body.includes(term));
    if (!titleHits.length && !bodyHits.length) continue;
    const signals = [];
    if (titleHits.length) signals.push('title');
    if (bodyHits.length) signals.push('body');
    const score = titleHits.length * 10 + bodyHits.length + (heading.includes(query.trim().toLocaleLowerCase()) ? 20 : 0);
    results.push({ file: relative, title, layer: candidate.layer, score, signals });
  }
  results.sort((a, b) => b.score - a.score || a.file.localeCompare(b.file));
  return { vault: root, layout: layout.layout, paths: { wiki: path.relative(root, layout.wiki) || '.', sources: layout.sources ? path.relative(root, layout.sources) || '.' : null }, query: query.trim(), results: results.slice(0, count) };
}

if (require.main === module) {
  try {
    const args = {};
    for (let i = 2; i < process.argv.length; i += 1) {
      const arg = process.argv[i];
      if (arg === '--include-sources' || arg === '--json') args[arg.slice(2).replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = true;
      else if (['--vault', '--query', '--limit'].includes(arg)) args[arg.slice(2)] = process.argv[++i];
      else throw new Error(`Unknown argument: ${arg}`);
    }
    const report = queryVault(args);
    process.stdout.write(`${JSON.stringify(report, null, args.json ? 0 : 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { queryVault };
