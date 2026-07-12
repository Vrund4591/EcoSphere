# EcoSphere — ESG Management Platform

Odoo Hackathon '26 · Virtual Round · Problem Statement: **EcoSphere (ESG Management Platform)**

An ESG platform that lets organizations **measure, manage and improve** their Environmental,
Social and Governance performance — integrating operational data, employee participation and
compliance into a unified dashboard, with **gamification** (challenges, XP, badges, rewards,
leaderboards).

## Modules
- **Environmental** — emission factors, carbon transactions (auto-calculated), sustainability goals, product ESG profiles
- **Social** — CSR activities, employee participation & approvals, diversity metrics
- **Governance** — ESG policies & acknowledgements, audits, compliance issues (owner + due date + overdue flagging)
- **Gamification** — challenges (full lifecycle), XP, auto-awarded badges, reward redemption, leaderboards
- **Dashboard & Reports** — E/S/G → department → overall ESG scoring rollup; Environmental/Social/Governance/Summary reports + custom builder + export (PDF/Excel/CSV)
- **Settings** — departments, categories, ESG configuration (weights + automation toggles), notification settings

## Tech stack
| Layer | Stack |
|---|---|
| Backend | Node.js · Express 5 · Prisma 7 · PostgreSQL · JWT (RBAC: Admin / Manager / Employee) |
| Frontend | React 19 · Vite · Tailwind CSS · Recharts · axios · Zustand |

## Monorepo layout
```
EcoSphere/
├── backend/    # Express + Prisma API
└── frontend/   # React + Vite SPA
```

## Quick start
**1. Database (PostgreSQL)**
```bash
# any local Postgres works; create the database once:
createdb ecosphere_db   # or via psql: CREATE DATABASE ecosphere_db;
```

**2. Backend**
```bash
cd backend
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install
npm run db:push               # sync schema
npm run db:seed               # demo data + test accounts
npm run dev                   # http://localhost:5001
```

**3. Frontend**
```bash
cd frontend
cp .env.example .env          # VITE_API_URL=http://localhost:5001/api
npm install
npm run dev                   # http://localhost:5173
```

## Docs (read before coding — esp. for AI agents / Antigravity)
- **[AGENTS.md](AGENTS.md)** — quick agent context + non-negotiable rules
- **[docs/AI_ONBOARDING.md](docs/AI_ONBOARDING.md)** — full architecture, conventions, data model, and a copy-paste recipe for adding a feature
- **Per-person tasks:** [Prince](docs/tasks/PRINCE.md) · [Tirth](docs/tasks/TIRTH.md) · [Samarth](docs/tasks/SAMARTH.md)

## Team
| Member | Area |
|---|---|
| **Vrund** (Lead) | Platform: auth/RBAC, schema, settings, scoring, dashboard, integration |
| **Prince** | Environmental |
| **Tirth** | Social + Governance |
| **Samarth** | Gamification + Reports |

Everyone commits their **own** code to `main` at least **once per hour** (contribution is scored per author).

_Built for Odoo Hackathon '26._
