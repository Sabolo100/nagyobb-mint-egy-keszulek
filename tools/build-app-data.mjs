// A weboldal (site/index.html) tartalmából előállítja az app adatfájlját (site/app/data.gen.js).
// Így a részletszövegeket, forrásokat, kérdéseket egy helyen kell karbantartani.
//   node tools/build-app-data.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const html = fs.readFileSync(path.join(root, 'site/index.html'), 'utf8');
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => decode(s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
const all = (re) => [...html.matchAll(re)];

// felugró ablakok → részletoldalak
const details = {};
for (const m of all(/<template id="m-([\w-]+)">([\s\S]*?)<\/template>/g)) {
  const body = m[2].trim();
  const title = strip((body.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || '');
  const eyebrow = strip((body.match(/<div class="eyebrow">([\s\S]*?)<\/div>/) || [])[1] || '');
  const content = body.replace(/<div class="eyebrow">[\s\S]*?<\/div>/, '').replace(/<h3>[\s\S]*?<\/h3>/, '').trim();
  details[m[1]] = { title, eyebrow, html: content };
}

// források
const sources = all(/<li id="s-([\w-]+)" data-t="([^"]*)">([\s\S]*?)<\/li>/g).map((m, i) => {
  const inner = m[3];
  const url = (inner.match(/href="([^"]+)"/) || [])[1] || '';
  const linkText = strip((inner.match(/<a [^>]*>([\s\S]*?)<\/a>/) || [])[1] || '');
  const head = strip((inner.match(/<b>([\s\S]*?)<\/b>/) || [])[1] || '');
  const text = strip(inner.replace(/<b>[\s\S]*?<\/b>/, '').replace(/<a [\s\S]*?<\/a>/, ''));
  return { id: m[1], n: i + 1, topics: m[2].split(' '), head, text, url, linkText };
});

// levélgenerátor kérdései
const letterQs = all(/<label><input type="checkbox"( checked)? value="([^"]+)"><span>([\s\S]*?)<small>([\s\S]*?)<\/small><\/span><\/label>/g)
  .map(m => ({ checked: !!m[1], value: m[2], title: strip(m[3]), sub: strip(m[4]) }));

// pedagógus ötletek
const ideas = all(/<div class="idea[^"]*"><div class="em">([\s\S]*?)<\/div><h4>([\s\S]*?)<\/h4><p>([\s\S]*?)<\/p><\/div>/g)
  .map(m => ({ em: m[1].trim(), title: strip(m[2]), text: strip(m[3]) }));

// döntéshozói keret
const checklistBlock = (html.match(/<ol class="checklist">([\s\S]*?)<\/ol>/) || [])[1] || '';
const policy = [...checklistBlock.matchAll(/<li><b>([\s\S]*?)<\/b>([\s\S]*?)<\/li>/g)].map(m => ({ title: strip(m[1]), text: strip(m[2]) }));

// „amit nem állítunk”
const claims = all(/<div class="bad">([\s\S]*?)<\/div><div class="good">([\s\S]*?)<\/div>/g).map(m => ({ bad: strip(m[1]), good: strip(m[2]) }));

// ellenérvek
const counter = all(/<details><summary>([\s\S]*?)<\/summary><div class="body">([\s\S]*?)<\/div><\/details>/g)
  .map((m, i) => ({ id: 'counter-' + (i + 1), title: strip(m[1]), html: m[2].trim() }));

const out = `/* GENERÁLT FÁJL – ne szerkeszd kézzel. Forrás: site/index.html → node tools/build-app-data.mjs */
window.APPDATA = ${JSON.stringify({ details, sources, letterQs, ideas, policy, claims, counter }, null, 1)};
`;
fs.writeFileSync(path.join(root, 'site/app/data.gen.js'), out);
console.log(`details: ${Object.keys(details).length}, sources: ${sources.length}, letterQs: ${letterQs.length}, ideas: ${ideas.length}, policy: ${policy.length}, claims: ${claims.length}, counter: ${counter.length}`);
