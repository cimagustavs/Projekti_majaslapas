const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const euro = (c) => `${(c / 100).toFixed(2).replace('.', ',')} €`;

// ---------- Opening hours (sample) + live status ----------
const HOURS = [[10, 20], [9, 21], [9, 21], [9, 21], [9, 21], [9, 21], [10, 20]]; // 0 = Sunday
function renderStatus() {
  const now = new Date();
  const d = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const [from, to] = HOURS[d];
  const el = document.querySelector('[data-status]');
  const open = h >= from && h < to;
  el.textContent = open ? `Atvērts līdz ${to}:00` : h < from ? `Atveram ${from}:00` : `Rīt atveram ${HOURS[(d + 1) % 7][0]}:00`;
  el.classList.toggle('is-open', open);
  const mini = document.querySelector('[data-status-mini]');
  if (mini) { mini.textContent = open ? 'atvērts' : 'slēgts'; mini.classList.toggle('is-open', open); }
  document.querySelectorAll('#hours [data-days]').forEach((r) => r.classList.toggle('is-today', r.dataset.days.split(' ').includes(String(d))));
}
renderStatus();
setInterval(renderStatus, 60_000);

// ---------- Street lamp follows the pointer ----------
const street = document.querySelector('.street');
if (matchMedia('(pointer: fine)').matches && !reduceMotion) {
  const lamp = document.querySelector('.street-stick');
  lamp.addEventListener('pointermove', (e) => {
    const r = lamp.getBoundingClientRect();
    lamp.style.setProperty('--mx', `${e.clientX - r.left}px`);
    lamp.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
}

// ---------- Hero scroll: motion starts with the first pixel of scrolling, nothing is pinned ----------
const stick = document.querySelector('.street-stick');
let ticking = false;
function onHeroScroll() {
  ticking = false;
  const h = street.offsetHeight || innerHeight;
  const p = Math.min(1, Math.max(0, scrollY / h));       // 0 at the top, 1 once the hero has scrolled away
  const q = Math.min(1, p * 1.7);                          // words leave faster than the panda
  stick.style.setProperty('--p', p.toFixed(4));
  stick.style.setProperty('--q', (1 - (1 - q) * (1 - q)).toFixed(4)); // ease-out: they react immediately
}
if (!reduceMotion) {
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onHeroScroll); } }, { passive: true });
  addEventListener('resize', onHeroScroll);
  onHeroScroll();
}

// ---------- The panda's day ----------
const day = document.querySelector('.day');
const steps = [...document.querySelectorAll('.step')];
const actors = [...document.querySelectorAll('.actor')];
const clock = document.getElementById('clock');
let current = -1;
function showStep(i) {
  if (i === current) return;
  current = i;
  day.dataset.step = i;
  steps.forEach((s, k) => s.classList.toggle('on', k === i));
  actors.forEach((a, k) => a.classList.toggle('on', k === i));
  clock.textContent = steps[i].dataset.time;
}
showStep(0);
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) showStep(steps.indexOf(e.target)); });
  }, { rootMargin: '-45% 0px -45% 0px' });
  steps.forEach((s) => io.observe(s));
} else steps.forEach((s) => s.classList.add('on'));

// ---------- Build your tray ----------
// Real rule from their poster: soup + main = 7 €, + dessert = 9 €. Item prices are samples.
const picks = document.getElementById('picks');
const lines = document.getElementById('tray-lines');
const panda = document.getElementById('tray-panda');
const bubble = document.getElementById('bubble');
const saveEl = document.getElementById('save');
const totalEl = document.getElementById('total');
const qtyEl = document.getElementById('qty');
const minus = document.querySelector('.tray .minus');
const plus = document.querySelector('.tray .plus');
let qty = 1;
let mood = 'peek';

const pick = (course) => picks.querySelector(`input[name="${course}"]:checked`);
const bump = (el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); };

function setPanda(next, text) {
  bubble.textContent = text;
  if (next === mood) return;
  mood = next;
  panda.src = `img/panda/${next}.webp`;
  panda.classList.remove('pop'); void panda.offsetWidth; panda.classList.add('pop');
}

