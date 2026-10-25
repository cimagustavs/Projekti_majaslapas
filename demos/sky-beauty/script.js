const root = document.documentElement;
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (k) => k * k * (3 - 2 * k);
const { TOP, HEM } = Hair.geometry;

let lastResult = null;

/* ---------- hero: frizzy hair that combs straight ---------- */

const heroSection = document.querySelector('.hero');
const heroFig = document.querySelector('.hero-hair');
const heroSvg = document.getElementById('hero-canvas');
const combEl = heroFig.querySelector('.comb');
const hero = Hair.mount(heroSvg, { n: innerWidth < 700 ? 170 : 200, pts: 30, seed: 11, reveal: reduce ? 1 : 0 });
const revealStart = performance.now();
hero.draw();

let fTarget = 1;
let touchComb = false, combIdle;
let cap = -1;
let introDone = reduce;
let sweepStart = null;
let heroVisible = true;
let heroRunning = false;
let last = performance.now();

function setCap(n) {
  if (n === cap) return;
  cap = n;
  heroFig.dataset.cap = n;
}

function combTo(svgX, svgY, width) {
  const q = hero.toScreen(svgX, svgY);
  const fig = heroFig.getBoundingClientRect();
  const x = q.x - fig.left, y = q.y - fig.top;
  const w = width || combEl.offsetWidth;
  if (width) combEl.style.width = w + 'px';
  combEl.style.transform = `translate(${(x - w / 2).toFixed(1)}px, ${(y - w * 0.12).toFixed(1)}px)`;
}

// Drop detail on devices that can't keep up: measured once the opening animation is over.
function watchSpeed(hair) {
  let ema = 1 / 60, frames = 0;
  return (dt, settled) => {
    if (!settled || hair.quality >= 2) return;
    ema += (dt - ema) * 0.1;
    if (++frames > 24 && ema > 1 / 38) { hair.setQuality(hair.quality + 1); frames = 0; ema = 1 / 60; }
  };
}
const heroSpeed = watchSpeed(hero);

function heroFrame(now) {
  const rawDt = (now - last) / 1000;
  const dt = Math.min(0.05, rawDt);
  last = now;
  heroSpeed(rawDt, hero.st.reveal >= 1 && sweepStart === null);
  const st = hero.st;
  if (!reduce) st.time += dt;
  if (st.reveal < 1) st.reveal = Math.min(1, (now - revealStart) / 1600);
  st.f += (fTarget - st.f) * Math.min(1, dt * 7);

  // the brush stroke that plays once after the hair has drawn in
  if (sweepStart !== null) {
    const k = clamp((now - sweepStart) / 1500, 0, 1);
    const u = smooth(k) * 1.1;
    hero.brush(u, 1.6);
    combTo(200, TOP + Math.min(u, 1) * (HEM - TOP), 250 * hero.toScreen(0, 0).k);
    // lift the comb away before it reaches the caption under the hair
    if (k > 0.82) combEl.classList.remove('on');
    if (k >= 1) {
      sweepStart = null;
      combEl.classList.remove('on');
      combEl.style.width = '';
    }
  } else if (!hero.relax(dt, 0.4) && introDone && cap === 0) {
    setCap(1);
  }

  const sleek = 1 - st.f;
  st.shineY = 0.14 + sleek * 0.12;
  hero.draw();

  if (heroVisible) requestAnimationFrame(heroFrame);
  else heroRunning = false;
}

function startHero() {
  if (heroRunning) return;
  heroRunning = true;
  last = performance.now();
  requestAnimationFrame(heroFrame);
}

new IntersectionObserver(([e]) => {
  heroVisible = e.isIntersecting;
  if (heroVisible) startHero();
}).observe(heroSection);

