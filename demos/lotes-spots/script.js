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

// ---------- Hero scroll: the sign comes closer, then dissolves into drifting sparks ----------
// Scroll-linked, so scrolling back up reassembles it. The part of the sign that has not come
// apart yet stays the real, sharp image (masked from the top); only detached pieces are sparks.
const stick = document.querySelector('.street-stick');
const signImg = document.querySelector('.sign');
const dust = document.querySelector('.dust');
const ctx = dust.getContext('2d');
const APPROACH_END = 0.3;   // p where the sign stops growing
const DISSOLVE_START = 0.3; // ...and starts to fall apart
const SPREAD = 0.6;         // how much of the dissolve the top-to-bottom sweep takes
const NOISE = 0.12;         // ragged edge
const LIFE = 0.32;          // how long one spark lives
let grains = [];
let ticking = false;
let dissolving = false;
const sprites = new Map();

// A soft round spark with a hot core, tinted to the sign's colour. Cached per colour bucket.
function sprite(r, g, b) {
  const key = `${r >> 4},${g >> 4},${b >> 4}`;
  let s = sprites.get(key);
  if (s) return s;
  s = document.createElement('canvas');
  s.width = s.height = 32;
  const c = s.getContext('2d');
  const grd = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  grd.addColorStop(0, `rgba(${Math.min(255, r + 70)},${Math.min(255, g + 70)},${Math.min(255, b + 70)},1)`);
  grd.addColorStop(0.25, `rgba(${r},${g},${b},0.95)`);
  grd.addColorStop(0.6, `rgba(${r},${g},${b},0.28)`);
  grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
  c.fillStyle = grd;
  c.fillRect(0, 0, 32, 32);
  sprites.set(key, s);
  return s;
}

function buildGrains() {
  const w = signImg.offsetWidth, h = signImg.offsetHeight;
  if (!w || !h) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cw = dust.offsetWidth, ch = dust.offsetHeight;
  dust.width = Math.round(cw * dpr); dust.height = Math.round(ch * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  // Sample the sign at the resolution it is shown on screen.
  const sw = Math.round(w * dpr), sh = Math.round(h * dpr);
  const off = document.createElement('canvas');
  off.width = sw; off.height = sh;
  const o = off.getContext('2d', { willReadFrequently: true });
  o.imageSmoothingQuality = 'high';
  o.drawImage(signImg, 0, 0, sw, sh);
  const data = o.getImageData(0, 0, sw, sh).data;

  // Pick a sampling step that gives a dense but smooth field of sparks.
  let bright = 0;
  for (let i = 0; i < data.length; i += 16) if (data[i + 3] > 80 && Math.max(data[i], data[i + 1], data[i + 2]) > 90) bright++;
  bright *= 4;
  const target = innerWidth < 700 ? 7000 : 12000;
  const step = Math.max(1, Math.round(Math.sqrt(bright / target)));

  const ox = (cw - w) / 2, oy = ch * 0.58 - h / 2; // matches .dust translate(-50%, -58%)
  grains = [];
  for (let y = 0; y < sh; y += step) {
    for (let x = 0; x < sw; x += step) {
      const i = (y * sw + x) * 4;
      const a = data[i + 3];
      const r = data[i], g = data[i + 1], b = data[i + 2];
      if (a < 80 || Math.max(r, g, b) < 90) continue;
      const fx = x / sw, fy = y / sh;
      grains.push({
        x: ox + fx * w, y: oy + fy * h,
        img: sprite(r, g, b),
        size: (step / dpr) * (2.2 + Math.random() * 1.6),
        alpha: (a / 255) * (0.75 + Math.random() * 0.25),
        dx: (fx - 0.5) * w * (0.4 + Math.random() * 0.9) + (Math.random() - 0.5) * w * 0.3,
        dy: -(0.3 + Math.random() * 0.9) * h,
        sway: Math.random() * Math.PI * 2,
        t0: fy * SPREAD + Math.random() * NOISE,
      });
    }
  }
}

function drawGrains(Q) {
  ctx.clearRect(0, 0, dust.width, dust.height);
  ctx.globalCompositeOperation = 'lighter';
  for (const gr of grains) {
    const k = (Q - gr.t0) / LIFE;
    if (k <= 0 || k >= 1) continue;          // still part of the sign, or already gone
    const e = 1 - (1 - k) * (1 - k);         // ease-out drift
    const fade = k < 0.15 ? 1 : 1 - (k - 0.15) / 0.85;
    ctx.globalAlpha = gr.alpha * fade;
    const s = gr.size * (1 - k * 0.55);
    const x = gr.x + gr.dx * e + Math.sin(gr.sway + k * 5) * 5 * k;
    const y = gr.y + gr.dy * e;
    ctx.drawImage(gr.img, x - s / 2, y - s / 2, s, s);
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
  const Q = q * (SPREAD + NOISE + LIFE);                              // all sparks gone at q = 1
  stick.style.setProperty('--approach', approach.toFixed(4));
  stick.style.setProperty('--fade', Math.min(1, q * 1.6).toFixed(4));
  // Rows whose every spark has left are hidden on the real image.
  stick.style.setProperty('--cut', (q > 0 ? (Q - NOISE * 0.5) / SPREAD : -0.2).toFixed(4));

  const nowDissolving = q > 0.001 && grains.length > 0;
  if (nowDissolving !== dissolving) {
    dissolving = nowDissolving;
    stick.classList.toggle('is-dust', dissolving);
    if (!dissolving) { ctx.clearRect(0, 0, dust.width, dust.height); flicker(); }
  }
  if (dissolving) drawGrains(Q);
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
