const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

// Initialize Prisma with the PostgreSQL driver adapter (Prisma 7.x)
let prisma;

if (process.env.DATABASE_URL?.startsWith('prisma+postgres://')) {
  prisma = new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
} else {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool);
  prisma = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

prisma.$connect()
  .then(() => console.log('Database connected'))
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;
