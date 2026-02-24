const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Hiyerarşik kategoriler oluşturuluyor...');

    const categories = [
        {
            name: 'Elektronik',
            slug: 'elektronik',
            children: [
                {
                    name: 'Bilgisayar',
                    slug: 'bilgisayar',
                    children: [
                        { name: 'Dizüstü Bilgisayar', slug: 'dizustu-bilgisayar' },
                        { name: 'Masaüstü Bilgisayar', slug: 'masaustu-bilgisayar' },
                        { name: 'Oyuncu Bilgisayarları', slug: 'oyuncu-bilgisayarlari' }
                    ]
                },
                {
                    name: 'Telefon',
                    slug: 'telefon',
                    children: [
                        { name: 'Akıllı Telefonlar', slug: 'akilli-telefonlar' },
                        { name: 'Yenilenmiş Telefonlar', slug: 'yenilenmis-telefonlar' }
                    ]
                }
            ]
        },
        {
            name: 'Moda',
            slug: 'moda',
            children: [
                {
                    name: 'Erkek Giyim',
                    slug: 'erkek-giyim',
                    children: [
                        { name: 'T-Shirt', slug: 'erkek-tshirt' },
                        { name: 'Pantolon', slug: 'erkek-pantolon' }
                    ]
                },
                {
                    name: 'Kadın Giyim',
                    slug: 'kadin-giyim',
                    children: [
                        { name: 'Elbise', slug: 'kadin-elbise' },
                        { name: 'Çanta', slug: 'kadin-canta' }
                    ]
                }
            ]
        }
    ];

    for (const cat of categories) {
        const parent = await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { name: cat.name, slug: cat.slug }
        });

        if (cat.children) {
            for (const sub of cat.children) {
                const subCat = await prisma.category.upsert({
                    where: { slug: sub.slug },
                    update: { parentId: parent.id },
                    create: { name: sub.name, slug: sub.slug, parentId: parent.id }
                });

                if (sub.children) {
                    for (const leaf of sub.children) {
                        await prisma.category.upsert({
                            where: { slug: leaf.slug },
                            update: { parentId: subCat.id },
                            create: { name: leaf.name, slug: leaf.slug, parentId: subCat.id }
                        });
                    }
                }
            }
        }
    }

    console.log('Kategoriler başarıyla eklendi.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
