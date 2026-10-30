# SEO audit: four demo sites (October 2026)

Pages: `demos/clementine`, `demos/kafe-picerija`, `demos/lotes-spots`, `demos/sky-beauty`.
How it was measured:
- the HTML was read directly;
- the pages were loaded in Chromium at phone size (390 px) on a throttled "fast 4G" connection;
- LCP and CLS come from PerformanceObserver in a lab run, not from field data.

These are demos, not live sites. Anything about deployment (robots, sitemap, canonical, Google Business Profile) applies when a site goes live.

## Summary

| | Clementine | Kafe-Picērija | Lotes Spots | SKY BEAUTY |
|---|---|---|---|---|
| Title | 30 ch, short | 48 ch ✓ | 52 ch, English slogan first | 59 ch ✓ |
| Description | 124 ch ✓ | 125 ch ✓ | 131 ch ✓ | 113 ch, slightly short |
| H1 | 1, LV+EN glued | 1, LV+RU glued | 1, "Good Food Vibes" | **3** (hero A/B/C) |
| LocalBusiness schema | ✗ | ✗ | ✗ | ✗ |
| og:image (share preview) | ✗ | ✗ | ✗ | ✗ |
| Canonical | ✗ | ✗ | ✗ | ✗ |
| Image alt | ✓ | ✓ (8 decorative) | ✓ (15 decorative) | ✓ |
| LCP (phone, lab) | 1.8 s ✓ | 1.4 s ✓ | **3.2 s** | 2.2 s ✓ |
| CLS | 0.000 ✓ | 0.000 ✓ | 0.012 ✓ | 0.028 ✓ |
| Page weight | 162 KB | 162 KB | 373 KB | 455 KB |

## Findings

**[HIGH] No business structured data on any site.**
- Location: `<head>` of all four `index.html`.
- Issue: Google can't read the address, phone, opening hours, price range, menu or services as facts. For a local café or salon, this and the Google Business Profile are what put it in the map pack for "kafejnīca Jelgava" or "keratīns Jelgava".
- Fix: add JSON-LD:
  - `Restaurant` for Clementine and Kafe-Picērija, with `servesCuisine` and `hasMenu`;
  - `CafeOrCoffeeShop` for Lotes Spots;
  - `BeautySalon` for SKY BEAUTY, with `makesOffer` for keratin 100 €, Deep Clean and Glow 35 €;
  - all of them with `address`, `telephone`, `geo`, `openingHoursSpecification` (only once the real hours are known) and `sameAs` (Facebook, Instagram).

**[HIGH] Two languages on one URL.**
- Location: every `data-l` span pair.
- Issue: LV and RU (or EN) text are both in the HTML, and CSS hides one. Google reads both, so the H1 comes out as "Brokastis Breakfast visu dienu. all day." and "Divas picas — Две пиццы — …". The RU and EN versions can't rank on their own, and the LV text is diluted.
- Fix: when a site goes live, serve each language at its own URL (`/` and `/ru/`), linked with `hreflang`. The toggle becomes a link. Until then, at least mark the hidden spans `lang="ru"` or `lang="en"`.

**[HIGH] SKY BEAUTY has three H1s.**
- Location: `demos/sky-beauty/index.html`, hero versions A, B and C.
- Fix: once a version is chosen, delete the other two sections so one H1 remains.

**[MEDIUM] No share preview.**
- Location: `<head>` of all four.
- Issue: these businesses live on Facebook and Instagram. A shared link shows no picture, and Lotes Spots and SKY BEAUTY also lack an og:description.
- Fix: add `og:image` (1200×630, the hero photo or logo), `og:description`, `og:type=website`, `og:locale=lv_LV` and `twitter:card=summary_large_image`.

**[MEDIUM] Lotes Spots is slow to show its main content on phones (LCP 3.2 s).**
- Location: `demos/lotes-spots`, the hero words "Good Food Vibes".
- Issue: the headline waits for the web font and then animates in, so the browser counts it as painted late.
- Fix:
  - preload the Bricolage Grotesque file;
  - start the words visible (opacity 1) and animate only their position;
  - add `fetchpriority="high"` to the logo.

**[MEDIUM] Titles and H1 don't say what or where.**
- Lotes Spots:
  - Issue: the title starts with an English slogan, and the H1 is "Good Food Vibes". People search "kafejnīca Jelgava", "pusdienas Jelgava" and "burgeri Jelgava".
  - Fix: use the title `Lotes Spots — ģimenes kafejnīca Jelgavā, Lielā iela 3`, and either put "Ģimenes kafejnīca Jelgavā" in the H1 or make the slogan the sub-line.
- Clementine:
  - Issue: the 30-character title wastes space.
  - Fix: use `Kafejnīca Clementine — brokastis visu dienu Jelgavā`.
- SKY BEAUTY:
  - Issue: the description doesn't mention the street.
  - Fix: add "Svētes iela 7" and stretch it to around 140 characters.

**[LOW] Missing for launch: `robots.txt`, `sitemap.xml` and `<link rel="canonical">`.**
- Issue: all three are trivial for one-page sites, but they must exist on the live domain.

**[LOW] Image weight.**
- Issue:
  - Clementine ships JPG fallbacks (180 KB and 244 KB) next to WebP. That's fine, but the WebP files could be ~40 % smaller at quality 80.
  - SKY BEAUTY's before/after photos are 144 KB and 115 KB; AVIF would halve them.
- Fix: not urgent.

**[LOW] Render-blocking Google Fonts on all four.**
- Issue: `preconnect` is already there.
- Fix: self-host the two font files per site at launch and `preload` the headline font. This saves a round trip on slow phone connections.

## Off-site (bigger than anything on the page)

**[Likely] The Google Business Profile matters more than the website for local search.**
- Check that each business has a GBP with the same name, address and phone as the site (NAP consistency).
- Fill it in: categories, hours, photos and a link to the new site.
- Ask happy clients for Google reviews. SKY BEAUTY already gets thank-you messages on Instagram, and those people are the easiest to ask.

## As a sales point

Every one of these businesses currently relies on Facebook or Instagram, or on a site that barely works (Kafe-Picērija's own site only shows pizzas). The pitch: "Today, someone searching 'keratīns Jelgava' or 'kafejnīca Jelgava' on Google doesn't find you. With this site and a filled-in Google profile, they will."
