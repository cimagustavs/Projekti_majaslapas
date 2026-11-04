// Look at an animation reference the way a person would: open it in a real browser, scroll through it,
// and save screenshots plus a short video, so the motion can be studied instead of guessed.
// Usage: node tools/inspo/look.mjs <url> <out-dir> [seconds=8] [width=1280] [height=800]
// Pages behind a "verify you are human" check (CodePen, Lapa Ninja) are skipped, not bypassed.
import fs from 'fs';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');

const [url, out, secs = '8', w = '1280', h = '800'] = process.argv.slice(2);
if (!url || !out) { console.log('usage: node tools/inspo/look.mjs <url> <out-dir> [seconds] [width] [height]'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });

const b = await chromium.launch({ executablePath: fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined });
const ctx = await b.newContext({
  viewport: { width: +w, height: +h },
  recordVideo: { dir: out, size: { width: +w, height: +h } },
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
});
const p = await ctx.newPage();
const res = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 }).catch((e) => ({ status: () => 'ERR ' + e.message.slice(0, 60) }));
await p.waitForTimeout(2500);
const title = await p.title();
if (/just a moment|verify/i.test(title)) { console.log('blocked by a bot check, skipped:', url); await ctx.close(); await b.close(); process.exit(0); }

await p.screenshot({ path: `${out}/0-top.png` });
const total = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const stepsN = Math.max(1, Math.round((+secs * 1000) / 120));
for (let i = 1; i <= stepsN; i++) {
  await p.mouse.move(+w * (0.3 + 0.4 * Math.sin(i / 7)), +h * 0.5);
  await p.evaluate((y) => scrollTo(0, y), (total * i) / stepsN);
  await p.waitForTimeout(120);
  if (i === Math.round(stepsN / 2)) await p.screenshot({ path: `${out}/1-middle.png` });
}
await p.screenshot({ path: `${out}/2-bottom.png` });
const text = (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, ' ').slice(0, 3000);
fs.writeFileSync(`${out}/page.txt`, `${title}\n${url}\n\n${text}\n`);
const video = await p.video().path();
await ctx.close(); await b.close();
fs.renameSync(video, `${out}/scroll.webm`);
console.log(res.status(), title, '→', out);
