const express = require('express');
const router = express.Router();
const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

/** GET /api/social/diversity */
router.get('/diversity', async (req, res, next) => {
  try {
    // Aggregate by gender
    const genderGroups = await prisma.user.groupBy({
      by: ['gender'],
      _count: { id: true },
      where: { isActive: true },
    });
    const byGender = genderGroups.map((g) => ({
      gender: g.gender,
      count: g._count.id,
    }));

    // Aggregate by department
    const users = await prisma.user.findMany({
      where: { isActive: true, departmentId: { not: null } },
      select: { department: { select: { name: true } } },
    });
    const deptMap = {};
    for (const u of users) {
      const name = u.department.name;
      deptMap[name] = (deptMap[name] || 0) + 1;
    }
    const byDepartment = Object.entries(deptMap).map(([department, count]) => ({
      department,
      count,
    }));

    res.json(
      new ApiResponse(200, { byGender, byDepartment }, 'Diversity data retrieved')
    );
  } catch (err) {
    next(err);
  }
});

module.exports = router;
