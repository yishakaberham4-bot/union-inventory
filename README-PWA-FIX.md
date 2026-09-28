# Union Inventory – PWA Install Fix

## What was wrong
Chrome showed **"This app cannot be installed"** because:

1. No Service Worker was registered (required by Chrome for installability)
2. Icons + manifest were inside the `app/` folder instead of `public/` (so they were not served at `/icons/...` and `/manifest.webmanifest`)

## What was fixed

### New / updated files
- `public/manifest.webmanifest` – improved with `id`, `scope`
- `public/sw.js` – Service Worker with `fetch` handler
- `public/icons/*` – icons moved here so they are publicly accessible
- `public/apple-touch-icon.png`
- `public/favicon.ico`
- `app/components/pwa-register.tsx` – registers the service worker
- `app/layout.tsx` – updated to include PwaRegister + viewport themeColor

## How to use

1. Copy the **entire contents** of this folder into your Next.js project root
   (merge with your existing project).

2. Make sure you have a `public/` folder at the project root.
   The files inside `public/` must stay in `public/`.

3. Redeploy to Vercel (or run `npm run build && npm start` locally).

4. Open the site on your phone in **Chrome** → menu → **Install app**.
   It should now work.

## Quick test (desktop Chrome)
1. Open the site
2. Open DevTools → Application → Manifest
3. Check that there are no errors under "Installability"
4. Application → Service Workers should show `/sw.js` as activated

## Notes
- The service worker is minimal (just enough for installability).
  You can later expand it for offline caching if needed.
- Clear site data / uninstall any previous shortcut before testing again.
