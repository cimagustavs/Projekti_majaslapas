const root = document.documentElement;

const TEXT = {
  lv: {
    title: 'Kafe-Picērija — picas Jelgavā, Akadēmijas ielā 4',
    langLabel: 'Переключить на русский',
    langButton: 'RU',
    open: (t) => `Tagad atvērts — līdz ${t}.`,
    before: (t) => `Šodien atveram ${t}.`,
    after: (when, t) => `Šodien jau slēgts. ${when} atveram ${t}.`,
    tomorrow: 'Rīt',
    gift: 'Siera pica — dāvanā',
    free: 'bez maksas',
    needOne: 'Pievieno vēl vienu picu — un siera pica būs dāvanā.',
    giftOn: 'Akcija strādā: siera pica dāvanā.',
    takeawayOnly: 'Akcija “siera pica dāvanā” ir tikai līdzņemšanai.',
    from: 'no',
    pizzas: (n) => `${n} ${n % 10 === 1 && n % 100 !== 11 ? 'pica' : 'picas'}`,
  },
  ru: {
    title: 'Kafe-Picērija — пицца в Елгаве, ул. Академияс, 4',
    langLabel: 'Pārslēgt uz latviešu valodu',
    langButton: 'LV',
    open: (t) => `Сейчас открыто — до ${t}.`,
    before: (t) => `Сегодня открываемся в ${t}.`,
    after: (when, t) => `Сегодня уже закрыто. ${when} открываемся в ${t}.`,
    tomorrow: 'Завтра',
    gift: 'Сырная пицца — в подарок',
    free: 'бесплатно',
    needOne: 'Добавьте ещё одну пиццу — и сырная будет в подарок.',
    giftOn: 'Акция работает: сырная пицца в подарок.',
    takeawayOnly: 'Акция «сырная пицца в подарок» — только навынос.',
    from: 'от',
    pizzas: (n) => {
      const m10 = n % 10, m100 = n % 100;
      const word = m10 === 1 && m100 !== 11 ? 'пицца' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'пиццы' : 'пицц';
      return `${n} ${word}`;
    },
  },
};
const t = () => TEXT[root.lang];
const euro = (cents) => `${(cents / 100).toFixed(2).replace('.', ',')} €`;

// ---------- Opening hours (from kafepicerija.lv): Mon–Fri 10–21, Sat–Sun 11–21 ----------
const HOURS = [[11, 21], [10, 21], [10, 21], [10, 21], [10, 21], [10, 21], [11, 21]];
const hh = (h) => `${h}:00`;

function renderStatus() {
  const now = new Date();
  const day = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const [from, to] = HOURS[day];
  let text, open = false;
  if (h >= from && h < to) { open = true; text = t().open(hh(to)); }
  else if (h < from) text = t().before(hh(from));
  else text = t().after(t().tomorrow, hh(HOURS[(day + 1) % 7][0]));
  document.querySelectorAll('[data-status]').forEach((el) => {
    el.textContent = text;
    el.classList.toggle('is-open', open);
  });
  document.querySelectorAll('#hours [data-days]').forEach((row) => {
    row.classList.toggle('is-today', row.dataset.days.split(' ').includes(String(day)));
  });
}

// ---------- Order board ----------
// Offer from kafepicerija.lv: order any two pizzas for takeaway, get a cheese pizza free.
// We apply one free cheese pizza per order; the café should confirm whether it is per two pizzas.
const FEES = { takeaway: 0, city: 350, outside: 500 };
const order = new Map(); // id -> qty
const pizzaEls = [...document.querySelectorAll('.pizza')];
const lines = document.getElementById('tray-lines');
const empty = document.getElementById('tray-empty');
const hint = document.getElementById('tray-hint');
const feeRow = document.getElementById('fee-row');
const feeEl = document.getElementById('fee');
const totalEl = document.getElementById('total');
const bar = document.getElementById('tray-bar');
const barCount = document.getElementById('tray-bar-count');
const barTotal = document.getElementById('tray-bar-total');
const modeInputs = document.querySelectorAll('input[name="mode"]');
const mode = () => document.querySelector('input[name="mode"]:checked').value;
const nameOf = (el) => el.querySelector(`h3 [data-l="${root.lang}"]`).textContent;

