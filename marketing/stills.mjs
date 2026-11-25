// Saves stills of a frame-by-frame reel page (one with window.render(t)) at the given times.
// Usage: node marketing/stills.mjs <reel.html> <out-dir> 0.5 2 4.2 ...
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [html, out, ...times] = process.argv.slice(2);
fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: +(process.env.DSF || 1) });
const errs = []; p.on('pageerror', (e) => errs.push(e.message));
await p.goto('file://' + path.resolve(html) + '?still'); await p.evaluate(() => document.fonts.ready);
for (const t of times) { await p.evaluate((t) => window.render(t), +t); await p.screenshot({ path: `${out}/s-${t}.png` }); }
if (errs.length) console.log('page errors:', errs);
await b.close();
