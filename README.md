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

## Deploy staging to Cloudflare Pages

Production stays on GitHub Pages (`main`). Staging deploys to Cloudflare Pages from the `staging` branch.

### One-time Cloudflare setup

1. In [Cloudflare Dashboard](https://dash.cloudflare.com/) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git** is optional; this repo uses GitHub Actions instead.
2. Note your **Account ID** (Workers & Pages overview, right column).
3. Create an **API token**: **My Profile → API Tokens → Create Token** → use the **Edit Cloudflare Workers** template (includes Pages deploy). Or create a custom token with **Account → Cloudflare Pages → Edit**.
4. In GitHub: **Settings → Secrets and variables → Actions** → add:
   - `CLOUDFLARE_API_TOKEN` — token from step 3
   - `CLOUDFLARE_ACCOUNT_ID` — account ID from step 2
   - `VITE_GA_MEASUREMENT_ID_STAGING` *(optional)* — separate GA4 stream for staging; omit to keep analytics off on staging
5. Create and push a `staging` branch (or merge into it). The workflow creates the Pages project `random-bible-verse-staging` on first deploy.

Staging URL: `https://random-bible-verse-staging.pages.dev` (or add a custom domain under the Pages project, e.g. `staging.hidden.swlabs.cc`).

To promote changes: merge `staging` → `main` (production deploys via the GitHub Pages workflow).

Cloudflare serves `public/_headers` so `sw.js` is not cached aggressively—PWA updates should land faster than on GitHub Pages alone.

## Deploy to GitHub Pages

1. In your GitHub repo go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push the `main` branch (or your default branch). The workflow builds and deploys automatically.

The site is at [https://hidden.swlabs.cc/](https://hidden.swlabs.cc/) and [https://zincsoda.github.io/random-bible-verse/](https://zincsoda.github.io/random-bible-verse/). The build uses a relative base (`./`) so one deploy works at both URLs.

If your default branch is not `main`, edit `.github/workflows/deploy.yml` and change `branches: [main]` to your branch (e.g. `master`).

### Faster updates for the installed PWA

The app checks for a new service worker as soon as it opens, then every two minutes while it stays open, so deploys are noticed sooner than relying on the browser alone. You still need to tap **Reload** when the update banner appears.

GitHub Pages does not let you set custom `Cache-Control` headers on `github.io`, so CDN caching of `sw.js` can occasionally add extra delay after a deploy. If that becomes a problem, a common approach is to put a CDN you control (for example Cloudflare) in front of the site and bypass or shorten cache for the service worker URL.

## Google Analytics (GA4)

1. In [Google Analytics](https://analytics.google.com/), open your property → **Admin** → **Data streams** → your web stream.
2. Copy the **Measurement ID** (format `G-XXXXXXXXXX`).
3. **Local dev:** copy `.env.example` to `.env` and set `VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX`, then restart `npm run dev`.
4. **Production (GitHub Pages):** add a repository secret named `VITE_GA_MEASUREMENT_ID` with that same value (**Settings → Secrets and variables → Actions**). The deploy workflow passes it into the build.

Analytics is off when the variable is unset (including in tests). Page views are sent automatically; custom events include verse picks, “Inspire me”, settings changes, and memory-practice actions. Verse text is not sent—only references where useful.

**PWA installs:** Chrome/Edge/Android fire a `pwa_install` event when the user completes the browser install prompt. iOS does not expose an install event (users add via Share → Add to Home Screen); GA will record `pwa_standalone_session` the first time they open the app from the home screen icon each session, which reflects installed usage but not the exact install moment. Expanding **Install on iOS** in the reading menu sends `ios_install_help_opened` (interest in installing, not a completed install).

## Features

- Random verse on load; “Another verse” loads a new one
- Dark background (`#0f0f12`), centered layout, readable typography
- PWA: `manifest.json` and service worker for install and offline use
- Verses are bundled (no API), so it works fully offline
