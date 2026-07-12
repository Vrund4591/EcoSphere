const prisma = require('../config/database');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const { getPagination, paginated } = require('../utils/helpers');
const { getOrCreateSettings } = require('./setting.controller');

/** POST /api/carbon-transactions */
const createCarbonTransaction = async (req, res, next) => {
  try {
    const { source, quantity, co2Amount: reqCo2Amount, description, date, departmentId, emissionFactorId } = req.body;
    if (quantity === undefined) {
      throw ApiError.badRequest('Quantity is required');
    }

    const settings = await getOrCreateSettings();
    let co2Amount = Number(reqCo2Amount) || 0;
    if (settings.autoEmissionCalc && emissionFactorId) {
      const f = await prisma.emissionFactor.findUnique({ where: { id: emissionFactorId } });
      co2Amount = Number(quantity) * (f?.factor || 0);
    }

    const transaction = await prisma.carbonTransaction.create({
      data: {
        source: source || 'MANUAL',
        quantity: Number(quantity),
        co2Amount: Number(co2Amount),
        description: description || null,
        date: date ? new Date(date) : new Date(),
        departmentId: departmentId || null,
        emissionFactorId: emissionFactorId || null,
      },
      include: {
        department: true,
        emissionFactor: true,
      },
    });

    res.status(201).json(new ApiResponse(201, { transaction }, 'Carbon transaction logged'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/carbon-transactions */
const getCarbonTransactions = async (req, res, next) => {
  try {
    const { page, limit, search, all, departmentId, source, startDate, endDate } = req.query;
    const where = {};

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { department: { name: { contains: search, mode: 'insensitive' } } },
        { emissionFactor: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }
    if (source) {
      where.source = source;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (all === 'true') {
      const transactions = await prisma.carbonTransaction.findMany({
        where,
        orderBy: { date: 'desc' },
        include: {
          department: true,
          emissionFactor: true,
        },
      });
      return res.json(new ApiResponse(200, { transactions }, 'Carbon transactions retrieved'));
    }

    const { page: p, limit: l, skip } = getPagination(page, limit);
    const [transactions, total] = await Promise.all([
      prisma.carbonTransaction.findMany({
        where,
        skip,
        take: l,
        orderBy: { date: 'desc' },
        include: {
          department: true,
          emissionFactor: true,
        },
      }),
      prisma.carbonTransaction.count({ where }),
    ]);

    res.json(new ApiResponse(200, paginated(transactions, total, p, l), 'Carbon transactions retrieved'));
  } catch (err) {
    next(err);
  }
};

/** GET /api/carbon-transactions/:id */
const getCarbonTransactionById = async (req, res, next) => {
  try {
    const transaction = await prisma.carbonTransaction.findUnique({
      where: { id: req.params.id },
      include: {
        department: true,
        emissionFactor: true,
      },
    });
    if (!transaction) throw ApiError.notFound('Carbon transaction not found');
    res.json(new ApiResponse(200, { transaction }, 'Carbon transaction retrieved'));
  } catch (err) {
    next(err);
  }
};

/** PUT /api/carbon-transactions/:id */
const updateCarbonTransaction = async (req, res, next) => {
  try {
    const { source, quantity, co2Amount: reqCo2Amount, description, date, departmentId, emissionFactorId } = req.body;

    const existing = await prisma.carbonTransaction.findUnique({ where: { id: req.params.id } });
    if (!existing) throw ApiError.notFound('Carbon transaction not found');

    const settings = await getOrCreateSettings();
    let co2Amount = reqCo2Amount !== undefined ? Number(reqCo2Amount) : existing.co2Amount;

    const finalQuantity = quantity !== undefined ? Number(quantity) : existing.quantity;
    const finalFactorId = emissionFactorId !== undefined ? emissionFactorId : existing.emissionFactorId;

    if (settings.autoEmissionCalc && finalFactorId) {
      const f = await prisma.emissionFactor.findUnique({ where: { id: finalFactorId } });
      co2Amount = finalQuantity * (f?.factor || 0);
    }

    const transaction = await prisma.carbonTransaction.update({
      where: { id: req.params.id },
      data: {
        ...(source && { source }),
        ...(quantity !== undefined && { quantity: Number(quantity) }),
        co2Amount: Number(co2Amount),
        ...(description !== undefined && { description: description || null }),
        ...(date && { date: new Date(date) }),
        ...(departmentId !== undefined && { departmentId: departmentId || null }),
        ...(emissionFactorId !== undefined && { emissionFactorId: emissionFactorId || null }),
      },
      include: {
        department: true,
        emissionFactor: true,
      },
    });

    res.json(new ApiResponse(200, { transaction }, 'Carbon transaction updated'));
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/carbon-transactions/:id */
const deleteCarbonTransaction = async (req, res, next) => {
  try {
    const transaction = await prisma.carbonTransaction.findUnique({
      where: { id: req.params.id },
    });
    if (!transaction) throw ApiError.notFound('Carbon transaction not found');
    await prisma.carbonTransaction.delete({ where: { id: req.params.id } });
    res.json(new ApiResponse(200, null, 'Carbon transaction deleted'));
  } catch (err) {
    next(err);
  }
};

/** POST /api/carbon-transactions/generate */
const generateTransactions = async (req, res, next) => {
  try {
    const [departments, factors] = await Promise.all([
      prisma.department.findMany({ where: { status: 'ACTIVE' } }),
      prisma.emissionFactor.findMany({ where: { status: 'ACTIVE' } }),
    ]);

    if (departments.length === 0 || factors.length === 0) {
      throw ApiError.badRequest('Cannot generate transactions: no active departments or active emission factors found.');
    }

    const sampleTransactions = [
      {
        source: 'PURCHASE',
        desc: 'Utility billing auto-ingest (Electricity)',
        factorName: 'Grid Electricity',
        qtyMin: 500,
        qtyMax: 2000,
      },
      {
        source: 'FLEET',
        desc: 'Fleet fuel card sync (Diesel)',
        factorName: 'Diesel',
        qtyMin: 100,
        qtyMax: 500,
      },
      {
        source: 'MANUFACTURING',
        desc: 'Factory floor energy monitor (Natural Gas)',
        factorName: 'Natural Gas',
        qtyMin: 300,
        qtyMax: 1500,
      },
      {
        source: 'EXPENSE',
        desc: 'Corporate travel booking (Air Travel)',
        factorName: 'Air Travel',
        qtyMin: 1000,
        qtyMax: 5000,
      },
    ];

    const createdTxns = [];
    for (const sample of sampleTransactions) {
      const ef = factors.find(f => f.name === sample.factorName) || factors[0];
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const qty = Math.floor(Math.random() * (sample.qtyMax - sample.qtyMin + 1)) + sample.qtyMin;
      const co2 = qty * ef.factor;

      const txn = await prisma.carbonTransaction.create({
        data: {
          source: sample.source,
          quantity: qty,
          co2Amount: co2,
          description: `${sample.desc} (Auto-Generated)`,
          date: new Date(),
          departmentId: dept.id,
          emissionFactorId: ef.id,
        },
        include: {
          department: true,
          emissionFactor: true,
        },
      });
      createdTxns.push(txn);
    }

    res.status(201).json(new ApiResponse(201, { transactions: createdTxns }, 'Sample transactions generated successfully'));
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createCarbonTransaction,
  getCarbonTransactions,
  getCarbonTransactionById,
  updateCarbonTransaction,
  deleteCarbonTransaction,
  generateTransactions,
};
