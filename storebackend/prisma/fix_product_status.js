const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Ürün durumları güncelleniyor...');
    const result = await prisma.product.updateMany({
        where: {},
        data: {
            status: 'PUBLISHED'
        }
    });
    console.log(`${result.count} ürün YAYINDA (PUBLISHED) durumuna getirildi.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
