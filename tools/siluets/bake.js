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

// "1 procedūra / 3 procedūras", "1 процедура / 3 процедуры / 5 процедур"
const lvCount = (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'procedūra' : 'procedūras'}`;
const ruCount = (n) => { const a = n % 10, b = n % 100; return `${n} ${a === 1 && b !== 11 ? 'процедура' : a >= 2 && a <= 4 && (b < 12 || b > 14) ? 'процедуры' : 'процедур'}`; };
const prices = GROUPS.map((g) => `
<details class="pg reveal">
  <summary><span class="t">${both(g.lv, g.ru)}</span><span class="s">${g.note ? both(g.note[0], g.note[1]) : both(lvCount(g.items.length), ruCount(g.items.length))}</span><span class="from">${both('no ' + eur(String(min(g))), 'от ' + eur(String(min(g))))}</span></summary>
  ${g.closed ? `<p class="closed-note">${both('Pašlaik pierakstīties nav iespējams.', 'Сейчас запись закрыта.')}</p>` : ''}
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
