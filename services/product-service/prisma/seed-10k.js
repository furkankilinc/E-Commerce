const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://postgres:password123@localhost:5434/product_db"
    }
  }
});

const BRANDS = [
  'Sony', 'Apple', 'Samsung', 'Nike', 'Adidas', 'Logitech', 'Razer', 'ASUS', 'Lenovo',
  'Xiaomi', 'Philips', 'Bosch', 'Dyson', 'JBL', 'Canon', 'DJI', 'Patagonia', 'Puma'
];

const PRODUCTS_METADATA = {
  'akilli-telefonlar': {
    types: ['Akıllı Telefon', 'Pro Max', 'Ultra', 'Lite Edition'],
    images: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=600&auto=format&fit=crop']
  },
  'bilgisayarlar': {
    types: ['Oyuncu Bilgisayarı', 'Laptop', 'Ultrabook', 'Masaüstü PC'],
    images: ['https://images.unsplash.com/photo-1496181130204-7552cc15f085?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&auto=format&fit=crop']
  },
  'tabletler': {
    types: ['Tablet Pro', 'Grafik Tableti', 'E-Kitap Okuyucu'],
    images: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop']
  },
  'kulakliklar': {
    types: ['Kablosuz Kulaklık', 'Gürültü Engelleyici Kulaküstü Kulaklık', 'Kulakiçi Bluetooth Kulaklık'],
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&auto=format&fit=crop']
  },
  'erkek-giyim': {
    types: ['Oversized Hoodie', 'Slim Fit Gömlek', 'Keten Pantolon', 'Denim Ceket'],
    images: ['https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&auto=format&fit=crop']
  },
  'kadin-giyim': {
    types: ['Örme Hırka', 'Elbise', 'Trenchcoat', 'Crop Top'],
    images: ['https://images.unsplash.com/photo-1618220179428-22790b461013?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600&auto=format&fit=crop']
  },
  'ayakkabi': {
    types: ['Koşu Ayakkabısı', 'Deri Bot', 'Sneaker', 'Günlük Ayakkabı'],
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop', 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&auto=format&fit=crop']
  },
  'mutfak': {
    types: ['Filtre Kahve Makinesi', 'Döküm Tava Seti', 'Elektrikli Su Isıtıcısı'],
    images: ['https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?w=600&auto=format&fit=crop']
  },
  'saat-aksesuar': {
    types: ['Analog Kol Saati', 'Güneş Gözlüğü', 'Deri Cüzdan'],
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop']
  }
};

const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop'
];

async function main() {
  console.log('🚀 Seeding 10,000 products starting...');

  // 1. Fetch Categories
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.error('❌ No categories found in database! Please run standard seed first.');
    process.exit(1);
  }

  // Filter leaf/child categories
  const childCategories = categories.filter(c => c.parentId !== null);
  const selectedCategories = childCategories.length > 0 ? childCategories : categories;

  const targetMerchantId = 'cmpd26b8t0005b33fc715z2cn';
  const totalCount = 10000;
  const batchSize = 2000;

  console.log(`📌 Using Merchant ID: ${targetMerchantId}`);
  console.log(`📌 Seeding ${totalCount} products in ${totalCount / batchSize} batches...`);

  let seededCount = 0;

  for (let batch = 0; batch < totalCount / batchSize; batch++) {
    const productsToCreate = [];
    const slugs = new Set();

    for (let i = 0; i < batchSize; i++) {
      const idx = batch * batchSize + i;
      
      // Select category
      const category = selectedCategories[idx % selectedCategories.length];
      const categorySlug = category.slug;

      // Select brand & build name
      const brand = BRANDS[crypto.randomInt(0, BRANDS.length)];
      const meta = PRODUCTS_METADATA[categorySlug] || { types: ['Ürün', 'Özel Seri'], images: DEFAULT_IMAGES };
      const type = meta.types[crypto.randomInt(0, meta.types.length)];
      
      const productName = `${brand} ${type} v${crypto.randomInt(1, 100)} Pro`;
      let slug = `${categorySlug}-${brand.toLowerCase()}-${type.toLowerCase().replace(/\s+/g, '-')}-${crypto.randomInt(10000, 9999999)}`;
      
      // Ensure local uniqueness in batch
      while (slugs.has(slug)) {
        slug = `${slug}-${crypto.randomInt(1, 9)}`;
      }
      slugs.add(slug);

      const price = Math.round((Math.random() * 4900 + 100) * 100) / 100;
      const stock = crypto.randomInt(10, 1000);
      const sku = `SKU-${categorySlug.toUpperCase().slice(0, 3)}-${brand.toUpperCase().slice(0, 3)}-${crypto.randomInt(1000000, 99999999)}`;

      productsToCreate.push({
        merchantId: targetMerchantId,
        categoryId: category.id,
        name: productName,
        slug: slug,
        description: `Premium kalitede, özenle tasarlanmış ${productName}. Benzersiz özellikleri ve şık tasarımıyla günlük hayatınızı kolaylaştıracak mükemmel bir tercih. Uzun ömürlü kullanım ve maksimum performans için birinci sınıf materyallerden üretilmiştir.`,
        shortDescription: `${brand} kalitesiyle üstün performanslı e-ticaret ürünü.`,
        price: price,
        discountPrice: Math.random() > 0.7 ? Math.round(price * 0.85 * 100) / 100 : null,
        sku: sku,
        stock: stock,
        isFeatured: Math.random() > 0.85,
        isNewArrival: Math.random() > 0.85,
        isOnSale: Math.random() > 0.85,
        rating: Math.round((3.5 + Math.random() * 1.5) * 10) / 10,
        reviewCount: crypto.randomInt(5, 200),
        status: 'PUBLISHED',
        isActive: true
      });
    }

    // Bulk insert products
    await prisma.product.createMany({
      data: productsToCreate,
      skipDuplicates: true
    });

    // Fetch inserted products to link images
    const insertedSlugs = productsToCreate.map(p => p.slug);
    const dbProducts = await prisma.product.findMany({
      where: { slug: { in: insertedSlugs } },
      select: { id: true, slug: true, categoryId: true }
    });

    const imagesToCreate = [];
    for (const prod of dbProducts) {
      const category = categories.find(c => c.id === prod.categoryId);
      const categorySlug = category ? category.slug : '';
      const meta = PRODUCTS_METADATA[categorySlug] || { types: ['Ürün'], images: DEFAULT_IMAGES };
      const imagesList = meta.images.length > 0 ? meta.images : DEFAULT_IMAGES;

      // Add main image
      imagesToCreate.push({
        productId: prod.id,
        url: imagesList[0],
        isMain: true,
        order: 0
      });

      // Add optional second image
      if (imagesList.length > 1 && Math.random() > 0.5) {
        imagesToCreate.push({
          productId: prod.id,
          url: imagesList[1],
          isMain: false,
          order: 1
        });
      }
    }

    // Bulk insert images
    await prisma.productImage.createMany({
      data: imagesToCreate,
      skipDuplicates: true
    });

    seededCount += dbProducts.length;
    console.log(`📦 Seeded batch ${batch + 1}/${totalCount / batchSize} (${seededCount} / ${totalCount} products done)`);
  }

  console.log(`✅ Success! Successfully generated and seeded ${seededCount} products with images for merchant cmpd26b8t0005b33fc715z2cn.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