function renderTray(animate = false) {
  const soup = pick('soup'), main = pick('main'), dessert = pick('dessert'), drink = pick('drink');
  const chosen = [soup, main, dessert, drink].filter(Boolean);
  const loose = chosen.reduce((s, i) => s + Number(i.dataset.price), 0);
  const isSet = Boolean(soup && main);
  const one = isSet ? (dessert ? 900 : 700) + (drink ? Number(drink.dataset.price) : 0) : loose;

  lines.replaceChildren(...chosen.map((i) => {
    const li = document.createElement('li');
    const name = document.createElement('span'); name.textContent = i.value;
    const price = document.createElement('b'); price.textContent = euro(Number(i.dataset.price));
    li.append(name, price);
    return li;
  }));

  const delivery = document.querySelector('input[name="mode"]:checked').value === 'delivery';
  const food = one * qty;
  const fee = delivery && food > 0 && food <= 1500 ? 350 : 0;
  totalEl.textContent = euro(food + fee);
  if (animate) bump(totalEl);

  const saved = (loose - one) * qty;
  const deliveryNote = !delivery || !food ? '' : fee ? ' Piegāde 3,50 € (virs 15 € — bez maksas).' : ' Piegāde bez maksas!';
  saveEl.textContent = (isSet && saved > 0 ? `Komplekts! Ietaupi ${euro(saved)}.` : '') + deliveryNote;

  qtyEl.textContent = qty;
  minus.disabled = qty <= 1;

  if (!chosen.length) setPanda('peek', 'Nu, ko ņemsim?');
  else if (isSet && dessert && drink) setPanda('heart-eyes', 'Ideāla paplāte!');
  else if (isSet && dessert) setPanda('love-fries', 'Ar saldo — tikai 9 €!');
  else if (isSet) setPanda('thumbs-up', 'Komplekts — 7 €!');
  else if (drink && chosen.length === 1) setPanda('snack', 'Tikai iedzert? Var!');
  else setPanda('eating', soup ? 'Un otrais?' : main ? 'Zupu klāt?' : 'Vēl kaut ko?');
}

picks.addEventListener('change', () => renderTray(true));
document.querySelectorAll('input[name="mode"]').forEach((i) => i.addEventListener('change', () => renderTray(true)));
plus.addEventListener('click', () => { qty = Math.min(30, qty + 1); renderTray(true); });
minus.addEventListener('click', () => { qty = Math.max(1, qty - 1); renderTray(true); });
document.getElementById('clear').addEventListener('click', () => {
  picks.querySelectorAll('input:checked').forEach((i) => { i.checked = false; });
  qty = 1;
  renderTray(true);
});
// Tapping a chosen dish again takes it off the tray.
picks.addEventListener('pointerdown', (e) => {
  const input = e.target.closest('.food')?.querySelector('input');
  if (input) input.dataset.wasChecked = input.checked ? '1' : '0';
});
picks.addEventListener('click', (e) => {
  const input = e.target.closest('.food')?.querySelector('input');
  if (input && e.target === input && input.dataset.wasChecked === '1') {
    input.checked = false;
    input.dataset.wasChecked = '0';
    renderTray(true);
  }
});
renderTray();

// ---------- Entrances ----------
const reveals = document.querySelectorAll('.reveal');
if ('IntersectionObserver' in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { rootMargin: '0px 0px -12% 0px' });
  reveals.forEach((el) => io.observe(el));
} else reveals.forEach((el) => el.classList.add('in'));

// ---------- Neon cursor, sparks on every choice, and dishes that fly onto the tray ----------
const SELECTABLE = 'a, button, label.food, label.mode';
const SPARK_COLOURS = ['#ff9b1a', '#4fdc4a', '#fffaf2', '#ff4b55'];

