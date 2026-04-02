const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        console.log('--- DB TEST START ---');
        const count = await prisma.merchant.count();
        console.log('MERCHANT COUNT:', count);
        
        const m = await prisma.merchant.findFirst();
        console.log('FIRST MERCHANT:', m ? m.email : 'NONE');
        console.log('--- DB TEST END ---');
    } catch (e) {
        console.error('--- DB TEST ERROR ---');
        console.error(e.message);
        console.error(e.stack);
    } finally {
        await prisma.$disconnect();
    }
}

test();
