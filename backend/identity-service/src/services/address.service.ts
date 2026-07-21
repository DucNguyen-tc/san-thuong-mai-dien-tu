import { prisma } from '../config/prisma';
import { UserAddress } from '@prisma/client';

export class AddressService {
  async getAddressesByUserId(userId: string) {
    const addresses = await prisma.userAddress.findMany({
      where: { user_id: userId },
      orderBy: [
        { is_default: 'desc' },
        { created_at: 'desc' },
      ],
    });
    // Chuyển BigInt thành string để trả về JSON (nếu không patch global)
    // Nhưng ta sẽ patch global ở app.ts nên cứ return thẳng.
    return addresses;
  }

  async getAddressById(id: bigint, userId: string) {
    const address = await prisma.userAddress.findFirst({
      where: { id, user_id: userId },
    });
    if (!address) {
      throw new Error('Address not found');
    }
    return address;
  }

  async createAddress(userId: string, data: { receiver_name?: string; phone?: string; address_line: string; is_default?: boolean }) {
    // Nếu tạo địa chỉ mặc định, reset các địa chỉ cũ
    if (data.is_default) {
      await prisma.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      });
    }

    // Nếu đây là địa chỉ đầu tiên, tự động set mặc định
    const count = await prisma.userAddress.count({ where: { user_id: userId } });
    if (count === 0) {
      data.is_default = true;
    }

    return await prisma.userAddress.create({
      data: {
        user_id: userId,
        ...data,
      },
    });
  }

  async updateAddress(id: bigint, userId: string, data: { receiver_name?: string; phone?: string; address_line?: string; is_default?: boolean }) {
    await this.getAddressById(id, userId); // Ensure it belongs to user

    if (data.is_default) {
      await prisma.userAddress.updateMany({
        where: { user_id: userId, is_default: true, id: { not: id } },
        data: { is_default: false },
      });
    }

    return await prisma.userAddress.update({
      where: { id },
      data,
    });
  }

  async deleteAddress(id: bigint, userId: string) {
    const address = await this.getAddressById(id, userId);
    
    if (address.is_default) {
      throw new Error('Cannot delete default address. Set another address as default first.');
    }

    return await prisma.userAddress.delete({
      where: { id },
    });
  }

  async setDefaultAddress(id: bigint, userId: string) {
    await this.getAddressById(id, userId);

    await prisma.$transaction([
      prisma.userAddress.updateMany({
        where: { user_id: userId, is_default: true },
        data: { is_default: false },
      }),
      prisma.userAddress.update({
        where: { id },
        data: { is_default: true },
      }),
    ]);

    return true;
  }
}
