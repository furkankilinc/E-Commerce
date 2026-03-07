const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const categories = await prisma.category.findMany({
        select: { id: true, name: true, slug: true, parentId: true }
    });

    console.log('--- Categories ---');
    console.log(categories);

    const productsWithVariants = await prisma.product.findMany({
        where: { variants: { some: {} } },
        include: {
            category: { select: { name: true, slug: true } },
            variants: { select: { name: true, value: true } }
        }
    });

    console.log('\n--- Products with Variants ---');
    productsWithVariants.forEach(p => {
        console.log(`Product: ${p.name}`);
        console.log(`Category: ${p.category.name} (${p.category.slug})`);
        console.log(`Variants:`, p.variants.map(v => `${v.name}:${v.value}`));
        console.log('---');
    });
}

main().finally(() => prisma.$disconnect());
