# Nagyobb, mint egy készülék – weboldal

Statikus, egyoldalas weboldal (HTML + CSS + JS, build nélkül). A `site/` mappa tartalma bárhova feltölthető (Netlify, GitHub Pages, Vercel, saját tárhely).

## Megnyitás helyben
```bash
node .claude/serve.mjs site 5173
```
majd: http://localhost:5173

## Szerkezet
- `site/index.html` – teljes tartalom; a felugró ablakok szövege az oldal alján lévő `<template id="m-…">` blokkokban van
- `site/css/style.css` – design (kék / rózsaszín / krém paletta, a Design mappa alapján)
- `site/js/main.js` – interakciók: jutalomréteg (XP, jelvények, láda) és leleplezése, jutalomhurok-animáció, kézírás-labor, fókusz-teszt, heti képernyő-kalkulátor, kvíz, levélgenerátor, hivatkozások
- `site/assets/img/` – 9 fotó + 4 városkép + 9 matrica (11 OpenAI-generálásból, duotone utófeldolgozással)
- `_eredeti-kepek/` – a generált nyers PNG-k (nem kell feltölteni)

## Mobil PWA app (`site/app/`)
Mobilon (≤760 px szélesség) a weboldal automatikusan az appba irányít; a `?full=1` paraméter (vagy az app Több → Teljes weboldal menüje) visszaállítja a teljes oldalt.

- 5 alsó fül: Főoldal · Tudás · Kísérletek · Cselekvés · Több; többszintű, hash-alapú navigáció (lista → téma → részlet), Android vissza gomb támogatással
- végtelen görgetés helyett lapozható kártyák (`site/app/content.js`)
- telepíthető (manifest, ikonok), offline is működik (service worker)
- a részletszövegek, források, levélkérdések a weboldalból generálódnak: `node tools/build-app-data.mjs` → `site/app/data.gen.js` (a deploy ezt automatikusan lefuttatja)
- a kvíz kérdései közösek: `site/js/data.js`
- helyben (localhost) a service worker szándékosan nem fut; tesztelni `?sw=1`-gyel lehet

## Hivatkozások
Minden szövegközi szám a „Források” lista egy elemére mutat (`<li id="s-…">`). Új forrás: adj hozzá egy `<li id="s-kulcs" data-t="…">` elemet, és a szövegben `<sup class="c" data-s="kulcs"></sup>`.

## Publikálás előtt
- Az `og:image` meta tagba írd be a kép teljes URL-jét (pl. `https://domain.hu/assets/img/hero.webp`), hogy a megosztási előnézet működjön.
- Néhány DOI-linket a forrásellenőrzés során nem nyitottunk meg közvetlenül (Delgado 2018, Clinton 2019, Longcamp 2005, Deci 1999, Lepper 1973, Sundararajan 2020, Fisher 2014, Zendle 2019, King 2018) – a cím, szerző és folyóirat ellenőrzött, de érdemes egyszer rákattintani.
- A Lepper-kísérlet pontos százalékai (≈9% vs. ≈17–18%) a széles körben idézett értékek; az eredeti táblázatot nem sikerült közvetlenül ellenőrizni.
