const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const { GROUPS, ZONES, OPEN, PHONE } = window.SILUETS;
const L = () => (root.lang === 'ru' ? 1 : 0);
const both = (lv, ru) => `<span data-l="lv">${lv}</span><span data-l="ru" lang="ru">${ru}</span>`;
const eur = (s) => s.split('–').map((x) => { const v = parseFloat(x); return Number.isInteger(v) ? String(v) : v.toFixed(2).replace('.', ','); }).join('–') + ' €';
const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

document.querySelectorAll('.dot').forEach((d, i) => d.style.setProperty('--i', i));

/* ---------- zone picker ---------- */

const panel = document.getElementById('zone-panel');
const zoneFill = document.querySelectorAll('.zone-fill ellipse');
const dots = document.querySelectorAll('.dot');
let zone = null;

function itemsForZone(z) {
  const out = [];
  for (const g of GROUPS) {
    if (!g.zone.includes(z)) continue;
    g.items.forEach((it, idx) => {
      const itemZone = it[4];
      if (itemZone && itemZone !== z) return;
      if (/Abonements|Kostīms|kopā ar/.test(it[0])) return;
      out.push({ g, it, idx });
    });
  }
  return out;
}

function renderZone() {
  if (!zone) return;
  const Z = ZONES[zone];
  const rows = itemsForZone(zone).map(({ g, it, idx }) => `
    <li>
      <span class="n">${both(it[0], it[1])}</span>
      <span class="g">${both(g.lv, g.ru)}${g.closed ? ` · <span class="closed">${both('pieraksts slēgts', 'запись закрыта')}</span>` : ''}</span>
      <span class="pr">${eur(it[2])}</span>
    </li>`).join('');
  panel.innerHTML = `
    <div class="zp-head"><h3>${both(Z.lv, Z.ru)}</h3><p>${both(Z.blurb[0], Z.blurb[1])}</p></div>
    <ul class="zp-list">${rows}</ul>
    <div class="zp-actions">
      <a class="btn btn-solid" href="#pieraksts" data-book-zone="${zone}">${both('Pierakstīties', 'Записаться')}</a>
      <a class="btn btn-line" href="tel:${PHONE}">${both('Pajautāt pa tālruni', 'Спросить по телефону')}</a>
    </div>`;
  panel.classList.remove('show'); void panel.offsetWidth; panel.classList.add('show');
}

function pickZone(z) {
  zone = z;
  dots.forEach((d) => { d.classList.toggle('on', d.dataset.zone === z); d.setAttribute('aria-pressed', d.dataset.zone === z); });
  zoneFill.forEach((e) => e.classList.toggle('on', e.dataset.zone === z));
  renderZone();
  if (innerWidth < 900) panel.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'nearest' });
}
dots.forEach((d) => d.addEventListener('click', () => pickZone(d.dataset.zone)));

/* ---------- before / after ---------- */

const ba = document.querySelector('.ba');
ba.querySelector('.ba-range').addEventListener('input', (e) => ba.style.setProperty('--cut', e.target.value));

/* ---------- open now ---------- */

const statusEl = document.querySelector('[data-status]');
function status() {
  const now = new Date(), d = now.getDay(), h = OPEN[d], mins = now.getHours() * 60 + now.getMinutes();
  const open = h && mins >= h[0] * 60 && mins < h[1] * 60;
  statusEl.classList.toggle('open', !!open);
  if (open) { statusEl.innerHTML = both(`Tagad atvērts, līdz ${h[1]}:00`, `Сейчас открыто, до ${h[1]}:00`); return; }
  let k = 0, nd;
  do { k++; nd = (d + k) % 7; } while (!OPEN[nd] && k < 8);
  if (h && mins < h[0] * 60) { nd = d; k = 0; }
  const name = [['svētdien', 'в воскресенье'], ['pirmdien', 'в понедельник'], ['otrdien', 'во вторник'], ['trešdien', 'в среду'], ['ceturtdien', 'в четверг'], ['piektdien', 'в пятницу'], ['sestdien', 'в субботу']][nd];
  const when = k === 0 ? ['šodien', 'сегодня'] : k === 1 ? ['rīt', 'завтра'] : name;
  statusEl.innerHTML = both(`Slēgts. Atveram ${when[0]} ${OPEN[nd][0]}:00`, `Закрыто. Откроемся ${when[1]} в ${OPEN[nd][0]}:00`);
}
status();
setInterval(status, 60000);

