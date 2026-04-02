const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkStock() {
    try {
        const merchantId = 'cmn9z595m000511bvw225ozdx'; // From previous logs
        
        const products = await prisma.product.findMany({
            where: { merchantId },
            include: { variants: true }
        });

        const totalBaseStock = products.reduce((sum, p) => sum + p.stock, 0);
        const totalVariantStock = products.reduce((sum, p) => {
            return sum + p.variants.reduce((vSum, v) => vSum + v.stock, 0);
        }, 0);

        console.log('--- STOCK REPORT ---');
        console.log('Total Products:', products.length);
        console.log('Total Base Stock:', totalBaseStock);
        console.log('Total Variant Stock:', totalVariantStock);
        console.log('Total Combined:', totalBaseStock + totalVariantStock);

        // Sample product with variants
        const withVariants = products.filter(p => p.variants.length > 0);
        if (withVariants.length > 0) {
            console.log('\nSample Product with Variants:');
            console.log('Name:', withVariants[0].name);
            console.log('Base Stock:', withVariants[0].stock);
            console.log('Variants:', withVariants[0].variants.map(v => `${v.name}=${v.stock}`));
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

checkStock();
