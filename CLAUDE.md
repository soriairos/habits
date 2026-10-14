# Habit tracker

An ultraminimal habit tracker in the style of easlo.co (Easlo's Notion templates): monochrome, generous whitespace, quiet typography, nothing decorative.

Read `CODING_STANDARDS.md` before writing code. Read `DESIGN.md` before touching UI.

## Stack

- Vite + vanilla TypeScript (strict). No UI framework, no CSS framework, no runtime dependencies.
- State lives in `localStorage`, behind one module (`src/store.ts`). Nothing else touches storage.
- Tests: Vitest for domain logic.

## Commands

- `npm run dev` — dev server on http://localhost:5173 (also in `.claude/launch.json` as `dev`)
- `npm run check` — typecheck + lint + tests. Must pass before any commit.

## Verification

Every UI change is verified in the browser pane (`preview_start` with `dev`), in light and dark, at desktop and 375px width. Check the console for errors.

## Deploy

- GitHub Pages at https://soriairos.github.io/habits/ via `.github/workflows/deploy.yml` on push to `main` (check, build, deploy `dist/`).
- Builds use `base: '/habits/'`; dev stays at `/`. Preview a build with `npx vite preview --base /habits/`.
- Installable PWA: `public/manifest.webmanifest`, icons in `public/` (regenerate with `node scripts/icons.mjs`).
- `sw.js` is a template; the build fills in the asset list and a content-hash cache version. Registered only in production.