function onHeroScroll() {
  const h = heroSection.offsetHeight || innerHeight;
  heroSection.style.setProperty('--p', clamp(scrollY / h, 0, 1).toFixed(4));
  const s = clamp(scrollY / (h * 0.42), 0, 1);
  fTarget = 1 - smooth(s);
  if (touchComb && s > 0.5) setTouchComb(false);
  if (touchComb) return;
  if (s > 0.55) setCap(2);
  else if (cap === 2) setCap(1);
}
addEventListener('scroll', onHeroScroll, { passive: true });
onHeroScroll();

if (reduce) {
  setCap(1);
} else {
  setTimeout(() => {
    if (cap === 2) { introDone = true; return; }
    setCap(0);
    combEl.classList.add('on');
    sweepStart = performance.now();
    introDone = true;
  }, 1900);
}

// comb with the mouse, or with a finger while scrolling
function combAt(clientX, clientY, reach = 30, hold) {
  const p = hero.toView(clientX, clientY);
  const over = p.y > TOP - 30 && p.y < HEM + 30 && p.x > 40 && p.x < 360;
  if (over) hero.comb(p.x, p.y, reach, hold);
  return { over, p };
}
if (finePointer) {
  heroFig.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' || sweepStart !== null) return;
    const { over, p } = combAt(e.clientX, e.clientY);
    heroFig.classList.toggle('combing', over);
    combEl.classList.toggle('on', over);
    if (over) combTo(p.x, p.y);
  });
  heroFig.addEventListener('pointerleave', () => {
    if (sweepStart !== null) return;
    heroFig.classList.remove('combing');
    combEl.classList.remove('on');
  });
}
heroSvg.addEventListener('touchmove', (e) => {
  if (touchComb) return;
  for (const t of e.touches) combAt(t.clientX, t.clientY);
}, { passive: true });

// Phones: the hair fills most of the first screen, so dragging on it normally scrolls the page.
// "Izķemmē pats" switches the hair into comb mode until "Gatavs" or 10 s without a touch.
const combToggle = heroFig.querySelector('.comb-toggle');
function setTouchComb(on) {
  touchComb = on;
  heroFig.classList.toggle('touch-comb', on);
  combToggle.setAttribute('aria-pressed', on);
  clearTimeout(combIdle);
  if (on) {
    if (scrollY > 0) scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setCap(3);
    combIdle = setTimeout(() => setTouchComb(false), 10000);
  } else {
    combEl.classList.remove('on');
    if (cap === 3) setCap(1);
  }
}
combToggle.addEventListener('click', () => setTouchComb(!touchComb));
function touchCombMove(e) {
  if (!touchComb || e.pointerType === 'mouse') return;
  const { over, p } = combAt(e.clientX, e.clientY, 34, 4);
  combEl.classList.toggle('on', over);
  // keep the comb just above the fingertip so it stays visible
  if (over) combTo(p.x, p.y - 18);
  clearTimeout(combIdle);
  combIdle = setTimeout(() => setTouchComb(false), 10000);
}
heroSvg.addEventListener('pointerdown', (e) => {
  if (!touchComb || e.pointerType === 'mouse') return;
  heroSvg.setPointerCapture(e.pointerId);
  touchCombMove(e);
});
heroSvg.addEventListener('pointermove', touchCombMove);
heroSvg.addEventListener('pointerup', () => combEl.classList.remove('on'));
heroSvg.addEventListener('pointercancel', () => combEl.classList.remove('on'));

/* ---------- formula quiz ---------- */

const form = document.getElementById('quiz');
const quizSvg = document.getElementById('quiz-hair');
const resultEl = document.getElementById('result');
const quizHair = Hair.mount(quizSvg, { n: 120, pts: 26, seed: 5, f: 0.95, fuzz: 70 });
const qTarget = { f: 0.95, curl: 0, shine: 0 };
let quizVisible = false, quizRunning = false, qLast = 0;

const LOOK = {
  puka: { f: 0.95, curl: 0 },
  sausi: { f: 0.75, curl: 0.15 },
  vilni: { f: 0.3, curl: 0.95 },
  blavi: { f: 0.18, curl: 0 },
};

