// A prezentáció (site/prezentacio.html) előállítása.
// A diák HTML-je a tools/deck/slides/*.html fájlokban él; a részletező ablakok és a forráslista
// a weboldalból (site/index.html) generálódnak, így a két forma tartalma egy helyen karbantartható.
//   node tools/build-deck.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const page = read('site/index.html');
const decode = s => s.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&');
const strip = s => decode(s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const all = re => [...page.matchAll(re)];

/* ---------- a weboldal részletező ablakai (változtatás nélkül) ---------- */
const templates = all(/<template id="m-([\w-]+)">([\s\S]*?)<\/template>/g).map(m => ({ id: m[1], html: m[2].trim() }));

/* ---------- forráslista ---------- */
const sources = all(/<li id="s-([\w-]+)" data-t="([^"]*)">([\s\S]*?)<\/li>/g).map(m => ({ id: m[1], t: m[2], html: m[3].trim() }));

/* ---------- generált ablakok: szülők, pedagógusok, döntéshozók, ellenérvek ---------- */
const letterQs = all(/<label><input type="checkbox"( checked)? value="([^"]+)"><span>([\s\S]*?)<small>([\s\S]*?)<\/small><\/span><\/label>/g)
  .map(m => ({ title: strip(m[3]), sub: strip(m[4]) }));
const ideas = all(/<div class="idea[^"]*"><div class="em">([\s\S]*?)<\/div><h4>([\s\S]*?)<\/h4><p>([\s\S]*?)<\/p><\/div>/g)
  .map(m => ({ em: m[1].trim(), title: strip(m[2]), text: strip(m[3]) }));
const feedback = strip((page.match(/<div class="hi">Visszajelzés:<\/div><div><p>([\s\S]*?)<\/p>/) || [])[1] || '');
const checklist = [...((page.match(/<ol class="checklist">([\s\S]*?)<\/ol>/) || [])[1] || '').matchAll(/<li><b>([\s\S]*?)<\/b>([\s\S]*?)<\/li>/g)]
  .map(m => ({ title: strip(m[1]), text: strip(m[2]) }));
const counters = all(/<details><summary>([\s\S]*?)<\/summary><div class="body">([\s\S]*?)<\/div><\/details>/g)
  .map((m, i) => ({ n: i + 1, title: strip(m[1]), html: m[2].trim() }));

const gen = [];
gen.push({ id: 'c-szulo', html:
  `<div class="eyebrow">Szülőknek · levélgenerátor</div><h3>Mit kérdezz az iskolától?</h3>
  <p>Ezeket a kérdéseket érdemes feltenni egy tabletes, gamifikált alkalmazás bevezetése előtt. A „Levél az iskolának” dián ki is választhatod őket, és elkészül a levél.</p>
  <ol class="q-ol">${letterQs.map(q => `<li><b>${esc(q.title)}</b><small>${esc(q.sub)}</small></li>`).join('')}</ol>` });
gen.push({ id: 'c-tanar', html:
  `<div class="eyebrow">Pedagógusoknak</div><h3>A játék nem ellenség.</h3>
  <p><b>A képernyős, gyűjtögetős jutalomhurok az.</b> Íme hat bevált, analóg módszer, amely játékos, mégis a megértést jutalmazza.</p>
  <div class="idea-grid">${ideas.map(i => `<div class="idea"><div class="em">${i.em}</div><h4>${esc(i.title)}</h4><p>${esc(i.text)}</p></div>`).join('')}</div>
  <div class="k-box blue"><b>Visszajelzés:</b> ${esc(feedback)}</div>` });
gen.push({ id: 'c-dontes', html:
  `<div class="eyebrow">Döntéshozóknak</div><h3>„Analóg először – digitális kivételként”</h3>
  <p>Egy védhető szakpolitikai keret 7–14 éves korra:</p>
  <ol class="q-ol q-ol--num">${checklist.map(c => `<li><b>${esc(c.title)}</b> ${esc(c.text)}</li>`).join('')}</ol>` });
counters.forEach(c => gen.push({ id: 'a-' + c.n, html: `<div class="eyebrow">Ellenérv és válaszunk</div><h3>${esc(c.title)}</h3>${c.html}` }));

/* ---------- diák ---------- */
const slideDir = path.join(root, 'tools/deck/slides');
const files = fs.readdirSync(slideDir).filter(f => f.endsWith('.html')).sort();
const total = files.length;
const ids = new Set();
const slideHtml = files.map((f, i) => {
  let h = fs.readFileSync(path.join(slideDir, f), 'utf8').trim();
  const open = h.match(/^<section\b([^>]*)>/);
  if (!open) throw new Error(f + ': a fájlnak <section class="slide …"> elemmel kell kezdődnie');
  const id = (open[1].match(/data-id="([^"]+)"/) || [])[1];
  if (!id) throw new Error(f + ': hiányzik a data-id');
  if (ids.has(id)) throw new Error(f + ': ismétlődő data-id: ' + id);
  ids.add(id);
  const k = (open[1].match(/data-k="([^"]*)"/) || [])[1] || '';
  h = h.replace(/^<section\b/, `<section id="slide-${id}" data-n="${i + 1}"`);
  if (!/data-nofoot/.test(open[1])) {
    h = h.replace(/<\/section>\s*$/, `  <div class="s-foot"><span>${k}</span><span class="s-num">${String(i + 1).padStart(2, '0')} / ${total}</span></div>\n</section>`);
  }
  return h;
}).join('\n\n');

