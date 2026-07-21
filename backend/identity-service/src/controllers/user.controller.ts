import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendResponse } from '../utils/response';
import { z } from 'zod';
import { AuthRequest } from '../middlewares/verifyToken';

const userService = new UserService();

const updateProfileSchema = z.object({
  full_name: z.string().min(2).optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
});

const changePasswordSchema = z.object({
  old_password: z.string().min(6),
  new_password: z.string().min(6),
});

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const user = await userService.getProfile(userId);
    return sendResponse(res, 200, true, 'Lấy thông tin thành công', user);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const data = updateProfileSchema.parse(req.body);
    const user = await userService.updateProfile(userId, data);
    return sendResponse(res, 200, true, 'Cập nhật thông tin thành công', user);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const { old_password, new_password } = changePasswordSchema.parse(req.body);
    await userService.changePassword(userId, old_password, new_password);
    return sendResponse(res, 200, true, 'Đổi mật khẩu thành công');
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};
