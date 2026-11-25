# Noor Holding — website

Corporate website of **Noor Holding** (live at `noorholding.mr`), in French, English and Arabic.
A plain static site (HTML, Tailwind CSS, vanilla JS modules) hosted on **Netlify**, plus a small password-protected
**admin panel** that lets the client publish news without touching code.

---

## Folder structure

```
.
├── index.html               Homepage (hero, CEO message, latest news, about, subsidiaries, contact)
├── Allnews.html             All news: search + pagination
├── news.html                One article: news.html?id=<id>
├── admin.html               Admin panel (news CRUD) — not indexed by search engines
│
├── assets/
│   ├── css/site.css         Built stylesheet (generated — do not edit by hand)
│   ├── fonts/               Self-hosted fonts (Plus Jakarta Sans, DM Serif Text, IBM Plex Sans Arabic)
│   ├── js/
│   │   ├── lib/
│   │   │   ├── i18n.js          Translations + language switcher
│   │   │   ├── network.js       Hero network graphic (from data/subsidiaries.json)
│   │   │   ├── news.js          Loading news, date formatting, news card templates
│   │   │   └── site-nav.js      Navbar: mobile menu, hide on scroll, solid after the hero
│   │   └── pages/
│   │       ├── home.js          index.html
│   │       ├── news-list.js     Allnews.html
│   │       ├── news-article.js  news.html
│   │       └── admin.js         admin.html
│   └── images/
│       ├── brand/           Logo, favicon, network wheel
│       ├── hero/            Homepage slideshow backgrounds
│       ├── home/            CEO portrait, "About" photos
│       ├── subsidiaries/    One folder per company: logo.webp, photo-1..3.webp
│       ├── news/            Article images (admin uploads land here too)
│       └── decor/           Decorative SVG backgrounds
│
├── data/
│   ├── site-translations.json   Every text of the site, per language (fr / en / ar)
│   ├── subsidiaries.json        The list of companies (network graphic + hero figures)
│   ├── news.json                Article list: id, date, picture, featured
│   └── news-translations.json   Article texts per language: title, description, author, category, content (HTML)
│
├── src/input.css            Tailwind source: theme colors, fonts, custom components
├── netlify/functions/       Admin API (login, posts, upload-image) — commits to GitHub
├── netlify.toml             Netlify config: functions, /api/* routes, cache headers
└── package.json             Only used to build the CSS
```

---

## Everyday tasks

### Change a text
Every visible text lives in `data/site-translations.json`, under `fr`, `en` and `ar`.
In the HTML, an element shows the text whose path is in its `data-i18n` attribute:

```html
<h2 data-i18n="about.title">Qui Sommes Nous</h2>     <!-- → site-translations.json › fr › about › title -->
<input data-i18n-placeholder="contact.form.placeholders.email">
```

The text written inside the HTML tag is only a fallback, shown for a split second before translations load.
To add a new text: add the key in all three languages, then put `data-i18n="your.key"` on the element.

### Add / edit / delete a news article
Use the admin panel: `https://noorholding.mr/admin.html`. Every save is a commit on `main`, which redeploys the site.
(By hand: add an entry to `data/news.json` and the same id under `fr`, `en` and `ar` in `data/news-translations.json`.)

### Add a subsidiary to the homepage carousel
1. In `index.html` (section `#subsidiaries`), copy one `<div class="carousel-slide …">` block.
   Every card has the same structure: logo, name, description and services on one side, a mosaic of 3 photos on the other
   (`<article class="sub-card sub-card--split" data-accent="COLOUR">`).
   Sector colour (`data-accent`, used for the line under the name and the service bullets): `sun` (energy), `heritage` (mining),
   `sea` (fishing / sea products), `olive` (agriculture, green energy), `midnight` (trade, logistics, finance), `gulf` (health),
   `emerald` (technology). Defined in `src/input.css` › "Subsidiary cards".
   No photos yet? Replace the `sub-mosaic` block with `<div class="sub-showcase"><img src="…/logo.webp" alt=""></div>` (see Fair-Soft).