/* ---------- booking (demo: nothing is sent) ---------- */

const MONTH = { lv: ['jan', 'feb', 'mar', 'apr', 'mai', 'jūn', 'jūl', 'aug', 'sep', 'okt', 'nov', 'dec'], ru: ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'] };
const MONTH_FULL = { lv: ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'], ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'] };
const WD = { lv: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] };
const WD_FULL = { lv: ['svētdien', 'pirmdien', 'otrdien', 'trešdien', 'ceturtdien', 'piektdien', 'sestdien'], ru: ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'] };

const form = document.getElementById('book');
const chips = document.getElementById('grp-chips');
const svcList = document.getElementById('svc-list');
const daysEl = document.getElementById('days');
const slotsEl = document.getElementById('slots');
const pickEl = document.getElementById('pick');
const ticket = document.getElementById('ticket');
const err = document.getElementById('book-error');
const steps = [...form.querySelectorAll('.bstep')];
const bk = { g: null, i: null, day: null, time: null };

// a free consultation, bookable but not in the price list (a sample: the salon has to confirm it)
const CONSULT = { id: 'konsult', lv: 'Konsultācija', ru: 'Консультация', items: [['Ādas un figūras izvērtēšana', 'Оценка кожи и фигуры', '0', 20]] };
const BOOK_GROUPS = [CONSULT, ...GROUPS];
const price = (s, l) => (parseFloat(s) ? eur(s) : l === 'ru' ? 'бесплатно' : 'bez maksas');
const bookable = BOOK_GROUPS.filter((g) => g.items.some((it) => it[3]));
chips.innerHTML = bookable.map((g) => `<button type="button" class="chip" data-g="${g.id}">${both(g.lv, g.ru)}</button>`).join('');
const groupById = (id) => BOOK_GROUPS.find((g) => g.id === id);
const item = () => groupById(bk.g).items[bk.i];
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

function renderServices() {
  chips.querySelectorAll('.chip').forEach((c) => c.classList.toggle('on', c.dataset.g === bk.g));
  if (!bk.g) { svcList.innerHTML = ''; return; }
  const g = groupById(bk.g);
  svcList.innerHTML = g.items.map((it, i) => {
    if (!it[3]) return '';
    const off = g.closed;
    return `<label class="svc${off ? ' off' : ''}"><input type="radio" name="svc" value="${i}" ${bk.i === i ? 'checked' : ''} ${off ? 'disabled' : ''}>
      <span class="n">${both(it[0], it[1])}</span>
      <span class="m">${off ? both('pieraksts slēgts', 'запись закрыта') : both(`${it[3]} min · ${price(it[2], 'lv')}`, `${it[3]} мин · ${price(it[2], 'ru')}`)}</span></label>`;
  }).join('');
}

// stable pseudo-random existing appointments per day, so the calendar looks lived-in
const blocksCache = new Map();
function blocks(day) {
  const key = iso(day);
  if (!blocksCache.has(key)) {
    let h = 2166136261;
    for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
    const [o, c] = OPEN[day.getDay()];
    const list = [];
    for (let n = 1 + Math.floor(rnd() * 3); n > 0; n--) {
      const s = o * 60 + Math.floor(rnd() * ((c - o) * 2)) * 30;
      list.push([s, s + (2 + Math.floor(rnd() * 4)) * 30]);
    }
    blocksCache.set(key, list);
  }
  return blocksCache.get(key);
}
function freeSlots(day, minutes) {
  const [o, c] = OPEN[day.getDay()];
  const now = new Date(), today = iso(day) === iso(now);
  const earliest = today ? now.getHours() * 60 + now.getMinutes() + 60 : 0;
  const out = [];
  for (let t = o * 60; t + minutes <= c * 60; t += 30) {
    const ok = t >= earliest && !blocks(day).some(([a, b]) => t < b && t + minutes > a);
    out.push({ t, ok });
  }
  return out;
}
function openDays() {
  const out = [], d = new Date(); d.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < 10 && i < 30; i++, d.setDate(d.getDate() + 1)) if (OPEN[d.getDay()]) out.push(new Date(d));
  return out;
}
function renderDays() {
  const l = root.lang;
  daysEl.innerHTML = openDays().map((d) => {
    const free = bk.i === null || freeSlots(d, item()[3]).some((x) => x.ok);
    const on = bk.day === iso(d);
    return `<button type="button" class="day${on ? ' on' : ''}" data-day="${iso(d)}" ${free ? '' : 'disabled'} aria-pressed="${on}">
      <span class="w">${both(WD.lv[d.getDay()], WD.ru[d.getDay()])}</span><span class="d">${d.getDate()}</span><span class="mo">${both(MONTH.lv[d.getMonth()], MONTH.ru[d.getMonth()])}</span></button>`;
  }).join('');
}
function renderSlots() {
  if (!bk.day || bk.i === null) { slotsEl.innerHTML = ''; return; }
  slotsEl.innerHTML = freeSlots(new Date(bk.day + 'T00:00'), item()[3]).map((x, i) =>
    `<button type="button" class="slot${bk.time === x.t ? ' on' : ''}" data-time="${x.t}" style="--i:${i}" ${x.ok ? '' : 'disabled'}>${hm(x.t)}</button>`).join('');
}
function dateText(l) {
  const d = new Date(bk.day + 'T00:00');
  return l === 'lv' ? `${WD_FULL.lv[d.getDay()]}, ${d.getDate()}. ${MONTH_FULL.lv[d.getMonth()]}` : `${WD_FULL.ru[d.getDay()]}, ${d.getDate()} ${MONTH_FULL.ru[d.getMonth()]}`;
}
function renderPick() {
  if (bk.time === null) { pickEl.innerHTML = ''; return; }
  const it = item();
  pickEl.innerHTML = `<b>${both(it[0], it[1])}</b>, ${both(dateText('lv'), dateText('ru'))}, ${hm(bk.time)}–${hm(bk.time + it[3])}`;
}
function unlock() {
  const reached = [true, bk.i !== null, !!bk.day, bk.time !== null];
  steps.forEach((el, i) => { el.classList.toggle('locked', !reached[i]); el.disabled = !reached[i]; });
}
function refresh() { renderServices(); renderDays(); renderSlots(); renderPick(); unlock(); }
const near = (el) => { if (innerWidth < 900) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); };

