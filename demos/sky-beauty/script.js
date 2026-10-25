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
const heroSvg = document.getElementById('hero-hair');
const combEl = heroFig.querySelector('.comb');
const hero = Hair.mount(heroSvg, { id: 'h', n: 110, pts: 56, seed: 11 });
hero.draw();

let fTarget = 1;
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
  const m = heroSvg.getScreenCTM();
  const fig = heroFig.getBoundingClientRect();
  const x = m.a * svgX + m.e - fig.left, y = m.d * svgY + m.f - fig.top;
  const w = width || combEl.offsetWidth;
  if (width) combEl.style.width = w + 'px';
  combEl.style.transform = `translate(${(x - w / 2).toFixed(1)}px, ${(y - w * 0.12).toFixed(1)}px)`;
}

function heroFrame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const st = hero.st;
  if (!reduce) st.time += dt;
  st.f += (fTarget - st.f) * Math.min(1, dt * 7);

  // the brush stroke that plays once after the hair has drawn in
  if (sweepStart !== null) {
    const k = clamp((now - sweepStart) / 1500, 0, 1);
    const u = smooth(k) * 1.1;
    hero.brush(u, 1.6);
    const m = heroSvg.getScreenCTM();
    combTo(200, TOP + Math.min(u, 1) * (HEM - TOP), 250 * m.a);
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
  st.shine = sleek * sleek * 0.85;
  st.shineY = 0.12 + sleek * 0.32;
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
  if (s > 0.55) setCap(2);
  else if (cap === 2) setCap(1);
}
addEventListener('scroll', onHeroScroll, { passive: true });
onHeroScroll();

if (reduce) {
  setCap(1);
} else {
  heroSvg.classList.add('intro');
  setTimeout(() => heroSvg.classList.remove('intro'), 1500 + 40 * 16 + 100);
  setTimeout(() => {
    if (cap === 2) { introDone = true; return; }
    setCap(0);
    combEl.classList.add('on');
    sweepStart = performance.now();
    introDone = true;
  }, 1700);
}

// comb with the mouse, or with a finger while scrolling
function combAt(clientX, clientY) {
  const p = new DOMPoint(clientX, clientY).matrixTransform(heroSvg.getScreenCTM().inverse());
  const over = p.y > TOP - 30 && p.y < HEM + 30 && p.x > 40 && p.x < 360;
  if (over) hero.comb(p.x, p.y, 30);
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
  for (const t of e.touches) combAt(t.clientX, t.clientY);
}, { passive: true });

/* ---------- formula quiz ---------- */

const form = document.getElementById('quiz');
const quizSvg = document.getElementById('quiz-hair');
const resultEl = document.getElementById('result');
const quizHair = Hair.mount(quizSvg, { id: 'q', n: 80, pts: 48, seed: 5, f: 0.95, fuzz: 60 });
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
  const body = root.lang === 'lv'
    ? `Sveiki! Mani mati: ${tips.label}, ${kas.label}, ${garums.label}. Gribētu pierakstīties uz konsultāciju (${title}).`
    : `Здравствуйте! Мои волосы: ${tips.label}, ${kas.label}, ${garums.label}. Хочу записаться на консультацию (${title}).`;
  document.getElementById('result-sms').href = 'sms:+37120177678?&body=' + encodeURIComponent(body);
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

function quizFrame(now) {
  const dt = Math.min(0.05, (now - qLast) / 1000);
  qLast = now;
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

/* ---------- language ---------- */

const langBtn = document.querySelector('.lang');
function setLang(lang) {
  root.lang = lang;
  langBtn.textContent = lang === 'lv' ? 'RU' : 'LV';
  langBtn.setAttribute('aria-label', lang === 'lv' ? 'Переключить на русский' : 'Pārslēgt uz latviešu valodu');
  try { localStorage.setItem('sky-lang', lang); } catch {}
  if (lastResult) showResult(false);
}
let savedLang = null;
try { savedLang = localStorage.getItem('sky-lang'); } catch {}
if (!savedLang && navigator.language?.toLowerCase().startsWith('ru')) savedLang = 'ru';
setLang(savedLang === 'ru' ? 'ru' : 'lv');
langBtn.addEventListener('click', () => setLang(root.lang === 'lv' ? 'ru' : 'lv'));
