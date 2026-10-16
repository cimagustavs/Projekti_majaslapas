const root = document.documentElement;

// ---------- Opening hours ----------
// [open, close] in hours, indexed by getDay() (0 = Sunday). Monday is by request.
const HOURS = [[9, 18], null, [8, 19], [8, 19], [8, 19], [8, 21], [9, 21]];
const AXIS_START = 7; // the week chart runs 7:00–22:00
const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Latvian weeks start on Monday

const TEXT = {
  lv: {
    title: 'Kafejnīca Clementine — Jelgava',
    langLabel: 'Switch to English',
    days: ['Svētdiena', 'Pirmdiena', 'Otrdiena', 'Trešdiena', 'Ceturtdiena', 'Piektdiena', 'Sestdiena'],
    short: ['Sv', 'P', 'O', 'T', 'C', 'Pk', 'S'],
    byRequest: 'pēc pieprasījuma',
    left: (h, m) => (h ? `${h}\u00a0h ${m}\u00a0min` : `${m}\u00a0min`),
    open: (left) => `Tagad atvērts — brokastis pasniedz vēl ${left}.`,
    before: (t) => `Šodien atveram ${t}. Brokastis — no paša rīta.`,
    after: (when, t) => `Šodien jau slēgts. ${when} brokastis no ${t}.`,
    tomorrow: 'Rīt',
    monday: 'Pirmdienās strādājam pēc pieprasījuma — zvaniet.',
    cakeDefault: 'Daudz laimes!',
    cakeNote: (words, icing) => `Uzraksts: "${words}". Glazūra: ${icing}.`,
  },
  en: {
    title: 'Clementine Café — Jelgava',
    langLabel: 'Pārslēgt uz latviešu valodu',
    days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    short: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    byRequest: 'by request',
    left: (h, m) => (h ? `${h}\u00a0h ${m}\u00a0min` : `${m}\u00a0min`),
    open: (left) => `Open now — breakfast is served for another ${left}.`,
    before: (t) => `We open today at ${t}. Breakfast from the start.`,
    after: (when, t) => `Closed for today. ${when} breakfast from ${t}.`,
    tomorrow: 'Tomorrow',
    monday: 'On Mondays we open by request — give us a call.',
    cakeDefault: 'Happy birthday!',
    cakeNote: (words, icing) => `Writing: "${words}". Icing: ${icing}.`,
  },
};
const t = () => TEXT[root.lang];
const hhmm = (h) => `${Math.floor(h)}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;

function statusText(now = new Date()) {
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const today = HOURS[day];
  if (today && h >= today[0] && h < today[1]) {
    const mins = Math.round((today[1] - h) * 60);
    return { open: true, text: t().open(t().left(Math.floor(mins / 60), mins % 60)) };
  }
  if (today && h < today[0]) return { open: false, text: t().before(hhmm(today[0])) };
  if (!today) return { open: false, text: t().monday };
  for (let i = 1; i <= 7; i++) {
    const d = (day + i) % 7;
    if (HOURS[d]) {
      const when = i === 1 ? t().tomorrow : t().days[d];
      return { open: false, text: t().after(when, hhmm(HOURS[d][0])) };
    }
  }
}

function renderStatus() {
  const { open, text } = statusText();
  document.querySelectorAll('[data-now], [data-status]').forEach((el) => {
    el.textContent = text;
    el.classList.toggle('is-open', open);
  });
  renderWeek();
}

function renderWeek() {
  const list = document.getElementById('week');
  const now = new Date();
  const today = now.getDay();
  const hour = now.getHours() + now.getMinutes() / 60;
  list.replaceChildren(...WEEK_ORDER.map((d, row) => {
    const li = document.createElement('li');
    li.style.setProperty('--row', row);
    li.classList.toggle('is-today', d === today);
    const hours = HOURS[d];
    const label = `<span class="week-day"><span class="d-long">${t().days[d]}</span><span class="d-short">${t().short[d]}</span></span>`;
    let track;
    if (hours) {
      const [from, to] = hours;
      const showNow = d === today && hour >= AXIS_START && hour <= AXIS_START + 15;
      track = `<span class="week-track">
        <span class="week-bar" style="--from:${from - AXIS_START};--to:${to - AXIS_START}">${hhmm(from)}–${hhmm(to)}</span>
        ${showNow ? `<span class="week-now" style="--now:${hour - AXIS_START}"></span>` : ''}
      </span>`;
    } else {
      track = `<span class="week-track"><span class="week-off">${t().byRequest}</span></span>`;
    }
    li.innerHTML = label + track;
    return li;
  }));
}

// ---------- Cake studio (the live thing) ----------
const studio = document.getElementById('studio');
const words = document.getElementById('cake-words');
const stage = document.querySelector('.cake-stage');
const cakeText = document.querySelector('.cake-text');
const SVG_NS = 'http://www.w3.org/2000/svg';
let changeTimer;

function splitLines(text) {
  const clean = text.trim().replace(/\s+/g, ' ');
  if (clean.length <= 14 || !clean.includes(' ')) return [clean];
  // Break at the space closest to the middle.
  const mid = clean.length / 2;
  let best = -1;
  for (let i = 0; i < clean.length; i++) {
    if (clean[i] === ' ' && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
  }
  return [clean.slice(0, best), clean.slice(best + 1)];
}

function renderCake(animate = true) {
  const icing = studio.querySelector('input[name="icing"]:checked').closest('.swatch');
  stage.style.setProperty('--top', icing.style.getPropertyValue('--top'));
  stage.style.setProperty('--ink', icing.style.getPropertyValue('--ink'));

  const lines = splitLines(words.value || ' ');
  const longest = Math.max(...lines.map((l) => l.length), 1);
  // Fit the longest line inside the cake top (about 270 units wide).
  const size = Math.min(64, 270 / (longest * 0.56));
  const draw = () => {
    cakeText.replaceChildren(...lines.map((line, i) => {
      const span = document.createElementNS(SVG_NS, 'tspan');
      span.setAttribute('x', '200');
      span.setAttribute('dy', i === 0 ? `${-(lines.length - 1) * 0.55}em` : '1.1em');
      span.textContent = line;
      return span;
    }));
    cakeText.setAttribute('font-size', size.toFixed(1));
    cakeText.classList.remove('is-changing');
  };
  if (!animate) return draw();
  cakeText.classList.add('is-changing');
  clearTimeout(changeTimer);
  changeTimer = setTimeout(draw, 120);
}

words.addEventListener('input', () => renderCake());
studio.addEventListener('change', () => renderCake());
studio.addEventListener('submit', (e) => e.preventDefault());

document.querySelector('[data-use-cake]').addEventListener('click', () => {
  const icing = studio.querySelector('input[name="icing"]:checked').closest('.swatch');
  const icingName = icing.querySelector(`[data-l="${root.lang}"]`).textContent.toLowerCase();
  document.getElementById('note').value = t().cakeNote(words.value.trim(), icingName);
});

// ---------- Language ----------
const langButton = document.querySelector('.lang-toggle');

function setLanguage(lang) {
  const previousDefault = TEXT[root.lang]?.cakeDefault;
  root.lang = lang;
  document.title = t().title;
  langButton.textContent = lang === 'lv' ? 'EN' : 'LV';
  langButton.setAttribute('aria-label', t().langLabel);
  document.querySelectorAll('[data-ph-lv]').forEach((el) => {
    el.placeholder = el.dataset[lang === 'lv' ? 'phLv' : 'phEn'];
  });
  if (!words.value || words.value === previousDefault) words.value = t().cakeDefault;
  renderStatus();
  renderCake(false);
  try { localStorage.setItem('clementine-lang', lang); } catch {}
}

let savedLang = null;
try { savedLang = localStorage.getItem('clementine-lang'); } catch {}
setLanguage(savedLang === 'en' ? 'en' : 'lv');
langButton.addEventListener('click', () => setLanguage(root.lang === 'lv' ? 'en' : 'lv'));
setInterval(renderStatus, 60_000);
document.fonts?.ready.then(() => renderCake(false));

// ---------- Section entrances: once, staggered within each section ----------
const reveals = document.querySelectorAll('.reveal');
document.querySelectorAll('section').forEach((section) => {
  section.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${i * 80}ms`));
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
} else {
  reveals.forEach((el) => el.classList.add('in'));
}

// ---------- Mobile navigation ----------
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
function closeNav() {
  nav.classList.remove('is-open');
  navToggle.setAttribute('aria-expanded', 'false');
}
navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('is-open');
  navToggle.setAttribute('aria-expanded', String(open));
});
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });

// ---------- Cake order form ----------
const form = document.getElementById('order-form');
const dateInput = document.getElementById('date');
const success = form.querySelector('.form-success');
const fields = 'input:not([type="radio"])';

const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

const syncAria = (el) => {
  if (!el.matches?.(fields)) return;
  if (el.matches(':user-invalid')) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
};
form.addEventListener('blur', (e) => syncAria(e.target), true);
form.addEventListener('input', (e) => syncAria(e.target));
form.addEventListener('invalid', (e) => e.target.setAttribute('aria-invalid', 'true'), true);
form.addEventListener('submit', (e) => {
  // Invalid forms never reach here: the browser blocks submission first.
  e.preventDefault();
  success.hidden = false;
  form.querySelectorAll(fields).forEach((el) => el.removeAttribute('aria-invalid'));
  form.reset();
});
