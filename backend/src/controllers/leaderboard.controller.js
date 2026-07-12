const prisma = require('../config/database');
const ApiResponse = require('../utils/ApiResponse');

/** GET /api/leaderboard — top users by XP + department totals */
const getLeaderboard = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;

    // Top individual users by XP
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { xp: 'desc' },
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        xp: true,
        points: true,
        avatar: true,
        department: { select: { id: true, name: true } },
        badges: {
          include: { badge: { select: { icon: true, name: true } } },
          orderBy: { awardedAt: 'desc' },
          take: 3,
        },
      },
    });

    // Department totals — sum member XP
    const departments = await prisma.department.findMany({
      include: {
        members: {
          where: { isActive: true },
          select: { xp: true, points: true },
        },
      },
    });

    const departmentRankings = departments
      .map((d) => ({
        id: d.id,
        name: d.name,
        totalXp: d.members.reduce((sum, m) => sum + m.xp, 0),
        totalPoints: d.members.reduce((sum, m) => sum + m.points, 0),
        memberCount: d.members.length,
      }))
      .sort((a, b) => b.totalXp - a.totalXp);

    res.json(
      new ApiResponse(
        200,
        { users, departmentRankings },
        'Leaderboard retrieved'
      )
    );
  } catch (err) {
    next(err);
  }
};

module.exports = { getLeaderboard };
