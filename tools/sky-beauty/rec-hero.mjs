// High-resolution recording: slow every CSS/WAAPI animation down with CDP, take full-DPR screenshots
// as fast as possible, stamp each frame with "animation time", and drive scrolling from that same clock.
import fs from 'fs';
import { chromium } from 'playwright';

const S = process.argv[2];
const RATE = Number(process.env.RATE || 0.2);
const URL = 'http://localhost:8765/demos/sky-beauty/?hero=' + (process.argv[4] || 'a');

const V = process.argv[4] || 'a';
function plan(mobile) {
  const steps = [];
  if (V === 'a') {
    steps.push({ hold: 7.0 });
    if (mobile) steps.push({ click: '.comb-toggle' }, { hold: 0.6 }, { tdrag: [0.42, 0.12, 0.86], dur: 1.0 }, { hold: 0.2 }, { tdrag: [0.58, 0.12, 0.88], dur: 1.0 }, { hold: 1.2 }, { click: '.comb-toggle' }, { hold: 0.4 });
    else steps.push({ comb: [0.42, 0.14, 0.86], dur: 1.1 }, { comb: [0.58, 0.14, 0.88], dur: 1.0 }, { hold: 1.4 });
    steps.push({ scroll: { hero: 0.45 }, dur: 2.4 }, { hold: 1.2 });
  }
  if (V === 'b') {
    steps.push({ hold: 6.2 });
    steps.push({ bdrag: [0.16, 0.95], dur: 1.6 }, { hold: 0.8 }, { bdrag: [0.95, 0.45], dur: 1.0 }, { hold: 1.4 });
  }
  if (V === 'c') {
    steps.push({ hold: 2.6 });
    steps.push({ scroll: { hero: 0.5 }, dur: 4.0 }, { hold: 1.2 }, { scroll: { hero: 0.2 }, dur: 1.6 }, { hold: 0.8 }, { scroll: { hero: 0.5 }, dur: 1.4 }, { hold: 1.2 });
  }
  return steps;
}

async function resolve(p, target) {
  return p.evaluate((t) => {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    if (t.hero !== undefined) return [...document.querySelectorAll('.hero, .hero-b, .hero-c')].find((e) => e.offsetHeight).offsetHeight * t.hero;
    if (t.step !== undefined) return top(document.querySelectorAll('.step')[t.step]) - innerHeight * 0.25;
    if (t.center) { const el = document.querySelector(t.center); const r = el.getBoundingClientRect(); return scrollY + r.top + r.height / 2 - innerHeight / 2; }
    if (t.bottom) return document.documentElement.scrollHeight - innerHeight;
    return top(document.querySelector(t.sel)) - t.off;
  }, target);
}

const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);

