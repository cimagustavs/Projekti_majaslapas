// Renders reel.html frame by frame into a 1080x1920, 30 fps MP4 (no sound; add music in Instagram).
// Each output frame is the average of SUB sub-frames, which gives real motion blur on fast moves.
// Usage: node marketing/kagus-reel/render.mjs <frames-dir> <out.mp4>
import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { createRequire } from 'module';
const { chromium } = createRequire(import.meta.url)('playwright');
const [dir, outFile] = process.argv.slice(2);
const FPS = 30, SUB = 3;
fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const p = await b.newPage({ viewport: { width: 540, height: 960 }, deviceScaleFactor: 2 });
await p.goto('file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), 'reel.html') + '?still');
await p.evaluate(() => document.fonts.ready);
const dur = await p.evaluate(() => window.DURATION);
const n = Math.round(dur * FPS * SUB);
for (let i = 0; i < n; i++) {
  await p.evaluate((t) => window.render(t), i / (FPS * SUB));
  await p.screenshot({ path: `${dir}/${String(i).padStart(5, '0')}.jpg`, type: 'jpeg', quality: 95 });
  if (i % 300 === 0) console.log(i, '/', n);
}
await b.close();
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS * SUB), '-i', `${dir}/%05d.jpg`,
  '-vf', `tmix=frames=${SUB},fps=${FPS}`, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '17', '-preset', 'slow', '-movflags', '+faststart', outFile]);
console.log('wrote', outFile, n, 'sub-frames');
