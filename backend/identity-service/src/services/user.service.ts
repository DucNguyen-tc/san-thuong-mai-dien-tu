import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

export class UserService {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
        role: true,
        auth_provider: true,
        created_at: true,
      },
    });
    if (!user) throw new Error('User not found');
    return user;
  }

  async updateProfile(userId: string, data: { full_name?: string; phone?: string; avatar_url?: string }) {
    return await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        full_name: true,
        phone: true,
        avatar_url: true,
      },
    });
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password_hash) {
      throw new Error('Account does not have a local password');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    if (!isValid) {
      throw new Error('Mật khẩu cũ không chính xác');
    }

    const salt = await bcrypt.genSalt(10);
    const newPasswordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: userId },
      data: { password_hash: newPasswordHash },
    });

    return true;
  }

  async getAllUsers(page: number, limit: number) {
    const skip = (page - 1) * limit;
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        auth_provider: true,
        created_at: true,
      },
    });
    const total = await prisma.user.count();
    return { users, total, page, limit };
  }

  async toggleUserActive(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.role === 'ADMIN') {
      throw new Error('Không thể khóa tài khoản Admin');
    }

    return await prisma.user.update({
      where: { id: userId },
      data: { is_active: !user.is_active },
      select: {
        id: true,
        email: true,
        is_active: true,
      },
    });
  }

  async createUserByAdmin(data: any) {
    const { email, password, full_name, role, is_active } = data;
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error('Email đã được sử dụng');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password || '123456', salt);

    return await prisma.user.create({
      data: {
        email,
        full_name,
        password_hash,
        role: role || 'CUSTOMER',
        is_active: is_active !== undefined ? is_active : true,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
      }
    });
  }

  async updateUserByAdmin(userId: string, data: any) {
    const { email, full_name, role, is_active } = data;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (email && email !== user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) throw new Error('Email đã được sử dụng');
    }

    return await prisma.user.update({
      where: { id: userId },
      data: {
        email: email || user.email,
        full_name: full_name || user.full_name,
        role: role || user.role,
        is_active: is_active !== undefined ? is_active : user.is_active,
      },
      select: {
        id: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
      }
    });
  }
}