chips.addEventListener('click', (e) => {
  const c = e.target.closest('.chip'); if (!c) return;
  bk.g = c.dataset.g; bk.i = null; bk.time = null;
  refresh();
});
svcList.addEventListener('change', (e) => {
  bk.i = +e.target.value; bk.time = null;
  if (bk.day && !freeSlots(new Date(bk.day + 'T00:00'), item()[3]).some((x) => x.ok)) bk.day = null;
  refresh(); near(steps[1]);
});
daysEl.addEventListener('click', (e) => {
  const b = e.target.closest('.day'); if (!b || b.disabled) return;
  bk.day = b.dataset.day; bk.time = null; refresh(); near(steps[2]);
});
slotsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.slot'); if (!b || b.disabled) return;
  bk.time = +b.dataset.time; refresh(); near(steps[3]);
});

// "Pierakstīties" in the zone panel opens the booking on that zone's first bookable group
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-book-zone]'); if (!a) return;
  const first = itemsForZone(a.dataset.bookZone).find(({ g, it }) => !g.closed && it[3]);
  if (first) { bk.g = first.g.id; bk.i = first.idx; bk.day = null; bk.time = null; ticket.hidden = true; form.hidden = false; refresh(); }
});

// "Pieteikties konsultācijai" opens the booking with the consultation already picked
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-book-group]'); if (!a) return;
  bk.g = a.dataset.bookGroup; bk.i = 0; bk.day = null; bk.time = null; ticket.hidden = true; form.hidden = false; refresh();
});

