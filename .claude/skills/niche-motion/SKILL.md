---
name: niche-motion
description: Find and study distinctive, non-generic web animation before building a demo site, so pages don't move like every other AI-made site. Use when planning the hero or the signature interaction of a new demo, when the user says the motion looks generic or "AI", or asks for animation ideas or references.
---

# Niche motion

Most AI-made sites move the same way: fade-up on scroll, a gradient blob, a marquee, a counter, a 3D tilt card. This skill exists to get the motion from somewhere else: from the business itself, and from places where people publish experiments.

## 1. Start from the business, not from a library

Before looking anything up, write one sentence: **what does this business physically do with its hands or tools?** The best animations in this repo came from that answer:

| Demo | The real thing | The animation |
|---|---|---|
| SKY BEAUTY | combing frizz out of hair | drawn hair you comb with a finger |
| Lotes Spots | a neon panda sign in the window | the sign flickers on, the panda leaves on scroll |
| Kafe-Picērija | 2 pizzas = a free cheese pizza | an order board that adds the gift |
| Siluets | treatments per body zone | pick a zone on the figure, see its prices |
| Siluets | LPG rollers smoothing "orange peel" skin | skin lit by a low light; the LPG head rolls over it on scroll (or by drag) and leaves it smooth (`demos/siluets/lpg.js`) |

Ask for each new business: what is the tool (iron, needle, oven, wrench, scissors), what is the material (dough, paint, glass, fur), and what is the before → after? An animation built on one of those is niche by definition.

## 2. Then browse references, with your own eyes

Look before you build. `tools/inspo/look.mjs` opens a page in a real browser, scrolls it, and saves screenshots, a short video and the page text:

```bash
python3 -m http.server 8765 &   # only needed for local pages
node tools/inspo/look.mjs "<url>" <scratchpad>/inspo/<name> 8
```

Read the screenshots (and the text) before deciding. Never copy code or assets from a reference; take the idea of the motion and rebuild it for this business.

### Sources that work from the cloud sandbox (checked Nov 2026)

| Source | What it is good for | Notes |
|---|---|---|
| tympanus.net/codrops (tutorials, `/hub/all`) | the best place for unusual effects, with demo and code | Works in a real browser (curl gets 403); use `look.mjs` |
| scroll-driven-animations.style | native CSS scroll-driven demos, no JS | Light, fast, and very little of it looks AI-made |
| gsap.com/showcase | real client sites made with GSAP | Look for transitions and type, not the 3D blobs |
| motion.dev (examples) | interaction and gesture physics | Springs, drag, layout animations |
| hover.dev | small, sharp component interactions | Good for buttons and menus |
| animations.dev, emilkowal.ski, rauno.me | craft: timing, easing, restraint | Read when an effect feels cheap |
| onepagelove.com | one-page layouts by section type | Composition more than motion |
| developer.chrome.com/blog, webkit.org/blog | new CSS (view transitions, anchor positioning) | New features look fresh because few sites use them yet |

**Blocked or behind a bot check:** codepen.io, lapa.ninja (Cloudflare challenge; don't try to get round it), awwwards.com (connection reset), godly.website (not in the network allowlist). If the user wants these, they add them in the environment's network settings; screenshots from the user also work.

## 3. Catalogue: niche moves that suit small local businesses

Each one is cheap to build with CSS/Canvas/SVG, works on a phone, and is tied to something physical:

- **Tool-driven reveal**: a drawn tool (comb, iron, squeegee, brush, knife) is dragged across, and the surface changes under it. Hair salons, cleaning, car detailing, painters.
- **Material simulation on canvas**: hair, steam, dough, foam, water beads that react to the pointer. Keep it to one element.
- **Before/after as a physical act**: the reveal follows the real process (wipe a dirty window, sweep a floor, pull a tablecloth), not a generic slider.
- **Neon / signage boot-up**: the shop's real sign flickering on, tube by tube. Bars, cafés, barbers.
- **Receipt / ticket printing**: an order or booking prints out line by line with a tear edge. Bakeries, pizzerias, repair shops.
- **Chalkboard or menu-board writing**: today's menu written stroke by stroke (SVG stroke-dashoffset), only once.
- **Stamp and punch card**: a loyalty card that gets stamped when you add something. Coffee, car wash.
- **Clock-driven page**: the page changes with the real time (open, lunch, closing). Already in Lotes Spots and Kafe-Picērija.
- **Scroll as a day / as a process**: one scroll goes through the business's day or one job from start to finish (car in → car out).
- **Body or object map**: pick a zone on an illustration (body, car, room, bike) to filter services and prices. Salons, garages, cleaners.
- **Ghost / trail typography** (Codrops Oct 2026): letters leave outlined copies as you scroll. Use for one headline only.
- **Native scroll-driven CSS** (`animation-timeline: view()`): progress bars, sticky reveals, parallax with no JS.
- **View transitions** between list and detail (`document.startViewTransition`): a service card expands into its page.
- **Cursor that is the tool**: on desktop, the cursor becomes scissors, a brush or a fork near the interactive area.

## 4. Avoid (these read as "AI-made")

- fade-up-on-scroll on every block, all with the same delay;
- gradient blobs, aurora backgrounds, glassmorphism cards;
- marquee logo strips, auto-rotating testimonial carousels;
- counters that count up for numbers nobody asked for;
- 3D tilt cards, magnetic buttons everywhere, a custom cursor dot following the mouse for no reason;
- particles, confetti and sparkles without meaning.

## 5. Quality bar, every time

- One signature interaction per page. Everything else is quiet.
- It must work with a finger on a phone, and not block scrolling.
- `prefers-reduced-motion`: give the final state, no movement.
- Only `transform`/`opacity` in CSS. Canvas only for the one signature element, with a lower-quality mode for slow phones.
- Record it (`tools/<demo>/record*.mjs`) and look at the frames before showing it to the user.
