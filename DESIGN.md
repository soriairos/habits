# Design

Reference: easlo.co. Black on off-white, one typeface, almost no color. The page should feel like a clean Notion page, not an app.

## Rules

- Palette: tokens only, defined on `:root` in `src/style.css`. Light: background `#fbfbfa`, text `#191919`, muted `#9b9a97`, hairline `#ededec`. Dark mode mirrors it via `prefers-color-scheme`. No other colors anywhere.
- Type: Inter (Google Fonts) with system fallback. Two sizes for body/labels, one for the title. Weights 400 and 500 only.
- Layout: single centered column, max ~640px, 16px side gutters on mobile. No cards, no shadows, no gradients, no rounded-corner boxes except the check cells.
- Lines: 1px hairlines to separate, never borders around containers.
- Motion: none except a ~120ms fill on check toggle.
- Icons: none. Text and the check cell are the whole vocabulary.

## Screen

One screen.

- Header: small muted date line ("October 2026"), title "Habits".
- Grid: one row per habit. Habit name on the left; the last 7 days as square check cells on the right; day initials (M T W …) above the cells, today emphasized.
- Each row shows a muted streak count ("12d") at the end.
- Click a cell to toggle. Click a habit name to rename inline; clearing the name and committing deletes the habit (no confirm dialog).
- Last row: muted "+ New habit" text that becomes an input.
- Keyboard: Enter commits, Escape cancels.