const RESULTS = {
  keratin: {
    lv: ['Keratīna taisnošana', 'Gludi, paklausīgi mati bez pūkas, un taisnotājs var palikt plauktā.', '100 € jebkuram garumam ar kodu RUDENS'],
    ru: ['Кератиновое выпрямление', 'Гладкие, послушные волосы без пушка, а утюжок может остаться на полке.', '100 € на любую длину с кодом ОСЕНЬ'],
  },
  rekon: {
    lv: ['Matu rekonstrukcija', 'Uz balinātiem, stipri bojātiem vai sausiem matiem keratīna taisnošanu nedarām. Vispirms atjaunojam struktūru un aizpildām tukšumus matā.', 'Cena pēc konsultācijas'],
    ru: ['Реконструкция волос', 'На осветлённых, сильно повреждённых или сухих волосах кератиновое выпрямление не делаем. Сначала восстанавливаем структуру и заполняем пустоты в волосе.', 'Цена по консультации'],
  },
  gloss: {
    lv: ['Viegls pārklājums spīdumam', 'Spīdums, gludums un koptu matu sajūta, nemainot matu struktūru vairāk, nekā vajag.', 'Cena pēc konsultācijas'],
    ru: ['Лёгкое покрытие для блеска', 'Блеск, гладкость и ощущение ухоженных волос, не меняя структуру больше, чем нужно.', 'Цена по консультации'],
  },
};
const WAVE_NOTE = {
  lv: ' Ja viļņi ir viegli, var pietikt ar maigāku gludināšanu. Stingrus lokus tā neiztaisno.',
  ru: ' Если волна лёгкая, может хватить мягкого разглаживания. Тугие локоны оно не выпрямляет.',
};

function choice(name) {
  const input = form.querySelector(`input[name="${name}"]:checked`);
  return { value: input.value, label: input.parentElement.querySelector(`[data-l="${root.lang}"]`).textContent };
}

function lookFromForm() {
  const tips = choice('tips').value, kas = choice('kas').value;
  quizSvg.classList.toggle('tone-kraasoti', tips === 'kraasoti');
  quizSvg.classList.toggle('tone-balinati', tips === 'balinati');
  quizSvg.style.filter = kas === 'blavi' ? 'saturate(0.55) brightness(0.92)' : '';
  quizHair.refresh();
  Object.assign(qTarget, LOOK[kas], { shine: 0 });
}

form.addEventListener('change', () => {
  lookFromForm();
  resultEl.hidden = true;
  lastResult = null;
  startQuiz();
});

function showResult(animate) {
  const tips = choice('tips'), kas = choice('kas'), garums = choice('garums');
  const key = tips.value === 'balinati' || kas.value === 'sausi' ? 'rekon' : kas.value === 'blavi' ? 'gloss' : 'keratin';
  const [title, text, price] = RESULTS[key][root.lang];
  document.getElementById('result-title').textContent = title;
  document.getElementById('result-text').textContent = text + (key === 'keratin' && kas.value === 'vilni' ? WAVE_NOTE[root.lang] : '');
  document.getElementById('result-price').textContent = price;
  const bookLink = document.getElementById('result-book');
  bookLink.dataset.book = { keratin: 'keratins', rekon: 'rekonstrukcija', gloss: 'konsultacija' }[key];
  bookLink.dataset.note = `${tips.label}, ${kas.label}, ${garums.label}`;
  resultEl.hidden = false;
  if (animate) {
    resultEl.classList.remove('show');
    void resultEl.offsetWidth;
    resultEl.classList.add('show');
  }
  lastResult = key;
}

form.addEventListener('submit', (e) => {
  e.preventDefault();
  Object.assign(qTarget, { f: 0, curl: 0, shine: 0.85 });
  quizSvg.style.filter = '';
  showResult(true);
  startQuiz();
  if (innerWidth < 900) resultEl.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
});

