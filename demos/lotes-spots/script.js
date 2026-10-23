const root = document.documentElement;
const euro = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

const TEXT = {
  lv: {
    title: 'Lotes Spots — ģimenes kafejnīca Jelgavā, Lielā iela 3',
    langLabel: 'Переключить на русский', langButton: 'RU', tabs: 'Ko šodien gribas?',
    sets: (n, price) => `${n} × ${price === 900 ? 'zupa + otrais + saldais' : 'zupa + otrais'}`,
    free: 'bez maksas',
    hintFree: 'Virs 15 € — piegāde bez maksas.',
    hintAlmost: 'Pasūtot virs 15 € — piegāde bez maksas.',
    hintTakeaway: 'Izņem Lielajā ielā 3 — piegādes maksas nav.',
    hintHere: 'Gaidīsim pie galdiņa Lielajā ielā 3.',
    minus: 'Mazāk cilvēku', plus: 'Vairāk cilvēku',
  },
  ru: {
    title: 'Lotes Spots — семейное кафе в Елгаве, ул. Лиела, 3',
    langLabel: 'Pārslēgt uz latviešu valodu', langButton: 'LV', tabs: 'Чего сегодня хочется?',
    sets: (n, price) => `${n} × ${price === 900 ? 'суп + второе + десерт' : 'суп + второе'}`,
    free: 'бесплатно',
    hintFree: 'От 15 € — доставка бесплатно.',
    hintAlmost: 'При заказе от 15 € — доставка бесплатно.',
    hintTakeaway: 'Заберите на улице Лиела, 3 — без платы за доставку.',
    hintHere: 'Ждём вас за столиком на улице Лиела, 3.',
    minus: 'Меньше человек', plus: 'Больше человек',
  },
};
const t = () => TEXT[root.lang];
const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

// ---------- Panda signs as tabs ----------
const tablist = document.querySelector('.signs');
const tabs = [...tablist.querySelectorAll('[role="tab"]')];
function selectTab(tab, focus = false) {
  tabs.forEach((x) => {
    const on = x === tab;
    x.setAttribute('aria-selected', String(on));
    x.tabIndex = on ? 0 : -1;
    document.getElementById(x.getAttribute('aria-controls')).hidden = !on;
  });
  if (focus) tab.focus();
  tab.scrollIntoView({ block: 'nearest', inline: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}
tabs.forEach((tab) => tab.addEventListener('click', () => selectTab(tab)));
tablist.addEventListener('keydown', (e) => {
  const i = tabs.indexOf(document.activeElement);
  if (i < 0) return;
  const keys = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 };
  if (!(e.key in keys)) return;
  e.preventDefault();
  selectTab(tabs[(keys[e.key] + tabs.length) % tabs.length], true);
});

// ---------- Office lunch calculator ----------
// From their posters: sets 7 € / 9 €, delivery in Jelgava 3,50 €, free when the order is over 15 €.
const DELIVERY = 350, FREE_OVER = 1500, MAX_PEOPLE = 40;
let people = 5;
const $ = (id) => document.getElementById(id);
const calc = $('calc');
const minus = calc.querySelector('.minus');
const plus = calc.querySelector('.plus');

function renderCalc(animate = false) {
  const price = Number(calc.querySelector('input[name="set"]:checked').value);
  const mode = calc.querySelector('input[name="mode"]:checked').value;
  const subtotal = people * price;
  const isDelivery = mode === 'delivery';
  const fee = isDelivery && subtotal <= FREE_OVER ? DELIVERY : 0;

  $('people').textContent = people;
  minus.disabled = people <= 1;
  plus.disabled = people >= MAX_PEOPLE;
  $('sets-label').textContent = t().sets(people, price);
  $('sets-sum').textContent = euro(subtotal);
  $('fee-row').hidden = !isDelivery;
  $('fee').textContent = fee ? euro(fee) : t().free;
  $('fee').classList.toggle('free', !fee);
  $('total').textContent = euro(subtotal + fee);
  if (animate) bump($('total'));

  const hint = $('hint');
  const freeDelivery = isDelivery && !fee;
  hint.textContent = !isDelivery ? (mode === 'takeaway' ? t().hintTakeaway : t().hintHere) : fee ? t().hintAlmost : t().hintFree;
  hint.classList.toggle('good', freeDelivery);
  $('calc-panda').classList.toggle('on', freeDelivery);
}
calc.querySelectorAll('[data-step]').forEach((btn) => btn.addEventListener('click', () => {
  people = Math.min(MAX_PEOPLE, Math.max(1, people + Number(btn.dataset.step)));
  bump($('people'));
  renderCalc(true);
}));
calc.addEventListener('change', () => renderCalc(true));
calc.addEventListener('submit', (e) => e.preventDefault());

// ---------- Language ----------
const langButton = document.querySelector('.lang-toggle');
function setLanguage(lang) {
  root.lang = lang;
  document.title = t().title;
  langButton.textContent = t().langButton;
  langButton.setAttribute('aria-label', t().langLabel);
  tablist.setAttribute('aria-label', t().tabs);
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

// ---------- Entrances ----------
const reveals = document.querySelectorAll('.reveal');
document.querySelectorAll('section').forEach((s) => {
  s.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 4) * 80}ms`));
});
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
} else reveals.forEach((el) => el.classList.add('in'));
