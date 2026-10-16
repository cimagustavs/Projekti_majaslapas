// Language toggle: swaps html[lang]; CSS hides the other language's spans.
const root = document.documentElement;
const langButton = document.querySelector('.lang-toggle');
const titles = {
  lv: 'Kafejnīca Clementine — Jelgava',
  en: 'Clementine Café — Jelgava',
};

function setLanguage(lang) {
  root.lang = lang;
  document.title = titles[lang];
  langButton.textContent = lang === 'lv' ? 'EN' : 'LV';
  langButton.setAttribute('aria-label', lang === 'lv' ? 'Switch to English' : 'Pārslēgt uz latviešu valodu');
  document.querySelectorAll('[data-ph-lv]').forEach((el) => {
    el.placeholder = el.dataset[lang === 'lv' ? 'phLv' : 'phEn'];
  });
  document.querySelectorAll('option[data-lv]').forEach((el) => {
    el.textContent = el.dataset[lang];
  });
  renderToday();
  try { localStorage.setItem('clementine-lang', lang); } catch {}
}

// Today's hours (0 = Sunday). Monday is "by request".
const hoursByDay = [
  '9:00–18:00',
  null,
  '8:00–19:00', '8:00–19:00', '8:00–19:00',
  '8:00–21:00',
  '9:00–21:00',
];
function renderToday() {
  const day = new Date().getDay();
  document.getElementById('today-hours').textContent =
    hoursByDay[day] ?? (root.lang === 'lv' ? 'pēc pieprasījuma' : 'by request');
  document.querySelectorAll('#hours [data-days]').forEach((row) => {
    row.classList.toggle('is-today', row.dataset.days.split(' ').includes(String(day)));
  });
}

let savedLang = null;
try { savedLang = localStorage.getItem('clementine-lang'); } catch {}
setLanguage(savedLang === 'en' ? 'en' : 'lv');
langButton.addEventListener('click', () => setLanguage(root.lang === 'lv' ? 'en' : 'lv'));

// Mobile navigation
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

// Cake order form
const form = document.getElementById('order-form');
const dateInput = document.getElementById('date');
const success = form.querySelector('.form-success');
const fields = 'input:not([type="radio"]), select';

// Earliest order date is tomorrow (local time).
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
dateInput.min = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Keep aria-invalid in sync with the visual :user-invalid state.
const syncAria = (el) => {
  if (!el.matches?.(fields)) return;
  if (el.matches(':user-invalid')) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
};
form.addEventListener('blur', (e) => syncAria(e.target), true);
form.addEventListener('input', (e) => syncAria(e.target));
form.addEventListener('change', (e) => syncAria(e.target));
form.addEventListener('invalid', (e) => e.target.setAttribute('aria-invalid', 'true'), true);

form.addEventListener('submit', (e) => {
  // Invalid forms never reach this handler: the browser blocks submission
  // and focuses the first invalid field.
  e.preventDefault();
  success.hidden = false;
  form.querySelectorAll(fields).forEach((el) => el.removeAttribute('aria-invalid'));
  form.reset();
});
