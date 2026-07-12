const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');

const INCLUDE = {
  category: { select: { id: true, name: true } },
  _count: { select: { participations: true } },
};

/** GET /api/challenges */
const getChallenges = async (req, res, next) => {
  try {
    const { page, limit, status, all } = req.query;
    const where = status ? { status } : {};

    if (all === 'true') {
      const challenges = await prisma.challenge.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      });
      return res.json(new ApiResponse(200, { challenges }, 'Challenges retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
        include: INCLUDE,
      }),
      prisma.challenge.count({ where }),
    ]);
    res.json(new ApiResponse(200, paginated(challenges, total, p, l), 'Challenges retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/challenges/:id */
const getChallengeById = async (req, res, next) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        ...INCLUDE,
        participations: {
          include: { employee: { select: { id: true, name: true, email: true } } },
        },
      },
    });
    if (!challenge) throw ApiError.notFound('Challenge not found');
    res.json(new ApiResponse(200, { challenge }, 'Challenge retrieved'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/challenges */
const createChallenge = async (req, res, next) => {
  try {
    const { title, description, xp, difficulty, evidenceRequired, deadline, categoryId } = req.body;
    if (!title) throw ApiError.badRequest('Title is required');
    const challenge = await prisma.challenge.create({
      data: {
        title,
        description: description || null,
        xp: Number(xp) || 0,
        difficulty: difficulty || 'EASY',
        evidenceRequired: Boolean(evidenceRequired),
        deadline: deadline ? new Date(deadline) : null,
        status: 'DRAFT',
        categoryId: categoryId || null,
      },
      include: INCLUDE,
    });
    res.status(201).json(new ApiResponse(201, { challenge }, 'Challenge created'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/challenges/:id */
const updateChallenge = async (req, res, next) => {
  try {
    const { title, description, xp, difficulty, evidenceRequired, deadline, categoryId } = req.body;
    const challenge = await prisma.challenge.update({
      where: { id: req.params.id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(xp !== undefined && { xp: Number(xp) }),
        ...(difficulty && { difficulty }),
        ...(evidenceRequired !== undefined && { evidenceRequired: Boolean(evidenceRequired) }),
        ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
        ...(categoryId !== undefined && { categoryId: categoryId || null }),
      },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { challenge }, 'Challenge updated'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/challenges/:id/status — lifecycle transitions */
const updateChallengeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const VALID = ['DRAFT', 'ACTIVE', 'UNDER_REVIEW', 'COMPLETED', 'ARCHIVED'];
    if (!VALID.includes(status)) throw ApiError.badRequest('Invalid status value');

    const existing = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Challenge not found');

    const challenge = await prisma.challenge.update({
      where: { id: req.params.id },
      data: { status },
      include: INCLUDE,
    });
    res.json(new ApiResponse(200, { challenge }, `Challenge status updated to ${status}`));
  } catch (err) {
    next(err);
  }
};

/** POST /api/challenges/:id/join — employee joins a challenge */
const joinChallenge = async (req, res, next) => {
  try {
    const challenge = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!challenge) throw ApiError.notFound('Challenge not found');
    if (challenge.status !== 'ACTIVE') throw ApiError.badRequest('Challenge is not active');

    const existing = await prisma.challengeParticipation.findUnique({
      where: { challengeId_employeeId: { challengeId: req.params.id, employeeId: req.user.id } },
    });
    if (existing) throw ApiError.conflict('You have already joined this challenge');

    const participation = await prisma.challengeParticipation.create({
      data: {
        challengeId: req.params.id,
        employeeId: req.user.id,
        progress: 0,
        approvalStatus: 'PENDING',
        xpAwarded: 0,
      },
    });
    res.status(201).json(new ApiResponse(201, { participation }, 'Joined challenge successfully'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/challenges/:id */
const deleteChallenge = async (req, res, next) => {
  try {
    const existing = await prisma.challenge.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Challenge not found');
    await prisma.challenge.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Challenge deleted'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getChallenges,
  getChallengeById,
  createChallenge,
  updateChallenge,
  updateChallengeStatus,
  joinChallenge,
  deleteChallenge,
};
