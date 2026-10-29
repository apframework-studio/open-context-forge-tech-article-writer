const fs = require('node:fs');
const path = require('node:path');
const { readProjectState, deriveReadiness, articleDigest } = require('./project-state');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function hasPngStructure(file) {
  const bytes = fs.readFileSync(file);
  return bytes.length >= 45 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)
    && bytes.toString('ascii', 12, 16) === 'IHDR'
    && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0
    && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
}

function scanMarkdownImages(line, lineNumber, definitions, checkImage, issues, publicIntent) {
  let cursor = 0;
  while ((cursor = line.indexOf('![', cursor)) >= 0) {
    if (cursor > 0 && line[cursor - 1] === '\\') { cursor += 2; continue; }
    const altEnd = line.indexOf(']', cursor + 2);
    if (altEnd < 0) {
      issues.push({ code: 'invalid-image-syntax', line: lineNumber, detail: line.trim() });
      break;
    }
    const alt = line.slice(cursor + 2, altEnd);
    if (publicIntent && !alt.trim()) issues.push({ code: 'missing-image-alt', line: lineNumber, detail: line.trim() });
    const next = line[altEnd + 1];
    if (next === '(') {
      let depth = 1;
      let inAngle = false;
      let end = altEnd + 2;
      for (; end < line.length; end++) {
        const char = line[end];
        if (char === '\\') { end++; continue; }
        if (char === '<') inAngle = true;
        else if (char === '>') inAngle = false;
        else if (!inAngle && char === '(') depth++;
        else if (!inAngle && char === ')' && --depth === 0) break;
      }
      if (depth !== 0) {
        issues.push({ code: 'invalid-image-syntax', line: lineNumber, detail: line.trim() });
        break;
      }
      const body = line.slice(altEnd + 2, end).trim();
      const source = body.startsWith('<') ? body.slice(1, body.indexOf('>')) : body.match(/^\S+/)?.[0];
      if (!source || (body.startsWith('<') && !body.includes('>'))) {
        issues.push({ code: 'invalid-image-syntax', line: lineNumber, detail: line.trim() });
      } else {
        checkImage(source.replace(/\\([() ])/g, '$1'), lineNumber);
      }
      cursor = end + 1;
      continue;
    }
    let label = alt;
    if (next === '[') {
      const labelEnd = line.indexOf(']', altEnd + 2);
      if (labelEnd < 0) {
        issues.push({ code: 'invalid-image-syntax', line: lineNumber, detail: line.trim() });
        break;
      }
      label = line.slice(altEnd + 2, labelEnd) || alt;
      cursor = labelEnd + 1;
    } else {
      cursor = altEnd + 1;
    }
    const key = label.trim().toLocaleLowerCase();
    const definition = definitions.get(key);
    if (!definition) issues.push({ code: 'missing-image-definition', line: lineNumber, detail: key });
    else checkImage(definition.source, lineNumber);
  }
}

function fencedCodeLines(lines) {
  const skipped = new Set();
  let fence = null;
  for (const [index, line] of lines.entries()) {
    const marker = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (fence) {
      skipped.add(index);
      if (marker && marker[1][0] === fence.char && marker[1].length >= fence.length
        && line.slice(marker[0].length).trim() === '') fence = null;
    } else if (marker) {
      skipped.add(index);
      fence = { char: marker[1][0], length: marker[1].length };
    }
  }
  return skipped;
}