/* ---------- gift card (demo: ordered by phone or in the salon) ---------- */

const gift = document.querySelector('.gift');
if (gift) {
  const amount = gift.querySelector('[data-gift-amount]'), what = gift.querySelector('[data-gift-what]');
  gift.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gift]'); if (!b) return;
    gift.querySelectorAll('[data-gift]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    amount.textContent = b.dataset.gift + ' €';
    what.innerHTML = b.dataset.giftLv ? both(b.dataset.giftLv, b.dataset.giftRu) : both('jebkurai procedūrai', 'на любую процедуру');
  });
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = form.elements.vards.value.trim(), phone = form.elements.talr.value.replace(/[^\d+]/g, '');
  err.innerHTML = '';
  if (name.length < 2) { err.innerHTML = both('Ierakstiet savu vārdu.', 'Напишите своё имя.'); form.elements.vards.focus(); return; }
  if (phone.replace('+', '').length < 8) { err.innerHTML = both('Ierakstiet tālruni, lai varam apstiprināt.', 'Напишите телефон, чтобы мы могли подтвердить.'); form.elements.talr.focus(); return; }
  const it = item(), g = groupById(bk.g);
  const row = (a, b, v) => `<div><dt>${both(a, b)}</dt><dd>${v}</dd></div>`;
  document.getElementById('ticket-rows').innerHTML =
    row('Procedūra', 'Процедура', both(`${g.lv}: ${it[0]}`, `${g.ru}: ${it[1]}`)) +
    row('Laiks', 'Время', both(`${dateText('lv')}, ${hm(bk.time)}`, `${dateText('ru')}, ${hm(bk.time)}`)) +
    row('Cena', 'Цена', both(price(it[2], 'lv'), price(it[2], 'ru'))) +
    row('Kur', 'Где', 'Raiņa iela 18, Jelgava') +
    row('Vārds', 'Имя', name.replace(/[<>&]/g, ''));
  form.hidden = true; ticket.hidden = false;
  ticket.classList.remove('show'); void ticket.offsetWidth; ticket.classList.add('show');
  ticket.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
});
document.getElementById('again').addEventListener('click', () => {
  Object.assign(bk, { g: null, i: null, day: null, time: null }); form.reset(); form.hidden = false; ticket.hidden = true; refresh();
});
document.getElementById('ics').addEventListener('click', () => {
  const it = item(), stamp = (m) => bk.day.replace(/-/g, '') + 'T' + hm(m).replace(':', '') + '00';
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Siluets demo//LV', 'BEGIN:VEVENT', `UID:${Date.now()}@siluets-demo`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`, `DTSTART:${stamp(bk.time)}`, `DTEND:${stamp(bk.time + it[3])}`,
    `SUMMARY:Siluets: ${it[L()]}`, 'LOCATION:Raiņa iela 18\\, Jelgava', `DESCRIPTION:${PHONE}`, 'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'siluets-pieraksts.ics' });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
refresh();

/* ---------- reveal ---------- */

const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- language ---------- */

const langBtn = document.querySelector('.lang');
function setLang(l) {
  root.lang = l;
  langBtn.textContent = l === 'lv' ? 'RU' : 'LV';
  langBtn.setAttribute('aria-label', l === 'lv' ? 'Переключить на русский' : 'Pārslēgt uz latviešu valodu');
  try { localStorage.setItem('siluets-lang', l); } catch {}
}
let saved = null;
try { saved = localStorage.getItem('siluets-lang'); } catch {}
if (!saved && navigator.language?.toLowerCase().startsWith('ru')) saved = 'ru';
setLang(saved === 'ru' ? 'ru' : 'lv');
langBtn.addEventListener('click', () => setLang(root.lang === 'lv' ? 'ru' : 'lv'));
