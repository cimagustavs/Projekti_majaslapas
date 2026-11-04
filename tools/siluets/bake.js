// Renders the price list and the course cards from demos/siluets/data.js into index.html,
// so both are in the page for visitors without JavaScript and for search engines.
// Usage: node tools/siluets/bake.js demos/siluets
const fs = require('fs');
const path = require('path');
const dir = path.resolve(process.argv[2]);
require(path.join(dir, 'data.js'));
const { GROUPS, COURSES } = globalThis.SILUETS;

const both = (lv, ru) => `<span data-l="lv">${lv}</span><span data-l="ru" lang="ru">${ru}</span>`;
const num = (s) => s.split('–').map((x) => { const v = parseFloat(x); return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','); }).join('–');
const eur = (s) => num(s) + ' €';
const min = (g) => Math.min(...g.items.filter((it) => !/Abonements|Kostīms|kopā ar/.test(it[0])).map((it) => parseFloat(it[2])));

const prices = GROUPS.map((g) => `
<details class="pg reveal">
  <summary><span class="t">${both(g.lv, g.ru)}</span><span class="s">${g.note ? both(g.note[0], g.note[1]) : both(g.items.length + ' procedūras', g.items.length + ' процедур')}</span><span class="from">${both('no ' + eur(String(min(g))), 'от ' + eur(String(min(g))))}</span></summary>
  ${g.closed ? `<p class="closed-note">${both('Uz doto brīdi pierakstīties nav iespējams.', 'На данный момент записаться нет возможности.')}</p>` : ''}
  <ul>${g.items.map((it) => `<li><span>${both(it[0], it[1])}</span><b>${eur(it[2])}</b></li>`).join('')}</ul>
</details>`).join('');

const courses = COURSES.map(([gid, single, course, n]) => {
  const g = GROUPS.find((x) => x.id === gid);
  const one = parseFloat(g.items[single][2]), total = parseFloat(g.items[course][2]);
  const full = one * n, save = full - total, pct = Math.round((save / full) * 100);
  return `
<article class="course reveal">
  <span class="save">−${pct}%</span>
  <h3>${both(g.lv, g.ru)}</h3>
  <p class="calc">${both(`${g.items[single][0]}, ${n} reizes`, `${g.items[single][1]}, ${n} раз`)}</p>
  <p class="price">${eur(String(total))}</p>
  <p class="calc"><s>${eur(String(full))}</s> · ${both(`ietaupi ${eur(String(save))}`, `экономия ${eur(String(save))}`)} · ${both(`${num(String(total / n))} € par reizi`, `${num(String(total / n))} € за раз`)}</p>
</article>`;
}).join('');

const p = path.join(dir, 'index.html');
let html = fs.readFileSync(p, 'utf8');
html = html.replace(/<!--prices-->[\s\S]*?<!--\/prices-->/, `<!--prices-->${prices}\n<!--/prices-->`);
html = html.replace(/<!--courses-->[\s\S]*?<!--\/courses-->/, `<!--courses-->${courses}\n<!--/courses-->`);
fs.writeFileSync(p, html);
console.log('baked', GROUPS.length, 'price groups and', COURSES.length, 'courses');
