const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding process started...');

    // 1. Kategoriler & Alt Kategoriler
    const categoriesData = [
        {
            name: 'Elektronik',
            slug: 'elektronik',
            description: 'Tüm teknolojik ürünler',
            children: [
                { name: 'Akıllı Telefonlar', slug: 'akilli-telefonlar' },
                { name: 'Bilgisayarlar', slug: 'bilgisayarlar' },
                { name: 'Tabletler', slug: 'tabletler' },
                { name: 'Kulaklıklar', slug: 'kulakliklar' },
                { name: 'Televizyonlar', slug: 'televizyonlar' },
                { name: 'Fotoğraf & Kamera', slug: 'fotograf-kamera' },
                { name: 'Giyilebilir Teknoloji', slug: 'giyilebilir-teknoloji' },
            ]
        },
        {
            name: 'Moda',
            slug: 'moda',
            description: 'Giyim ve aksesuar',
            children: [
                { name: 'Erkek Giyim', slug: 'erkek-giyim' },
                { name: 'Kadın Giyim', slug: 'kadin-giyim' },
                { name: 'Ayakkabı', slug: 'ayakkabi' },
                { name: 'Saat & Aksesuar', slug: 'saat-aksesuar' },
                { name: 'Çanta', slug: 'canta' },
                { name: 'İç Giyim', slug: 'ic-giyim' },
            ]
        },
        {
            name: 'Ev & Yaşam',
            slug: 'ev-yasam',
            description: 'Mobilya ve ev dekorasyonu',
            children: [
                { name: 'Mobilya', slug: 'mobilya' },
                { name: 'Ev Dekorasyon', slug: 'ev-dekorasyon' },
                { name: 'Mutfak', slug: 'mutfak' },
                { name: 'Aydınlatma', slug: 'aydinlatma' },
                { name: 'Banyo', slug: 'banyo' },
                { name: 'Ev Tekstili', slug: 'ev-tekstili' },
            ]
        },
        {
            name: 'Spor & Outdoor',
            slug: 'spor-outdoor',
            description: 'Spor ekipmanları ve outdoor malzemeleri',
            children: [
                { name: 'Fitness & Kondisyon', slug: 'fitness-kondisyon' },
                { name: 'Kamp Malzemeleri', slug: 'kamp-malzemeleri' },
                { name: 'Bisiklet', slug: 'bisiklet' },
                { name: 'Spor Ayakkabı', slug: 'spor-ayakkabi' },
                { name: 'Outdoor Giyim', slug: 'outdoor-giyim' },
            ]
        },
        {
            name: 'Kozmetik & Kişisel Bakım',
            slug: 'kozmetik-kisisel-bakim',
            description: 'Güzellik ve bakım ürünleri',
            children: [
                { name: 'Parfüm', slug: 'parfum' },
                { name: 'Cilt Bakımı', slug: 'cilt-bakimi' },
                { name: 'Makyaj', slug: 'makyaj' },
                { name: 'Saç Bakımı', slug: 'sac-bakimi' },
                { name: 'Ağız Bakımı', slug: 'agiz-bakimi' },
            ]
        },
        {
            name: 'Kitap, Müzik, Hobi',
            slug: 'kitap-muzik-hobi',
            description: 'Kültür ve eğlence ürünleri',
            children: [
                { name: 'Kitap', slug: 'kitap' },
                { name: 'Müzik Enstrümanları', slug: 'muzik-enstrumanlari' },
                { name: 'Oyun & Konsol', slug: 'oyun-konsol' },
                { name: 'Hobi & Oyun', slug: 'hobi-oyun' },
                { name: 'Kırtasiye', slug: 'kirtasiye' },
            ]
        },
        {
            name: 'Anne & Bebek',
            slug: 'anne-bebek',
            description: 'Bebek ürünleri ve anne ihtiyaçları',
            children: [
                { name: 'Bebek Arabası', slug: 'bebek-arabasi' },
                { name: 'Bebek Giyim', slug: 'bebek-giyim' },
                { name: 'Oyuncak', slug: 'oyuncak' },
                { name: 'Beslenme Gereçleri', slug: 'beslenme-gerecleri' },
                { name: 'Bebek Bakım', slug: 'bebek-bakim' },
            ]
        },
        {
            name: 'Süpermarket',
            slug: 'supermarket',
            description: 'Temel gıda ve ev temizlik ürünleri',
            children: [
                { name: 'Gıda Ürünleri', slug: 'gida-urunleri' },
                { name: 'Temizlik Ürünleri', slug: 'temizlik-urunleri' },
                { name: 'Kişisel Temizlik', slug: 'kisisel-temizlik' },
                { name: 'Atıştırmalıklar', slug: 'atistirmaliklar' },
                { name: 'İçecekler', slug: 'icecekler' },
            ]
        }
    ];

    for (const cat of categoriesData) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {
                name: cat.name,
                description: cat.description,
                isActive: true
            },
            create: {
                name: cat.name,
                slug: cat.slug,
                description: cat.description,
                isActive: true,
                children: {
                    create: cat.children.map(child => ({
                        name: child.name,
                        slug: child.slug,
                        isActive: true
                    }))
                }
            }
        });
    }

    // Ürünler için kategorileri tekrar çekelim
    const allCategories = await prisma.category.findMany({
        include: { children: true }
    });

    const electronicCat = allCategories.find(c => c.slug === 'elektronik');
    const phones = electronicCat.children.find(c => c.slug === 'akilli-telefonlar');
    const laptops = electronicCat.children.find(c => c.slug === 'bilgisayarlar');

    const fashionCat = allCategories.find(c => c.slug === 'moda');
    const menFashion = fashionCat.children.find(c => c.slug === 'erkek-giyim');

    // 2. Örnek Ürünler
    const productsData = [
        {
            name: 'iPhone 15 Pro Max 256GB',
            slug: 'iphone-15-pro-max-256gb',
            description: 'En güçlü iPhone deneyimi.',
            price: 89999.99,
            stock: 50,
            sku: 'IPH15PM-256',
            categoryId: phones.id,
            merchantId: 'merchant-123',
            imageUrl: 'https://placehold.co/600x400?text=iPhone+15+ProMax'
        },
        {
            name: 'Samsung Galaxy S23 Ultra',
            slug: 'samsung-galaxy-s23-ultra',
            description: '200MP kamerasıyla fark yaratın.',
            price: 54999.99,
            stock: 30,
            sku: 'SMSNG-S23U',
            categoryId: phones.id,
            merchantId: 'merchant-456',
            imageUrl: 'https://placehold.co/600x400?text=Galaxy+S23+Ultra'
        },
        {
            name: 'MacBook Pro M3 Max 14"',
            slug: 'macbook-pro-m3-max-14',
            description: 'Yaratıcı profesyoneller için tasarlandı.',
            price: 124999.00,
            stock: 15,
            sku: 'MBP-M3-14',
            categoryId: laptops.id,
            merchantId: 'merchant-123',
            imageUrl: 'https://placehold.co/600x400?text=MacBook+Pro+M3'
        },
        {
            name: 'Slim Fit Siyah Gömlek',
            slug: 'slim-fit-siyah-gomlek',
            description: '%100 Pamuklu, şık ve modern kesim.',
            price: 899.90,
            stock: 100,
            sku: 'SHIRT-BLK-SM',
            categoryId: menFashion.id,
            merchantId: 'merchant-789',
            imageUrl: 'https://placehold.co/600x400?text=Slim+Fit+Shirt'
        }
    ];

    for (const prod of productsData) {
        await prisma.product.upsert({
            where: { slug: prod.slug },
            update: {
                name: prod.name,
                description: prod.description,
                price: prod.price,
                stock: prod.stock,
                categoryId: prod.categoryId
            },
            create: {
                name: prod.name,
                slug: prod.slug,
                description: prod.description,
                price: prod.price,
                stock: prod.stock,
                sku: prod.sku,
                status: 'PUBLISHED',
                isActive: true,
                categoryId: prod.categoryId,
                merchantId: prod.merchantId,
                images: {
                    create: [
                        { url: prod.imageUrl, isMain: true }
                    ]
                }
            }
        });
    }

    // 3. Özellikler (Attributes)
    const attributesData = [
        { name: 'RAM', values: ['8GB', '16GB', '32GB', '64GB'] },
        { name: 'Disk', values: ['256GB', '512GB', '1TB', '2TB'] },
        { name: 'İşlemci', values: ['Apple M1', 'Apple M2', 'Apple M3', 'Intel i7', 'Intel i9', 'Ryzen 7'] },
        { name: 'Renk', values: ['Uzay Grisi', 'Gümüş', 'Siyah', 'Beyaz', 'Lacivert', 'Kırmızı'] }
    ];

    for (const attr of attributesData) {
        await prisma.attribute.upsert({
            where: { name: attr.name },
            update: {},
            create: {
                name: attr.name,
                values: {
                    create: attr.values.map(v => ({ value: v }))
                }
            }
        });
    }

    console.log('✅ Seeding completed! Enjoy your crowded demo database.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
