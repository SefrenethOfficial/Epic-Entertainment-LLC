# Epic Entertainment LLC

Games hub site, originally built on Base44 and converted to a fully static site for GitHub Pages.

- Live site: https://sefrenethofficial.github.io/Epic-Entertainment-LLC/
- Every push to `main` builds the site and publishes it to the `gh-pages` branch (see `.github/workflows/deploy.yml`).

## How it works without Base44

The Base44 backend has been replaced by `src/lib/localDb.js`, which stores everything
(profile, points, EpicBucks, items, trades, threads) in the visitor's browser via localStorage.
Each visitor has their own save; nothing is shared between players.

## Adding games for everyone

Games, videos, shop items and news posts that every visitor should see go in `src/data/seed.json`, e.g.

```json
{
  "Game": [
    { "id": "my-game", "title": "My Game", "description": "Short blurb", "type": "embed",
      "embed_url": "https://sefrenethofficial.github.io/Tacocraft/", "category": "arcade", "play_count": 0 }
  ]
}
```

`type` is `"embed"` (with `embed_url`) or `"html"` (with `html_code`). Add `"is_app": true` to list it under Apps.

## Local development

```
npm install
npm run dev
```