2. Put its images in `assets/images/subsidiaries/<company>/` (`logo.webp`, `photo-1.webp` … `photo-3.webp`; photo-3 is the tall one).
3. Add its texts under `subsidiaries.companies.<company>` in `data/site-translations.json` (fr, en, ar): `name`, `description`, `services` (list).
   The `<li>` items in the card use `data-i18n="subsidiaries.companies.<company>.services.0"`, `.1`, …
   The carousel dots and counter update automatically. Rebuild the CSS (`npm run build`).

### The network graphic in the hero
The Noor Holding logo with every company in a circle around it, drawn by `assets/js/lib/network.js` from
**`data/subsidiaries.json`**. Nothing is drawn by hand: spacing and logo sizes recalculate for any number of companies,
and past ~20 companies a second, inner circle opens. The "subsidiaries" and "sectors" figures in the hero follow the file.

- **Add a company:** one entry in `companies`: `name`, `logo` (path inside `assets/images/subsidiaries/`), `sector`,
  and `slide` = the key of its carousel card (leave it out if it has no card). Clicking the logo opens that card.
- Motion: the circle turns slowly (one turn every 3 minutes) and pauses on hover; small lights travel from the centre
  to each company. Both are off for visitors who ask for reduced motion.

### Typography
- **Plus Jakarta Sans** — all text (Latin). **DM Serif Text** — headings and company names (`font-dm-serif`).
  **IBM Plex Sans Arabic** — everything when the page is in Arabic.
- The fonts are self-hosted in `assets/fonts/` (no Google Fonts request) and declared at the top of `src/input.css`.
  Licences: SIL Open Font License (files next to the fonts).

### Images
Use **WebP**, resized to the size they are displayed at (≈ 1600–1920 px wide for full-width backgrounds,
≈ 900 px for cards and photos, ≈ 480 px for logos). Every image below the first screen gets `loading="lazy"`.

### Change styles
Use Tailwind classes in the HTML. Brand colors (`sand`, `midnight`, `skyline`, `gulf`, `executive-navy` …) are defined
in `src/input.css`. Note: `bg-white` / `text-white` are the brand off-white `#f5f4f3`.
After changing HTML classes or `src/input.css`, rebuild the CSS:

```bash
npm install          # once
npm run build        # writes assets/css/site.css (commit it — Netlify does not build)
npm run dev          # same, rebuilds on every change
```

### Run locally
```bash
python3 -m http.server 8080      # site only → http://localhost:8080
netlify dev                      # site + admin functions (needs netlify-cli and the env vars below)
```

---

## Admin panel — how it works

- `admin.html` + `assets/js/pages/admin.js` are only the UI. They call `/api/login`, `/api/posts`, `/api/upload-image`.
- `netlify.toml` routes those to `netlify/functions/*.js`.
- The functions check the password, then read/write `data/news.json` and `data/news-translations.json`
  (and upload images to `assets/images/news/`) through the **GitHub Contents API**. Each change is a real commit on `main`.
- Sessions are signed tokens valid 8 hours; no database.

### Netlify environment variables (Site configuration → Environment variables)

| Name | Value |
|---|---|
| `GITHUB_TOKEN` | Fine-grained token, repo `noor-holding` only, permission **Contents: Read and write** |
| `REPO_OWNER` | `Abdou-MedMahfoudh` |
| `REPO_NAME` | `noor-holding` |
| `REPO_BRANCH` | `main` |
| `ADMIN_PASSWORD` | Password given to the client |
| `SESSION_SECRET` | Long random string: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Redeploy after changing them.

### Known limitations
- Two people editing at the same moment → the second save fails (GitHub `sha` conflict). Fine for one admin.
- Uploaded images are never deleted automatically; tidy `assets/images/news/` from time to time.

---

## Hosting
- Netlify publishes the repository root as-is (no build command). Domain: `noorholding.mr`.
- `CNAME` is only used by GitHub Pages (previous host); Netlify ignores it.
- Contact form: handled by **Netlify Forms** (`name="contact"`). Submissions appear in Netlify → Forms;
  set up an email notification there.