const quizSpeed = watchSpeed(quizHair);
function quizFrame(now) {
  const rawDt = (now - qLast) / 1000;
  const dt = Math.min(0.05, rawDt);
  qLast = now;
  quizSpeed(rawDt, true);
  const st = quizHair.st, k = Math.min(1, dt * 3.5);
  if (!reduce) st.time += dt;
  st.f += (qTarget.f - st.f) * k;
  st.curl += (qTarget.curl - st.curl) * k;
  st.shine += (qTarget.shine - st.shine) * k;
  st.shineY = 0.3;
  quizHair.draw();
  if (quizVisible) requestAnimationFrame(quizFrame);
  else quizRunning = false;
}
function startQuiz() {
  if (quizRunning || !quizVisible) return;
  quizRunning = true;
  qLast = performance.now();
  requestAnimationFrame(quizFrame);
}
new IntersectionObserver(([e]) => {
  quizVisible = e.isIntersecting;
  startQuiz();
}).observe(quizSvg);
lookFromForm();
Object.assign(quizHair.st, qTarget);
quizHair.draw();

/* ---------- reviews arrive like messages ---------- */

const chat = document.getElementById('chat');
const msgs = [...chat.querySelectorAll('.msg')];
const typing = chat.querySelector('.typing');
if (reduce) {
  chat.classList.add('done');
} else {
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return;
    obs.disconnect();
    let i = 0;
    const next = () => {
      if (i >= msgs.length) { typing.classList.remove('on'); chat.classList.add('done'); return; }
      chat.insertBefore(typing, msgs[i]);
      typing.classList.add('on');
      setTimeout(() => {
        typing.classList.remove('on');
        msgs[i].classList.add('in');
        i++;
        setTimeout(next, 260);
      }, i === 0 ? 500 : 650);
    };
    next();
  }, { threshold: 0.25 }).observe(chat);
}

/* ---------- autumn code ---------- */

const copyBtn = document.getElementById('copy');
const copyHTML = copyBtn.innerHTML;
copyBtn.addEventListener('click', async () => {
  const code = root.lang === 'lv' ? 'RUDENS' : 'ОСЕНЬ';
  try { await navigator.clipboard.writeText(code); } catch {}
  copyBtn.innerHTML = '<span data-l="lv">Nokopēts ✓</span><span data-l="ru">Скопировано ✓</span>';
  setTimeout(() => { copyBtn.innerHTML = copyHTML; }, 2000);
});

/* ---------- reveal ---------- */

