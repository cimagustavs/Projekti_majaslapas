# GEO audit: five demo sites (6 November 2026)

GEO (generative engine optimization) means making a business easy for AI assistants to find, understand and recommend. The assistants include ChatGPT search, Google AI Overviews, Gemini and Perplexity. A typical question is "where in Jelgava can I get LPG massage?".

For a local business it is about 90% the same work as local SEO. The assistants answer local questions from web search results, map listings and directories, and then read the business's own site for details. So this audit looks at two things:
- **Off the site:** does the web know the business at all, under the right name, address and phone?
- **On the site:** can a machine read the facts from the page, including a crawler that does not run JavaScript?

Pages: `demos/clementine`, `demos/kafe-picerija`, `demos/lotes-spots`, `demos/siluets`, `demos/sky-beauty`. They are demos, not live sites.

## How it was checked

- **Web presence.** Nine searches on 6 Nov 2026 with the session's web search tool. It is the same kind of search an assistant runs before it answers, so it is a fair stand-in, but it is not ChatGPT or Google itself.
  - Four category searches in Latvian: "LPG masāža Jelgava", "keratīna taisnošana Jelgava salons", "picas piegāde Jelgava picērija", "brokastis Jelgava kafejnīca". A fifth combined category and street: "ģimenes kafejnīca Jelgava Lielā iela burgeri".
  - Four searches by business name and address.
- **Structured data.** The JSON-LD in each `index.html`, read field by field.
- **Text without JavaScript.** Each page was loaded in Chromium twice, with JavaScript on and off. For each run I compared the text and counted the prices (numbers with €). Many AI crawlers fetch the HTML and do not run scripts. This is reported for GPTBot and ClaudeBot, and I count it as likely, not certain.
- **robots.txt**, canonical, FAQ content and phone links, read from the files.

## Summary

| | Siluets | SKY BEAUTY | Lotes Spots | Clementine | Kafe-Picērija |
|---|---|---|---|---|---|
| Found by name and address | ✗ | ✗ | ✗ | **✗, the address shows as "ACADEMIA coffee and breakfast bar"** | ✓, as "kafejnīca picērija" / "Comedor" |
| Found for its category in Jelgava | ✗ | ✗ | ✗ | ✗ | ✗ (Picburg, Čili Pica come up) |
| Business schema | ✓ BeautySalon | ✓ BeautySalon | ✓ CafeOrCoffeeShop | ✓ CafeOrCoffeeShop | ✓ Restaurant |
| Opening hours in schema | ✗ (sample hours) | ✗ | ✗ | ✗ | ✓ |
| Prices in schema | 4 offers | 3 offers | ✗ | ✗ | menu link only |
| `geo`, `url`, `image`, `priceRange` | ✗ | ✗ | ✗ | ✗ | ✗ |
| Social links (`sameAs`) | ✗ | Instagram | Instagram, TikTok | Facebook, Instagram | Facebook |
| Plain question-and-answer section | ✗ | partly (quiz) | ✗ | ✗ | ✗ |
| Text without JavaScript | 10.6k chars, all 119 prices ✓ | 6.4k chars, **17 of 33 prices** | **1.9k chars**, 7 prices | 11.2k chars, 8 prices | 6.0k chars, all 32 prices ✓ |
| robots.txt lets AI crawlers in | ✓ | ✓ | ✓ | ✓ | ✓ |

**Bottom line.** The pages are in decent shape for machines. The businesses are not: three of five do not exist on the open web, and the other two show up under the wrong name. A website alone will not get any of them into AI answers. A website plus listings that agree with it will.

## Findings

**[HIGH] Siluets, SKY BEAUTY and Lotes Spots are not on the web at all.**
- Evidence: a search for the name plus the address returns nothing about the business. Siluets also has no Google Maps entry (see `docs/siluets-izpete.md`).
- Effect: an assistant asked about LPG massage or keratin in Jelgava names someone else. The LPG search found no Jelgava provider at all. The keratin search found only ME TIME STUDIO, Raiņa iela 34, because it has a Fresha page. Both gaps are an open door for whoever gets listed first.
- Fix, in this order:
  1. Google Business Profile with the same name, address, phone and hours as the site.
  2. A listing on **visit.jelgava.lv**, the city's tourism portal. It appeared in four of the nine searches and is clearly a source the search engine trusts for Jelgava.
  3. The same details on zl.lv / 1188.lv.
  4. For the salons, a Fresha-style booking page also counts as a listing.

**[HIGH] Clementine's address belongs to another café online.**
- Evidence: Akadēmijas iela 4a comes up as "ACADEMIA coffee and breakfast bar". It shows 4.8 ★ from 32 reviews, and a phone number, +371 28 951 491, that is not Clementine's (+371 29 587 936). Trip.com lists it as closed.
- Effect: an assistant may send people to "ACADEMIA", give the wrong phone number, or say the place is closed.
- Fix: ask the owner whether they took over from ACADEMIA. Then get the old listings closed or renamed (Google, Trip.com, TripAligner) and create Clementine's own Google profile. Until that is done, the website should say plainly "Clementine, Akadēmijas iela 4a (agrāk ACADEMIA)" only if that is true. Check it first.

**[HIGH] Kafe-Picērija has two names online.**
- Evidence: visit.jelgava.lv lists "kafejnīca picērija", Akadēmijas iela 4, 20319837, with no delivery information. zl.lv lists the company "Comedor" at the same address and says delivery is free.
- Effect: the demo says "Kafe-Picērija" and delivery 3.50 €, so the sources disagree on both the name and the price. Assistants hedge or pick the wrong one. The delivery search named Picburg and Čili Pica, both of which say clearly on visit.jelgava.lv that they deliver.
- Fix: agree one public name with the owner (the company can stay "Comedor"). Update visit.jelgava.lv and zl.lv with that name, delivery terms and the 2-pizzas offer. In the schema, add `alternateName` for the other name.

