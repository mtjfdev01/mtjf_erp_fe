import fs from 'fs';
import path from 'path';

function classes(file) {
  const s = fs.readFileSync(file, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = re.exec(s))) out.add(m[1]);
  return out;
}

function allCss(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules') continue;
      allCss(p, out);
    } else if (e.name.endsWith('.css')) out.push(p);
  }
  return out;
}

const map = {};
for (const f of allCss('src')) {
  for (const c of classes(f)) (map[c] = map[c] || []).push(f.split(path.sep).join('/'));
}

const roots = process.argv.slice(2).map((r) => path.resolve(r));
const rootSet = new Set(roots);
const owned = [];
const elsewhere = [];
for (const root of roots) {
  for (const c of classes(root)) {
    const others = (map[c] || []).filter((f) => !rootSet.has(path.resolve(f)));
    if (others.length === 0) owned.push(c);
    else elsewhere.push(`${c}  ->  ${[...new Set(others)].join(', ')}`);
  }
}
console.log(`OWNED (only in given roots): ${owned.length}`);
console.log(`ALSO DEFINED ELSEWHERE (${elsewhere.length}):`);
for (const e of [...new Set(elsewhere)].sort()) console.log('  ' + e);
