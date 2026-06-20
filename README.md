# Noor Holding — Admin CRM + Netlify Migration

This adds a password-protected admin panel (`/admin.html`) where the client
can create, edit, and delete news articles in fr/en/ar without touching code
or Git. Saves commit directly to the `main` branch via a Netlify Function,
which then triggers your existing auto-deploy.

This version runs entirely on Netlify (no Vercel dependency) and assumes
you're moving the live domain from GitHub Pages back to Netlify, and making
the repo private.

## What changed since the last version

- Backend moved from Vercel Functions (`/api/*.js`) to **Netlify Functions**
  (`netlify/functions/*.js`). Logic is identical — only the request/response
  shape changed to match Netlify's handler format.
- Added `netlify.toml`, which routes `/api/posts`, `/api/login`, and
  `/api/upload-image` to the matching functions. **`js/admin.js` did not
  need to change at all** — it already calls those exact paths.
- `data/news.json` — trimmed to only `id, date, picture, featured` (text
  fields were a duplicate of `news-translations.json` — verified all 14
  articles had matching entries in fr/en/ar before trimming).
- `js/Allnews.js`, `js/single-news.js` — small fixes so search and content
  rendering still work correctly now that `news.json` is trimmed.

## 1. Copy files into your repo

Copy everything in this folder into `noor-holding/`, preserving paths.
This adds `netlify/`, `netlify.toml`, `admin.html`, and overwrites
`data/news.json`, `js/Allnews.js`, `js/single-news.js`.

If you previously deployed the Vercel version, delete the old `api/`
folder — it's replaced by `netlify/functions/`.

## 2. Point the domain back to Netlify

Your custom domain is `noorholding.mr` (from the repo's `CNAME` file).

1. In **Netlify** → Site settings → Domain management → add
   `noorholding.mr` if it isn't already linked to this site.
2. Netlify will show you a DNS target (typically an A record to
   `75.2.60.5`, or Netlify's own nameservers if you want them managing DNS
   entirely).
3. At your **domain registrar**, update DNS:
   - Remove the GitHub Pages A records (the four `185.199.108.x` IPs) or
     the CNAME pointing at `<username>.github.io`.
   - Add the Netlify record from step 2.
4. Once DNS has propagated (minutes to ~48h depending on registrar TTL),
   go to repo **Settings → Pages** and disable GitHub Pages, so there's no
   ambiguity about which host is live.
5. The `CNAME` file in the repo root can stay — Netlify ignores it; it's a
   GitHub Pages-specific file.

## 3. Make the repo private

GitHub repo → Settings → General → Danger Zone → Change visibility →
Private.

Two things to double check afterward:
- **Netlify's GitHub connection** — Site settings → Build & deploy →
  confirm the repo link still shows connected. Netlify's GitHub App
  retains access through private/public switches in almost all cases, but
  worth a glance.
- **The GitHub token in step 4 below** — fine-grained PATs scoped to a
  specific repo keep working regardless of that repo's public/private
  status, so no change needed there.

## 4. Generate a GitHub token

1. https://github.com/settings/tokens?type=beta
2. "Generate new token" → fine-grained
3. Repository access → only select `noor-holding`
4. Permissions → **Contents: Read and write**
5. Copy the token — shown only once.

## 5. Set environment variables in Netlify

Site configuration → Environment variables → add:

| Name | Value |
|---|---|
| `GITHUB_TOKEN` | the token from step 4 |
| `REPO_OWNER` | `Abdou-MedMahfoudh` |
| `REPO_NAME` | `noor-holding` |
| `REPO_BRANCH` | `main` |
| `ADMIN_PASSWORD` | a password for your client |
| `SESSION_SECRET` | a long random string — generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

Trigger a new deploy after adding these (Netlify Functions only pick up
new env vars on a fresh deploy/build).

## 6. Give the client the URL

`https://noorholding.mr/admin.html`

They log in with the password, see a list of articles, and can create,
edit, or delete. Every save is a real git commit — visible in your repo's
commit history (e.g. "Add article #15 via admin panel") as a full audit
trail.

## How it works, briefly

- `admin.html` is pure UI — it never talks to GitHub directly.
- It calls `/api/login`, `/api/posts`, `/api/upload-image`.
- `netlify.toml` rewrites those to the real function paths under
  `/.netlify/functions/...`, passing query strings through untouched
  (confirmed: Netlify auto-forwards query params on 200-status redirects).
- The functions hold the GitHub token (from env vars, never in code) and
  make the actual commits via GitHub's Contents API.
- Password check happens server-side — never readable from page source.
- Session tokens are short-lived (8h) signed tokens, no database needed.

## Local testing before going live

```
npm install -g netlify-cli
netlify login
netlify dev
```

This runs the static site + functions together locally with your env vars
(pull them with `netlify env:pull` first, or set a local `.env` based on
`.env.example`). Test login, create, edit, delete, and image upload before
pointing the real domain at it.

## Known limitations (worth knowing, not blockers)

- **No concurrent-edit protection** — simultaneous edits from two people
  would hit a GitHub `sha` mismatch error; a non-issue for a single-admin
  client.
- **No image cleanup** — uploaded images accumulate in `assets/news/`.
  Fine for now, worth a periodic manual tidy.
- **Content field is raw HTML in a textarea**, matching your existing data
  format. If the client needs a WYSIWYG editor instead of typing tags,
  that's a reasonable next step (e.g. swapping in Quill or TipTap).
