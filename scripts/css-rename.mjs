// Usage: node scripts/css-rename.mjs <mapping.json>
// mapping.json: { "files": ["path", ...], "map": { "old": "new", ... } }
// Paths are relative to src/. Applies exact class-name token replacement
// (?<![\w-])old(?![\w-]) in every listed file. Writes in place.
import fs from 'fs';
import path from 'path';

const [mappingPath] = process.argv.slice(2);
if (!mappingPath) {
  console.error('Usage: node scripts/css-rename.mjs <mapping.json>');
  process.exit(1);
}
const root = path.resolve(process.cwd(), 'src');
const { files, map } = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));

const entries = Object.entries(map).sort((a, b) => b[0].length - a[0].length);
const patterns = entries.map(([oldName, newName]) => ({
  re: new RegExp(`(?<![\\w-])${oldName}(?![\\w-])`, 'g'),
  newName,
  oldName,
}));

let total = 0;
for (const relFile of files) {
  const p = path.join(root, relFile);
  let content = fs.readFileSync(p, 'utf8');
  let count = 0;
  for (const { re, newName, oldName } of patterns) {
    content = content.replace(re, (m) => {
      count++;
      return newName;
    });
  }
  if (count > 0) {
    fs.writeFileSync(p, content);
    console.log(`${relFile}: ${count} replacements`);
    total += count;
  } else {
    console.log(`${relFile}: no matches`);
  }
}
console.log(`TOTAL: ${total}`);
