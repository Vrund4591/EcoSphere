# 🌱 Prince — Environmental Module

> **Before you start:** read [`AGENTS.md`](../../AGENTS.md) and [`docs/AI_ONBOARDING.md`](../AI_ONBOARDING.md).
> The database schema and all conventions are already set — you build **APIs + UI against existing models**.
> Reference implementation to copy: `backend/src/controllers/department.controller.js` and the
> **Settings → Departments** UI in `frontend/src/pages/SettingsPage.jsx`.

## Your mission
Own the **Environmental** pillar: carbon accounting, emission factors, sustainability goals, product ESG
profiles — and the star feature, **automatic carbon calculation**.

## Models you work with (already in `schema.prisma` — don't edit it)
- **EmissionFactor**: `name`, `source` (enum: PURCHASE/MANUFACTURING/EXPENSE/FLEET/MANUAL), `unit` (e.g. "kWh","liter","km"), `factor` (Float = kgCO₂e per unit), `reference?`, `status`
- **CarbonTransaction**: `source`, `quantity` (Float), `co2Amount` (Float, = quantity×factor), `description?`, `date`, `departmentId?`, `emissionFactorId?`
- **EnvironmentalGoal**: `name`, `targetCo2` (Float), `currentCo2` (Float), `deadline?`, `status`, `departmentId?`
- **ProductESGProfile**: `name`, `category?`, `carbonFootprint` (Float), `recyclablePct` (Float), `status`, `emissionFactorId?`

## Backend — create these files
| File | Endpoints |
|---|---|
| `controllers/emissionFactor.controller.js` + `routes/emissionFactor.routes.js` | GET/POST/PUT/DELETE `/emission-factors` |
| `controllers/carbonTransaction.controller.js` + `routes/carbonTransaction.routes.js` | GET/POST/PUT/DELETE `/carbon-transactions` (filters: `departmentId`, `source`, date range) |
| `controllers/environmentalGoal.controller.js` + `routes/environmentalGoal.routes.js` | GET/POST/PUT/DELETE `/environmental-goals` |
| `controllers/productProfile.controller.js` + `routes/productProfile.routes.js` | GET/POST/PUT/DELETE `/product-profiles` |

Then append to `backend/src/routes/index.js` (under the `// TEAMMATES:` marker):
```js
router.use('/emission-factors', require('./emissionFactor.routes'));
router.use('/carbon-transactions', require('./carbonTransaction.routes'));
router.use('/environmental-goals', require('./environmentalGoal.routes'));
router.use('/product-profiles', require('./productProfile.routes'));
```
Guard writes with `isAdminOrManager`; reads with just `authenticate`. On list endpoints `include: { department: true, emissionFactor: true }`.

## ⭐ Signature feature — Auto Emission Calculation
On **create/update** of a CarbonTransaction:
```js
const { getOrCreateSettings } = require('../controllers/setting.controller');
const settings = await getOrCreateSettings();
let co2Amount = Number(req.body.co2Amount) || 0;
if (settings.autoEmissionCalc && req.body.emissionFactorId) {
  const f = await prisma.emissionFactor.findUnique({ where: { id: req.body.emissionFactorId } });
  co2Amount = Number(req.body.quantity) * (f?.factor || 0);   // auto: no manual entry needed
}
// save with co2Amount
```
Bonus demo touch: a `POST /carbon-transactions/generate` that seeds a few transactions from sample
Purchase/Manufacturing/Fleet quantities × factors (shows "auto-generated from operations").

## Frontend — build these
Replace the placeholder in `frontend/src/pages/modules.jsx` `EnvironmentalPage` with a real tabbed page
(`frontend/src/pages/environmental/…`). Create `frontend/src/services/environmental.js` with the API objects.
Tabs (mirror the mockup):
1. **Emission Factors** — table + create/edit/delete modal (name, source, unit, factor, reference).
2. **Carbon Transactions** — table + "Log Carbon Data" modal: pick source + department + emission factor + quantity → **CO₂ shown auto-computed**. Show total CO₂.
3. **Environmental Goals** — cards/table with **progress bars** (target vs current CO₂, %, deadline, status). Reuse `ScoreBar` from `components/ui`.
4. **Product ESG Profiles** — table + CRUD.
Use `Card, Button, Input, Select, Modal, Badge, PageLoader` from `../../components/ui`; `toast` for feedback.

## ✅ Done when (demo checklist)
- [ ] Add an emission factor → log a carbon transaction → **CO₂ auto-calculates** from quantity × factor.
- [ ] A goal's progress bar reflects data; statuses show (Active/On Track/Completed).
- [ ] The main **Dashboard's Environmental score + emissions trend** move after you add data.
- [ ] Everything role-gated (employees can view; managers/admins edit).

## 📋 Paste this into your Antigravity AI to start
```
This is the EcoSphere repo. First read AGENTS.md and docs/AI_ONBOARDING.md fully — follow every
convention there (ApiResponse shape res.data.data, auth middleware, ApiError, one controller+route per
resource, shared UI kit, DO NOT edit prisma/schema.prisma). My task is docs/tasks/PRINCE.md — the
Environmental module. Build the backend controllers+routes for EmissionFactor, CarbonTransaction (with
the auto emission calculation described), EnvironmentalGoal and ProductESGProfile, append them in
backend/src/routes/index.js, then build the frontend Environmental tabbed page + services/environmental.js,
mirroring the Settings→Departments CRUD pattern. Then run the app and verify the auto CO₂ calc and that
the dashboard Environmental score updates.
```

## Git
`git checkout -b feat/environmental` → commit your OWN work with clear messages **every hour** → push → PR to `main`.
