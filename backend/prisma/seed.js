require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const now = new Date();
const monthsAgo = (n, day = 15) => new Date(now.getFullYear(), now.getMonth() - n, day);
const daysFromNow = (n) => new Date(now.getTime() + n * 86400000);
const pick = (arr, i) => arr[i % arr.length];

async function main() {
  console.log('🌱 Seeding EcoSphere...\n');

  // 1. Clean (reverse dependency order)
  console.log('🧹 Cleaning...');
  await prisma.rewardRedemption.deleteMany();
  await prisma.employeeBadge.deleteMany();
  await prisma.challengeParticipation.deleteMany();
  await prisma.employeeParticipation.deleteMany();
  await prisma.policyAcknowledgement.deleteMany();
  await prisma.complianceIssue.deleteMany();
  await prisma.departmentScore.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.carbonTransaction.deleteMany();
  await prisma.environmentalGoal.deleteMany();
  await prisma.productESGProfile.deleteMany();
  await prisma.audit.deleteMany();
  await prisma.challenge.deleteMany();
  await prisma.reward.deleteMany();
  await prisma.badge.deleteMany();
  await prisma.cSRActivity.deleteMany();
  await prisma.eSGPolicy.deleteMany();
  await prisma.emissionFactor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.setting.deleteMany();

  // 2. Settings (singleton)
  await prisma.setting.create({ data: {} });

  // 3. Departments
  console.log('🏛️  Departments...');
  const D = {};
  for (const d of [
    { name: 'Manufacturing', code: 'MFG' },
    { name: 'Corporate', code: 'COR' },
    { name: 'R&D', code: 'RND' },
    { name: 'Sales', code: 'SAL' },
  ]) {
    D[d.code] = await prisma.department.create({ data: d });
  }
  D.LOG = await prisma.department.create({
    data: { name: 'Logistics', code: 'LOG', parentDepartmentId: D.MFG.id },
  });

  // 4. Users
  console.log('👥 Users...');
  const pwCache = {};
  const hash = async (pw) => (pwCache[pw] ||= await bcrypt.hash(pw, 12));

  const usersData = [
    { name: 'Aarav Mehta', email: 'admin@ecosphere.com', role: 'ADMIN', dept: 'COR', gender: 'MALE', xp: 0, points: 0, pw: 'Admin@123' },
    { name: 'Sanjana Nair', email: 'sanjana@ecosphere.com', role: 'MANAGER', dept: 'MFG', gender: 'FEMALE', xp: 600, points: 150, pw: 'Manager@123' },
    { name: 'Rohan Iyer', email: 'rohan@ecosphere.com', role: 'MANAGER', dept: 'LOG', gender: 'MALE', xp: 450, points: 120, pw: 'Manager@123' },
    { name: 'Aditi Rao', email: 'aditi@ecosphere.com', role: 'MANAGER', dept: 'COR', gender: 'FEMALE', xp: 1300, points: 400, pw: 'Manager@123' },
    { name: 'Karan Shah', email: 'karan@ecosphere.com', role: 'MANAGER', dept: 'RND', gender: 'MALE', xp: 520, points: 130, pw: 'Manager@123' },
    { name: 'Priya Menon', email: 'priya@ecosphere.com', role: 'EMPLOYEE', dept: 'MFG', gender: 'FEMALE', xp: 1200, points: 350, pw: 'Employee@123' },
    { name: 'Isha Patel', email: 'isha@ecosphere.com', role: 'EMPLOYEE', dept: 'MFG', gender: 'FEMALE', xp: 820, points: 220, pw: 'Employee@123' },
    { name: 'Vikram Singh', email: 'vikram@ecosphere.com', role: 'EMPLOYEE', dept: 'LOG', gender: 'MALE', xp: 650, points: 170, pw: 'Employee@123' },
    { name: 'Rahul Verma', email: 'rahul@ecosphere.com', role: 'EMPLOYEE', dept: 'LOG', gender: 'MALE', xp: 420, points: 110, pw: 'Employee@123' },
    { name: 'Neha Gupta', email: 'neha@ecosphere.com', role: 'EMPLOYEE', dept: 'COR', gender: 'FEMALE', xp: 930, points: 260, pw: 'Employee@123' },
    { name: 'Arjun Reddy', email: 'arjun@ecosphere.com', role: 'EMPLOYEE', dept: 'RND', gender: 'MALE', xp: 700, points: 180, pw: 'Employee@123' },
    { name: 'Sneha Joshi', email: 'sneha@ecosphere.com', role: 'EMPLOYEE', dept: 'SAL', gender: 'FEMALE', xp: 310, points: 90, pw: 'Employee@123' },
    { name: 'Dev Sharma', email: 'dev@ecosphere.com', role: 'EMPLOYEE', dept: 'SAL', gender: 'MALE', xp: 480, points: 600, pw: 'Employee@123' },
  ];

  const U = {};
  for (const u of usersData) {
    U[u.email] = await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: await hash(u.pw),
        role: u.role,
        gender: u.gender,
        xp: u.xp,
        points: u.points,
        departmentId: D[u.dept].id,
      },
    });
  }

  // Department heads
  const heads = { MFG: 'sanjana@ecosphere.com', LOG: 'rohan@ecosphere.com', COR: 'aditi@ecosphere.com', RND: 'karan@ecosphere.com' };
  for (const [code, email] of Object.entries(heads)) {
    await prisma.department.update({ where: { id: D[code].id }, data: { headId: U[email].id } });
  }

  // 5. Categories
  console.log('🏷️  Categories...');
  const C = {};
  const cats = [
    { name: 'Environment', type: 'CSR_ACTIVITY' },
    { name: 'Health', type: 'CSR_ACTIVITY' },
    { name: 'Education', type: 'CSR_ACTIVITY' },
    { name: 'Community', type: 'CSR_ACTIVITY' },
    { name: 'Energy', type: 'CHALLENGE' },
    { name: 'Waste', type: 'CHALLENGE' },
    { name: 'Mobility', type: 'CHALLENGE' },
    { name: 'Recycling', type: 'CHALLENGE' },
  ];
  for (const c of cats) C[c.name] = await prisma.category.create({ data: c });

  // 6. Emission factors
  console.log('🌫️  Emission factors...');
  const F = {};
  const factors = [
    { name: 'Grid Electricity', unit: 'kWh', factor: 0.82, source: 'PURCHASE' },
    { name: 'Diesel', unit: 'liter', factor: 2.68, source: 'FLEET' },
    { name: 'Petrol', unit: 'liter', factor: 2.31, source: 'FLEET' },
    { name: 'Air Travel', unit: 'km', factor: 0.15, source: 'EXPENSE' },
    { name: 'Paper', unit: 'kg', factor: 1.3, source: 'PURCHASE' },
    { name: 'Natural Gas', unit: 'm³', factor: 2.02, source: 'MANUFACTURING' },
    { name: 'Steel', unit: 'kg', factor: 1.9, source: 'MANUFACTURING' },
    { name: 'Water Supply', unit: 'm³', factor: 0.34, source: 'PURCHASE' },
  ];
  for (const f of factors) F[f.name] = await prisma.emissionFactor.create({ data: { ...f, reference: 'DEFRA/IPCC 2024' } });
  const factorList = Object.values(F);
  const deptList = [D.MFG, D.LOG, D.COR, D.RND, D.SAL];

  // 7. Carbon transactions across 12 months (drives the trend chart)
  console.log('🏭 Carbon transactions...');
  const txns = [];
  let ti = 0;
  for (let m = 11; m >= 0; m--) {
    for (let k = 0; k < 3; k++, ti++) {
      const f = pick(factorList, ti);
      const dept = pick(deptList, ti + m);
      const quantity = Math.round((200 + ((ti * 137) % 900)) * (1 - m * 0.02)); // gentle downward trend
      txns.push({
        source: f.source,
        quantity,
        co2Amount: Math.round(quantity * f.factor),
        description: `${f.name} usage`,
        date: monthsAgo(m, 5 + k * 8),
        departmentId: dept.id,
        emissionFactorId: f.id,
      });
    }
  }
  await prisma.carbonTransaction.createMany({ data: txns });

  // 8. Environmental goals
  console.log('🎯 Environmental goals...');
  await prisma.environmentalGoal.createMany({
    data: [
      { name: 'Reduce Fleet Emissions', departmentId: D.LOG.id, targetCo2: 500, currentCo2: 390, deadline: daysFromNow(160), status: 'ON_TRACK' },
      { name: 'Cut Packaging Waste', departmentId: D.MFG.id, targetCo2: 120, currentCo2: 98, deadline: daysFromNow(80), status: 'ON_TRACK' },
      { name: 'Office Energy Cut', departmentId: D.COR.id, targetCo2: 80, currentCo2: 80, deadline: daysFromNow(-10), status: 'COMPLETED' },
      { name: 'Green Data Center', departmentId: D.RND.id, targetCo2: 200, currentCo2: 120, deadline: daysFromNow(200), status: 'ACTIVE' },
      { name: 'Paperless Sales', departmentId: D.SAL.id, targetCo2: 60, currentCo2: 40, deadline: daysFromNow(120), status: 'ACTIVE' },
    ],
  });

  // 9. Product ESG profiles
  await prisma.productESGProfile.createMany({
    data: [
      { name: 'EcoBottle 500ml', category: 'Packaging', carbonFootprint: 0.4, recyclablePct: 100, emissionFactorId: F['Steel'].id },
      { name: 'Recycled Notebook', category: 'Stationery', carbonFootprint: 0.9, recyclablePct: 90, emissionFactorId: F['Paper'].id },
      { name: 'Solar Power Bank', category: 'Electronics', carbonFootprint: 3.2, recyclablePct: 60 },
    ],
  });

  // 10. CSR activities
  console.log('🤝 CSR activities...');
  const A = {};
  const activities = [
    { title: 'Tree Plantation Drive', cat: 'Environment', pointsValue: 50, evidenceRequired: true, location: 'City Park' },
    { title: 'Blood Donation Camp', cat: 'Health', pointsValue: 30, evidenceRequired: false, location: 'HQ Auditorium' },
    { title: 'Beach Cleanup', cat: 'Community', pointsValue: 40, evidenceRequired: true, location: 'Marina Beach' },
    { title: 'ESG Awareness Workshop', cat: 'Education', pointsValue: 30, evidenceRequired: true, location: 'Training Room' },
  ];
  for (const a of activities) {
    A[a.title] = await prisma.cSRActivity.create({
      data: {
        title: a.title,
        description: `${a.title} organized by the CSR team.`,
        categoryId: C[a.cat].id,
        pointsValue: a.pointsValue,
        evidenceRequired: a.evidenceRequired,
        location: a.location,
        date: daysFromNow(7),
        status: 'OPEN',
      },
    });
  }

  // 11. Employee participations (CSR)
  const parts = [
    ['priya@ecosphere.com', 'Tree Plantation Drive', 'APPROVED', 50],
    ['isha@ecosphere.com', 'ESG Awareness Workshop', 'APPROVED', 30],
    ['neha@ecosphere.com', 'Blood Donation Camp', 'APPROVED', 30],
    ['rahul@ecosphere.com', 'ESG Awareness Workshop', 'APPROVED', 30],
    ['dev@ecosphere.com', 'Blood Donation Camp', 'APPROVED', 30],
    ['vikram@ecosphere.com', 'Beach Cleanup', 'PENDING', 0],
    ['arjun@ecosphere.com', 'Tree Plantation Drive', 'PENDING', 0],
    ['sneha@ecosphere.com', 'Beach Cleanup', 'PENDING', 0],
  ];
  for (const [email, title, status, pts] of parts) {
    await prisma.employeeParticipation.create({
      data: {
        employeeId: U[email].id,
        activityId: A[title].id,
        approvalStatus: status,
        pointsEarned: pts,
        proof: status === 'APPROVED' || Math.random() > 0.5 ? 'proof.jpg' : null,
        completionDate: status === 'APPROVED' ? daysFromNow(-3) : null,
      },
    });
  }

  // 12. ESG policies
  console.log('📜 Policies...');
  const P = {};
  const policies = [
    { title: 'Anti-Corruption Policy', pillar: 'GOVERNANCE' },
    { title: 'Code of Conduct', pillar: 'GOVERNANCE' },
    { title: 'Data Privacy Policy', pillar: 'GOVERNANCE' },
    { title: 'Environmental Sustainability Policy', pillar: 'ENVIRONMENTAL' },
    { title: 'Health & Safety Policy', pillar: 'SOCIAL' },
    { title: 'Diversity & Inclusion Policy', pillar: 'SOCIAL' },
  ];
  for (const p of policies) {
    P[p.title] = await prisma.eSGPolicy.create({
      data: { title: p.title, pillar: p.pillar, description: `${p.title} — all employees must comply.`, effectiveDate: daysFromNow(-60) },
    });
  }

  // 13. Policy acknowledgements
  const employees = usersData.filter((u) => u.role !== 'ADMIN');
  for (let i = 0; i < employees.length; i++) {
    const u = U[employees[i].email];
    // everyone acknowledges Code of Conduct
    await prisma.policyAcknowledgement.create({
      data: { policyId: P['Code of Conduct'].id, employeeId: u.id, status: 'ACKNOWLEDGED', acknowledgedAt: daysFromNow(-20) },
    });
    // Anti-Corruption: about half acknowledged
    await prisma.policyAcknowledgement.create({
      data: {
        policyId: P['Anti-Corruption Policy'].id,
        employeeId: u.id,
        status: i % 2 === 0 ? 'ACKNOWLEDGED' : 'PENDING',
        acknowledgedAt: i % 2 === 0 ? daysFromNow(-15) : null,
      },
    });
  }

  // 14. Audits
  console.log('🔎 Audits & compliance...');
  const AU = {};
  AU.waste = await prisma.audit.create({ data: { title: 'Q2 Waste Audit', departmentId: D.MFG.id, auditor: 'S. Nair', date: daysFromNow(-30), findings: '3 minor issues', status: 'COMPLETED' } });
  AU.vendor = await prisma.audit.create({ data: { title: 'Vendor Compliance Check', departmentId: D.LOG.id, auditor: 'R. Iyer', date: daysFromNow(-11), findings: '1 open issue', status: 'UNDER_REVIEW' } });
  AU.safety = await prisma.audit.create({ data: { title: 'Annual Safety Audit', departmentId: D.COR.id, auditor: 'A. Rao', date: daysFromNow(-45), findings: 'All clear', status: 'COMPLETED' } });
  AU.data = await prisma.audit.create({ data: { title: 'Data Security Review', departmentId: D.RND.id, auditor: 'K. Shah', date: daysFromNow(-5), findings: 'Pending remediation', status: 'UNDER_REVIEW' } });

  // 15. Compliance issues (each has an owner + due date; some overdue)
  await prisma.complianceIssue.createMany({
    data: [
      { title: 'Missing MSDS sheets', auditId: AU.waste.id, severity: 'HIGH', ownerId: U['sanjana@ecosphere.com'].id, dueDate: daysFromNow(-4), status: 'OPEN' }, // overdue
      { title: 'Late vendor disclosure', auditId: AU.vendor.id, severity: 'MEDIUM', ownerId: U['rohan@ecosphere.com'].id, dueDate: daysFromNow(-20), status: 'RESOLVED' },
      { title: 'Incomplete safety training', severity: 'MEDIUM', ownerId: U['aditi@ecosphere.com'].id, dueDate: daysFromNow(12), status: 'IN_PROGRESS' },
      { title: 'Unencrypted backup', auditId: AU.data.id, severity: 'HIGH', ownerId: U['karan@ecosphere.com'].id, dueDate: daysFromNow(3), status: 'OPEN' },
    ],
  });

  // 16. Challenges
  console.log('🏆 Gamification...');
  const CH = {};
  const challenges = [
    { title: 'Sustainability Sprint', cat: 'Energy', xp: 200, difficulty: 'HARD', status: 'ACTIVE', deadline: daysFromNow(8), evidenceRequired: true },
    { title: 'Recycle Challenge', cat: 'Recycling', xp: 80, difficulty: 'EASY', status: 'ACTIVE', deadline: daysFromNow(3) },
    { title: 'Commute Green Week', cat: 'Mobility', xp: 120, difficulty: 'MEDIUM', status: 'DRAFT', deadline: daysFromNow(13) },
    { title: 'Zero Waste Week', cat: 'Waste', xp: 150, difficulty: 'MEDIUM', status: 'ACTIVE', deadline: daysFromNow(6), evidenceRequired: true },
    { title: 'Energy Saver Month', cat: 'Energy', xp: 100, difficulty: 'EASY', status: 'UNDER_REVIEW', deadline: daysFromNow(2) },
    { title: 'Carbon Cutback', cat: 'Energy', xp: 300, difficulty: 'HARD', status: 'COMPLETED', deadline: daysFromNow(-5) },
  ];
  for (const c of challenges) {
    CH[c.title] = await prisma.challenge.create({
      data: {
        title: c.title,
        description: `${c.title} — take part and earn ${c.xp} XP.`,
        categoryId: C[c.cat].id,
        xp: c.xp,
        difficulty: c.difficulty,
        status: c.status,
        deadline: c.deadline,
        evidenceRequired: !!c.evidenceRequired,
      },
    });
  }

  // 17. Challenge participations
  const cparts = [
    ['priya@ecosphere.com', 'Zero Waste Week', 'APPROVED', 100, 150],
    ['priya@ecosphere.com', 'Carbon Cutback', 'APPROVED', 100, 300],
    ['neha@ecosphere.com', 'Recycle Challenge', 'APPROVED', 100, 80],
    ['isha@ecosphere.com', 'Recycle Challenge', 'APPROVED', 100, 80],
    ['vikram@ecosphere.com', 'Zero Waste Week', 'APPROVED', 100, 150],
    ['arjun@ecosphere.com', 'Sustainability Sprint', 'PENDING', 80, 0],
    ['priya@ecosphere.com', 'Sustainability Sprint', 'PENDING', 60, 0],
    ['dev@ecosphere.com', 'Zero Waste Week', 'PENDING', 40, 0],
  ];
  for (const [email, title, status, progress, xpAwarded] of cparts) {
    await prisma.challengeParticipation.create({
      data: {
        employeeId: U[email].id,
        challengeId: CH[title].id,
        approvalStatus: status,
        progress,
        xpAwarded,
        proof: status === 'APPROVED' ? 'evidence.pdf' : null,
      },
    });
  }

  // 18. Badges
  const B = {};
  const badges = [
    { name: 'Green Beginner', icon: '🌱', unlockType: 'XP', unlockThreshold: 100, description: 'Earn 100 XP' },
    { name: 'Carbon Saver', icon: '♻️', unlockType: 'XP', unlockThreshold: 500, description: 'Earn 500 XP' },
    { name: 'Sustainability Champion', icon: '🌍', unlockType: 'XP', unlockThreshold: 1000, description: 'Earn 1000 XP' },
    { name: 'Team Player', icon: '⭐', unlockType: 'CHALLENGES', unlockThreshold: 3, description: 'Complete 3 challenges' },
  ];
  for (const b of badges) B[b.name] = await prisma.badge.create({ data: b });

  // Award XP badges based on seeded xp
  for (const u of usersData) {
    const user = U[u.email];
    const earned = [];
    if (u.xp >= 100) earned.push('Green Beginner');
    if (u.xp >= 500) earned.push('Carbon Saver');
    if (u.xp >= 1000) earned.push('Sustainability Champion');
    for (const name of earned) {
      await prisma.employeeBadge.create({ data: { employeeId: user.id, badgeId: B[name].id } });
    }
  }

  // 19. Rewards
  console.log('🎁 Rewards...');
  const R = {};
  const rewards = [
    { name: 'Eco Tote Bag', pointsRequired: 100, stock: 50 },
    { name: 'Reusable Coffee Cup', pointsRequired: 150, stock: 40 },
    { name: 'Plant a Tree in Your Name', pointsRequired: 200, stock: 100 },
    { name: '₹500 Eco Voucher', pointsRequired: 500, stock: 20 },
    { name: 'Extra Day Off', pointsRequired: 2000, stock: 10 },
  ];
  for (const r of rewards) R[r.name] = await prisma.reward.create({ data: { ...r, description: `Redeemable for ${r.pointsRequired} points` } });

  await prisma.rewardRedemption.create({ data: { rewardId: R['Eco Tote Bag'].id, employeeId: U['dev@ecosphere.com'].id, pointsSpent: 100 } });
  await prisma.rewardRedemption.create({ data: { rewardId: R['Reusable Coffee Cup'].id, employeeId: U['aditi@ecosphere.com'].id, pointsSpent: 150 } });

  console.log('\n✅ Seed complete!\n');
  console.log('   Test accounts (password shown):');
  console.log('   ┌─────────────────────────────┬──────────────┬──────────────┐');
  console.log('   │ admin@ecosphere.com         │ ADMIN        │ Admin@123    │');
  console.log('   │ sanjana@ecosphere.com       │ MANAGER      │ Manager@123  │');
  console.log('   │ priya@ecosphere.com         │ EMPLOYEE     │ Employee@123 │');
  console.log('   └─────────────────────────────┴──────────────┴──────────────┘');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
