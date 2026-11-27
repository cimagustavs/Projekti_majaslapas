// Exports both layout variants of the plan (plan.html = A, plan-b.html = B) to PDF in LV and EN, plus PNG previews.
// Usage: node marketing/rooster/plan/export.mjs
import path from 'path';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const dir = path.dirname(new URL(import.meta.url).pathname);
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
for (const [file, name] of [['plan.html', 'rooster-plans'], ['plan-b.html', 'rooster-plans-b']]) {
  for (const lang of ['lv', 'en']) {
    const p = await b.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 2 });
    await p.goto(`file://${dir}/${file}${lang === 'en' ? '?lang=en' : ''}`);
    await p.evaluate(() => document.fonts.ready);
    const over = await p.evaluate(() => document.querySelector('.page').scrollHeight - document.querySelector('.page').clientHeight);
    if (over > 0) console.log(name, lang, 'content overflows the page by', over, 'px');
    await p.pdf({ path: `${dir}/${name}-${lang}.pdf`, format: 'A4', printBackground: true, preferCSSPageSize: true });
    await p.screenshot({ path: `${dir}/preview-${name === 'rooster-plans' ? '' : 'b-'}${lang}.png` });
    await p.close();
  }
}
await b.close();
console.log('exported');
