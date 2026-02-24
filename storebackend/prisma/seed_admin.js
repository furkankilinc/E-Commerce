/**
 * Admin seed scripti — Veritabanına SUPER_ADMIN hesabı oluşturur.
 * Kullanım: node prisma/seed_admin.js
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@fuira.com';
    const password = 'Admin123!';
    const name = 'Super Admin';

    const existing = await prisma.admin.findUnique({ where: { email } });
    if (existing) {
        console.log('✅ Admin zaten mevcut:', email);
        return;
    }

    const hashed = await bcrypt.hash(password, 14);
    const admin = await prisma.admin.create({
        data: {
            email,
            password: hashed,
            name,
            role: 'SUPER_ADMIN',
            isActive: true,
        },
    });

    console.log('✅ Admin oluşturuldu!');
    console.log('   Email   :', admin.email);
    console.log('   Şifre   :', password);
    console.log('   Rol     :', admin.role);
}

main()
    .catch(e => { console.error('❌ Hata:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
