# habits

Ultraminimal habit tracker in the style of easlo.co: monochrome, generous whitespace, quiet typography, nothing decorative.

Shared agent rules, skills, and the multi-repo workflow live in the Home Repo: [soriairos/sistema-ia](https://github.com/soriairos/sistema-ia). Read that repository's `AGENTS.md` first. On the shared box the Home Repo checkout is `/workspace/sistema`. This repo's mapped path is `/workspace/habits`.

## This repo

Read `CODING_STANDARDS.md` before writing code. Read `DESIGN.md` before touching UI.

- Stack: Vite + vanilla TypeScript (strict). No UI framework, no CSS framework, no runtime dependencies.
- State lives in `localStorage`, behind one module (`src/store.ts`). Nothing else touches storage.
- Tests: Vitest for domain logic.
- `npm run dev` — dev server on http://localhost:5173 (also in `.claude/launch.json` as `dev`).
- `npm run check` — typecheck + lint + tests. Must pass before any commit.

## Verification

Every UI change is verified in the browser pane (`preview_start` with `dev`), in light and dark, at desktop and 375px width. Check the console for errors.

## Deploy

- GitHub Pages at https://soriairos.github.io/habits/ via `.github/workflows/deploy.yml` on push to `main` (check, build, deploy `dist/`).
- Builds use `base: '/habits/'`; dev stays at `/`. Preview a build with `npx vite preview --base /habits/`.
- Installable PWA: `public/manifest.webmanifest`, icons in `public/` (regenerate with `node scripts/icons.mjs`).
- `sw.js` is a template; the build fills in the asset list and a content-hash cache version. Registered only in production.
- Service worker rule: never let the HTTP cache (Pages sends max-age=600) feed the worker. Precache with `cache: 'reload'`; navigations are network-first with `cache: 'reload'`, falling back to the cached `index.html` only when the network fails; hashed assets are cache-first. The cache version hashes the built files, `public/` and the `sw.js` template, so any change installs a new cache. Install calls `skipWaiting`; activate deletes old caches and calls `clients.claim`.