function renderOrder() {
  const items = pizzaEls.filter((el) => order.get(el.dataset.id));
  const count = items.reduce((n, el) => n + order.get(el.dataset.id), 0);
  const subtotal = items.reduce((s, el) => s + order.get(el.dataset.id) * Number(el.dataset.price), 0);
  const m = mode();
  const gift = m === 'takeaway' && count >= 2;
  const fee = count ? FEES[m] : 0;

  // Keep existing <li>s where possible so only new lines animate in.
  const wanted = items.map((el) => el.dataset.id);
  [...lines.children].forEach((li) => { if (!wanted.includes(li.dataset.id) && li.dataset.id !== 'gift') li.remove(); });
  items.forEach((el) => {
    const id = el.dataset.id;
    const qty = order.get(id);
    let li = lines.querySelector(`[data-id="${id}"]`);
    if (!li) {
      li = document.createElement('li');
      li.dataset.id = id;
      const photo = el.querySelector('img');
      const thumb = photo ? `<img src="${photo.getAttribute('src')}" alt="">` : '<span class="thumb-none" aria-hidden="true"></span>';
      li.innerHTML = `${thumb}<span class="name"></span><span class="sum"></span>`;
      lines.append(li);
    }
    li.querySelector('.name').textContent = `${qty} × ${nameOf(el)}`;
    li.querySelector('.sum').textContent = euro(qty * Number(el.dataset.price));
  });

  let giftLi = lines.querySelector('[data-id="gift"]');
  if (gift && !giftLi) {
    giftLi = document.createElement('li');
    giftLi.dataset.id = 'gift';
    giftLi.className = 'gift';
    giftLi.innerHTML = '<img src="img/siera.webp" alt=""><span class="name"></span><span class="sum">0,00 €</span>';
  }
  if (gift) {
    giftLi.querySelector('.name').textContent = `1 × ${t().gift}`;
    lines.append(giftLi); // always last
  } else if (giftLi) giftLi.remove();

  empty.hidden = count > 0;
  if (count === 1 && m === 'takeaway') { hint.textContent = t().needOne; hint.classList.remove('is-gift'); }
  else if (gift) { hint.textContent = t().giftOn; hint.classList.add('is-gift'); }
  else if (count >= 2 && m !== 'takeaway') { hint.textContent = t().takeawayOnly; hint.classList.remove('is-gift'); }
  else hint.textContent = '';

  feeRow.hidden = !(count && m !== 'takeaway');
  feeEl.textContent = m === 'outside' ? `${t().from} ${euro(fee)}` : euro(fee);
  const total = subtotal + fee;
  totalEl.textContent = m === 'outside' && count ? `${t().from} ${euro(total)}` : euro(total);

  bar.hidden = count === 0;
  barCount.textContent = t().pizzas(count) + (gift ? ' + 1' : '');
  barTotal.textContent = euro(total);

  pizzaEls.forEach((el) => {
    const q = order.get(el.dataset.id) || 0;
    el.classList.toggle('has-qty', q > 0);
    el.querySelector('.minus').disabled = q === 0;
  });
}

function change(el, delta) {
  const id = el.dataset.id;
  const q = Math.max(0, Math.min(20, (order.get(id) || 0) + delta));
  order.set(id, q);
  const out = el.querySelector('.qty');
  out.textContent = q;
  out.classList.remove('bump');
  void out.offsetWidth; // restart the bump
  out.classList.add('bump');
  renderOrder();
}

pizzaEls.forEach((el) => {
  el.querySelector('.plus').addEventListener('click', () => change(el, 1));
  el.querySelector('.minus').addEventListener('click', () => change(el, -1));
});
modeInputs.forEach((input) => input.addEventListener('change', renderOrder));

function labelSteppers() {
  pizzaEls.forEach((el) => {
    const n = nameOf(el);
    el.querySelector('.plus').setAttribute('aria-label', (root.lang === 'lv' ? 'Pievienot: ' : 'Добавить: ') + n);
    el.querySelector('.minus').setAttribute('aria-label', (root.lang === 'lv' ? 'Noņemt: ' : 'Убрать: ') + n);
    el.querySelector('.qty').setAttribute('aria-label', root.lang === 'lv' ? 'Skaits' : 'Количество');
  });
}

// Hide the floating order bar while the tray itself (or anything below it) is on screen.
if ('IntersectionObserver' in window) {
  const tray = document.getElementById('tray');
  new IntersectionObserver(([e]) => {
    bar.classList.toggle('is-away', e.isIntersecting || e.boundingClientRect.top < 0);
  }).observe(tray);
}

// ---------- Language ----------
const langButton = document.querySelector('.lang-toggle');
function setLanguage(lang) {
  root.lang = lang;
  document.title = t().title;
  langButton.textContent = t().langButton;
  langButton.setAttribute('aria-label', t().langLabel);
  labelSteppers();
  renderStatus();
  renderOrder();
  try { localStorage.setItem('picerija-lang', lang); } catch {}
}
let savedLang = null;
try { savedLang = localStorage.getItem('picerija-lang'); } catch {}
if (!savedLang && navigator.language?.toLowerCase().startsWith('ru')) savedLang = 'ru';
setLanguage(savedLang === 'ru' ? 'ru' : 'lv');
langButton.addEventListener('click', () => setLanguage(root.lang === 'lv' ? 'ru' : 'lv'));
setInterval(renderStatus, 60_000);

// ---------- Section entrances ----------
const reveals = document.querySelectorAll('.reveal');
document.querySelectorAll('section').forEach((section) => {
  section.querySelectorAll('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i, 5) * 70}ms`));
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
