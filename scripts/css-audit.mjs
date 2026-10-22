import fs from 'fs';
import path from 'path';

const SRC = path.resolve(process.cwd(), 'src');

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === 'node_modules' || e.name === 'build') continue;
      walk(p, out);
    } else if (/\.(css|jsx|js)$/.test(e.name) && !/\.test\.js$/.test(e.name)) {
      out.push(p);
    }
  }
  return out;
}

const files = walk(SRC);
const rel = (p) => path.relative(SRC, p).replace(/\\/g, '/');

// 1. Map: class name -> Set of CSS files defining it (top-level selectors only)
const cssFiles = files.filter((f) => f.endsWith('.css'));
const classDefs = new Map(); // class -> Map(file -> count)
const stripComments = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
for (const f of cssFiles) {
  const content = stripComments(fs.readFileSync(f, 'utf8'));
  // Remove @keyframes bodies and selectors inside them are percentages; still fine.
  // Match class tokens in selectors: ".name" where name = [A-Za-z_][\w-]*
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = re.exec(content))) {
    const name = m[1];
    if (!classDefs.has(name)) classDefs.set(name, new Map());
    const fm = classDefs.get(name);
    fm.set(rel(f), (fm.get(rel(f)) || 0) + 1);
  }
}

// 2. Classes referenced in JSX/JS (className strings etc.)
const jsFiles = files.filter((f) => /\.(jsx|js)$/.test(f));
const classUsage = new Map(); // class -> Set of files using it
for (const f of jsFiles) {
  const content = fs.readFileSync(f, 'utf8');
  // className="... class1 class2 ..." or className={`...`} or querySelector('.x')
  const re = /className=["'`{]([^"'`}]{0,400})|querySelector(?:All)?\(\s*['"`]([^'"`]+)['"`]|classList\.(?:add|remove|toggle|contains)\(\s*['"`]([^'"`]+)['"`]/g;
  let m;
  const found = new Set();
  while ((m = re.exec(content))) {
    const raw = m[1] || m[2] || m[3] || '';
    for (const tok of raw.split(/[\s'"`]+/)) {
      if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(tok)) found.add(tok);
    }
  }
  // also catch template literal fragments like `${... ? 'cls-a' : 'cls-b'}` handled by split above
  if (found.size) {
    for (const c of found) {
      if (!classUsage.has(c)) classUsage.set(c, new Set());
      classUsage.get(c).add(rel(f));
    }
  }
}

// 3. Report per tasks CSS file
const tasksCss = cssFiles.filter((f) => rel(f).startsWith('components/admin/tasks/'));
console.log('================ PER-FILE REPORT (tasks module CSS) ================');
let m;
for (const f of tasksCss) {
  const content = stripComments(fs.readFileSync(f, 'utf8'));
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  const classes = new Set();
  while ((m = re.exec(content))) classes.add(m[1]);
  const sorted = [...classes].sort();
  // A class is "component-prefixed" if it starts with one of the known prefixes present in this file's top classes
  console.log(`\n### ${rel(f)} (${sorted.length} classes)`);
  // find classes defined in >1 css file anywhere
  const multi = sorted.filter((c) => classDefs.get(c).size > 1);
  if (multi.length) {
    console.log('  DEFINED IN MULTIPLE CSS FILES:');
    for (const c of multi) {
      const defs = [...classDefs.get(c).keys()].join(', ');
      console.log(`    .${c}  ->  ${defs}`);
    }
  }
}

console.log('\n================ GENERIC (unprefixed) CLASSES IN TASKS CSS ================');
const genericReport = [];
for (const f of tasksCss) {
  const content = stripComments(fs.readFileSync(f, 'utf8'));
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  const classes = new Set();
  while ((m = re.exec(content))) classes.add(m[1]);
  const generic = [...classes].filter(
    (c) =>
      !/^(tlx|tv2|tl|trello-board|team-perf|mov-assignment|task-pending-attachments|task-view-mode-switch|mention-comment-input|task-due-reminders-panel|task-form-modal|task-view-v2|add-task|task-receipt|taskreceipt)-/.test(c)
  );
  if (generic.length) {
    genericReport.push([rel(f), generic]);
    console.log(`\n### ${rel(f)}`);
    console.log('  ' + generic.sort().join('\n  '));
  }
}
