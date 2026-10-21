const fs = require('node:fs');
const path = require('node:path');

function checkArticle({ file } = {}) {
  if (!file) throw new Error('--file is required');
  const absolute = fs.realpathSync(file);
  const root = path.dirname(absolute);
  const content = fs.readFileSync(absolute, 'utf8');
  const issues = [];
  const lines = content.split(/\r?\n/);
  const imageDefinitions = new Map();
  for (const [index, line] of lines.entries()) {
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
    }
  }
  for (const [index, line] of lines.entries()) {
    if (/\b(?:TODO|TBD)\b/i.test(line)) issues.push({ code: 'unfinished-text', line: index + 1, detail: line.trim() });
    const withoutWebUrls = line.replace(/https?:\/\/[^\s)<>]+/gi, '');
    if (/(?:^|[^\w./:-])\/(?!\/)[^\s<>)]+|[A-Za-z]:\\|file:\/\//i.test(withoutWebUrls)) issues.push({ code: 'absolute-path', line: index + 1, detail: line.trim() });
    for (const match of line.matchAll(/!\[[^\]]*\]\((<[^>]+>|[^\s)]+)(?:\s+[^)]*)?\)/g)) {
      checkImage(match[1], index + 1);
    }
    for (const match of line.matchAll(/!\[([^\]]*)\]\[([^\]]*)\]/g)) {
      const label = (match[2] || match[1]).trim().toLocaleLowerCase();
      const definition = imageDefinitions.get(label);
      if (!definition) issues.push({ code: 'missing-image-definition', line: index + 1, detail: label });
      else checkImage(definition.source, index + 1);
    }
    for (const match of line.matchAll(/!\[([^\]]+)\](?![\[(])/g)) {
      const label = match[1].trim().toLocaleLowerCase();
      const definition = imageDefinitions.get(label);
      if (!definition) issues.push({ code: 'missing-image-definition', line: index + 1, detail: label });
      else checkImage(definition.source, index + 1);
    }
  }
  return { file: absolute, ok: issues.length === 0, issues };
}

if (require.main === module) {
  try {
    const index = process.argv.indexOf('--file');
    if (index < 0 || !process.argv[index + 1]) throw new Error('Usage: node scripts/check-article.js --file <article.md> [--json]');
    const report = checkArticle({ file: process.argv[index + 1] });
    process.stdout.write(`${JSON.stringify(report, null, process.argv.includes('--json') ? 0 : 2)}\n`);
    if (!report.ok) process.exitCode = 1;
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}

module.exports = { checkArticle };
