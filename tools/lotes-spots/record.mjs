// High-resolution recording: slow every CSS/WAAPI animation down with CDP, take full-DPR screenshots
// as fast as possible, stamp each frame with "animation time", and drive scrolling from that same clock.
import fs from 'fs';
import { chromium } from 'playwright';

const S = process.argv[2];
const RATE = 0.2; // animations run at 1/5 speed while we capture
const URL = 'http://localhost:8765/demos/lotes-spots/';

function plan(mobile) {
  const steps = [{ hold: 3.4 }];
  const y = (sel, off) => ({ sel, off });
  steps.push({ scroll: { hero: 0.5 }, dur: 2.4 }, { hold: 0.5 }, { scroll: { hero: 0 }, dur: 2.0 }, { hold: 0.5 }, { scroll: { hero: 1.0 }, dur: 3.0 }, { hold: 0.3 });
  for (let i = 0; i < 5; i++) steps.push({ scroll: { step: i }, dur: 1.3 }, { hold: 1.3 });
  steps.push({ scroll: y('#paplate', 60), dur: 1.5 }, { hold: 0.8 });
  if (mobile) steps.push({ scroll: y('#picks', 70), dur: 0.7 });
  for (const v of ['Soļanka', 'Gaļas bumbiņas tomātu mērcē', 'Siera kūka', 'Mango Mākonis']) {
    if (mobile) steps.push({ scroll: { center: `.food:has(input[value="${v}"])` }, dur: 0.5 });
    steps.push({ click: `.food:has(input[value="${v}"])` }, { hold: mobile ? 0.6 : 0.8 });
  }
  steps.push({ scroll: { center: '.tray' }, dur: 0.9 }, { hold: 0.5 });
  steps.push({ click: '.mode:has(input[value="delivery"])' }, { hold: 0.7 });
  steps.push({ click: '.tray .plus' }, { hold: 0.5 }, { click: '.tray .plus' }, { hold: 1.2 });
  steps.push({ scroll: y('#burgeri', 40), dur: 1.4 }, { hold: 1.3 });
  steps.push({ scroll: y('.board-list', 120), dur: 0.9 }, { hold: 1.2 });
  steps.push({ scroll: y('.office', 80), dur: 1.4 }, { hold: 1.3 });
  steps.push({ scroll: y('#kur', 60), dur: 1.4 }, { hold: 1.8 });
  steps.push({ scroll: { bottom: true }, dur: 1.2 }, { hold: 1.5 });
  return steps;
}

async function resolve(p, target) {
  return p.evaluate((t) => {
    const top = (el) => el.getBoundingClientRect().top + scrollY;
    if (t.hero !== undefined) return document.querySelector('.street').offsetHeight * t.hero;
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
  const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p);
  await cdp.send('Animation.enable');
  await p.goto(URL, { waitUntil: 'domcontentloaded' });
  await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  await p.evaluate(() => document.fonts.ready);
  if (w >= 500) await p.mouse.move(w * 0.62, h * 0.55);

  const dir = `${S}/hq/${name}`;
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
      if (s.click) {
        const bx = await p.locator(s.click).boundingBox();
        const cx = bx.x + bx.width * 0.6, cy = bx.y + bx.height / 2;
        if (mobile) await p.touchscreen.tap(cx, cy);
        else { await p.mouse.move(cx, cy, { steps: 6 }); await p.mouse.click(cx, cy); }
      }
    }
    const s = steps[idx];
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
