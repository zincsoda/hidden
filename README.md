# Random Bible Verse

A small PWA built with React and Vite that shows a random Bible verse (KJV) centered on a dark screen.

## Run locally

- **Node:** Use Node 18+ (project uses Vite 5).
- Install and start:

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (e.g. http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview
```

The service worker is only registered in production, so the app can be installed and used offline after the first load.

## Deploy to Cloudflare Workers (production)

Production on `main` deploys to [Cloudflare Workers Static Assets](https://developers.cloudflare.com/workers/static-assets/) via `wrangler.jsonc`. Pushes to `main` run the GitHub Actions workflow; you can also deploy locally with `npm run deploy`.

### One-time setup

1. **Cloudflare account** — the zone for [hidden.swlabs.cc](https://hidden.swlabs.cc/) must be on Cloudflare (custom domain is declared in `wrangler.jsonc`).
2. **API token** — in the Cloudflare dashboard, create a token with **Workers Scripts: Edit** (and **Account Settings: Read** if prompted). Copy your **Account ID** from the Workers overview page.
3. **GitHub secrets** — in the repo go to **Settings → Secrets and variables → Actions** and add:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `VITE_GA_MEASUREMENT_ID` (GA4; see below)
   - `VITE_GA_MEASUREMENT_ID_STAGING` *(optional)* — separate GA4 stream for staging
4. **DNS** — on first deploy, Wrangler attaches `hidden.swlabs.cc` as a Worker custom domain. If the domain previously pointed at GitHub Pages, remove the old CNAME/A record first (see [Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)).
5. **Disable GitHub Pages** (optional) — **Settings → Pages → Source: None**, so only Workers serves production.

Live site: [https://hidden.swlabs.cc/](https://hidden.swlabs.cc/)

If your default branch is not `main`, edit `.github/workflows/deploy.yml` and change `branches: [main]`.

### Local deploy

```bash
npm install
npx wrangler login   # once
npm run deploy
```

Preview the Worker + assets locally: `npm run preview:worker`.

### Faster updates for the installed PWA

The app checks for a new service worker as soon as it opens, then every two minutes while it stays open, so deploys are noticed sooner than relying on the browser alone. You still need to tap **Reload** when the update banner appears.

`public/_headers` sets strict cache headers on `sw.js` and Workbox files so Cloudflare does not serve a stale service worker after a deploy.

## Deploy staging to Cloudflare Pages

Staging deploys from the `staging` branch via `.github/workflows/deploy-staging.yml`.

1. Create and push a `staging` branch (or merge into it). The workflow creates the Pages project `random-bible-verse-staging` on first deploy and attaches the custom domain.
2. Uses the same `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` secrets as production.

**Staging URLs**

- [https://staging.hidden.swlabs.cc/](https://staging.hidden.swlabs.cc/) — custom domain (auto-attached after each deploy)
- [https://random-bible-verse-staging.pages.dev](https://random-bible-verse-staging.pages.dev) — default Pages hostname

To promote changes: merge `staging` → `main` (production deploys via the Workers workflow).

## Google Analytics (GA4)

1. In [Google Analytics](https://analytics.google.com/), open your property → **Admin** → **Data streams** → your web stream.
2. Copy the **Measurement ID** (format `G-XXXXXXXXXX`).
3. **Local dev:** copy `.env.example` to `.env` and set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`, then restart `npm run dev`.
4. **Production (Cloudflare Workers):** add a repository secret named `VITE_GA_MEASUREMENT_ID` with that same value (**Settings → Secrets and variables → Actions**). The deploy workflow passes it into the build.

Analytics is off when the variable is unset (including in tests). Page views are sent automatically; custom events include verse picks, “Inspire me”, settings changes, and memory-practice actions. Verse text is not sent—only references where useful.

**PWA installs:** Chrome/Edge/Android fire a `pwa_install` event when the user completes the browser install prompt. iOS does not expose an install event (users add via Share → Add to Home Screen); GA will record `pwa_standalone_session` the first time they open the app from the home screen icon each session, which reflects installed usage but not the exact install moment. Expanding **Install on iOS** in the reading menu sends `ios_install_help_opened` (interest in installing, not a completed install).

## Features

- Random verse on load; “Another verse” loads a new one
- Dark background (`#0f0f12`), centered layout, readable typography
- PWA: `manifest.json` and service worker for install and offline use
- Verses are bundled (no API), so it works fully offline
