# kagus.eu reel (Latvian, 19 s, 1080×1920)

- `kagus-reel.mp4`: the reel, 30 fps, with motion blur, sound effects and a quiet pad (-14 LUFS).
- `kagus-reel-efekti.mp4`: sound effects only. Use it when you add music in Instagram, so the two don't clash.
- `kagus-reel-bez-skanas.mp4`: no sound at all.
- `sound.py`: the sound design, synthesised in code, so there are no samples and no licences. `python3 marketing/kagus-reel/sound.py out.wav [--sfx-only]`, then mux it with ffmpeg as in the section below.
- `cover.jpg`: the cover frame, which is the outro with the logo.
- `reel.html`: the animation. Open it in a browser to watch it loop.
- `render.mjs`: renders the video frame by frame, with 3 sub-frames per frame for motion blur. Run `node marketing/kagus-reel/render.mjs <frames-dir> marketing/kagus-reel/kagus-reel.mp4`. It takes about 8 minutes.
- `assets/`: logo and Geist fonts, taken from kagus.eu.

**Sound:** every effect sits on the same timeline as `render(t)`:
- whooshes on the transitions;
- clicks on the three phone taps;
- a chime on the confirmation and a pop when the notification drops in;
- ticks and thuds on the rolling numbers, and a shimmer on "Pulēšana";
- a riser while the language ring spins up, a laser on the light streak, and an impact with a reverb tail when the logo lands.

The pad pulses at 120 bpm and stops just before the impact.

To mux the sound in:

```bash
ffmpeg -i kagus-reel-bez-skanas.mp4 -i out.wav -map 0:v -map 1:a -c:v copy \
  -af "loudnorm=I=-14:TP=-1.5:LRA=11" -c:a aac -b:a 192k -shortest kagus-reel.mp4
```

**Voice-over:** not added yet. Amplifiers / ElevenLabs needs a Pro plan, and none of its voices is a native Latvian voice. The script is written to fit the scenes:

| Time | Line |
|---|---|
| 0.0 | "Lielākā daļa mājaslapu ir gana labas. Mēs taisām labākas." |
| 3.8 | "Tavi klienti piesakās paši. Arī divos naktī." |
| 8.5 | "Izpēte. Dizains. Kods. Un pulēšana, ko vairums izlaiž." |
| 12.3 | "Latviski, krieviski, angliski. Un Google tevi atrod." |
| 15.4 | "kagus punkts e u. Raksti mums." |

**Look:**
- A dotted floor that recedes to a lit horizon, under a beam of light from above.
- Film grain and a vignette.
- A slow camera push in every scene.
- Lines are revealed through a mask, with a light sheen across the accent words.

**Scenes:**

| Time | What it shows |
|---|---|
| 0–3.7 s | "Lielākā daļa mājaslapu ir ~~gana labas~~." The line sinks back, "Mēs taisām labākas." comes forward, and the camera zooms through the words. |
| 3.7–8.4 s | "Klienti piesakās paši. Arī naktī." A 3D phone flies in, showing 02:14 on the clock. A finger picks a day and a time and taps Pieteikties. The booking is confirmed and a reminder notification drops in. |
| 8.4–12.2 s | "Kā mēs strādājam." Huge outlined numbers 01–04 roll past, with Izpēte, Dizains, Kods and Pulēšana. A light polishes the last word: "To daļu vairums izlaiž. Mēs ne." |
| 12.2–15.2 s | A ring of language codes turns in 3D around Latviski, По-русски and In English, then collapses into the centre. |
| 15.2–19 s | A streak of light reveals the logo, then kagus.eu letter by letter, the tagline, and a "Raksti mums" button with a moving edge light. |

No client work or client names are shown.

## Caption (LV)

```
Lielākā daļa mājaslapu ir "gana labas". Mēs taisām labākas.

Mājaslapa, kurā klienti piesakās paši (arī naktī), kas runā latviski, krieviski un angliski, un kuru saprot Google un ChatGPT.

Divi cilvēki, dizains un kods vienās rokās. Raksti mums 👉 kagus.eu

#mājaslapa #webdizains #Jelgava #mazaisbizness #Latvija #mājaslapuizstrāde #onlinepieraksts
```
