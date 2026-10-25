const fs = require('node:fs');
const path = require('node:path');

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

function hasPngStructure(file) {
  const bytes = fs.readFileSync(file);
  return bytes.length >= 45 && bytes.subarray(0, 8).equals(PNG_SIGNATURE)
    && bytes.toString('ascii', 12, 16) === 'IHDR'
    && bytes.readUInt32BE(16) > 0 && bytes.readUInt32BE(20) > 0
    && bytes.toString('ascii', bytes.length - 8, bytes.length - 4) === 'IEND';
}

function scanMarkdownImages(line, lineNumber, definitions, checkImage, issues) {
  let cursor = 0;
  while ((cursor = line.indexOf('![', cursor)) >= 0) {
    if (cursor > 0 && line[cursor - 1] === '\\') { cursor += 2; continue; }
    const altEnd = line.indexOf(']', cursor + 2);
    if (altEnd < 0) {
      issues.push({ code: 'invalid-image-syntax', line: lineNumber, detail: line.trim() });
      break;
    }
    const alt = line.slice(cursor + 2, altEnd);
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

function checkArticle({ file } = {}) {
  if (!file) throw new Error('--file is required');
  const absolute = fs.realpathSync(file);
  const root = path.dirname(absolute);
  const content = fs.readFileSync(absolute, 'utf8');
  const issues = [];
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
    if (/(?:^|[^\w./:-])\/(?!\/)[^\s<>)]+|[A-Za-z]:\\|file:\/\//i.test(withoutWebUrls)) issues.push({ code: 'absolute-path', line: index + 1, detail: line.trim() });
    scanMarkdownImages(line, index + 1, imageDefinitions, checkImage, issues);
    for (const match of line.matchAll(/<img\b[^>]*>/gi)) {
      const source = match[0].match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
      if (!source || !(source[1] || source[2] || source[3])) {
        issues.push({ code: 'invalid-image-syntax', line: index + 1, detail: match[0] });
      } else {
        checkImage(source[1] || source[2] || source[3], index + 1);
      }
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
