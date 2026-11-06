// Phone and desktop walk-through of the Siluets demo
import fs from 'fs';
import { createRequire } from 'module'; const { chromium } = createRequire(import.meta.url)('playwright');
const S = process.argv[2], RATE = 0.2;
const ease = (k) => (k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2);
function plan(m) {
  const st = [{ hold: 3.6 }, { click: '.dot[data-zone="seja"]' }, { hold: 1.4 }, { click: '.dot[data-zone="kermenis"]' }, { hold: 1.6 }];
  if (m) st.push({ scroll: { center: '#zone-panel' }, dur: 1 }, { hold: 1.4 });
  st.push({ scroll: { sel: '.facts', off: 60 }, dur: 1.4 }, { hold: 0.8 }, { scroll: { sel: '.lpg', off: m ? 520 : 420 }, dur: 1.2 }, { hold: 0.8 }, { scroll: { center: '.lpg' }, dur: 3.2 }, { hold: 2 });
  st.push({ scroll: { sel: '#cenas', off: 30 }, dur: 1.4 }, { hold: 0.6 }, { click: 'details.pg >> nth=3' }, { hold: 1.4 });
  st.push({ scroll: { sel: '#palidziba', off: 30 }, dur: 1.4 }, { hold: 2 });
  st.push({ scroll: { sel: '#kursi', off: 30 }, dur: 1.4 }, { hold: 1.6 });
  st.push({ scroll: { sel: '#darbi', off: 30 }, dur: 1.2 }, { hold: 1.0 });
  st.push({ scroll: { sel: '#pieraksts', off: 20 }, dur: 1.4 }, { hold: 0.6 }, { click: '.chip[data-g="lpg"]' }, { hold: 0.7 });
  if (m) st.push({ scroll: { center: '#svc-list' }, dur: 0.6 });
  st.push({ click: '.svc >> nth=0' }, { hold: 0.9 }, { scroll: { center: '#days' }, dur: 0.5 }, { click: '.day:not([disabled]) >> nth=1' }, { hold: 0.8 });
  st.push({ scroll: { center: '#slots' }, dur: 0.5 }, { click: '.slot:not([disabled]) >> nth=1' }, { hold: 0.8 }, { scroll: { center: 'input[name=talr]' }, dur: 0.5 });
  st.push({ fill: ['input[name=vards]', 'Laura'] }, { hold: 0.4 }, { fill: ['input[name=talr]', '+371 20 000 000'] }, { hold: 0.5 }, { click: '#book button[type=submit]' }, { hold: 2.6 });
  st.push({ scroll: { sel: '#kur', off: 30 }, dur: 1.4 }, { hold: 3 });
  return st;
}
async function run(b, name, w, h, dsf) {
  const m = w < 500;
  const ctx = await b.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf, hasTouch: m, isMobile: m });
  const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await cdp.send('Animation.enable');
  await p.goto('http://localhost:8765/demos/siluets/', { waitUntil: 'domcontentloaded' });
  await cdp.send('Animation.setPlaybackRate', { playbackRate: RATE });
  await p.evaluate(() => { document.documentElement.style.scrollBehavior = 'auto'; });
  const dir = `${S}/hq/${name}`; fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const steps = plan(m); let acc = 0; for (const s of steps) { s.start = acc; acc += s.dur ?? s.hold ?? 0; }
  const t0 = Date.now(), stamps = []; let idx = -1, from = 0, to = 0;
  for (;;) {
    const t = ((Date.now() - t0) / 1000) * RATE; if (t > acc) break;
    let i = idx; while (i + 1 < steps.length && steps[i + 1].start <= t) i++;
    while (idx < i) {
      idx++; const s = steps[idx];
      if (s.scroll) { from = await p.evaluate(() => scrollY); to = await p.evaluate((x) => { const el = document.querySelector(x.center || x.sel); if (!el) return scrollY; const r = el.getBoundingClientRect(); return x.center ? scrollY + r.top + r.height / 2 - innerHeight / 2 : scrollY + r.top - x.off; }, s.scroll); }
      if (s.fill) await p.fill(s.fill[0], s.fill[1], { timeout: 3000 }).catch(() => console.log('fill failed', s.fill[0]));
      if (s.click) { await p.locator(s.click).first().evaluate((el) => el.scrollIntoView({ block: 'nearest', inline: 'center' })).catch(() => {});
        const bx = await p.locator(s.click).first().boundingBox({ timeout: 3000 }).catch(() => null); if (!bx) console.log('missing', s.click, 'at', t.toFixed(1)); if (bx) { const cx = bx.x + bx.width * 0.5, cy = bx.y + Math.min(bx.height / 2, 28); if (m) await p.touchscreen.tap(cx, cy); else { await p.mouse.move(cx, cy, { steps: 6 }); await p.mouse.click(cx, cy); } } }
    }
    const s = steps[idx];
    if (s && s.scroll) await p.evaluate((y) => scrollTo(0, y), from + (to - from) * ease(Math.min(1, (t - s.start) / s.dur)));
    await p.screenshot({ path: `${dir}/${String(stamps.length).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 90 });
    stamps.push(((Date.now() - t0) / 1000) * RATE);
  }
  let list = ''; for (let i = 0; i < stamps.length; i++) list += `file '${dir}/${String(i).padStart(5, '0')}.jpg'\nduration ${Math.max(0.001, (stamps[i + 1] ?? stamps[i] + 0.05) - stamps[i]).toFixed(4)}\n`;
  list += `file '${dir}/${String(stamps.length - 1).padStart(5, '0')}.jpg'\n`; fs.writeFileSync(`${dir}/list.txt`, list);
  console.log(name, stamps.length, 'frames'); await ctx.close();
}
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
await run(b, 'telefons', 390, 844, 2); await run(b, 'dators', 1280, 800, 1.5); await b.close();
