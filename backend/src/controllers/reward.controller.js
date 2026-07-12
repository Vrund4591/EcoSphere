const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { notify } = require('../services/notification.service');

/** GET /api/rewards */
const getRewards = async (req, res, next) => {
  try {
    const { page, limit, all } = req.query;
    const where = {};

    if (all === 'true') {
      const rewards = await prisma.reward.findMany({
        orderBy: { pointsRequired: 'asc' },
      });
      return res.json(new ApiResponse(200, { rewards }, 'Rewards retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [rewards, total] = await Promise.all([
      prisma.reward.findMany({
        skip,
        take: l,
        orderBy: { pointsRequired: 'asc' },
      }),
      prisma.reward.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(rewards, total, p, l), 'Rewards retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/rewards/:id */
const getRewardById = async (req, res, next) => {
  try {
    const reward = await prisma.reward.findUnique({
      where: { id: req.params.id },
      include: { _count: { select: { redemptions: true } } },
    });
    if (!reward) throw ApiError.notFound('Reward not found');
    res.json(new ApiResponse(200, { reward }, 'Reward retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/rewards */
const createReward = async (req, res, next) => {
  try {
    const { name, description, pointsRequired, stock, status } = req.body;
    if (!name) throw ApiError.badRequest('Name is required');
    const reward = await prisma.reward.create({
      data: {
        name,
        description: description || null,
        pointsRequired: Number(pointsRequired) || 0,
        stock: Number(stock) || 0,
        status: status || 'ACTIVE',
      },
    });
    res.status(201).json(new ApiResponse(201, { reward }, 'Reward created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/rewards/:id */
const updateReward = async (req, res, next) => {
  try {
    const { name, description, pointsRequired, stock, status } = req.body;
    const reward = await prisma.reward.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(pointsRequired !== undefined && { pointsRequired: Number(pointsRequired) }),
        ...(stock !== undefined && { stock: Number(stock) }),
        ...(status && { status }),
      },
    });
    res.json(new ApiResponse(200, { reward }, 'Reward updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/rewards/:id */
const deleteReward = async (req, res, next) => {
  try {
    const existing = await prisma.reward.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Reward not found');
    await prisma.reward.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Reward deleted'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/rewards/:id/redeem — atomic redemption with stock and balance check */
const redeemReward = async (req, res, next) => {
  try {
    const rewardId = req.params.id;
    const userId = req.user.id;

    const redemption = await prisma.$transaction(async (tx) => {
      // Re-fetch inside transaction with select for latest values
      const [reward, user] = await Promise.all([
        tx.reward.findUnique({ where: { id: rewardId } }),
        tx.user.findUnique({ where: { id: userId } }),
      ]);

      if (!reward) throw ApiError.notFound('Reward not found');
      if (reward.status !== 'ACTIVE') throw ApiError.badRequest('Reward is not available');
      if (reward.stock <= 0) throw ApiError.badRequest('This reward is out of stock');
      if (user.points < reward.pointsRequired) {
        throw ApiError.badRequest(
          `Insufficient points. You have ${user.points} but need ${reward.pointsRequired}`
        );
      }

      // Deduct stock and user points
      await Promise.all([
        tx.reward.update({
          where: { id: rewardId },
          data: { stock: { decrement: 1 } },
        }),
        tx.user.update({
          where: { id: userId },
          data: { points: { decrement: reward.pointsRequired } },
        }),
      ]);

      // Record redemption
      return tx.rewardRedemption.create({
        data: {
          rewardId,
          employeeId: userId,
          pointsSpent: reward.pointsRequired,
        },
        include: { reward: { select: { name: true } } },
      });
    });

    // Notify outside transaction (best-effort)
    await notify(userId, {
      type: 'REWARD_REDEEMED',
      title: 'Reward Redeemed!',
      message: `You successfully redeemed "${redemption.reward.name}" for ${redemption.pointsSpent} points.`,
      link: '/gamification',
    });

    res.status(201).json(new ApiResponse(201, { redemption }, 'Reward redeemed successfully'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/rewards/redemptions — list redemption history */
const getRedemptions = async (req, res, next) => {
  try {
    const where = req.user.role === 'EMPLOYEE' ? { employeeId: req.user.id } : {};
    const redemptions = await prisma.rewardRedemption.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        reward: { select: { name: true, description: true } },
        employee: { select: { id: true, name: true, email: true } },
      },
    });
    res.json(new ApiResponse(200, { redemptions }, 'Redemptions retrieved'));
  } catch (err) {
    next(err);
  }
};

module.exports = { getRewards, getRewardById, createReward, updateReward, deleteReward, redeemReward, getRedemptions };
