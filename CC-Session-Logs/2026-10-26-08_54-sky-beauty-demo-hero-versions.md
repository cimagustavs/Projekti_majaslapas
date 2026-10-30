# Session Log: 2026-10-26 08:54 - sky-beauty-demo-hero-versions

## Quick Reference (for AI scanning)
**Confidence keywords:** SKY BEAUTY, skaistumkopšanas salons, Jelgava, Svētes iela 7, demo website, hair canvas, comb, ķemme, frizz, pūka, hero versions A B C, before/after, pirms pēc, online booking, pieraksts, .ics, Bodoni Moda, LV/RU, rec-hero.mjs, CPR plugin, Lotes Spots, Clementine, Kafe-Picērija
**Projects:** cimagustavs/Projekti_majaslapas (private), demos/sky-beauty, demos/lotes-spots, demos/clementine, demos/kafe-picerija
**Outcome:** Built the SKY BEAUTY salon demo (LV/RU) with realistic combable canvas hair, three hero versions, same-client before/after, and an online booking demo. Everything is pushed to the private repo, and nothing is published.

## Decisions Made
- The repo stays PRIVATE, with GitHub Pages off. Pages using real business names or branding are never published, so the user gets single-file previews and videos instead of public links.
- Version A (drawn hair you comb) is the default. The user said to keep improving A "until it's top". The choice between A, B and C is still open. I recommended B (the salon's own photos) as the most convincing to the owner.
- Hair moved from SVG to canvas for realism: clumps, gloss band, side shading, flyaway halo. Adaptive quality lowers DPR on slow devices.
- Phone finger-combing sits behind an explicit "Pamēģini izķemmēt" mode button, because the hair fills the first screen and would otherwise block scrolling.
- Before/after uses two frames of ONE salon Instagram reel ("Sausi, pūkaini un bojāti mati?") with honest captions. The earlier zoomed, blurry "pēc" crop was dropped after the user complained.
- Online booking is a front-end demo only: nothing is sent and slots are generated. A real site should connect to an existing booking system (Fresha or Booksy, to be decided with the salon) rather than a home-built backend.
- Unknown hours and prices are shown as samples marked "PARAUGS". Fake reviews are never invented; the reviews used are the salon's real client messages without names.
- Canva image generation is disabled by the team admin, so all three hero versions were built in code.

## Solutions & Fixes
- Bodoni Moda's display cut made macrons (ā ē ī ū) invisible. Fixed with `font-optical-sizing: none; font-variation-settings: 'opsz' 11` on body. Small display text (legends, labels) uses Hanken Grotesk, or is ≥2.3rem.
- The `font` shorthand resets optical sizing, so the opsz setting is re-applied on elements that use the shorthand.
- Canvas was slow when every strand went into one big path; it now strokes each strand on its own. Quadratic curves through midpoints, pts 30, 170–200 strands.
- Crown was flat or pointed. Strands now start at the whorl (half-width 0) and use dense sample points near the top (`TOP_U`), with a mass path sampled at `(j/steps)**1.8`.
- Recording canvas pages in headless Chromium (no GPU) gave about 10fps video. Fixed with `RATE=0.05` in `rec-hero.mjs`, which slows the JS clock, rAF and setTimeout via addInitScript.
- `pkill -f rec-sky.mjs` killed its own shell, because the command line contained the pattern. Kill by PID instead.
- The recorder could not click elements below the viewport (desktop booking). It now scrolls to centre before each click.

## Files Modified
- `demos/sky-beauty/index.html`: hero A/B/C, formula quiz, before/after (`.pair`), services with sample prices, `#pieraksts` booking, reviews, RUDENS code, contacts. `?hero=a|b|c` picks the version.
- `demos/sky-beauty/hair.js`: canvas hair renderer (`Hair.mount`), SVG snapshot generator for no-JS (`Hair.markup`), comb, brush, relax, pull, setQuality.
- `demos/sky-beauty/script.js`: hero A (sweep intro, mouse comb, touch comb mode), quiz, booking logic plus .ics export, reviews chat, language toggle, `watchSpeed`.
- `demos/sky-beauty/heroes.js`: hero B (comb reveal over the salon photos) and hero C (dark, flat iron on scroll, steam).
- `demos/sky-beauty/style.css`, `img/` (pirms/pec 840×1120 from the reel, ombre, gari, nagi).
- `preview/sky-beauty/`:
  - single-file `sky-beauty-demo.html` and `sky-beauty-versija-{A,B,C}.html`;
  - `versija-{A,B,C}-{dators,telefons}.mp4` and full-page mp4s;
  - comparison PNGs and README.
- `README.md` table, `.gitignore` (raw CPR autosaves stay local), `tools/` (bundle, bake and recorder scripts with a README).

## Setup & Config
- Local server: `python3 -m http.server 8765` from the repo root.
- Scratchpad tools in `/tmp/claude-0/-home-user-projekti-majaslapas/f35766aa-d9d8-5925-a543-d2bd89c26116/scratchpad/sky/`:
  - `bake.js` bakes the no-JS hair snapshot into index.html;
  - `bundle.py src out [a|b|c]` builds the single files;
  - `rec-sky.mjs` records the full page;
  - `rec-hero.mjs S both a|b|c` records a hero version, with `RATE=0.05` for canvas;
  - test scripts `real2.mjs`, `vars.mjs`, `book.mjs`, `touch.mjs`.
- Playwright: `chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })`.
- Git remote moved to `https://github.com/cimagustavs/Projekti_majaslapas.git`. Push to `main`, ending commits with the Co-Authored-By and Claude-Session lines.
- CPR v2.0.0 installed at user scope: `claude plugin marketplace add EliaAlberti/cpr-compress-preserve-resume`, then `claude plugin install cpr@cpr`. Auto-compact is left on. The container is ephemeral, so expect to reinstall.
- Marketplace `davepoon/buildwithclaude` was added (169 third-party plugins). None are installed.

## Pending Tasks
- [ ] User picks hero version A, B or C, then make it the default and remove the others.
- [ ] Real opening hours and prices from the salon, replacing everything marked PARAUGS. Also the real name of the "gludināšana vieglām lokām" procedure.
- [ ] Ask the salon whether they already use a booking system. That decides how real booking is wired.
- [ ] A native speaker should check the Russian text.
- [ ] Test hero A on a real iPhone and Android for smoothness. Only the emulator and headless browser have been tested.
- [ ] Original photos from the salon for the "Vēl darbi" images (currently ~380 px crops).
- [ ] Business: decide the price and maintenance package before pitching. The analysis suggested a cheap video/one-screen teaser before any full demo.

## Errors & Workarounds
- Canva `generate-image` returned "Your team admin has disabled this tool", so the heroes were built in code.
- The proxy blocks instagram.com and facebook.com, so the work relied on user screenshots. The network allowlist can be changed in environment settings.
- `/cpr:compress` was not loaded in this session (the plugin was installed mid-session), so this log was written by hand following the skill's steps.
- Pushing the log with the raw transcript was blocked as sensitive content. This committed copy is the summary only, and the full transcript stays out of git.

## Key Exchanges
- User: "bilde pirms un pēc vispār neko nevar saprast" led to dropping the zoomed crop and using the same-reel pair.
- User: "Realistiskāku" led to rewriting the hair renderer on canvas.
- User: "a versiju vari uzlabot… strādā līdz tā ir top" led to round crown, fine frizz halo, curved cut, comb pull and headline entrance.

## Custom Notes
None

---

## Quick Resume Context
The SKY BEAUTY demo (`demos/sky-beauty`, private repo; build and recording scripts are in `tools/`) is feature-complete: hero versions A, B and C via `?hero=`, a canvas hair you can comb (mouse, or finger in comb mode), quiz, booking demo, LV/RU. The user hasn't chosen a version yet and asked to keep polishing A. Prices and hours are samples, and nothing may be published publicly because the page uses a real business's branding.