const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  });
}, { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('.reveal').forEach((el) => io.observe(el));

/* ---------- online booking (demo: nothing is sent) ---------- */

// durations and most prices are samples until the salon gives real ones
const SERVICES = [
  { id: 'keratins', lv: 'Keratīna taisnošana', ru: 'Кератиновое выпрямление', min: 180, price: { lv: '100 €', ru: '100 €' }, sample: true },
  { id: 'rekonstrukcija', lv: 'Matu rekonstrukcija', ru: 'Реконструкция волос', min: 120, price: { lv: 'no 60 €', ru: 'от 60 €' }, sample: true },
  { id: 'gludinasana', lv: 'Gludināšana vieglām lokām', ru: 'Разглаживание лёгкой волны', min: 150, price: { lv: 'no 70 €', ru: 'от 70 €' }, sample: true },
  { id: 'konsultacija', lv: 'Matu konsultācija', ru: 'Консультация по волосам', min: 20, price: { lv: 'bez maksas', ru: 'бесплатно' }, sample: true },
  { id: 'frizieris', lv: 'Griezums', ru: 'Стрижка', min: 60, price: { lv: 'no 20 €', ru: 'от 20 €' }, sample: true },
  { id: 'manikirs', lv: 'Manikīrs', ru: 'Маникюр', min: 90, price: { lv: 'no 30 €', ru: 'от 30 €' }, sample: true },
  { id: 'deepclean', lv: 'Deep Clean', ru: 'Deep Clean', min: 40, price: { lv: '35 €', ru: '35 €' }, sample: false },
  { id: 'glow', lv: 'Glow', ru: 'Glow', min: 40, price: { lv: '35 €', ru: '35 €' }, sample: false },
  { id: 'solarijs', lv: 'Solārijs', ru: 'Солярий', min: 15, price: { lv: '0,70 €/min', ru: '0,70 €/мин' }, sample: true },
];
// sample opening hours: Mon–Fri 10–19, Sat 10–16, Sun closed (index = getDay())
const OPEN = [null, [10, 19], [10, 19], [10, 19], [10, 19], [10, 19], [10, 16]];
const DAY = { lv: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'], ru: ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] };
const MONTH = {
  lv: ['janvārī', 'februārī', 'martā', 'aprīlī', 'maijā', 'jūnijā', 'jūlijā', 'augustā', 'septembrī', 'oktobrī', 'novembrī', 'decembrī'],
  ru: ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'],
};
const SAMPLE_TAG = '<small class="sample"><span data-l="lv">paraugs</span><span data-l="ru">пример</span></small>';

const bookForm = document.getElementById('book');
const svcList = document.getElementById('svc-list');
const daysEl = document.getElementById('days');
const slotsEl = document.getElementById('slots');
const pickEl = document.getElementById('pick');
const ticket = document.getElementById('ticket');
const bookError = document.getElementById('book-error');
const steps = [...bookForm.querySelectorAll('.bstep')];
const booking = { svc: null, day: null, time: null };

const pad = (n) => String(n).padStart(2, '0');
const hm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const svcById = (id) => SERVICES.find((x) => x.id === id);
function duration(min, lang) {
  const h = Math.floor(min / 60), m = min % 60;
  const hs = lang === 'lv' ? 'h' : 'ч', ms = lang === 'lv' ? 'min' : 'мин';
  return [h ? `${h} ${hs}` : '', m ? `${m} ${ms}` : ''].filter(Boolean).join(' ');
}
const both = (fn) => `<span data-l="lv">${fn('lv')}</span><span data-l="ru">${fn('ru')}</span>`;

svcList.innerHTML = SERVICES.map((x) => `
  <label class="svc">
    <input type="radio" name="svc" value="${x.id}">
    <span class="svc-name">${both((l) => x[l])}</span>
    <span class="svc-meta">${both((l) => `${duration(x.min, l)} · ${x.price[l]}`)}${x.sample ? SAMPLE_TAG : ''}</span>
  </label>`).join('');

// the next 14 days the salon is open
function openDays() {
  const out = [], d = new Date();
  d.setHours(0, 0, 0, 0);
  for (let i = 0; out.length < 12 && i < 21; i++, d.setDate(d.getDate() + 1)) {
    if (OPEN[d.getDay()]) out.push(new Date(d));
  }
  return out;
}
const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

// stable pseudo-random existing appointments per day (1–3 h blocks), so the calendar looks lived-in
const dayBlocks = new Map();
function blocks(day) {
  const key = iso(day);
  if (!dayBlocks.has(key)) {
    let h = 2166136261;
    for (const c of key) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
    const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
    const [o, c] = OPEN[day.getDay()];
    const list = [];
    for (let n = 1 + Math.floor(rnd() * 3); n > 0; n--) {
      const start = o * 60 + Math.floor(rnd() * ((c - o) * 2)) * 30;
      list.push([start, start + (2 + Math.floor(rnd() * 5)) * 30]);
    }
    dayBlocks.set(key, list);
  }
  return dayBlocks.get(key);
}
const busy = (day, minute) => blocks(day).some(([a, b]) => minute >= a && minute < b);

function freeSlots(day, svc) {
  const [o, c] = OPEN[day.getDay()];
  const now = new Date(), isToday = iso(day) === iso(now);
  const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + 60 : 0;
  const out = [];
  for (let t = o * 60; t + svc.min <= c * 60; t += 30) {
    let ok = t >= earliest;
    for (let k = t; ok && k < t + svc.min; k += 30) if (busy(day, k)) ok = false;
    out.push({ t, ok });
  }
  return out;
}

function renderDays() {
  const days = openDays();
  daysEl.innerHTML = days.map((d) => {
    const free = booking.svc ? freeSlots(d, svcById(booking.svc)).some((x) => x.ok) : true;
    return `<button type="button" class="day${booking.day === iso(d) ? ' on' : ''}" data-day="${iso(d)}" ${free ? '' : 'disabled'} aria-pressed="${booking.day === iso(d)}">
      <span class="day-w">${both((l) => DAY[l][d.getDay()])}</span><span class="day-n">${d.getDate()}</span>
      <span class="day-m">${both((l) => MONTH[l][d.getMonth()].slice(0, 3))}</span></button>`;
  }).join('');
}

function renderSlots() {
  if (!booking.day || !booking.svc) { slotsEl.innerHTML = ''; return; }
  const day = new Date(booking.day + 'T00:00');
  const list = freeSlots(day, svcById(booking.svc));
  slotsEl.innerHTML = list.map((x, i) =>
    `<button type="button" class="slot${booking.time === x.t ? ' on' : ''}" data-time="${x.t}" style="--i:${i}" ${x.ok ? '' : 'disabled'} aria-pressed="${booking.time === x.t}">${hm(x.t)}</button>`).join('');
}

function dateText(lang) {
  const d = new Date(booking.day + 'T00:00');
  const wd = lang === 'lv'
    ? ['svētdien', 'pirmdien', 'otrdien', 'trešdien', 'ceturtdien', 'piektdien', 'sestdien'][d.getDay()]
    : ['в воскресенье', 'в понедельник', 'во вторник', 'в среду', 'в четверг', 'в пятницу', 'в субботу'][d.getDay()];
  return lang === 'lv' ? `${wd}, ${d.getDate()}. ${MONTH.lv[d.getMonth()]}` : `${wd}, ${d.getDate()} ${MONTH.ru[d.getMonth()]}`;
}

function renderPick() {
  if (booking.time === null) { pickEl.innerHTML = ''; return; }
  const x = svcById(booking.svc);
  pickEl.innerHTML = both((l) => `<b>${x[l]}</b>, ${dateText(l)}, ${hm(booking.time)}–${hm(booking.time + x.min)}`);
}

function unlock() {
  const reached = [true, !!booking.svc, !!booking.day, booking.time !== null];
  steps.forEach((el, i) => {
    el.classList.toggle('locked', !reached[i]);
    el.disabled = !reached[i];
  });
}

function bringIntoView(el) {
  if (innerWidth < 900) el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
}

function chooseService(id) {
  booking.svc = id;
  bookForm.querySelector(`input[value="${id}"]`).checked = true;
  // a longer procedure may no longer fit the chosen day or time
  if (booking.day && !freeSlots(new Date(booking.day + 'T00:00'), svcById(id)).some((x) => x.ok)) booking.day = null;
  booking.time = null;
  renderDays(); renderSlots(); renderPick(); unlock();
}

svcList.addEventListener('change', (e) => {
  chooseService(e.target.value);
  bringIntoView(steps[1]);
});
daysEl.addEventListener('click', (e) => {
  const b = e.target.closest('.day');
  if (!b || b.disabled) return;
  booking.day = b.dataset.day; booking.time = null;
  renderDays(); renderSlots(); renderPick(); unlock();
  bringIntoView(steps[2]);
});
slotsEl.addEventListener('click', (e) => {
  const b = e.target.closest('.slot');
  if (!b || b.disabled) return;
  booking.time = Number(b.dataset.time);
  slotsEl.querySelectorAll('.slot').forEach((x) => { const on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); });
  renderPick(); unlock();
  bringIntoView(steps[3]);
});

// "Pierakstīties" buttons elsewhere on the page pick the service for you
document.addEventListener('click', (e) => {
  const a = e.target.closest('[data-book]');
  if (!a || !a.dataset.book) return;
  if (!ticket.hidden) resetBooking();
  chooseService(a.dataset.book);
  if (a.dataset.note) bookForm.elements.piez.value = a.dataset.note;
});

const ERR = {
  name: { lv: 'Ieraksti savu vārdu.', ru: 'Напиши своё имя.' },
  phone: { lv: 'Ieraksti tālruņa numuru, lai salons var apstiprināt.', ru: 'Напиши номер телефона, чтобы салон мог подтвердить.' },
};
bookForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = bookForm.elements.vards.value.trim(), phone = bookForm.elements.talr.value.replace(/[^\d+]/g, '');
  bookError.textContent = '';
  if (name.length < 2) { bookError.textContent = ERR.name[root.lang]; bookForm.elements.vards.focus(); return; }
  if (phone.replace('+', '').length < 8) { bookError.textContent = ERR.phone[root.lang]; bookForm.elements.talr.focus(); return; }
  booking.name = name; booking.phone = phone; booking.note = bookForm.elements.piez.value.trim();
  renderTicket();
  bookForm.hidden = true;
  ticket.hidden = false;
  ticket.classList.remove('show'); void ticket.offsetWidth; ticket.classList.add('show');
  ticket.focus({ preventScroll: true });
  ticket.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
});

