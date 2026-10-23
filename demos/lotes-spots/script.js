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

// ---------- Hero scroll: the sign comes closer, flickers, then dissolves into drifting grains ----------
// Scroll-linked, so scrolling back up reassembles it.
const stick = document.querySelector('.street-stick');
const signImg = document.querySelector('.sign');
const dust = document.querySelector('.dust');
const ctx = dust.getContext('2d');
const APPROACH_END = 0.3;   // p where the sign stops growing
const DISSOLVE_START = 0.3; // ...and starts to fall apart
let grains = [];
let ticking = false;
let dissolving = false;

function buildGrains() {
  const w = Math.round(signImg.offsetWidth), h = Math.round(signImg.offsetHeight);
  if (!w || !h) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cw = dust.offsetWidth, ch = dust.offsetHeight;
  dust.width = Math.round(cw * dpr); dust.height = Math.round(ch * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  // sample the sign
  const off = document.createElement('canvas');
  off.width = w; off.height = h;
  const o = off.getContext('2d', { willReadFrequently: true });
  o.drawImage(signImg, 0, 0, w, h);
  const data = o.getImageData(0, 0, w, h).data;
  const step = Math.max(2, Math.round(w / 170));
  const ox = (cw - w) / 2, oy = ch * 0.58 - h / 2;  // matches .dust translate(-50%, -58%)
  grains = [];
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      const i = (y * w + x) * 4;
      const a = data[i + 3];
      if (a < 70) continue;
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (Math.max(r, g, b) < 60) continue;
      const nx = x / w - 0.5;
      grains.push({
        x: ox + x, y: oy + y, size: step * 0.9,
        color: `rgb(${r},${g},${b})`, alpha: a / 255,
        // drift up and outward, like sparks lifting off a sign
        dx: nx * w * (0.5 + Math.random() * 0.9) + (Math.random() - 0.5) * w * 0.35,
        dy: -(0.35 + Math.random() * 0.9) * h,
        spin: (Math.random() - 0.5) * 2,
        // the sign comes apart from the top down, with some noise
        t0: (y / h) * 0.55 + Math.random() * 0.2,
      });
    }
  }
}

function drawGrains(q) {
  ctx.clearRect(0, 0, dust.width, dust.height);
  ctx.globalCompositeOperation = 'lighter';
  for (const gr of grains) {
    const k = Math.min(1, Math.max(0, (q - gr.t0) / 0.35));
    const e = 1 - (1 - k) * (1 - k);              // ease-out drift
    const a = gr.alpha * (1 - k);
    if (a <= 0.01) continue;
    const wobble = Math.sin(k * 6 + gr.spin * 3) * 6 * k;
    ctx.globalAlpha = a;
    ctx.fillStyle = gr.color;
    const s = gr.size * (1 - k * 0.6);
    ctx.fillRect(gr.x + gr.dx * e + wobble, gr.y + gr.dy * e, s, s);
  }
  ctx.globalAlpha = 1;
  ctx.globalCompositeOperation = 'source-over';
}

function flicker() {
  signImg.animate([{ opacity: 0.7 }, { opacity: 0.15 }, { opacity: 0.9 }, { opacity: 0.25 }, {}], { duration: 380, easing: 'linear' });
}

function onHeroScroll() {
  ticking = false;
  const r = street.getBoundingClientRect();
  const travel = street.offsetHeight - innerHeight;
  const p = travel > 0 ? Math.min(1, Math.max(0, -r.top / travel)) : 0;
  const approach = Math.min(1, p / APPROACH_END);
  const q = Math.max(0, (p - DISSOLVE_START) / (1 - DISSOLVE_START)); // 0 → 1 across the dissolve
  stick.style.setProperty('--approach', approach.toFixed(4));
  stick.style.setProperty('--fade', Math.min(1, q * 1.6).toFixed(4));

  const nowDissolving = q > 0.001 && grains.length > 0;
  if (nowDissolving !== dissolving) {
    dissolving = nowDissolving;
    stick.classList.toggle('is-dust', dissolving);
    if (!dissolving) { ctx.clearRect(0, 0, dust.width, dust.height); flicker(); }
  }
  if (dissolving) drawGrains(q * 1.12);
}

if (!reduceMotion) {
  const ready = () => { buildGrains(); onHeroScroll(); };
  if (signImg.complete) ready(); else signImg.addEventListener('load', ready, { once: true });
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onHeroScroll); } }, { passive: true });
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(ready, 150); });
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
