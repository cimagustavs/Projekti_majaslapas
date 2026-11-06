/* LPG smoothing: a patch of skin lit by a low, raking light, so the "orange peel" dimples cast shadows,
   the way a cosmetologist shows them. The LPG head glides over it as the section scrolls past (or under
   a finger / the mouse), and the skin behind it comes out smooth. Canvas 2D with a height map and per-pixel
   lighting; the dimples are random but stable, so the page looks the same every visit. */
(function () {
  const wrap = document.querySelector('.lpg');
  if (!wrap) return;
  const canvas = wrap.querySelector('canvas');
  const head = wrap.querySelector('.lpg-head');
  const meter = wrap.querySelector('[data-smooth]');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const W = 300, H = 200;
  canvas.width = W; canvas.height = H;

  // height map: many soft, shallow puckers next to each other (that is what "orange peel" is), plus fine grain
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  const height = new Float32Array(W * H);
  for (let n = 0; n < 520; n++) {
    const cx = rnd() * W, cy = rnd() * H, r = 3.5 + rnd() * rnd() * 9, d = 0.25 + rnd() * 0.35;
    const x0 = Math.max(0, cx - r * 2.5 | 0), x1 = Math.min(W - 1, cx + r * 2.5 | 0);
    const y0 = Math.max(0, cy - r * 2.5 | 0), y1 = Math.min(H - 1, cy + r * 2.5 | 0);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const q = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r);
      height[y * W + x] -= d * Math.exp(-q);
    }
  }
  for (let i = 0; i < W * H; i++) height[i] += (rnd() - 0.5) * 0.02;

  // skin colour with a little blush mottling, fixed per pixel
  const GW = 16, GH = 11, grid = Array.from({ length: GW * GH }, () => rnd() - 0.5);
  const skin = new Float32Array(W * H * 3);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const gx = (x / W) * (GW - 1), gy = (y / H) * (GH - 1), ix = gx | 0, iy = gy | 0, fx = gx - ix, fy = gy - iy;
    const g = (a, b) => grid[Math.min(GH - 1, iy + b) * GW + Math.min(GW - 1, ix + a)];
    const m = (g(0, 0) * (1 - fx) + g(1, 0) * fx) * (1 - fy) + (g(0, 1) * (1 - fx) + g(1, 1) * fx) * fy;
    const o = (y * W + x) * 3;
    skin[o] = 236 + m * 10; skin[o + 1] = 204 - m * 8; skin[o + 2] = 184 - m * 6;
  }

  const smooth = new Float32Array(W * H); // 0 = untreated, 1 = smooth
  const img = ctx.createImageData(W, H);
  const SHADOW = [150, 92, 76]; // shadows on skin are warm, never grey
  const LIGHT = [255, 240, 228];

  // raking light from the upper left, low over the surface
  const L = (() => { const v = [-0.8, -0.5, 0.45]; const m = Math.hypot(...v); return v.map((c) => c / m); })();
  const hgt = (k) => height[k] * (1 - smooth[k]);
  function render() {
    const d = img.data;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = y * W + x;
        const hx = hgt(x < W - 1 ? i + 1 : i) - hgt(x > 0 ? i - 1 : i);
        const hy = hgt(y < H - 1 ? i + W : i) - hgt(y > 0 ? i - W : i);
        let nx = -hx * 3, ny = -hy * 3, nz = 1;
        const m = Math.hypot(nx, ny, nz);
        // 0 on a flat surface, negative in the shade of a pucker, positive on the lit rim
        const t = ((nx * L[0] + ny * L[1] + nz * L[2]) / m - L[2]) * 1.8;
        const o = i * 4, c = i * 3;
        for (let ch = 0; ch < 3; ch++) {
          const base = skin[c + ch];
          let v = t < 0 ? base + (SHADOW[ch] - base) * Math.min(1, -t) : base + (LIGHT[ch] - base) * Math.min(1, t);
          v += smooth[i] * 7; // treated skin looks a touch fresher
          d[o + ch] = v;
        }
        d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // the head smooths a band as wide as its rollers, with a soft edge so there is no ridge
  const HX = 30, HY = 27, EDGE = 12;
  const soft = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v));
  function treat(px, py) {
    const x0 = Math.max(0, px - HX - EDGE | 0), x1 = Math.min(W - 1, px + HX + EDGE | 0);
    const y0 = Math.max(0, py - HY - EDGE | 0), y1 = Math.min(H - 1, py + HY + EDGE | 0);
    for (let y = y0; y <= y1; y++) {
      const fy = soft((HY + EDGE - Math.abs(y - py)) / EDGE);
      for (let x = x0; x <= x1; x++) {
        const v = fy * soft((HX + EDGE - Math.abs(x - px)) / EDGE), i = y * W + x;
        if (v > smooth[i]) smooth[i] = v;
      }
    }
  }
  let last = null;
  function moveHead(px, py, apply) {
    const r = canvas.getBoundingClientRect(), k = r.width / W;
    head.style.transform = `translate(${(px * k).toFixed(1)}px, ${(py * k).toFixed(1)}px) translate(-50%, -61%)`;
    if (!apply) { last = null; return; }
    // fill the gap between frames so fast moves leave no stripes
    if (last) {
      const steps = Math.ceil(Math.hypot(px - last[0], py - last[1]) / 6);
      for (let s = 1; s <= steps; s++) treat(last[0] + ((px - last[0]) * s) / steps, last[1] + ((py - last[1]) * s) / steps);
    } else treat(px, py);
    last = [px, py];
    queue();
  }

  let pending = false;
  function queue() {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false; render();
      let sum = 0; for (let i = 0; i < W * H; i += 7) sum += smooth[i];
      const pct = Math.round((sum / (W * H / 7)) * 100);
      meter.textContent = pct + '%';
      wrap.classList.toggle('done', pct >= 97);
    });
  }

  // scroll: the head makes a few passes across the patch, like the real procedure
  const path = (t) => {
    const passes = 4, p = t * passes, row = Math.min(passes - 1, Math.floor(p)), f = p - row;
    const x = row % 2 === 0 ? 24 + f * (W - 48) : W - 24 - f * (W - 48);
    const y = 26 + row * ((H - 52) / (passes - 1));
    return [x, y];
  };
  let dragging = false, scrollT = -1;
  function onScroll() {
    if (dragging) return;
    const r = wrap.getBoundingClientRect();
    // starts once the whole patch is on screen, so the "before" is seen; done by the time it is in the middle
    const from = Math.min(innerHeight - r.height, innerHeight * 0.75), to = Math.min(innerHeight * 0.55 - r.height / 2, from - 180);
    const t = Math.min(1, Math.max(0, (from - r.top) / (from - to)));
    if (t <= 0 || Math.abs(t - scrollT) < 0.002) return;
    const start = scrollT < 0 ? 0 : scrollT;
    scrollT = t;
    // only move forward: once treated, skin stays smooth
    for (let s = start; s <= t; s += 0.004) { const [x, y] = path(s); treat(x, y); }
    const [x, y] = path(t);
    moveHead(x, y, false); queue();
  }

  // mouse anywhere on the patch; a finger only on the head, so the page still scrolls
  const toLocal = (e) => { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * W, ((e.clientY - r.top) / r.height) * H]; };
  wrap.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' && !head.contains(e.target)) return;
    dragging = true; wrap.classList.add('dragging'); wrap.setPointerCapture(e.pointerId);
    const [x, y] = toLocal(e); moveHead(x, y, true); e.preventDefault();
  });
  wrap.addEventListener('pointermove', (e) => { if (!dragging) return; const [x, y] = toLocal(e); moveHead(Math.max(0, Math.min(W, x)), Math.max(0, Math.min(H, y)), true); });
  const stop = () => { dragging = false; last = null; wrap.classList.remove('dragging'); };
  wrap.addEventListener('pointerup', stop); wrap.addEventListener('pointercancel', stop);
  wrap.querySelector('.lpg-reset').addEventListener('click', () => { smooth.fill(0); scrollT = -1; moveHead(24, 26, false); queue(); });

  if (reduce) { for (let s = 0; s <= 0.5; s += 0.004) { const [x, y] = path(s); treat(x, y); } }
  moveHead(24, 26, false);
  render(); queue();
  if (!reduce) addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { const [x, y] = last || path(Math.max(0, scrollT)); moveHead(x, y, false); });
})();
