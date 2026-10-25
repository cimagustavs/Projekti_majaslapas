/* A head of long hair seen from behind.
   frizz 1 = dry and fluffy, 0 = sleek blunt cut. The geometry has no DOM access, so Node can run it
   and bake a static SVG snapshot into index.html for no-JS viewers; browsers draw it live on a canvas. */
(function (g) {
  const CX = 200, TOP = 62, HY = 172, R = 94, HEM = 560;
  const VB = { x: 20, y: 40, w: 360, h: 560 }; // the visible window, same as the SVG viewBox

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function rng(seed) {
    return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  // Real hair moves in clumps: strands next to each other share a wave and a parting.
  function makeStrands(n, seed) {
    const r = rng(seed);
    const clumps = [];
    for (let i = 0; i < Math.round(n / 9); i++) {
      clumps.push({ ph: r() * 6.283, k: 0.75 + r() * 0.55, a: 0.6 + r() * 0.8, sep: (r() - 0.5) * 2 });
    }
    const list = [];
    for (let i = 0; i < n; i++) {
      const t = ((i + 0.2 + r() * 0.6) / n) * 2 - 1;
      list.push({
        t, cl: clumps[Math.min(clumps.length - 1, Math.floor(((t + 1) / 2) * clumps.length))],
        ph: r() * 6.283, ph2: r() * 6.283,
        k: 0.75 + r() * 0.6, a: 0.5 + r(), cut: r(), flow: (r() - 0.5) * 2,
        w: 0.55 + r() * r() * 1.6, tone: Math.floor(r() * 3), lum: r(),
        fly: r() < 0.18, comb: 0, cu: 0, hold: 0,
      });
    }
    // outer strands wrap round the head, so they sit underneath the ones down the middle
    list.sort((a, b) => Math.abs(b.t) - Math.abs(a.t));
    return list;
  }

  // short broken-off hairs that stand out from the surface: the actual "pūka"
  function makeFuzz(n, seed) {
    const r = rng(seed + 101);
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push({
        side: r() < 0.5 ? -1 : 1, ya: TOP + 6 + Math.pow(r(), 0.8) * (HEM - TOP - 40),
        inset: 0.55 + r() * 0.45, len: 8 + r() * 24, tilt: (r() - 0.5) * 1.3,
        bend: (r() - 0.5) * 26, ph: r() * 6.283, w: 0.35 + r() * 0.5,
      });
    }
    return list;
  }

  // half-width of the hair silhouette at height y: the skull, then a slight flare to the ends
  function half(y) {
    if (y < HY) {
      const d = (HY - y) / (HY - TOP);
      return R * Math.sqrt(Math.max(0, 1 - d * d));
    }
    return R + (y - HY) * 0.07;
  }

  const len = HEM - TOP - 2;
  const uAt = (y) => clamp((y - TOP - 2) / len, 0, 1);
  const combedAt = (s, u) => s.comb * clamp((s.cu - u) / 0.1 + 0.5, 0, 1);

  // one point of a strand at fraction u of its length → writes into out[0], out[1]
  function strandPoint(s, st, u, out) {
    const m = combedAt(s, u);
    const f = st.f * (1 - m), c = st.curl * (1 - m), cl = s.cl;
    const y = TOP + 2 + u * len * (1 - f * 0.09 * s.cut);
    const e = Math.pow(u, 1.2);
    let x = CX + s.t * half(y) * (1 + f * 0.24 * u * u + c * 0.1 * u);
    // frizz: the clump bends together, single hairs kink on their own
    x += f * e * (4.5 * cl.a * Math.sin(u * cl.k * 21 + cl.ph + st.time * 0.6)
      + 2.6 * s.a * Math.sin(u * 62 * s.k + s.ph2 - st.time));
    if (s.fly) x += f * e * 28 * (s.t < 0 ? -1 : 1) * Math.sin(u * 2.6 + s.ph * 0.2);
    x += c * e * 10 * Math.sin(u * cl.k * 30 + cl.ph);
    // sleek hair still flows a little, splits into pieces at the ends and tucks in at the cut
    const sleek = 1 - f;
    x += sleek * (s.flow * 1.1 * Math.sin(u * 3 + s.ph) + cl.sep * 2.4 * Math.pow(u, 4) - s.t * 7 * Math.pow(u, 7));
    x += Math.sin(st.time * 0.9 + s.t * 2) * u * u * 1.6;
    out[0] = x;
    out[1] = y + f * e * 3 * Math.sin(u * 47 * s.k + s.ph2);
  }

  function fuzzPoints(z, st, amt) {
    const u = uAt(z.ya);
    const hx = half(z.ya) * (1 + st.f * 0.24 * u * u);
    const x0 = CX + z.side * hx * z.inset, y0 = z.ya;
    // outward normal: round over the skull, sideways further down
    let nx = z.side, ny = 0;
    if (z.ya < HY) { nx = (x0 - CX) / R; ny = (z.ya - HY) / R; const l = Math.hypot(nx, ny) || 1; nx /= l; ny /= l; }
    const c = Math.cos(z.tilt), sn = Math.sin(z.tilt);
    const dx = nx * c - ny * sn, dy = nx * sn + ny * c;
    const L = z.len * amt * (1 + 0.12 * Math.sin(st.time * 1.3 + z.ph)) + 0.01;
    const x1 = x0 + dx * L, y1 = y0 + dy * L;
    return [x0, y0, (x0 + x1) / 2 - dy * z.bend * amt, (y0 + y1) / 2 + dx * z.bend * amt, x1, y1];
  }

  function massPoints(st) {
    const f = st.f * 0.55, c = st.curl, steps = 30, out = [];
    for (const sign of [-1, 1]) {
      const side = [];
      for (let j = 0; j <= steps; j++) {
        const u = j / steps;
        const y = TOP + 2 + u * len * (1 - f * 0.05);
        side.push([CX + sign * half(y) * 0.95 * (1 + f * 0.24 * u * u + c * 0.1 * u), y]);
      }
      out.push(...(sign < 0 ? side : side.reverse()));
    }
    return out;
  }

  const CAPE = 'M14 600C22 452 104 412 200 404C296 412 378 452 386 600Z';

  function rgba(hex, a) {
    const h = hex.replace('#', '');
    const v = h.length === 3 ? h.split('').map((c) => parseInt(c + c, 16)) : [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
    return `rgba(${v[0]},${v[1]},${v[2]},${a})`;
  }

  /* ---------- static SVG snapshot (no-JS) ---------- */

  function markup(id, strands, st, pts, fuzz) {
    const tone = (i) =>
      `<linearGradient id="${id}-t${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="${HEM}">` +
      `<stop offset="0" style="stop-color:var(--hair-root)"/>` +
      `<stop offset="0.42" style="stop-color:var(--hair-mid${i})"/>` +
      `<stop offset="1" style="stop-color:var(--hair-end${i})"/></linearGradient>`;
    const p = [0, 0];
    const mass = 'M' + massPoints(st).map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
    let s = `<defs>${tone(0)}${tone(1)}${tone(2)}</defs><path class="cape" d="${CAPE}"/>` +
      `<path class="mass" d="${mass}" fill="url(#${id}-t0)"/><g class="strands" fill="none" stroke-linecap="round">`;
    strands.forEach((x) => {
      let d = '';
      for (let j = 0; j <= pts; j++) { strandPoint(x, st, j / pts, p); d += (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }
      s += `<path stroke="url(#${id}-t${x.tone})" stroke-width="${(x.w * 1.4).toFixed(2)}" d="${d}"/>`;
    });
    s += '</g>';
    (fuzz || []).forEach(() => {}); // the snapshot is the sleek state, so no fuzz
    return s;
  }

  /* ---------- live canvas renderer ---------- */

  function mount(canvas, opts) {
    const pts = opts.pts || 44, n = opts.n || 240;
    const strands = makeStrands(n, opts.seed || 11);
    const fuzz = makeFuzz(opts.fuzz ?? 110, opts.seed || 11);
    const st = { f: opts.f ?? 1, curl: 0, time: 0, shine: 0.9, shineY: 0.2, reveal: opts.reveal ?? 1 };
    const ctx = canvas.getContext('2d');
    const P = pts + 1;
    const xs = new Float32Array(n * P), ys = new Float32Array(n * P);
    const fAtBand = new Float32Array(n);
    const pt = [0, 0];
    let scale = 1, colors = null, grads = null;
    // quality 0: full pixel density; 1 and 2: fewer pixels for devices that can't keep up
    let quality = 0;

    function resize() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min([2, 1.25, 1][quality], window.devicePixelRatio || 1);
      const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      scale = canvas.width / VB.w;
      grads = null;
    }

    // colours come from CSS custom properties, so the quiz can recolour with a class
    function readColors() {
      const cs = getComputedStyle(canvas);
      const v = (k) => cs.getPropertyValue(k).trim();
      colors = { root: v('--hair-root'), mid: [v('--hair-mid0'), v('--hair-mid1'), v('--hair-mid2')], end: [v('--hair-end0'), v('--hair-end1'), v('--hair-end2')] };
      grads = null;
    }

    function makeGrads() {
      const tone = (i, a = 0.42) => {
        const gr = ctx.createLinearGradient(0, TOP, 0, HEM);
        gr.addColorStop(0, colors.root); gr.addColorStop(a, colors.mid[i]); gr.addColorStop(1, colors.end[i]);
        return gr;
      };
      // the underlayer fades out before the ends, so thin frizzy tips don't sit on a hard edge
      const under = ctx.createLinearGradient(0, TOP, 0, HEM);
      under.addColorStop(0, rgba(colors.root, 1)); under.addColorStop(0.62, rgba(colors.mid[2], 0.95)); under.addColorStop(0.92, rgba(colors.mid[2], 0));
      const cape = ctx.createLinearGradient(0, 404, 0, 600);
      cape.addColorStop(0, '#26201d'); cape.addColorStop(1, '#0d0b0a');
      // roundness: darker towards both sides of the head
      const side = ctx.createLinearGradient(CX - 150, 0, CX + 150, 0);
      side.addColorStop(0, 'rgba(15,8,4,0.55)'); side.addColorStop(0.3, 'rgba(15,8,4,0.08)');
      side.addColorStop(0.5, 'rgba(15,8,4,0)'); side.addColorStop(0.7, 'rgba(15,8,4,0.08)'); side.addColorStop(1, 'rgba(15,8,4,0.55)');
      const crown = ctx.createRadialGradient(CX, TOP + 40, 5, CX, TOP + 40, 120);
      crown.addColorStop(0, 'rgba(255,240,225,0.10)'); crown.addColorStop(1, 'rgba(255,240,225,0)');
      grads = { tone: [tone(0), tone(1), tone(2)], under, cape, side, crown };
    }

    function compute() {
      for (let i = 0; i < n; i++) {
        const s = strands[i], o = i * P;
        for (let j = 0; j < P; j++) {
          strandPoint(s, st, j / pts, pt);
          xs[o + j] = pt[0]; ys[o + j] = pt[1];
        }
      }
    }

    // stroke a set of strands from point index a to b. Each strand is its own path: one big path of
    // overlapping strands makes the rasteriser merge every outline, which is many times slower.
    function strokeSet(filter, a, b) {
      for (let i = 0; i < n; i++) {
        if (!filter(strands[i], i)) continue;
        const o = i * P, lim = Math.min(b(i), pts);
        const from = Math.max(0, a(i));
        if (lim <= from) continue;
        ctx.beginPath();
        ctx.moveTo(xs[o + from], ys[o + from]);
        // quadratic curves through the midpoints: smooth hair from few points
        for (let j = from + 1; j < lim; j++) {
          ctx.quadraticCurveTo(xs[o + j], ys[o + j], (xs[o + j] + xs[o + j + 1]) / 2, (ys[o + j] + ys[o + j + 1]) / 2);
        }
        ctx.lineTo(xs[o + lim], ys[o + lim]);
        ctx.stroke();
      }
    }

    function draw() {
      if (!colors) readColors();
      if (!grads) makeGrads();
      compute();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.setTransform(scale, 0, 0, scale, -VB.x * scale, -VB.y * scale);
      ctx.lineCap = 'round'; ctx.lineJoin = 'bevel';
      ctx.globalCompositeOperation = 'source-over';

      // how much of each strand is drawn during the opening draw-in
      const rev = clamp(st.reveal, 0, 1);
      const endIdx = rev >= 1 ? () => pts : (i) => Math.floor(clamp(rev * 1.6 - (i % 40) / 40 * 0.6, 0, 1) * pts);
      const zero = () => 0;

      // dense underlayer so the head never looks see-through
      ctx.globalAlpha = 0.96 * clamp(rev * 1.5 - 0.3, 0, 1);
      // the underlayer fades out before the ends, so thin frizzy tips don't sit on a hard edge;
      // sleek hair is dense right down to the cut
      const under = ctx.createLinearGradient(0, TOP, 0, HEM);
      const sl = 1 - st.f;
      under.addColorStop(0, rgba(colors.root, 1));
      under.addColorStop(0.62 + 0.3 * sl, rgba(colors.mid[2], 0.95));
      under.addColorStop(Math.min(1, 0.92 + 0.08 * sl), rgba(colors.mid[2], 0));
      ctx.fillStyle = under;
      ctx.beginPath();
      massPoints(st).forEach((q, k) => (k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])));
      ctx.closePath(); ctx.fill();

      // strands, batched by colour and thickness
      const skip = 1, thick = 1;
      for (let tone = 0; tone < 3; tone++) {
        ctx.strokeStyle = grads.tone[tone];
        for (const [lo, hi, w, a] of [[0, 1.1, 1.0, 0.8], [1.1, 9, 1.7, 0.93]]) {
          ctx.lineWidth = w * thick; ctx.globalAlpha = a;
          strokeSet((s, i) => i % skip === 0 && s.tone === tone && s.w >= lo && s.w < hi, zero, endIdx);
        }
      }

      // gloss: two soft bands of light that only smooth hair catches
      if (rev >= 1 && st.shine > 0.01) {
        const by = TOP + st.shineY * len, l2 = by + 0.36 * len;
        const gl = ctx.createLinearGradient(0, by - 70, 0, l2 + 40);
        const at = (y) => clamp((y - (by - 70)) / (l2 + 40 - (by - 70)), 0, 1);
        gl.addColorStop(0, 'rgba(255,241,224,0)');
        gl.addColorStop(at(by - 22), 'rgba(255,241,224,0.5)');
        gl.addColorStop(at(by), 'rgba(255,241,224,0.85)');
        gl.addColorStop(at(by + 26), 'rgba(255,241,224,0.35)');
        gl.addColorStop(at(by + 70), 'rgba(255,241,224,0)');
        gl.addColorStop(at(l2 - 10), 'rgba(255,241,224,0.2)');
        gl.addColorStop(1, 'rgba(255,241,224,0)');
        const sleek = (1 - st.f) ** 2;
        if (sleek > 0.01) {
          ctx.globalCompositeOperation = 'source-atop';
          ctx.globalAlpha = 0.42 * sleek * st.shine;
          ctx.fillStyle = gl;
          ctx.fillRect(VB.x, by - 70, VB.w, l2 - by + 110);
        }
        // freshly combed strands shine on their own, even while the rest is frizzy
        if (st.f > 0.15) {
          for (let i = 0; i < n; i++) fAtBand[i] = combedAt(strands[i], st.shineY + 0.2);
          ctx.globalCompositeOperation = 'screen';
          ctx.strokeStyle = gl; ctx.lineWidth = 1.1;
          ctx.globalAlpha = 0.45 * st.shine * st.f;
          strokeSet((s, i) => fAtBand[i] > 0.5, zero, () => pts);
        }
      }

      // shade the sides and light the crown, only where hair is already drawn
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 1;
      ctx.fillStyle = grads.side; ctx.fillRect(VB.x, TOP - 20, VB.w, HEM - TOP + 30);
      ctx.fillStyle = grads.crown; ctx.fillRect(VB.x, TOP - 20, VB.w, 200);
      // frizzy hair scatters light and looks lighter and flatter
      if (st.f > 0.02) {
        ctx.globalAlpha = 0.14 * st.f;
        ctx.fillStyle = colors.end[1];
        ctx.fillRect(VB.x, TOP - 20, VB.w, HEM - TOP + 30);
      }

      // the cape goes behind everything drawn so far
      ctx.globalCompositeOperation = 'destination-over';
      ctx.globalAlpha = 1;
      ctx.fillStyle = grads.cape;
      ctx.fill(new Path2D(CAPE));

      // flyaways sit on top and only show while the hair is frizzy
      let combed = 0;
      for (const s of strands) combed += s.comb * clamp(s.cu, 0, 1);
      const amt = st.f * (1 - combed / n) * clamp(rev * 2 - 1, 0, 1);
      if (amt > 0.02) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = grads.tone[1];
        ctx.globalAlpha = Math.min(0.85, amt);
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        for (const z of fuzz) {
          const q = fuzzPoints(z, st, amt);
          ctx.moveTo(q[0], q[1]); ctx.quadraticCurveTo(q[2], q[3], q[4], q[5]);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    resize();
    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); draw(); }).observe(canvas);

    return {
      st, strands, draw, refresh: readColors,
      get quality() { return quality; },
      setQuality(q) { quality = clamp(q, 0, 2); resize(); },
      // viewBox units ↔ screen pixels
      toView(clientX, clientY) {
        const r = canvas.getBoundingClientRect();
        return { x: VB.x + ((clientX - r.left) / r.width) * VB.w, y: VB.y + ((clientY - r.top) / r.height) * VB.h };
      },
      toScreen(x, y) {
        const r = canvas.getBoundingClientRect();
        return { x: r.left + ((x - VB.x) / VB.w) * r.width, y: r.top + ((y - VB.y) / VB.h) * r.height, k: r.width / VB.w };
      },
      // comb strands near (x, y) in viewBox units, from the root down to y
      comb(x, y, reach, hold = 2.4) {
        const u = uAt(y);
        if (y < TOP - 10 || y > HEM + 10) return false;
        let hit = false;
        strands.forEach((s) => {
          const sx = CX + s.t * half(y) * (1 + st.f * 0.24 * u * u);
          const d = Math.abs(sx - x);
          if (d < reach) {
            const k = 1 - (d / reach) ** 2;
            s.cu = s.comb > 0.5 ? Math.max(s.cu, u + 0.06) : u + 0.06;
            s.comb = Math.max(s.comb, k); s.hold = Math.max(s.hold, hold); hit = true;
          }
        });
        return hit;
      },
      // whole-head brush stroke down to fraction u of the length
      brush(u, hold) {
        strands.forEach((s) => { s.comb = 1; s.cu = u; s.hold = hold; });
      },
      // combed strands frizz back up after a moment; returns true while anything is still moving
      relax(dt, speed) {
        let busy = false;
        strands.forEach((s) => {
          if (s.comb <= 0) return;
          busy = true;
          if (s.hold > 0) s.hold -= dt;
          else s.comb = Math.max(0, s.comb - dt * speed);
        });
        return busy;
      },
    };
  }

  g.Hair = { mount, markup, makeStrands, makeFuzz, geometry: { CX, TOP, HEM, len, VB } };
})(typeof window !== 'undefined' ? window : globalThis);