function renderTicket() {
  if (ticket.hidden && !booking.name) return;
  const x = svcById(booking.svc);
  const row = (lv, ru, v) => `<div><dt>${both((l) => (l === 'lv' ? lv : ru))}</dt><dd>${v}</dd></div>`;
  document.getElementById('ticket-rows').innerHTML =
    row('Procedūra', 'Процедура', both((l) => x[l])) +
    row('Laiks', 'Время', both((l) => `${dateText(l)}, ${hm(booking.time)}`)) +
    row('Ilgums', 'Длительность', both((l) => duration(x.min, l))) +
    row('Kur', 'Где', 'Svētes iela 7, Jelgava') +
    row('Vārds', 'Имя', booking.name.replace(/[<>&]/g, ''));
}

function resetBooking() {
  Object.assign(booking, { svc: null, day: null, time: null, name: null });
  bookForm.reset();
  bookForm.hidden = false;
  ticket.hidden = true;
  renderDays(); renderSlots(); renderPick(); unlock();
}
document.getElementById('book-again').addEventListener('click', () => {
  resetBooking();
  steps[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
});

// a real calendar file the visitor can save
document.getElementById('ics').addEventListener('click', () => {
  const x = svcById(booking.svc);
  const stamp = (m) => booking.day.replace(/-/g, '') + 'T' + hm(m).replace(':', '') + '00';
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//SKY BEAUTY demo//LV', 'BEGIN:VEVENT',
    `UID:${Date.now()}@skybeauty-demo`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${stamp(booking.time)}`, `DTEND:${stamp(booking.time + x.min)}`,
    `SUMMARY:SKY BEAUTY: ${x[root.lang]}`, 'LOCATION:Svētes iela 7\\, Jelgava', 'DESCRIPTION:+371 20 177 678',
    'END:VEVENT', 'END:VCALENDAR',
  ].join('\r\n');
  const url = URL.createObjectURL(new Blob([ics], { type: 'text/calendar' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: 'sky-beauty-pieraksts.ics' });
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

renderDays(); unlock();

/* ---------- language ---------- */

const langBtn = document.querySelector('.lang');
function setLang(lang) {
  root.lang = lang;
  langBtn.textContent = lang === 'lv' ? 'RU' : 'LV';
  langBtn.setAttribute('aria-label', lang === 'lv' ? 'Переключить на русский' : 'Pārslēgt uz latviešu valodu');
  try { localStorage.setItem('sky-lang', lang); } catch {}
  if (lastResult) showResult(false);
  if (bookError.textContent) bookError.textContent = '';
}
let savedLang = null;
try { savedLang = localStorage.getItem('sky-lang'); } catch {}
if (!savedLang && navigator.language?.toLowerCase().startsWith('ru')) savedLang = 'ru';
setLang(savedLang === 'ru' ? 'ru' : 'lv');
langBtn.addEventListener('click', () => setLang(root.lang === 'lv' ? 'ru' : 'lv'));
