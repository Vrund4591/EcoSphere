# AGENTS.md — EcoSphere

AI agents (Antigravity / Gemini / etc.): **read [`docs/AI_ONBOARDING.md`](docs/AI_ONBOARDING.md) first** — it
has the full architecture, conventions, data model, and a copy-paste recipe for adding a feature.

## TL;DR
- **EcoSphere** = ESG Management Platform. Backend: Express 5 + Prisma 7 + Postgres + JWT (RBAC: ADMIN/MANAGER/EMPLOYEE). Frontend: React 19 + Vite + Tailwind v4 + Zustand + axios + Recharts.
- Backend `:5001` (API base `/api`), frontend `:5173`.

## Non-negotiable rules
1. **Do NOT edit `backend/prisma/schema.prisma`** — all 20 models already exist. Build controllers/routes/pages against them. (Schema changes go through the Lead only.)
2. API responses are `new ApiResponse(status, data, msg)` → on the client read **`res.data.data`**.
3. Protect routes with `authenticate` + role guards (`isAdmin` / `isAdminOrManager` / `authorize(...)`).
4. Controllers use `try/catch (err){ next(err) }` and throw `ApiError.badRequest(...)` etc.
5. One resource = `<name>.controller.js` + `<name>.routes.js`; mirror `department.controller.js`.
6. Frontend: one page per feature under `src/pages/`, one API object per module file in `src/services/`, use the shared UI kit in `src/components/ui`.
7. Append-only shared files (merge-safe, marked `// TEAMMATES:`): `backend/src/routes/index.js`, `frontend/src/services/api.js`.
8. Tailwind v4 — no dynamic class names (`bg-${x}` won't work).

## Run
```bash
cd backend  && npm install && npm run db:push && npm run db:seed && npm run dev   # :5001
cd frontend && npm install && npm run dev                                         # :5173
```

## Who owns what
Prince → Environmental · Tirth → Social + Governance · Samarth → Gamification + Reports · Vrund → Lead/platform/integration.
Details: `docs/tasks/{PRINCE,TIRTH,SAMARTH}.md`.
