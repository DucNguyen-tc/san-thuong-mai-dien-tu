import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  // 1. Admin
  await prisma.user.upsert({
    where: { email: 'admin@gmail.com' },
    update: { password_hash: hash, role: 'ADMIN' },
    create: {
      email: 'admin@gmail.com',
      password_hash: hash,
      full_name: 'Quản trị viên',
      role: 'ADMIN',
    },
  });

  // 2. User
  await prisma.user.upsert({
    where: { email: 'nguyenvana@gmail.com' },
    update: { password_hash: hash, role: 'CUSTOMER' },
    create: {
      email: 'nguyenvana@gmail.com',
      password_hash: hash,
      full_name: 'Nguyễn Văn A',
      role: 'CUSTOMER',
    },
  });

  console.log('🎉 Đã tạo thành công 2 tài khoản!');
  console.log('--- ADMIN ---');
  console.log('Email   : admin@gmail.com');
  console.log('Mật khẩu: 123456');
  console.log('--- USER ---');
  console.log('Email   : nguyenvana@gmail.com');
  console.log('Mật khẩu: 123456');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