function checkArticle({ file, intent = 'reviewable_article', project } = {}) {
  if (!file) throw new Error('--file is required');
  if (!['internal_note', 'reviewable_article', 'public_article', 'channel_publish'].includes(intent)) throw new Error(`Unknown output intent: ${intent}`);
  const publicIntent = intent !== 'internal_note';
  const absolute = fs.realpathSync(file);
  const root = path.dirname(absolute);
  const content = fs.readFileSync(absolute, 'utf8');
  const issues = [];
  if (['public_article', 'channel_publish'].includes(intent) && !project) {
    issues.push({ code: 'missing-project-state', detail: '--project is required to verify public readiness' });
  }
  const lines = content.split(/\r?\n/);
  const codeLines = fencedCodeLines(lines);
  const imageDefinitions = new Map();
  for (const [index, line] of lines.entries()) {
    if (codeLines.has(index)) continue;
    const definition = line.match(/^\s{0,3}\[([^\]]+)\]:\s*(<[^>]+>|\S+)/);
    if (definition) imageDefinitions.set(definition[1].trim().toLocaleLowerCase(), { source: definition[2], line: index + 1 });
  }
  function checkImage(source, lineNumber) {
    const destination = source.replace(/^<|>$/g, '').split('#')[0].split('?')[0];
    if (/^(https?:|data:)/i.test(destination)) return;
    let decoded;
    try { decoded = decodeURIComponent(destination); }
    catch { issues.push({ code: 'invalid-image-path', line: lineNumber, detail: destination }); return; }
    const target = path.resolve(root, decoded);
    if (target !== root && !target.startsWith(`${root}${path.sep}`)) {
      issues.push({ code: 'image-outside-project', line: lineNumber, detail: destination });
    } else if (!fs.existsSync(target)) {
      issues.push({ code: 'missing-image', line: lineNumber, detail: destination });
    } else {
      const resolved = fs.realpathSync(target);
      if (resolved !== root && !resolved.startsWith(`${root}${path.sep}`)) {
        issues.push({ code: 'image-outside-project', line: lineNumber, detail: destination });
      } else if (!fs.statSync(resolved).isFile() || (path.extname(resolved).toLowerCase() === '.png' && !hasPngStructure(resolved))) {
        issues.push({ code: 'invalid-image-file', line: lineNumber, detail: destination });
      }
    }
  }
  for (const [index, line] of lines.entries()) {
    if (codeLines.has(index)) continue;
    if (/\b(?:TODO|TBD)\b/i.test(line)) issues.push({ code: 'unfinished-text', line: index + 1, detail: line.trim() });
    const withoutWebUrls = line.replace(/https?:\/\/[^\s)<>]+/gi, '').replace(/<\/[A-Za-z][^>]*>/g, '');
    if (publicIntent && /(?:^|[^\w./:-])\/(?!\/)[^\s<>)]+|[A-Za-z]:\\|file:\/\//i.test(withoutWebUrls)) issues.push({ code: 'absolute-path', line: index + 1, detail: line.trim() });
    if (publicIntent) {
      if (/\[\[[^\]]+\]\]/.test(line)) issues.push({ code: 'unresolved-wikilink', line: index + 1, detail: line.trim() });
      if (/(?:^|[\s(<\["'])\.?\/?(?:00-system|10-raw|20-wiki|\.ocf|workspace|notes|artifacts)\//i.test(line) || /source[ -]fingerprint/i.test(line)) {
        issues.push({ code: 'internal-reference', line: index + 1, detail: line.trim() });
      }
      if (/<https?:\/\/[^>]+>/i.test(line)) issues.push({ code: 'bare-angle-url', line: index + 1, detail: line.trim() });
    }
    scanMarkdownImages(line, index + 1, imageDefinitions, checkImage, issues, publicIntent);
    for (const match of line.matchAll(/<img\b[^>]*>/gi)) {
      const source = match[0].match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!source || !(source[1] || source[2] || source[3])) {
        issues.push({ code: 'invalid-image-syntax', line: index + 1, detail: match[0] });
      } else {
        checkImage(source[1] || source[2] || source[3], index + 1);
        if (publicIntent && !/\balt\s*=\s*(?:"[^"]+"|'[^']+'|[^\s>]+)/i.test(match[0])) {
          issues.push({ code: 'missing-image-alt', line: index + 1, detail: match[0] });
        }
      }
    }
  }
  if (project) {
    const projectState = readProjectState(project);
    const projectRoot = path.dirname(projectState.file);
    const state = projectState.fields;
    const expectedArticle = path.join(projectRoot, 'article.md');
    if (!fs.existsSync(expectedArticle) || absolute !== fs.realpathSync(expectedArticle)) {
      issues.push({ code: 'article-project-mismatch', detail: 'checked file differs from project article.md' });
    }
    if (state.output_intent && state.output_intent !== intent) issues.push({ code: 'intent-mismatch', detail: `${state.output_intent} != ${intent}` });
    if (['public_article', 'channel_publish'].includes(intent) && state.public_source_status !== 'ready') {
      issues.push({ code: 'public-source-not-ready', detail: state.public_source_status || 'missing' });
    }
    if (['public_article', 'channel_publish'].includes(intent) && state.public_source_status === 'ready'
      && !fs.existsSync(path.join(projectRoot, 'notes/public-source-map.md'))) {
      issues.push({ code: 'missing-source-map', detail: 'notes/public-source-map.md' });
    }
    if (state.public_readiness_status !== deriveReadiness(state)) {
      issues.push({ code: 'readiness-mismatch', detail: `${state.public_readiness_status || 'missing'} != ${deriveReadiness(state)}` });
    }
    const digest = fs.existsSync(expectedArticle) ? articleDigest(project) : null;
    if (state.render_status === 'passed' && state.rendered_article_sha256 !== digest) {
      issues.push({ code: 'stale-check', detail: 'rendered_article_sha256 does not match article.md' });
    }
    if (state.editorial_status === 'passed' && state.reviewed_article_sha256 !== digest) {
      issues.push({ code: 'stale-check', detail: 'reviewed_article_sha256 does not match article.md' });
    }
    if (state.render_status === 'passed' && !fs.existsSync(path.join(projectRoot, 'review/render-check.md'))) {
      issues.push({ code: 'missing-review-record', detail: 'review/render-check.md' });
    }
    if (state.editorial_status === 'passed' && !fs.existsSync(path.join(projectRoot, 'review/editorial-review.md'))) {
      issues.push({ code: 'missing-review-record', detail: 'review/editorial-review.md' });
    }
    if (state.visual_status === 'not-needed' && /!\[[^\]]*\]\s*(?:\(|\[)|<img\b/i.test(lines.filter((_, i) => !codeLines.has(i)).join('\n'))) {
      issues.push({ code: 'visual-status-mismatch', detail: 'article has images while visual_status is not-needed' });
    }
  }
  const counts = { P0: 0, P1: 0, P2: 0, INFO: 0 };
  for (const issue of issues) {
    issue.severity = issue.code === 'missing-image-alt' ? 'P1' : 'P0';
    counts[issue.severity]++;
  }
  return { file: absolute, intent, ok: counts.P0 === 0, counts, issues };
}

if (require.main === module) {
  try {
    const index = process.argv.indexOf('--file');
    if (index < 0 || !process.argv[index + 1]) throw new Error('Usage: node scripts/check-article.js --file <article.md> [--intent <intent>] [--project <dir>] [--json]');
    const option = (flag) => { const i = process.argv.indexOf(flag); return i < 0 ? undefined : process.argv[i + 1]; };
    const report = checkArticle({ file: process.argv[index + 1], intent: option('--intent'), project: option('--project') });
    process.stdout.write(`${JSON.stringify(report, null, process.argv.includes('--json') ? 0 : 2)}\n`);
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { checkArticle };
