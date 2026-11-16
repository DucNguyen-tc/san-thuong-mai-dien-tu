import { Request, Response } from 'express';
import { AddressService } from '../services/address.service';
import { sendResponse } from '../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/verifyToken';

const addressService = new AddressService();

const createAddressSchema = z.object({
  receiver_name: z.string().optional(),
  phone: z.string().optional(),
  address_line: z.string().min(5),
  is_default: z.boolean().optional(),
});

const updateAddressSchema = z.object({
  receiver_name: z.string().optional(),
  phone: z.string().optional(),
  address_line: z.string().min(5).optional(),
  is_default: z.boolean().optional(),
});

export const getMyAddresses = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addresses = await addressService.getAddressesByUserId(userId);
    return sendResponse(res, 200, true, 'Lấy danh sách địa chỉ thành công', addresses);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const createAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = createAddressSchema.parse(req.body);
    const address = await addressService.createAddress(userId, data);
    return sendResponse(res, 201, true, 'Thêm địa chỉ thành công', address);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const updateAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addressId = BigInt(req.params.id);
    const data = updateAddressSchema.parse(req.body);
    const address = await addressService.updateAddress(addressId, userId, data);
    return sendResponse(res, 200, true, 'Cập nhật địa chỉ thành công', address);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const deleteAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addressId = BigInt(req.params.id);
    await addressService.deleteAddress(addressId, userId);
    return sendResponse(res, 200, true, 'Xóa địa chỉ thành công');
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const setDefaultAddress = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const addressId = BigInt(req.params.id);
    await addressService.setDefaultAddress(addressId, userId);
    return sendResponse(res, 200, true, 'Đã thiết lập địa chỉ mặc định');
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};
