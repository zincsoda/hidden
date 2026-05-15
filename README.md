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

## Deploy to GitHub Pages

1. In your GitHub repo go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Push the `main` branch (or your default branch). The workflow builds and deploys automatically.

The site will be at `https://<your-username>.github.io/random-bible-verse/`.

If your default branch is not `main`, edit `.github/workflows/deploy.yml` and change `branches: [main]` to your branch (e.g. `master`).

### Faster updates for the installed PWA

The app checks for a new service worker as soon as it opens, then every two minutes while it stays open, so deploys are noticed sooner than relying on the browser alone. You still need to tap **Reload** when the update banner appears.

GitHub Pages does not let you set custom `Cache-Control` headers on `github.io`, so CDN caching of `sw.js` can occasionally add extra delay after a deploy. If that becomes a problem, a common approach is to put a CDN you control (for example Cloudflare) in front of the site and bypass or shorten cache for the service worker URL.

## Features

- Random verse on load; “Another verse” loads a new one
- Dark background (`#0f0f12`), centered layout, readable typography
- PWA: `manifest.json` and service worker for install and offline use
- Verses are bundled (no API), so it works fully offline
