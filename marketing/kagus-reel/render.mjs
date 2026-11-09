// Renders reel.html frame by frame into a 1080x1920, 30 fps MP4 (no sound; add music in Instagram).
// Usage: node marketing/kagus-reel/render.mjs <frames-dir> <out.mp4>
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [dir, outFile] = process.argv.slice(2);
const FPS = 30;
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'reel.html') + '?still');
await p.evaluate(() => document.fonts.ready);
const dur = await p.evaluate(() => window.DURATION);
for (let i = 0; i < dur * FPS; i++) {
  await p.evaluate((t) => window.render(t), i / FPS);
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.png` });
}
await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', `${dir}/%05d.png`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', outFile]);
console.log('wrote', outFile, dur * FPS, 'frames');
