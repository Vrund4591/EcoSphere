# Tirth — Social + Governance Modules

> **Before you start:** read [`AGENTS.md`](../../AGENTS.md) and [`docs/AI_ONBOARDING.md`](../AI_ONBOARDING.md).
> Schema + conventions are already set — build **APIs + UI against existing models**.
> Reference: `backend/src/controllers/department.controller.js` + **Settings → Departments** UI.
> Yours is the biggest scope (2 pillars) — ping **Vrund (Lead)** anytime for help.

## Your mission
Own **Social** (CSR + employee engagement + diversity) and **Governance** (policies, audits, compliance).

---
## PART A — Social

### Models
- **CSRActivity**: `title`, `description?`, `date?`, `location?`, `pointsValue` (Int), `evidenceRequired` (Bool), `status` (OPEN/CLOSED), `categoryId?`
- **EmployeeParticipation**: `proof?`, `approvalStatus` (PENDING/APPROVED/REJECTED), `pointsEarned` (Int), `approverId?`, `completionDate?`, `activityId`, `employeeId`

### Backend (`/csr-activities`, `/participations`)
- CSRActivity CRUD.
- `POST /csr-activities/:id/join` → create EmployeeParticipation for `req.user.id` (PENDING) with optional `proof`.
- `GET /participations?status=PENDING` → the **approval queue** (include employee + activity).
- `PUT /participations/:id/approve` (managers/admins):
  ```js
  const s = await getOrCreateSettings();
  if (s.evidenceRequiredForCSR && !participation.proof)
    throw ApiError.badRequest('Evidence (proof) required before approval');
  // set APPROVED, pointsEarned = activity.pointsValue, completionDate = now, approverId = req.user.id
  // award the employee: xp += pointsValue AND points += pointsValue
  // then trigger badge check + notify employee
  ```
- `PUT /participations/:id/reject`.
- `GET /social/diversity` → aggregate `User` by `gender` and by `department` (counts) for the diversity dashboard.

### Frontend (`SocialPage`)
Tabs: **CSR Activities** (cards with "Join" + evidence upload + admin "New Activity"), **Employee Participation**
(approval-queue table with Approve/Reject for managers), **Diversity Dashboard** (Recharts pie by gender + bar by dept).

---
## PART B — Governance

### Models
- **ESGPolicy**: `title`, `description?`, `pillar` (ENVIRONMENTAL/SOCIAL/GOVERNANCE), `version`, `effectiveDate?`, `status`
- **PolicyAcknowledgement**: `acknowledgedAt?`, `status` (PENDING/ACKNOWLEDGED), `policyId`, `employeeId`
- **Audit**: `title`, `auditor?`, `date?`, `findings?`, `status` (UNDER_REVIEW/COMPLETED), `departmentId?`
- **ComplianceIssue**: `title`, `description?`, `severity` (LOW/MEDIUM/HIGH/CRITICAL), `dueDate` (**required**), `status` (OPEN/IN_PROGRESS/RESOLVED), `auditId?`, `ownerId` (**required**)

### Backend (`/policies`, `/acknowledgements`, `/audits`, `/compliance-issues`)
- Policy CRUD; `POST /policies/:id/acknowledge` (employee → ACKNOWLEDGED + timestamp); admin "send reminder"
  creates notifications to employees who haven't acknowledged.
- Audit CRUD.
- ComplianceIssue CRUD — **enforce `ownerId` + `dueDate` are present**. On create: `notify(ownerId, …)` +
  `notifyAdmins(…)` (type `COMPLIANCE_ISSUE`). Mark **overdue** in responses: `isOverdue = status!=='RESOLVED' && new Date(dueDate) < new Date()`.

### Frontend (`GovernancePage`)
Tabs: **Policies**, **Policy Acknowledgements** (who acknowledged / pending), **Audits**, **Compliance Issues**
(severity badges, **overdue rows highlighted red**, owner + due date shown, status workflow).

---
## Signature features
- **CSR approval → points/XP** (+ evidence enforcement via the Setting toggle).
- **Compliance ownership + overdue flag + notifications**.
- **Policy acknowledgement + reminders**.

## Coordinate with Samarth (shared gamification helper)
Awarding XP/points + badges is shared logic. Samarth builds `backend/src/services/gamification.service.js`
exposing `awardXp(userId, { xp, points })` and `checkAndAwardBadges(userId)`. Import and call these in your
CSR approve handler. Until it's pushed, you can inline
`prisma.user.update({ where:{id}, data:{ xp:{increment:pts}, points:{increment:pts} } })` and add the badge
check when his service lands.

## Done when (demo checklist)
- [ ] Employee joins a CSR activity + uploads proof → **manager approves → points/XP awarded + notification** (and blocked if evidence required but missing).
- [ ] Diversity dashboard renders gender/department charts.
- [ ] Policy can be acknowledged; pending acks are visible.
- [ ] Raising a compliance issue **notifies the owner + admins**; **overdue issues are flagged**.
- [ ] Dashboard **Social + Governance scores** move after you add data.

## Paste this into your Antigravity AI to start
```
This is the EcoSphere repo. First read AGENTS.md and docs/AI_ONBOARDING.md fully and follow every
convention (ApiResponse → res.data.data on client, auth + role middleware, ApiError, one controller+route
per resource, shared UI kit, DO NOT edit prisma/schema.prisma). My task is docs/tasks/TIRTH.md — the Social
and Governance modules. Build backend controllers+routes for CSRActivity + EmployeeParticipation (with the
approval→points/XP flow and evidence enforcement), diversity aggregation, ESGPolicy + PolicyAcknowledgement,
Audit, and ComplianceIssue (owner + due date required, notify owner/admins, overdue flag). Append routes in
backend/src/routes/index.js. Then build the Social and Governance frontend pages (tabs, approval queue,
diversity charts, severity-tagged compliance list) mirroring the Settings→Departments CRUD pattern. Verify
the dashboard Social/Governance scores update.
```

## Git
`git checkout -b feat/social-governance` → commit your OWN work hourly with clear messages → push → PR to `main`.
