# Tools

Helper scripts used to build the previews and videos. They are not part of the websites.

Start a local server from the repo root first:

```bash
python3 -m http.server 8765
```

Playwright must be installed. In the cloud sessions Chromium lives at `/opt/pw-browsers/chromium`; the recorders launch it from there.

## sky-beauty/

| Script | What it does |
|---|---|
| `bake.js` | `node tools/sky-beauty/bake.js demos/sky-beauty`: writes the static hair drawing into `index.html` (shown when JavaScript is off). Run after changing `hair.js`. |
| `bundle.py` | `python3 tools/sky-beauty/bundle.py demos/sky-beauty preview/sky-beauty/sky-beauty-demo.html [a\|b\|c]`: the whole page in one file, with CSS, JS and photos inside. The optional letter picks the hero version. |
| `rec-sky.mjs` | `node tools/sky-beauty/rec-sky.mjs <work-dir> [dators\|telefons\|both]`: records the full page as frames into `<work-dir>/hq/`, plus a `list.txt` for ffmpeg. |
| `rec-hero.mjs` | `RATE=0.05 node tools/sky-beauty/rec-hero.mjs <work-dir> both a\|b\|c`: records one hero version. Use `RATE=0.05` for versions A and C (canvas hair is slow without a GPU). |

Turn the frames into a video:

```bash
ffmpeg -f concat -safe 0 -i <work-dir>/hq/dators/list.txt \
  -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2,format=yuv420p" -c:v libx264 -crf 18 -r 30 out.mp4
```

## lotes-spots/

| Script | What it does |
|---|---|
| `record.mjs` | `node tools/lotes-spots/record.mjs <work-dir> [dators\|telefons\|both]`: same frame recorder, for the Lotes Spots page. |
| `trace-logo.py` | Turns the neon panda logo bitmap into the vector `img/panda/logo.svg`. Needs `numpy`, `Pillow` and `potracer`. |
