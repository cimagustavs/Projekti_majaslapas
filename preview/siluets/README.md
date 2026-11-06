# Siluets preview

- `siluets-demo.html`: the whole page in one file. Download it and open it in a browser.
- `siluets-telefons.mp4`, `siluets-dators.mp4`: walk-throughs (`node tools/siluets/record.mjs <work-dir>`, then ffmpeg as in `tools/README.md`).

Signature animation (in "Ko dod trīs LPG procedūras"): a patch of skin with "orange peel" texture under a low light. As you scroll, the LPG head rolls over it in passes and leaves the skin smooth; it can also be dragged (mouse anywhere, finger on the head). With reduced motion it shows a half-done patch, still. Code: `demos/siluets/lpg.js`.

Generated from `demos/siluets/`:
- `node tools/siluets/bake.js demos/siluets` writes the price list and the course cards into the page;
- `python3 tools/siluets/bundle.py demos/siluets preview/siluets/siluets-demo.html` builds the single file.

Research and sources: `docs/siluets-izpete.md`.

**Real**, from siluetssalons.lv:
- every price;
- the procedures and the equipment;
- "since 2004";
- closed on Monday, Saturday and Sunday;
- the phone number;
- manicure and pedicure bookings closed;
- the equipment pictures.

**Sample**, marked on the page: the free consultation (bookable as the first chip), the gift cards, the opening times, before/after, reviews, booking slots and durations.
