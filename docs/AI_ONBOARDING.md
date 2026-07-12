# EcoSphere — AI Onboarding & Developer Guide

> **Read this first.** It gives any AI coding agent (Antigravity / Gemini / etc.) everything
> needed to build a feature in this repo *correctly and consistently*. Follow the conventions
> exactly — the platform foundation is already built and every module must match it.

---

## 1. What we're building

**EcoSphere** is an **ESG (Environmental, Social, Governance) Management Platform** for the
Odoo Hackathon '26. Organizations use it to measure carbon emissions, run CSR & employee
engagement, track governance/compliance, and drive sustainability through **gamification**
(challenges, XP, badges, rewards, leaderboards) — all in one dashboard with an
**ESG scoring rollup** (Environmental/Social/Governance → per-department → overall score).

## 2. Tech stack (do NOT substitute)

| Layer | Tech |
|---|---|
| Backend | Node.js, **Express 5**, **Prisma 7.8** (ORM), **PostgreSQL**, JWT auth |
| Frontend | **React 19**, **Vite**, **Tailwind CSS v4**, **Zustand** (state), **axios**, **Recharts** (charts), **react-hot-toast** |
| Auth | JWT bearer tokens, RBAC roles: `ADMIN` / `MANAGER` / `EMPLOYEE` |

Ports: **backend `http://localhost:5001`**, **frontend `http://localhost:5173`**. API base = `http://localhost:5001/api`.

## 3. Repo layout

```
EcoSphere/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma      # ALL 20 models already defined (owned by Lead)
│   │   └── seed.js            # demo data
│   ├── prisma.config.ts       # Prisma 7 CLI datasource (reads DATABASE_URL)
│   └── src/
│       ├── config/            # database.js (prisma client), constants.js
│       ├── middleware/        # auth.middleware, role.middleware, validate, error
│       ├── controllers/       # <resource>.controller.js   ← you create these
│       ├── routes/            # <resource>.routes.js + index.js (aggregator)
│       ├── validators/        # optional express-validator chains
│       ├── services/          # notification.service.js, scoring.service.js
│       └── utils/             # ApiError.js, ApiResponse.js, helpers.js
└── frontend/
    └── src/
        ├── config/constants.js       # API_BASE_URL, ROLES, STATUS_COLORS
        ├── services/api.js           # axios instance + per-module API objects
        ├── store/authStore.js        # Zustand auth (login/signup/logout)
        ├── components/ui/index.jsx   # Button, Input, Select, Card, Modal, Badge, Table bits…
        ├── components/layout/        # Sidebar.jsx, Layout.jsx
        └── pages/                    # one folder/file per feature  ← you create these
```

## 4. Run it locally

```bash
# 1) Postgres must be running + a database named ecosphere_db must exist
#    (docker: `docker start dev-postgres` then create DB, or any local Postgres)

# 2) Backend
cd backend
cp .env.example .env            # set DATABASE_URL + JWT_SECRET
npm install
npm run db:push                 # sync Prisma schema -> DB (NO migrations, we use db push)
npm run db:seed                 # load demo data + test accounts
npm run dev                     # http://localhost:5001

# 3) Frontend (second terminal)
cd frontend
cp .env.example .env            # VITE_API_URL=http://localhost:5001/api
npm install
npm run dev                     # http://localhost:5173
```

**Test accounts** (password shown): `admin@ecosphere.com` / `Admin@123` · `sanjana@ecosphere.com` / `Manager@123` · `priya@ecosphere.com` / `Employee@123`.

## 5. Request flow (how a feature works end-to-end)

```
React page  →  services/api.js (axios, auto-attaches JWT)  →  Express route
   →  auth middleware (authenticate + authorize roles)  →  controller
   →  Prisma  →  PostgreSQL  →  ApiResponse JSON  →  back to the page
```

## 6. Golden conventions (MUST follow)

1. **The Prisma schema is DONE.** All 20 models already exist in `backend/prisma/schema.prisma`.
   **You build controllers, routes and pages against existing models — do NOT add/edit models.**
   If you truly need a schema change, ask the **Lead** (only the Lead edits `schema.prisma`, then runs `npm run db:push`).

