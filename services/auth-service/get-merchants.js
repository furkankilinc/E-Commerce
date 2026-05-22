const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password123@localhost:5433/auth_db"
    }
  }
});

async function main() {
  const merchants = await prisma.merchant.findMany();
  console.log('MERCHANTS_LIST_JSON:', JSON.stringify(merchants));
}

main().catch(console.error).finally(() => prisma.$disconnect());
