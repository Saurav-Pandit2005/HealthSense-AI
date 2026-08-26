# HealthSense AI — Frontend (Rebuilt)

This is a full rebuild of the frontend with one consistent design system
across all 9 pages, built on a **stable stack** instead of the bleeding-edge
one the previous version used.

## What changed from the previous version

| | Before | Now |
|---|---|---|
| React | 19.2 | **18.3** (stable, all libraries fully compatible) |
| Tailwind | v4 (`@tailwindcss/vite`, default `oklch()` colors) | **v3.4** (plain hex colors — this is what caused the earlier PDF font/color bug) |
| react-router-dom | v7 | **v6.26** (stable API) |
| jsPDF | v4 (pre-release) | **v2.5** (stable release) |

The `oklch()` color issue is the direct root cause of the "PDF font changed"
bug you ran into — `html2canvas` doesn't reliably parse modern CSS color
functions, and Tailwind v4 uses them by default for its whole palette. Moving
to Tailwind v3 (plain rgb/hex under the hood) removes that failure mode
entirely, on top of the inline-style + `document.fonts.ready` fix already
applied in `HealthReport.jsx`.

## Design system

- **Colors**: deep teal `brand` (primary), `mint` (positive/success), `coral`
  (alerts/high risk), `amber` (warnings) — all defined as plain hex in
  `tailwind.config.js`.
- **Fonts**: Manrope (headings), Inter (body), JetBrains Mono (numbers/data).
- **Shared components** (`src/components/ui/`): `Field.jsx` (inputs, buttons,
  toggles, tag input), `Card.jsx` (cards, stat cards, badges), `States.jsx`
  (loading/empty/error states) — every page is built from these, so the look
  is consistent everywhere instead of each page reinventing its own styling.

## Project structure

```
src/
├── api/client.js          Single axios instance, auto-attaches the JWT,
│                           one function per backend endpoint
├── context/AuthContext.jsx Login/register/logout/session-restore
├── components/
│   ├── ui/                 Field.jsx, Card.jsx, States.jsx — shared primitives
│   ├── Navbar.jsx
│   └── ProtectedRoute.jsx  Auth + profile-completion route guards
└── pages/
    ├── Login.jsx / Register.jsx
    ├── ProfileSetup.jsx
    ├── Dashboard.jsx        Health score gauge, breakdown, stat cards, 14-day trend
    ├── Tracker.jsx          Daily log form + last-7-days table
    ├── DiseaseRisk.jsx      Diabetes risk form + result + factor breakdown
    ├── FitnessPlanner.jsx   Weekly plan cards, today highlighted
    ├── MealPlanner.jsx      Preference tabs, macro donut, meal cards
    └── HealthReport.jsx     Aggregates everything, exports as PDF
```

## Running it

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` to your backend on
`http://localhost:5000` (see `vite.config.js`) — make sure the Node backend
and the FastAPI ML service (for Disease Risk) are both running.

## Notes on the Health Report / PDF page

`HealthReport.jsx` deliberately uses **inline styles with explicit hex
colors and font-family** for everything inside the captured report area
(`reportRef`), rather than Tailwind utility classes. This is intentional —
`html2canvas` has historically been unreliable about picking up styles that
come from utility classes vs. inline `style` attributes, and this was the
direct cause of the earlier "PDF font changed" bug. If you extend this page,
keep new content inside `reportRef` following the same `styles.*` object
pattern rather than adding Tailwind classes there.

The PDF export also:
- Waits for `document.fonts.ready` before capturing, so web fonts are fully
  loaded before the snapshot is taken.
- Uses JPEG at 92% quality (not PNG) for the embedded image — this keeps a
  multi-page report in the low hundreds of KB instead of ballooning to
  30+ MB.
- Splits across multiple A4 pages automatically if the content is taller
  than one page.