async function run(browser, name, w, h, dsf) {
  const mobile = w < 500;
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: mobile, isMobile: mobile });
  await ctx.addInitScript((rate) => {
    const now = performance.now.bind(performance);
    performance.now = () => now() * rate;
    const raf = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (cb) => raf(() => cb(performance.now()));
    const st = window.setTimeout.bind(window);
    window.setTimeout = (fn, d, ...a) => st(fn, (d || 0) / rate, ...a);
  }, RATE);
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Animation.enable');
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await p.evaluate(() => document.fonts.ready);
  if (w >= 500) await p.mouse.move(w * 0.3, h * 0.9);

  const dir = `${S}/hq/${name}-${V}`;
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });

  const steps = plan(w < 500);
  // segment start times in animation seconds
  let acc = 0; for (const s of steps) { s.start = acc; acc += s.dur ?? s.hold ?? 0; }
  const total = acc;
  const t0 = Date.now();
  const stamps = [];
  let idx = -1, from = 0, to = 0;
  for (;;) {
    const t = ((Date.now() - t0) / 1000) * RATE;
    if (t > total) break;
    let i = idx;
    while (i + 1 < steps.length && steps[i + 1].start <= t) i++;
    while (idx < i) { // enter new segments in order
      idx++;
      const s = steps[idx];
      if (s.scroll) { from = await p.evaluate(() => scrollY); to = await resolve(p, s.scroll); }
      if (s.comb) {
        const bx = await p.locator('#hero-canvas').boundingBox();
        s.box = bx;
        await p.mouse.move(bx.x + bx.width * s.comb[0], bx.y + bx.height * s.comb[1], { steps: 4 });
      }
      const prev = steps[idx - 1];
      if (prev && prev.tdrag) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      if (s.tdrag) {
        s.box = await p.locator('#hero-canvas').boundingBox();
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.box.x + s.box.width * s.tdrag[0], y: s.box.y + s.box.height * s.tdrag[1] }] });
      }
      if (prev && prev.bdrag) { if (mobile) await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); else await p.mouse.up(); }
      if (s.bdrag) {
        s.box = await p.locator('.hb-frame').boundingBox();
        const x = s.box.x + s.box.width * 0.85, y = s.box.y + s.box.height * s.bdrag[0];
        const g = await p.locator('.hb-grip').boundingBox();
        s.x = mobile ? g.x + g.width / 2 : x; s.dy = mobile ? (g.y + g.height / 2) - y : 0;
        if (mobile) await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: s.x, y: y + s.dy }] });
        else { await p.mouse.move(x, y, { steps: 5 }); await p.mouse.down(); }
      }
      if (s.fill) await p.fill(s.fill[0], s.fill[1]);
      if (s.click) {
        const bx = await p.locator(s.click).boundingBox();
        const cx = bx.x + bx.width * 0.6, cy = bx.y + bx.height / 2;
        if (mobile) await p.touchscreen.tap(cx, cy);
        else { await p.mouse.move(cx, cy, { steps: 6 }); await p.mouse.click(cx, cy); }
      }
    }
    const s = steps[idx];
    if (s && s.bdrag) {
      const k = Math.min(1, (t - s.start) / s.dur), bx = s.box;
      const y = bx.y + bx.height * (s.bdrag[0] + (s.bdrag[1] - s.bdrag[0]) * k);
      if (mobile) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: s.x, y: y + s.dy }] });
      else await p.mouse.move(s.x, y);
    }
    if (s && s.tdrag) {
      const k = Math.min(1, (t - s.start) / s.dur), bx = s.box;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: bx.x + bx.width * s.tdrag[0], y: bx.y + bx.height * (s.tdrag[1] + (s.tdrag[2] - s.tdrag[1]) * k) }] });
    }
    if (s && s.comb) {
      const k = Math.min(1, (t - s.start) / s.dur), bx = s.box;
      await p.mouse.move(bx.x + bx.width * s.comb[0], bx.y + bx.height * (s.comb[1] + (s.comb[2] - s.comb[1]) * k));
    }
    if (s && s.scroll) {
      const k = Math.min(1, (t - s.start) / s.dur);
      await p.evaluate((y) => scrollTo(0, y), from + (to - from) * ease(k));
    }
    await p.screenshot({ path: `${dir}/${String(stamps.length).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 92 });
    stamps.push(((Date.now() - t0) / 1000) * RATE);
  }
  let list = '';
  for (let i = 0; i < stamps.length; i++) {
    const d = i + 1 < stamps.length ? stamps[i + 1] - stamps[i] : 0.05;
    list += `file '${dir}/${String(i).padStart(5, '0')}.jpg'\nduration ${Math.max(0.001, d).toFixed(4)}\n`;
  }
  list += `file '${dir}/${String(stamps.length - 1).padStart(5, '0')}.jpg'\n`;
  fs.writeFileSync(`${dir}/list.txt`, list);
  console.log(name, 'frames', stamps.length, 'anim seconds', total.toFixed(1), 'fps', (stamps.length / total).toFixed(1));
  await ctx.close();
}

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const which = process.argv[3] || 'both';
if (which !== 'telefons') await run(browser, 'dators', 1280, 800, 1.5);
if (which !== 'dators') await run(browser, 'telefons', 390, 844, 2);
await browser.close();