**[MEDIUM] No question-and-answer section on any site.**
- Issue: assistants are good at lifting a short answer to a direct question. None of the pages states one in that form: "Vai piegādājat?", "Cik ilgi turas keratīns?".
- Fix: 5–6 real questions per business, written as text on the page, plus `FAQPage` schema. Suggested questions:
  - **Siluets:** Cik maksā LPG? Cik procedūru vajag? Vai LPG sāp? Vai jāpērk kostīms (22 €)? Kuras dienas strādājat? Vai var pierakstīties tiešsaistē?
  - **SKY BEAUTY:** Cik maksā keratīns un vai cena atkarīga no garuma? Cik ilgi tas turas? Vai var krāsot matus pēc keratīna? Kā pierakstīties?
  - **Kafe-Picērija:** Vai piegādājat un cik tas maksā? Kā strādā "2 picas, siers dāvanā"? Darba laiks? Vai ir pusdienas?
  - **Clementine:** Vai brokastis ir visu dienu? Cik laikus jāpasūta kūka? Vai uzņemat kāzas, cik cilvēkus? Vai var ar bērniem?
  - **Lotes Spots:** Cik maksā pusdienu komplekts? Vai piegādājat uz biroju? Vai ir vieta bērniem? Darba laiks?
- Only real answers from the owner. A made-up FAQ is worse than none.

**[MEDIUM] SKY BEAUTY shows half its prices only after JavaScript runs.**
- Evidence: 17 prices without JavaScript, 33 with it. The service and price lists are built by `script.js`.
- Effect: a crawler that reads only the HTML sees half the price list.
- Fix: write the lists into the HTML at build time, the way `tools/siluets/bake.js` already does for Siluets.

**[MEDIUM] Lotes Spots has very little text for a machine to quote.**
- Evidence: about 1,900 characters on the whole page. The design is mostly images and the neon sign.
- Effect: there is nothing to answer "does Lotes Spots have lunch deals / burgers / a kids' corner?" except a few headings.
- Fix: a plain-text menu with prices, opening hours, and a two-sentence "what we are" paragraph ("ģimenes kafejnīca Lielajā ielā 3…"). It can sit below the visual sections without changing the look.

**[MEDIUM] Schema is missing the fields assistants use for local answers.**
- Missing everywhere:
  - `geo` (latitude and longitude);
  - `url`;
  - `image`;
  - `priceRange`.
- Missing on four of five: `openingHoursSpecification`. Kafe-Picērija is the only site that has it.
- Siluets: the schema address is "Raiņa iela 18-2" but the page says "Raiņa iela 18". Use one form everywhere, including the Google profile.
- Lotes Spots and Clementine have no prices in the schema. Add `hasMenu` and a few `makesOffer` entries.
- Do **not** put sample data into the schema: Siluets' opening times, the free consultation, sample reviews. Add them only once the owner confirms.

**[LOW] Crawler access is fine; keep it that way.**
- Every `robots.txt` is `Allow: /`, so AI crawlers are let in: GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended.
- When a site goes live on a host, check the host does not block bots by default. Some "bot protection" settings do.

**[LOW] llms.txt.** It is a proposed file that lists a site's key pages for AI. As far as I know the big assistants don't rely on it yet (Likely). It costs 10 minutes per site, so add it at launch, but it is not a selling point.

**[LOW] Launch items carried over from the SEO audit.** Canonical tags, `sitemap.xml`, separate `/ru/` URLs with hreflang. LV and RU on one URL is not a problem for AI (Likely): both languages are readable.

## What to offer clients

Sell it as part of the 350 € site, not as a separate service: "lapa, kuru atrod gan Google, gan ChatGPT". The work per client:

1. Google Business Profile, set up or cleaned up. This matters most for all five.
2. The same name, address, phone and hours on visit.jelgava.lv and zl.lv.
3. Questions and answers on the site, plus FAQ schema.
4. Complete schema: hours, geo, prices, social links.
5. A plan to collect reviews (the QR card on the Siluets and SKY BEAUTY demos).

To check the result after launch, ask ChatGPT and Google the category question (for example "LPG masāža Jelgava") a month later. Put a screenshot before and after into the client report.

## Sources (searches of 6 Nov 2026)

- visit.jelgava.lv:
  - [kafejnīca picērija, Akadēmijas 4](https://www.visit.jelgava.lv/en/food-and-drink/item/4192-kafejnica-picerija)
  - [Picburg](https://visit.jelgava.lv/en/recreation/pizzerias/item/5032-picerija-picburg)
  - [Čili Pica](https://www.visit.jelgava.lv/en/recreation/pizzerias/item/644-picerija-cili-pica)
  - [Brokastnīca](https://visit.jelgava.lv/en/recreation/water-temptation/item/5154-kafejnica-brokastnica)
- zl.lv: [Cafe, companies in Jelgava](https://search-result.zl.lv/Cafe/Jelgava)
- ACADEMIA at Akadēmijas 4a:
  - [TripAligner](https://tripaligner.com/countries/latvia-26/destinations/jelgava-8067/places/academia-coffee-and-breakfast-bar-13925512)
  - [Trip.com](https://nz.trip.com/restaurant/latvia/jelgava/detail/ACADEMIA%20coffee%20and%20breakfast%20bar-52718223)
- [ME TIME STUDIO on Fresha](https://www.fresha.com/a/me-time-studio-jelgava-raina-iela-34-gmcrfbff)