function sparks(x, y, count = 12) {
  if (reduceMotion) return;
  for (let i = 0; i < count; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.style.setProperty('--c', SPARK_COLOURS[i % SPARK_COLOURS.length]);
    document.body.append(s);
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const d = 28 + Math.random() * 42;
    s.animate([
      { transform: `translate(${x}px, ${y}px) scale(1)`, opacity: 1 },
      { transform: `translate(${x + Math.cos(a) * d}px, ${y + Math.sin(a) * d}px) scale(0.2)`, opacity: 0 },
    ], { duration: 480 + Math.random() * 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).finished.then(() => s.remove());
  }
}

function flyToTray(fromEl, text) {
  if (reduceMotion) return;
  const a = fromEl.getBoundingClientRect();
  const target = document.getElementById('tray-panda').getBoundingClientRect();
  const onScreen = target.bottom > 0 && target.top < innerHeight;
  const x0 = a.left + a.width - 40, y0 = a.top + a.height / 2;
  const x1 = onScreen ? target.left + target.width / 2 : innerWidth / 2;
  const y1 = onScreen ? target.top + target.height / 2 : innerHeight + 30;
  const chip = document.createElement('span');
  chip.className = 'fly';
  chip.textContent = text;
  document.body.append(chip);
  const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 120; // arc over the top
  chip.animate([
    { transform: `translate(${x0}px, ${y0}px) translate(-50%, -50%) scale(1)`, opacity: 1 },
    { transform: `translate(${mx}px, ${my}px) translate(-50%, -50%) scale(1.15)`, opacity: 1, offset: 0.45 },
    { transform: `translate(${x1}px, ${y1}px) translate(-50%, -50%) scale(0.35)`, opacity: 0.2 },
  ], { duration: 700, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' }).finished.then(() => {
    chip.remove();
    if (onScreen) sparks(x1, y1, 10);
  });
}

// Sparks wherever something is chosen (mouse or finger).
addEventListener('pointerdown', (e) => {
  if (e.target.closest(SELECTABLE)) sparks(e.clientX, e.clientY);
});

// A dish that becomes checked flies onto the tray.
picks.addEventListener('change', (e) => {
  const input = e.target;
  if (input.checked) flyToTray(input.closest('.food'), `+ ${euro(Number(input.dataset.price))}`);
});

// The cursor itself: desktop with a real mouse only.
if (matchMedia('(hover: hover) and (pointer: fine)').matches && !reduceMotion) {
  const cur = document.querySelector('.cursor');
  const dot = cur.querySelector('.cursor-dot');
  const ring = cur.querySelector('.cursor-ring');
  const label = cur.querySelector('.cursor-label');
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
  document.documentElement.classList.add('has-cursor');
  cur.classList.add('is-hidden');

  addEventListener('pointermove', (e) => {
    mx = e.clientX; my = e.clientY;
    cur.classList.remove('is-hidden');
    dot.style.transform = `translate(${mx}px, ${my}px)`;
    const hit = e.target.closest(SELECTABLE);
    const food = hit?.matches('label.food') ? hit : null;
    cur.classList.toggle('is-hover', Boolean(hit));
    cur.classList.toggle('is-food', Boolean(food));
    const picked = Boolean(food?.querySelector('input').checked);
    cur.classList.toggle('is-picked', picked);
    label.textContent = food ? (picked ? '✓' : '+') : '';
  }, { passive: true });
  addEventListener('pointerdown', () => cur.classList.add('is-down'));
  addEventListener('pointerup', () => cur.classList.remove('is-down'));
  document.addEventListener('pointerleave', () => cur.classList.add('is-hidden'));
  // After a click on a dish its state changes under a still mouse — refresh the label.
  picks.addEventListener('change', () => {
    const food = document.elementFromPoint(mx, my)?.closest('label.food');
    if (!food) return;
    const picked = food.querySelector('input').checked;
    cur.classList.toggle('is-picked', picked);
    label.textContent = picked ? '✓' : '+';
  });

  (function follow() {
    rx += (mx - rx) * 0.2;
    ry += (my - ry) * 0.2;
    ring.style.transform = `translate(${rx}px, ${ry}px)`;
    requestAnimationFrame(follow);
  })();
}
