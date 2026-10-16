# Projekti_majaslapas

Demo websites for businesses. Plain HTML/CSS/JS — no build step. Open any `index.html` in a browser.

| Demo | Folder | Languages |
|------|--------|-----------|
| Restaurant "Kalme" | `demos/restorans/` | LV / EN |

## Structure

```
index.html          gallery linking every demo
demos/<name>/       one self-contained site per folder (index.html, style.css, script.js)
```

Each demo folder can be copied out on its own to start a real client site.

## Languages

Text is written twice in the HTML: `<span data-l="lv">…</span><span data-l="en">…</span>`.
CSS hides whichever language doesn't match `<html lang>`; the LV/EN button flips it.
Latvian is the default, so the page still reads correctly without JavaScript.

## Notes

- All business names, addresses and phone numbers are fictional.
- Booking forms don't send anything — they validate and show a "demo" confirmation.
- No photos yet. To add them, put images in `demos/<name>/img/` and reference them locally
  (don't hotlink): `fetchpriority="high"` on the hero image, `loading="lazy"` on the rest,
  and always set `width`/`height`.
