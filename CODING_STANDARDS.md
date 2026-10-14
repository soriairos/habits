# Coding standards

Reviewers enforce these. Deviations get fixed before feature work continues — no workarounds.

1. **Domain is pure.** `src/habits.ts` holds types and pure functions (toggle, streak, rename, add, remove). No DOM, no storage, no `Date.now()` — today's date is passed in as a `YYYY-MM-DD` string.
2. **One storage seam.** Only `src/store.ts` reads/writes `localStorage`. It validates parsed data and falls back to an empty state on anything malformed; storage access is wrapped in try/catch.
3. **Dates are strings.** Days are local `YYYY-MM-DD` strings produced by one helper. Never compare `Date` objects or use UTC getters for day keys.
4. **Render is a function of state.** `src/view.ts` re-renders from state; event handlers call domain functions, save, re-render. No hidden UI state beyond the element currently being edited.
5. **Strict TypeScript.** `strict`, `noUncheckedIndexedAccess`. No `any`, no `as` casts outside the store's validation, no non-null `!`.
6. **Tests cover behavior** of the domain module (streaks across gaps and today-unchecked, toggling, add/rename/remove). Test through the public functions.
7. **CSS uses tokens.** Every color is a `var(--…)` from `:root`. No inline styles set from JS; toggle classes instead.
8. **No dependencies** beyond dev tooling (vite, typescript, vitest, eslint).
9. No comments that restate code.