/* ---------- a diák helyőrzői: levélkérdések, „amit nem állítunk”, ellenérvek (a weboldalról) ---------- */
const qlistHtml = (page.match(/<div class="qlist">([\s\S]*?)<\/div>/) || [])[1] || '';
const claims = all(/<div class="bad">([\s\S]*?)<\/div><div class="good">([\s\S]*?)<\/div>/g).map(m => ({ bad: m[1].trim(), good: m[2].trim() }));
const claimsHtml = claims.map((c, i) => `    <div class="bad" style="--i:${i}">${c.bad}</div><div class="good" style="--i:${i}">${c.good}</div>`).join('\n');
const countersHtml = counters.map(c => `    <button class="ca rv" style="--d:${c.n + 2}" data-open="a-${c.n}" type="button"><span class="n">${String(c.n).padStart(2, '0')}</span><b>${esc(c.title)}</b><i aria-hidden="true">→</i></button>`).join('\n')
  + `\n    <button class="ca ca--more rv" style="--d:${counters.length + 3}" data-goto="forrasok" type="button"><span class="n">✓</span><b>Minden válasz forrásokkal – a Források dián</b><i aria-hidden="true">→</i></button>`;
if (!qlistHtml || !claims.length || !counters.length) console.warn('FIGYELEM: a weboldalról nem sikerült kinyerni a levélkérdéseket / állításokat / ellenérveket');
const withPlaceholders = slideHtml
  .replace('<!--@LETTERQS@-->', () => qlistHtml.trim())
  .replace('<!--@CLAIMS@-->', () => claimsHtml)
  .replace('<!--@COUNTERS@-->', () => countersHtml);

/* ---------- QR (a PDF-ből) ---------- */
const pdf = read('pdf/osszefoglalo.html');
const qr = (pdf.match(/<a class="qr"[^>]*>(<svg[\s\S]*?<\/svg>)/) || [])[1] || '';
if (!qr) console.warn('FIGYELEM: nem található QR-kód a pdf/osszefoglalo.html-ben');

/* ---------- forrásszámok témánként ---------- */
const counts = {};
sources.forEach(s => s.t.split(' ').forEach(t => { counts[t] = (counts[t] || 0) + 1; }));

/* ---------- összeállítás ---------- */
let out = read('tools/deck/shell.html')
  .replace('<!--@SLIDES@-->', () => withPlaceholders)
  .replace('<!--@TEMPLATES@-->', [...templates, ...gen].map(t => `<template id="m-${t.id}">\n${t.html}\n</template>`).join('\n'))
  .replace('<!--@SOURCES@-->', sources.map(s => `<li id="s-${s.id}" data-t="${s.t}">${s.html}</li>`).join('\n'))
  .replace('<span id="gateCount">30</span>', `<span id="gateCount">${total}</span>`);
out = out.replace(/<!--@QR@-->/g, () => qr)
  .replace(/\{\{N_(\w+)\}\}/g, (m, k) => k === 'all' ? String(sources.length) : String(counts[k] || 0))
  .replace(/\{\{TOTAL\}\}/g, String(total));

/* ---------- ellenőrzés: hivatkozott ablakok, diák, források ---------- */
const tplIds = new Set([...templates, ...gen].map(t => 't:' + t.id));
const srcIds = new Set(sources.map(s => s.id));
const problems = [];
for (const m of out.matchAll(/data-open="([\w-]+)"/g)) if (m[1] !== 'forrasok' && !tplIds.has('t:' + m[1])) problems.push('data-open → nincs ablak: ' + m[1]);
for (const m of out.matchAll(/data-goto="([\w-]+)"/g)) if (!ids.has(m[1])) problems.push('data-goto → nincs dia: ' + m[1]);
for (const m of out.matchAll(/data-s="([^"]+)"/g)) m[1].split(',').forEach(s => { if (!srcIds.has(s.trim())) problems.push('data-s → nincs forrás: ' + s.trim()); });
if (/\{\{|<!--@/.test(out)) problems.push('kitöltetlen helyőrző maradt a kimenetben');
if (problems.length) { console.error([...new Set(problems)].join('\n')); process.exitCode = 1; }

fs.writeFileSync(path.join(root, 'site/prezentacio.html'), out);
console.log(`prezentacio.html: ${total} dia, ${templates.length} oldal-ablak + ${gen.length} generált ablak, ${sources.length} forrás`);
