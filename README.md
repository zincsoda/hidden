# Random Bible Verse

A small PWA built with React and Vite that shows a random Bible verse (KJV) centered on a dark screen.

## Run locally

- **Node:** Use Node 20.19+ or 22.12+ (required by Vite 7).
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

## Features

- Random verse on load; “Another verse” loads a new one
- Dark background (`#0f0f12`), centered layout, readable typography
- PWA: `manifest.json` and service worker for install and offline use
- Verses are bundled (no API), so it works fully offline
