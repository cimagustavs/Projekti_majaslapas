/* Hero versions B and C. Version A (drawn hair you comb) lives in script.js.
   Uses clamp, smooth, reduce, Hair and watchSpeed from script.js / hair.js. */

const heroVariant = document.documentElement.dataset.hero;
if (heroVariant === 'b') initPhotoHero();
if (heroVariant === 'c') initIronHero();

/* ---------- B: the salon's own before/after, combed open ---------- */

function initPhotoHero() {
  const frame = document.querySelector('.hb-frame');
  const handle = frame.querySelector('.hb-comb');
  let cut = 0, touched = false, dragging = false;

  const set = (v) => {
    cut = clamp(v, 0, 100);
    frame.style.setProperty('--cut', cut.toFixed(2));
    handle.setAttribute('aria-valuenow', Math.round(cut));
  };
  const tween = (to, ms) => new Promise((done) => {
    const from = cut, t0 = performance.now();
    const step = (now) => {
      if (touched) return done();
      const k = clamp((now - t0) / ms, 0, 1);
      set(from + (to - from) * smooth(k));
      if (k < 1) requestAnimationFrame(step); else done();
    };
    requestAnimationFrame(step);
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  // show the result once, then pull the comb back up so the visitor can do it
  if (reduce) set(100);
  else setTimeout(async () => {
    await tween(100, 1800);
    await wait(1100);
    if (!touched) await tween(16, 1200);
  }, 900);

  // a mouse can drag anywhere on the photo; a finger only on the comb, so the page still scrolls
  const follow = (e) => {
    const r = frame.getBoundingClientRect();
    set(((e.clientY - r.top) / r.height) * 100);
  };
  frame.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && !handle.contains(e.target)) return;
    touched = dragging = true;
    frame.setPointerCapture(e.pointerId);
    follow(e);
    e.preventDefault();
  });
  frame.addEventListener('pointermove', (e) => { if (dragging) follow(e); });
  frame.addEventListener('pointerup', () => { dragging = false; });
  frame.addEventListener('pointercancel', () => { dragging = false; });
  handle.addEventListener('keydown', (e) => {
    const d = { ArrowDown: 5, ArrowUp: -5, PageDown: 25, PageUp: -25, Home: -100, End: 100 }[e.key];
    if (d === undefined) return;
    touched = true;
    e.preventDefault();
    set(cut + d);
  });
}

/* ---------- C: dark, a flat iron straightens the hair as you scroll ---------- */

function initIronHero() {
  const sec = document.querySelector('.hero-c');
  const canvas = document.getElementById('hc-canvas');
  const stage = sec.querySelector('.hc-stage');
  const iron = sec.querySelector('.hc-iron');
  const steam = sec.querySelector('.hc-steam');
  const { TOP, len } = Hair.geometry;
  const hair = Hair.mount(canvas, { n: innerWidth < 700 ? 170 : 200, pts: 30, seed: 23, f: 1, reveal: reduce ? 1 : 0 });
  const speed = watchSpeed(hair);
  const start = performance.now();

  let u = 0, target = 0, manual = null, dragging = false;
  let visible = true, running = false, last = start, lastPuff = 0;

  function fromScroll() {
    if (dragging) return;
    manual = null;
    const h = sec.offsetHeight || innerHeight;
    target = clamp(scrollY / (h * 0.45), 0, 1) * 1.04;
  }
  addEventListener('scroll', fromScroll, { passive: true });
  fromScroll();

  function placeIron() {
    const q = hair.toScreen(200, TOP + Math.min(u, 1) * len);
    const st = stage.getBoundingClientRect();
    const w = 300 * q.k * 0.98;
    iron.style.width = w.toFixed(1) + 'px';
    // the plates' centre sits at x=131 of the 300-wide drawing
    iron.style.transform = `translate(${(q.x - st.left - (131 / 300) * w).toFixed(1)}px, ${(q.y - st.top - w * 0.1).toFixed(1)}px)`;
    return { x: q.x - st.left, y: q.y - st.top, w: 250 * q.k };
  }

  function puff(p) {
    if (reduce) return;
    const el = document.createElement('span');
    el.className = 'hc-puff';
    el.style.left = (p.x + (Math.random() - 0.5) * p.w * 0.9).toFixed(1) + 'px';
    el.style.top = (p.y - 10).toFixed(1) + 'px';
    steam.append(el);
    el.animate([
      { transform: 'translate(-50%, 0) scale(0.6)', opacity: 0.8 },
      { transform: `translate(${(Math.random() - 0.5) * 30 - 50}%, -70px) scale(2.6)`, opacity: 0 },
    ], { duration: 1200, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' }).onfinish = () => el.remove();
  }

  function frame(now) {
    const raw = (now - last) / 1000, dt = Math.min(0.05, raw);
    last = now;
    const st = hair.st;
    if (!reduce) st.time += dt;
    if (st.reveal < 1) st.reveal = Math.min(1, (now - start) / 1600);
    speed(raw, st.reveal >= 1);

    const goal = manual ?? target;
    const before = u;
    u += (goal - u) * Math.min(1, dt * 6);
    hair.brush(u, 99);
    st.shineY = Math.max(0.06, u * 0.42);
    hair.draw();
    const p = placeIron();
    // steam while the iron is moving over the hair
    if (Math.abs(u - before) > 0.0015 && u > 0.01 && u < 1 && now - lastPuff > 70) { puff(p); lastPuff = now; }

    if (visible) requestAnimationFrame(frame); else running = false;
  }
  function run() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(sec);

  // with a mouse you can also grab the iron and pull it yourself
  stage.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse') return;
    dragging = true;
    stage.setPointerCapture(e.pointerId);
    manual = clamp(hair.toView(e.clientX, e.clientY).y - TOP, 0, len) / len;
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    manual = clamp(hair.toView(e.clientX, e.clientY).y - TOP, 0, len) / len;
  });
  stage.addEventListener('pointerup', () => { dragging = false; });
}
