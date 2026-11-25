# Grilvista: pitch material (private, not published)

Grilvista is a grilled-chicken place in Riga, on Krišjāņa Valdemāra iela, in the old Ze Donats spot. It opened in November 2026.

What the agent already promised them:
- work with their food photographer: we edit the photos and video and promote them;
- Instagram and TikTok;
- voice-overs in English and Latvian, Russian if they want;
- we run the accounts so the owner stays hands-off;
- a filming visit at lunch and in the evening.

**Note:** we have no past social media client with results, so we send a sample made for them and a plan. We do not send a "case study" with invented numbers.

## Files

- `grilvista-paraugs.mp4`: a 15 s sample reel, 1080×1920, with sound.
- `reel.html`: the reel as a page, with `render(t)`. Text is Latvian. Render it with `node marketing/grilvista/render.mjs <frames-dir> <out.mp4>`.
- `sound.py`: the soundtrack, synthesised in code: groove, sizzle, crunch, whooshes and the end-card hit.
- `plan/plan.html`: a one-page A4 plan. Latvian by default, `?lang=en` for English. `node marketing/grilvista/plan/export.mjs` writes the LV and EN PDFs and PNG previews.
- `assets/`:
  - `logo.png`, cut from a screenshot of their Instagram story. It is low resolution; ask them for the real file.
  - four AI illustrations of food and the room. They are not their food.
  - Anton and Figtree fonts (OFL).

## Open before sending

- [ ] The price in the plan (`___ €` placeholder).
- [ ] Confirm the deliverables: 12 videos, 3 stories a week, 1–2 filming days.
- [ ] How the voice-overs get made: our own voices, ElevenLabs (about €20–25 a month), or a Russian native speaker.
- [ ] Rights to the photographer's material.
- [ ] The owner's name: the agent's voice note sounds like "Rainārs".
