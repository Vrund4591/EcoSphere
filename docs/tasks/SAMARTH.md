# Samarth — Gamification + Reports

> **Before you start:** read [`AGENTS.md`](../../AGENTS.md) and [`docs/AI_ONBOARDING.md`](../AI_ONBOARDING.md).
> Schema + conventions are already set — build **APIs + UI against existing models**.
> Reference: `backend/src/controllers/department.controller.js` + **Settings → Departments** UI.

## Your mission
Own **Gamification** (the fun, demo-winning loop) and the **Reports** hub. You also build a small shared
helper the Social module depends on — **do this first**.

---
## PART A — Gamification

### Models
- **Challenge**: `title`, `description?`, `xp` (Int), `difficulty` (EASY/MEDIUM/HARD), `evidenceRequired` (Bool), `deadline?`, `status` (DRAFT/ACTIVE/UNDER_REVIEW/COMPLETED/ARCHIVED), `categoryId?`
- **ChallengeParticipation**: `progress` (Int 0-100), `proof?`, `approvalStatus` (PENDING/APPROVED/REJECTED), `xpAwarded` (Int), `approverId?`, `challengeId`, `employeeId`
- **Badge**: `name`, `description?`, `icon?` (emoji), `unlockType` (XP/CHALLENGES), `unlockThreshold` (Int), `status`
- **EmployeeBadge**: `employeeId`, `badgeId`, `awardedAt`
- **Reward**: `name`, `description?`, `pointsRequired` (Int), `stock` (Int), `status`
- **RewardRedemption**: `pointsSpent` (Int), `rewardId`, `employeeId`

### FIRST — build the shared helper `backend/src/services/gamification.service.js`
Both your challenge-approval and Tirth's CSR-approval call this:
```js
const prisma = require('../config/database');
const { notify } = require('./notification.service');

async function awardXp(userId, { xp = 0, points = 0 }) {
  await prisma.user.update({ where: { id: userId }, data: { xp: { increment: xp }, points: { increment: points } } });
  await checkAndAwardBadges(userId);
}

async function checkAndAwardBadges(userId) {
  const settings = await prisma.setting.findFirst();
  if (settings && !settings.autoAwardBadges) return;
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const completed = await prisma.challengeParticipation.count({ where: { employeeId: userId, approvalStatus: 'APPROVED' } });
  const badges = await prisma.badge.findMany({ where: { status: 'ACTIVE' } });
  for (const b of badges) {
    const metric = b.unlockType === 'XP' ? user.xp : completed;
    if (metric >= b.unlockThreshold) {
      const exists = await prisma.employeeBadge.findUnique({ where: { employeeId_badgeId: { employeeId: userId, badgeId: b.id } } });
      if (!exists) {
        await prisma.employeeBadge.create({ data: { employeeId: userId, badgeId: b.id } });
        await notify(userId, { type: 'BADGE_UNLOCK', title: 'Badge unlocked! ' + (b.icon || ''), message: `You earned "${b.name}"`, link: '/gamification' });
      }
    }
  }
}
module.exports = { awardXp, checkAndAwardBadges };
```
Push this early so Tirth can import it.

### Backend (`/challenges`, `/challenge-participations`, `/badges`, `/rewards`, `/leaderboard`)
- Challenge CRUD + `PUT /challenges/:id/status` (lifecycle: DRAFT→ACTIVE→UNDER_REVIEW→COMPLETED, ARCHIVED anytime).
- `POST /challenges/:id/join` → ChallengeParticipation (PENDING).
- `GET /challenge-participations?status=PENDING` (approval queue) + `PUT /:id/approve` → set APPROVED,
  `xpAwarded = challenge.xp`, then `awardXp(employeeId, { xp: challenge.xp, points: challenge.xp })` + notify. `PUT /:id/reject`.
- Badge CRUD; Reward CRUD.
- `POST /rewards/:id/redeem` (employee) — in a `prisma.$transaction`: check `user.points >= reward.pointsRequired`
  and `reward.stock > 0`, else `ApiError.badRequest`; decrement `reward.stock` and `user.points`; create
  RewardRedemption; `notify` the user (type `REWARD_REDEEMED`).
- `GET /leaderboard` → top users by `xp` desc (id,name,xp,points,department) + department totals (sum of members' xp).

### Frontend (`GamificationPage`)
Tabs: **Challenges** (cards grouped by status with lifecycle buttons + "Join" + admin "New"), **Participation**
(approval queue), **Badges** (gallery of all badges, earned ones highlighted + admin CRUD), **Rewards**
(catalog with "Redeem" showing your points balance + stock + admin CRUD), **Leaderboard** (ranked employees +
department ranking, reuse `ScoreBar`).

---
## PART B — Reports

### Backend (`/reports`)
- `GET /reports/environmental` · `/reports/social` · `/reports/governance` · `/reports/summary` → aggregated JSON
  (query the relevant tables; the dashboard scoring service is a good example of aggregation).
- `GET /reports/custom` → accept filters `department`, `startDate`, `endDate`, `module`, `employee`, `challenge`,
  `category` and return matching aggregated rows.

### Frontend (`ReportsPage`)
- Four report cards (Environmental / Social / Governance / ESG Summary) → **Generate** shows a table.
- **Custom Report Builder**: filter dropdowns → Run → table.
- **Export**: CSV works today via `downloadCSV(rows, 'report.csv')` from `frontend/src/lib/utils.js`.
  Excel (`xlsx`) and PDF (`jspdf` + `jspdf-autotable`) are nice-to-have (Tier 2).

## Done when (demo checklist)
- [ ] Employee joins a challenge → submits → **manager approves → XP awarded → badge auto-unlocks → leaderboard updates**.
- [ ] Reward **redemption** deducts points + stock (and blocks if not enough / out of stock).
- [ ] Challenge lifecycle transitions work (Draft→Active→Under Review→Completed / Archived).
- [ ] Reports generate + **export to CSV**; custom builder filters work.
- [ ] `gamification.service.js` is pushed early so Tirth's CSR approvals can award XP + badges too.

## Paste this into your Antigravity AI to start
```
This is the EcoSphere repo. First read AGENTS.md and docs/AI_ONBOARDING.md fully and follow every convention
(ApiResponse → res.data.data on client, auth + role middleware, ApiError, one controller+route per resource,
shared UI kit, DO NOT edit prisma/schema.prisma). My task is docs/tasks/SAMARTH.md — Gamification + Reports.
FIRST create backend/src/services/gamification.service.js (awardXp + checkAndAwardBadges) exactly as shown and
push it. Then build backend controllers+routes for Challenge (with lifecycle), ChallengeParticipation
(approve → awardXp), Badge, Reward (with redeem transaction) and Leaderboard, plus Reports endpoints. Append
routes in backend/src/routes/index.js. Then build the Gamification frontend page (challenges, approval queue,
badge gallery, rewards catalog with redeem, leaderboard) and the Reports hub with CSV export, mirroring the
Settings→Departments CRUD pattern. Verify the full loop: join → approve → XP → badge → leaderboard → redeem.
```

## Git
`git checkout -b feat/gamification-reports` → commit your OWN work hourly with clear messages → push → PR to `main`.