2. **API response shape is uniform.** Controllers return `new ApiResponse(status, data, message)` which
   serializes to `{ success, statusCode, message, data }`. So on the client:
   ```js
   const res = await somethingAPI.getAll();
   const items = res.data.data.items;   // axios.res.data = body, body.data = your payload
   ```

3. **Auth & RBAC.** Protect every route:
   ```js
   const { authenticate } = require('../middleware/auth.middleware');
   const { isAdmin, isManager, isAdminOrManager, authorize } = require('../middleware/role.middleware');
   router.use(authenticate);                       // require login
   router.post('/', isAdminOrManager, controller.create);   // gate by role
   ```
   `req.user` holds the logged-in user (id, role, departmentId, …).

4. **Errors:** in controllers, `try { … } catch (err) { next(err); }`. Throw `ApiError.badRequest('msg')`,
   `ApiError.notFound(...)`, `ApiError.forbidden(...)`. The error middleware formats everything.

5. **One resource = one controller + one route file**, named `<resource>.controller.js` / `<resource>.routes.js`.
   Mirror `backend/src/controllers/department.controller.js` exactly (it's the reference CRUD).

6. **Frontend:** one page (or folder) per feature under `src/pages/`, one API object per module in a
   **new file** `src/services/<module>.js` (import the shared axios `api` from `./api`). Use the shared
   UI kit from `components/ui` — don't hand-roll buttons/inputs/modals.

7. **Only 3 files are shared** (append-only, marked with `// TEAMMATES:` comments — merge-safe):
   - `backend/src/routes/index.js` — add `router.use('/your-thing', yourRoutes)`
   - `frontend/src/services/api.js` — add your API object (or import your `services/<module>.js`)
   - `frontend/src/components/layout/Sidebar.jsx` — the nav already lists all modules; no change needed unless adding sub-nav

8. **Notifications:** to notify a user, use the service:
   ```js
   const { notify, notifyAdmins } = require('../services/notification.service');
   await notify(userId, { type: 'CSR_APPROVAL', title: 'Approved!', message: '…', link: '/social' });
   ```

9. **Scoring is automatic.** The dashboard recomputes E/S/G/overall from your data via
   `scoring.service.js`. Just write correct data; scores update. Don't touch scoring unless coordinating with Lead.

10. **Styling:** Tailwind v4, brand color **emerald** (`emerald-600`). Never build class names by string
    interpolation (`bg-${x}-500`) — Tailwind won't detect them. Use full literal class names.

## 7. Data model (what already exists — group by module)

**Enums:** `UserRole{ADMIN,MANAGER,EMPLOYEE}` · `CarbonSource{PURCHASE,MANUFACTURING,EXPENSE,FLEET,MANUAL}` ·
`ApprovalStatus{PENDING,APPROVED,REJECTED}` · `ChallengeStatus{DRAFT,ACTIVE,UNDER_REVIEW,COMPLETED,ARCHIVED}` ·
`Difficulty{EASY,MEDIUM,HARD}` · `Severity{LOW,MEDIUM,HIGH,CRITICAL}` · `IssueStatus{OPEN,IN_PROGRESS,RESOLVED}` ·
`ESGPillar{ENVIRONMENTAL,SOCIAL,GOVERNANCE}` · `BadgeUnlockType{XP,CHALLENGES}` · `CategoryType{CSR_ACTIVITY,CHALLENGE}` · `Gender{MALE,FEMALE,OTHER,UNDISCLOSED}`

- **Platform (Lead, done):** `User`, `Department`, `Category`, `Setting`, `Notification`, `DepartmentScore`
- **Environmental:** `EmissionFactor`, `ProductESGProfile`, `CarbonTransaction`, `EnvironmentalGoal`
- **Social:** `CSRActivity`, `EmployeeParticipation`
- **Governance:** `ESGPolicy`, `PolicyAcknowledgement`, `Audit`, `ComplianceIssue`
- **Gamification:** `Challenge`, `ChallengeParticipation`, `Badge`, `EmployeeBadge`, `Reward`, `RewardRedemption`

> Open `backend/prisma/schema.prisma` to see exact fields. `User` has `xp` (lifetime → leaderboard/badges)
> and `points` (spendable → rewards).

## 8. Recipe: add a module (worked example = EmissionFactor)

**Backend — `backend/src/controllers/emissionFactor.controller.js`:**
```js
const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');

const list = async (req, res, next) => {
  try {
    const items = await prisma.emissionFactor.findMany({ orderBy: { name: 'asc' } });
    res.json(new ApiResponse(200, { items }, 'Emission factors retrieved'));
  } catch (e) { next(e); }
};
const create = async (req, res, next) => {
  try {
    const { name, source, unit, factor, reference } = req.body;
    if (!name || factor == null) throw ApiError.badRequest('name and factor are required');
    const item = await prisma.emissionFactor.create({
      data: { name, source: source || 'MANUAL', unit, factor: Number(factor), reference },
    });
    res.status(201).json(new ApiResponse(201, { item }, 'Created'));
  } catch (e) { next(e); }
};
const update = async (req, res, next) => {
  try {
    const item = await prisma.emissionFactor.update({ where: { id: req.params.id }, data: req.body });
    res.json(new ApiResponse(200, { item }, 'Updated'));
  } catch (e) { next(e); }
};
const remove = async (req, res, next) => {
  try { await prisma.emissionFactor.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Deleted')); } catch (e) { next(e); }
};
module.exports = { list, create, update, remove };
```

**Backend — `backend/src/routes/emissionFactor.routes.js`:**
```js
const express = require('express');
const router = express.Router();
const c = require('../controllers/emissionFactor.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { isAdminOrManager } = require('../middleware/role.middleware');
router.use(authenticate);
router.get('/', c.list);
router.post('/', isAdminOrManager, c.create);
router.put('/:id', isAdminOrManager, c.update);
router.delete('/:id', isAdminOrManager, c.remove);
module.exports = router;
```

**Backend — append to `backend/src/routes/index.js`** (under the `// TEAMMATES:` marker):
```js
const emissionFactorRoutes = require('./emissionFactor.routes');
router.use('/emission-factors', emissionFactorRoutes);
```

**Frontend — `frontend/src/services/environmental.js`:**
```js
import api from './api';
export const emissionFactorsAPI = {
  getAll: () => api.get('/emission-factors'),
  create: (d) => api.post('/emission-factors', d),
  update: (id, d) => api.put(`/emission-factors/${id}`, d),
  remove: (id) => api.delete(`/emission-factors/${id}`),
};
```

**Frontend — a page** `frontend/src/pages/environmental/EmissionFactorsPage.jsx`: copy the structure of
`frontend/src/pages/SettingsPage.jsx` → `Departments` component (table + `Modal` form + create/edit/delete),
using `Card, Button, Input, Select, Modal, Badge, PageLoader` from `../../components/ui` and `toast` from
`react-hot-toast`. Wire it into the module page (replace the placeholder in `frontend/src/pages/modules.jsx`).

That's the whole loop. Every resource is this same shape.

## 9. Module ownership

| Owner | Area | Models to build APIs/UI for |
|---|---|---|
| **Vrund (Lead)** | Platform + integration/help | done: auth, users, departments, categories, settings, dashboard, scoring |
| **Prince** | Environmental | EmissionFactor, CarbonTransaction, EnvironmentalGoal, ProductESGProfile |
| **Tirth** | Social + Governance | CSRActivity, EmployeeParticipation, ESGPolicy, PolicyAcknowledgement, Audit, ComplianceIssue |
| **Samarth** | Gamification + Reports | Challenge, ChallengeParticipation, Badge, Reward, Leaderboard, Reports |

See `docs/tasks/<NAME>.md` for each person's detailed checklist.

## 10. Git workflow (hackathon rules — important)

- Branch: `git checkout -b feat/<module>` → work → push → open a quick PR to `main` (Lead merges), **~every hour**.
- **Everyone commits their OWN code** with clear messages — individual commits are scored for contribution.
- Keep `main` always running. Pull `main` before starting each session.

## 11. Gotchas

- **Prisma 7**: connection comes from `prisma.config.ts` + a driver adapter — the `datasource` block in
  `schema.prisma` has no `url` (that's correct). Use `npm run db:push`, there are no migration files.
- **Response shape**: always `res.data.data` on the client (see §6.2).
- **Enums** are strings matching the schema exactly (e.g. `'PENDING'`, `'ACTIVE'`), case-sensitive.
- **Tailwind v4**: no dynamic class strings (§6.10).
- **RBAC 403**: if a call returns 403, your route guard is stricter than the caller's role — check `authorize(...)`.
