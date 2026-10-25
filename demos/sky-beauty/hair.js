/* A head of long hair seen from behind, drawn as SVG strands.
   frizz 1 = dry and fluffy, 0 = sleek blunt cut. Pure geometry with no DOM access in the
   generator, so Node can run it too and bake a static snapshot into index.html for no-JS viewers. */
(function (g) {
  const CX = 200, TOP = 62, HY = 172, R = 94, HEM = 560;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function rng(seed) {
    return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function makeStrands(n, seed) {
    const r = rng(seed);
    const list = [];
    for (let i = 0; i < n; i++) {
      list.push({
        t: ((i + 0.2 + r() * 0.6) / n) * 2 - 1,
        ph: r() * 6.283, ph2: r() * 6.283,
        k: 0.75 + r() * 0.6, a: 0.5 + r(), cut: r(),
        w: (1 + r() * 1.5).toFixed(2), tone: Math.floor(r() * 3),
        fly: r() < 0.22, comb: 0, cu: 0, hold: 0,
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
        inset: 0.55 + r() * 0.45, len: 10 + r() * 26, tilt: (r() - 0.5) * 1.3,
        bend: (r() - 0.5) * 26, ph: r() * 6.283, w: (0.5 + r() * 0.7).toFixed(2),
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

  function strandPath(s, st, pts) {
    let d = '';
    for (let j = 0; j <= pts; j++) {
      const u = j / pts;
      const m = s.comb * clamp((s.cu - u) / 0.1 + 0.5, 0, 1); // combed part of this strand
      const f = st.f * (1 - m), c = st.curl * (1 - m);
      const y = TOP + 2 + u * len * (1 - f * 0.09 * s.cut);
      const e = Math.pow(u, 1.2);
      let x = CX + s.t * half(y) * (1 + f * 0.24 * u * u + c * 0.1 * u);
      // frizz is fine and irregular, not big waves: a little body wave plus a dense kink
      x += f * e * (3.5 * s.a * Math.sin(u * s.k * 23 + s.ph + st.time * 0.7) + 2.6 * Math.sin(u * 95 * s.k + s.ph2 - st.time * 1.1) + 1.4 * Math.sin(u * 160 * s.k + s.ph));
      if (s.fly) x += f * e * 30 * (s.t < 0 ? -1 : 1) * Math.sin(u * 2.6 + s.ph * 0.2);
      x += c * e * 10 * Math.sin(u * s.k * 30 + s.ph);
      x += Math.sin(st.time * 0.9 + s.t * 2) * u * u * 1.6;
      const yy = y + f * e * 3 * Math.sin(u * 47 * s.k + s.ph2);
      d += (j ? 'L' : 'M') + x.toFixed(1) + ' ' + yy.toFixed(1);
    }
    return d;
  }

  function fuzzPath(z, st, amt) {
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
    const mx = (x0 + x1) / 2 - dy * z.bend * amt, my = (y0 + y1) / 2 + dx * z.bend * amt;
    return 'M' + x0.toFixed(1) + ' ' + y0.toFixed(1) + 'Q' + mx.toFixed(1) + ' ' + my.toFixed(1) + ' ' + x1.toFixed(1) + ' ' + y1.toFixed(1);
  }

  function massPath(st) {
    const f = st.f * 0.55, c = st.curl, steps = 30;
    const side = (sign) => {
      const out = [];
      for (let j = 0; j <= steps; j++) {
        const u = j / steps;
        const y = TOP + 2 + u * len * (1 - f * 0.05);
        out.push([CX + sign * half(y) * 0.96 * (1 + f * 0.24 * u * u + c * 0.1 * u), y]);
      }
      return out;
    };
    const l = side(-1), r = side(1).reverse();
    return 'M' + l.concat(r).map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('L') + 'Z';
  }

  function markup(id, strands, st, pts, fuzz) {
    const tone = (i) =>
      `<linearGradient id="${id}-t${i}" gradientUnits="userSpaceOnUse" x1="0" y1="${TOP}" x2="0" y2="${HEM}">` +
      `<stop offset="0" style="stop-color:var(--hair-root)"/>` +
      `<stop offset="0.42" style="stop-color:var(--hair-mid${i})"/>` +
      `<stop offset="1" style="stop-color:var(--hair-end${i})"/></linearGradient>`;
    const mass = massPath(st);
    let s = `<defs>${tone(0)}${tone(1)}${tone(2)}` +
      `<linearGradient id="${id}-gloss" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#fff6ea" stop-opacity="0"/><stop offset="0.5" stop-color="#fff6ea" stop-opacity="0.55"/>` +
      `<stop offset="1" stop-color="#fff6ea" stop-opacity="0"/></linearGradient>` +
      `<clipPath id="${id}-clip"><path class="mass-clip" d="${mass}"/></clipPath></defs>` +
      `<path class="cape" d="M14 600C22 452 104 412 200 404C296 412 378 452 386 600Z"/>` +
      `<path class="mass" d="${mass}" fill="url(#${id}-t0)"/><g class="strands" fill="none" stroke-linecap="round">`;
    strands.forEach((x, i) => {
      s += `<path pathLength="1" stroke="url(#${id}-t${x.tone})" stroke-width="${x.w}" style="--i:${i % 40}" d="${strandPath(x, st, pts)}"/>`;
    });
    s += `</g><g class="fuzz" fill="none" stroke-linecap="round" opacity="${Math.min(1, st.f * 1.3).toFixed(3)}">`;
    (fuzz || []).forEach((z) => {
      s += `<path stroke="url(#${id}-t1)" stroke-width="${z.w}" d="${fuzzPath(z, st, st.f)}"/>`;
    });
    s += `</g><g clip-path="url(#${id}-clip)"><rect class="gloss" x="0" y="${(TOP + st.shineY * len).toFixed(1)}" width="400" height="90" fill="url(#${id}-gloss)" opacity="${st.shine.toFixed(3)}"/></g>`;
    return s;
  }

  // Wires an <svg viewBox="0 0 400 600"> up for live redraws.
  function mount(svg, opts) {
    const id = opts.id, pts = opts.pts || 46;
    const strands = makeStrands(opts.n || 110, opts.seed || 11);
    const fuzz = makeFuzz(opts.fuzz ?? 90, opts.seed || 11);
    const st = { f: opts.f ?? 1, curl: 0, time: 0, shine: 0, shineY: 0.25 };
    if (!svg.querySelector('.strands') || svg.querySelectorAll('.strands path').length !== strands.length) {
      svg.innerHTML = markup(id, strands, st, pts, fuzz);
    }
    const paths = svg.querySelectorAll('.strands path');
    const fuzzG = svg.querySelector('.fuzz'), fuzzPaths = svg.querySelectorAll('.fuzz path');
    const mass = svg.querySelector('.mass'), clip = svg.querySelector('.mass-clip'), gloss = svg.querySelector('.gloss');

    return {
      st, strands,
      draw() {
        strands.forEach((s, i) => paths[i].setAttribute('d', strandPath(s, st, pts)));
        // a brush stroke over the whole head flattens the fuzz too
        let combed = 0;
        strands.forEach((s) => { combed += s.comb * clamp(s.cu, 0, 1); });
        const amt = st.f * (1 - combed / strands.length);
        fuzzG.setAttribute('opacity', Math.min(1, amt * 1.3).toFixed(3));
        if (amt > 0.01) fuzz.forEach((z, i) => fuzzPaths[i].setAttribute('d', fuzzPath(z, st, amt)));
        const m = massPath(st);
        mass.setAttribute('d', m); clip.setAttribute('d', m);
        gloss.setAttribute('y', (TOP + st.shineY * len - 45).toFixed(1));
        gloss.setAttribute('opacity', st.shine.toFixed(3));
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

  g.Hair = { mount, markup, makeStrands, makeFuzz, geometry: { CX, TOP, HEM, len } };
})(typeof window !== 'undefined' ? window : globalThis);
