const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    // Varsayılan değerler veya ENV üzerinden gelen değerler
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';
    const password = process.env.ADMIN_PASSWORD || 'admin123456';
    const name = process.env.ADMIN_NAME || 'Super Admin';

    console.log('Admin oluşturma işlemi başlatılıyor...');

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        const existingAdmin = await prisma.admin.findUnique({
            where: { email },
        });

        if (existingAdmin) {
            console.log(`Bilgi: ${email} adresine sahip bir admin zaten mevcut.`);
            return;
        }

        const admin = await prisma.admin.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: 'SUPER_ADMIN',
                isActive: true
            },
        });

        console.log('✅ Admin başarıyla oluşturuldu!');
        console.log('---------------------------');
        console.log(`E-posta: ${admin.email}`);
        console.log(`Şifre:   ${password} (Lütfen ilk girişte değiştirin)`);
        console.log(`İsim:    ${admin.name}`);
        console.log(`Rol:     ${admin.role}`);
        console.log('---------------------------');
    } catch (error) {
        console.error('❌ Admin oluşturulurken bir hata oluştu:', error);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
