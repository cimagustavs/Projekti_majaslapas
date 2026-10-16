// Language toggle: swaps html[lang]; CSS hides the other language's spans.
const root = document.documentElement;
const langButton = document.querySelector('.lang-toggle');
const titles = {
  lv: 'Restorāns Kalme — Rīga',
  en: 'Kalme Restaurant — Riga',
};

function setLanguage(lang) {
  root.lang = lang;
  document.title = titles[lang];
  langButton.textContent = lang === 'lv' ? 'EN' : 'LV';
  langButton.setAttribute('aria-label', lang === 'lv' ? 'Switch to English' : 'Pārslēgt uz latviešu valodu');
  document.querySelectorAll('[data-ph-lv]').forEach((el) => {
    el.placeholder = el.dataset[lang === 'lv' ? 'phLv' : 'phEn'];
  });
  try { localStorage.setItem('kalme-lang', lang); } catch {}
}

let savedLang = null;
try { savedLang = localStorage.getItem('kalme-lang'); } catch {}
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

// Today's opening hours in the hero card (0 = Sunday)
const hoursByDay = ['12:00–20:00', '12:00–22:00', '12:00–22:00', '12:00–22:00', '12:00–22:00', '12:00–23:00', '12:00–23:00'];
document.getElementById('today-open').textContent = hoursByDay[new Date().getDay()];

// Booking form
const form = document.getElementById('booking-form');
const dateInput = document.getElementById('date');
const success = form.querySelector('.form-success');
const fields = 'input, select';

// Earliest bookable date is today (local time).
const now = new Date();
dateInput.min = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

// Keep aria-invalid in sync with the visual :user-invalid state.
const syncAria = (el) => {
  if (!el.matches?.(fields)) return;
  if (el.matches(':user-invalid')) el.setAttribute('aria-invalid', 'true');
  else el.removeAttribute('aria-invalid');
};
form.addEventListener('blur', (e) => syncAria(e.target), true);
form.addEventListener('input', (e) => syncAria(e.target));
form.addEventListener('change', (e) => syncAria(e.target));

form.addEventListener('submit', (e) => {
  e.preventDefault();
  // Invalid forms never reach this handler: the browser blocks submission
  // and focuses the first invalid field.
  success.hidden = false;
  form.querySelectorAll(fields).forEach((el) => el.removeAttribute('aria-invalid'));
  form.reset();
});
form.addEventListener('invalid', (e) => e.target.setAttribute('aria-invalid', 'true'), true);
