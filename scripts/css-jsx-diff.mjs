import fs from 'fs';
import path from 'path';

const root = path.resolve(process.cwd(), 'src');
const rel = (p) => path.relative(root, p);

function classTokensInCss(file) {
  const s = fs.readFileSync(path.join(root, file), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const out = new Set();
  const re = /\.([A-Za-z_][A-Za-z0-9_-]*)/g;
  let m;
  while ((m = re.exec(s))) out.add(m[1]);
  return out;
}

function classTokensInJsx(file) {
  const s = fs.readFileSync(path.join(root, file), 'utf8');
  const out = new Set();
  // className="..." className={`...`} plus template fragments and ternaries inside
  const re = /className=\{?["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(s))) {
    for (const tok of m[1].split(/\s+/)) {
      if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(tok)) out.add(tok);
    }
  }
  return out;
}

const [cssFile, jsxFile] = process.argv.slice(2);
const css = classTokensInCss(cssFile);
const jsx = classTokensInJsx(jsxFile);
console.log(`== CSS classes NOT referenced in JSX (${[...css].filter((c) => !jsx.has(c)).length}) ==`);
console.log([...css].filter((c) => !jsx.has(c)).sort().join('\n'));
console.log(`\n== JSX classes NOT defined in CSS (${[...jsx].filter((c) => !css.has(c)).length}) ==`);
console.log([...jsx].filter((c) => !css.has(c)).sort().join('\n'));
