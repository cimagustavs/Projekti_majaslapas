const root = document.documentElement;
const euro = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

const TEXT = {
  lv: {
    title: 'Lotes Spots — ģimenes kafejnīca Jelgavā, Lielā iela 3',
    langLabel: 'Переключить на русский',
    langButton: 'RU',
    sets: (n, price) => `${n} × ${price === 900 ? 'zupa + otrais + saldais' : 'zupa + otrais'}`,
    free: 'bez maksas',
    none: '—',
    hintFree: 'Pasūtījums virs 15 € — piegāde bez maksas.',
    hintAlmost: 'Pasūtot virs 15 € — piegāde bez maksas.',
    hintTakeaway: 'Izņem Lielajā ielā 3 — piegādes maksas nav.',
    hintHere: 'Gaidīsim pie galdiņa Lielajā ielā 3.',
    minus: 'Mazāk cilvēku', plus: 'Vairāk cilvēku',
  },
  ru: {
    title: 'Lotes Spots — семейное кафе в Елгаве, ул. Лиела, 3',
    langLabel: 'Pārslēgt uz latviešu valodu',
    langButton: 'LV',
    sets: (n, price) => `${n} × ${price === 900 ? 'суп + второе + десерт' : 'суп + второе'}`,
    free: 'бесплатно',
    none: '—',
    hintFree: 'Заказ от 15 € — доставка бесплатно.',
    hintAlmost: 'При заказе от 15 € — доставка бесплатно.',
    hintTakeaway: 'Заберите на улице Лиела, 3 — без платы за доставку.',
    hintHere: 'Ждём вас за столиком на улице Лиела, 3.',
    minus: 'Меньше человек', plus: 'Больше человек',
  },
};
const t = () => TEXT[root.lang];

// ---------- Office lunch calculator ----------
// From their posters: sets 7 € / 9 €, delivery in Jelgava 3,50 €, free when the order is over 15 €.
const DELIVERY = 350;
const FREE_OVER = 1500;
const MAX_PEOPLE = 40;
let people = 5;

const peopleOut = document.getElementById('people');
const minus = document.querySelector('.stepper .minus');
const plus = document.querySelector('.stepper .plus');
const setsLabel = document.getElementById('sets-label');
const setsSum = document.getElementById('sets-sum');
const feeRow = document.getElementById('fee-row');
const feeEl = document.getElementById('fee');
const totalEl = document.getElementById('total');
const hint = document.getElementById('hint');
const calc = document.getElementById('calc');

const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

function renderCalc(animate = false) {
  const price = Number(calc.querySelector('input[name="set"]:checked').value);
  const mode = calc.querySelector('input[name="mode"]:checked').value;
  const subtotal = people * price;
  const isDelivery = mode === 'delivery';
  const fee = isDelivery && subtotal <= FREE_OVER ? DELIVERY : 0;

  peopleOut.textContent = people;
  minus.disabled = people <= 1;
  plus.disabled = people >= MAX_PEOPLE;
  setsLabel.textContent = t().sets(people, price);
  setsSum.textContent = euro(subtotal);
  feeRow.hidden = !isDelivery;
  feeEl.textContent = fee ? euro(fee) : t().free;
  feeEl.classList.toggle('free', !fee);
  totalEl.textContent = euro(subtotal + fee);
  if (animate) bump(totalEl);

  if (!isDelivery) {
    hint.textContent = mode === 'takeaway' ? t().hintTakeaway : t().hintHere;
    hint.classList.remove('good');
  } else if (fee) {
    hint.textContent = t().hintAlmost;
    hint.classList.remove('good');
  } else {
    hint.textContent = t().hintFree;
    hint.classList.add('good');
  }
}

document.querySelectorAll('.stepper [data-step]').forEach((btn) => {
  btn.addEventListener('click', () => {
    people = Math.min(MAX_PEOPLE, Math.max(1, people + Number(btn.dataset.step)));
    bump(peopleOut);
    renderCalc(true);
  });
});
calc.addEventListener('change', () => renderCalc(true));
calc.addEventListener('submit', (e) => e.preventDefault());

// ---------- Language ----------
const langButton = document.querySelector('.lang-toggle');
function setLanguage(lang) {
  root.lang = lang;
  document.title = t().title;
  langButton.textContent = t().langButton;
  langButton.setAttribute('aria-label', t().langLabel);
  minus.setAttribute('aria-label', t().minus);
  plus.setAttribute('aria-label', t().plus);
  renderCalc();
  try { localStorage.setItem('lotes-lang', lang); } catch {}
}
let saved = null;
try { saved = localStorage.getItem('lotes-lang'); } catch {}
if (!saved && navigator.language?.toLowerCase().startsWith('ru')) saved = 'ru';
setLanguage(saved === 'ru' ? 'ru' : 'lv');
langButton.addEventListener('click', () => setLanguage(root.lang === 'lv' ? 'ru' : 'lv'));

// ---------- Section entrances ----------
const reveals = document.querySelectorAll('.reveal');
document.querySelectorAll('section').forEach((s) => {
  s.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 70}ms`));
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -10% 0px' });
  reveals.forEach((el) => io.observe(el));
} else reveals.forEach((el) => el.classList.add('in'));

// ---------- Mobile navigation ----------
const navToggle = document.querySelector('.nav-toggle');
const nav = document.getElementById('site-nav');
const closeNav = () => { nav.classList.remove('is-open'); navToggle.setAttribute('aria-expanded', 'false'); };
navToggle.addEventListener('click', () => navToggle.setAttribute('aria-expanded', String(nav.classList.toggle('is-open'))));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) closeNav(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeNav(); });
