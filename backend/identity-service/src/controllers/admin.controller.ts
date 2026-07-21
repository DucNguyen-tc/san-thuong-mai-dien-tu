import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { sendResponse } from '../utils/response';

const userService = new UserService();

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await userService.getAllUsers(page, limit);
    return sendResponse(res, 200, true, 'Lấy danh sách người dùng thành công', result);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};

export const toggleUserActive = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;
    const user = await userService.toggleUserActive(userId);
    return sendResponse(res, 200, true, `Đã ${user.is_active ? 'mở khóa' : 'khóa'} tài khoản thành công`, user);
  } catch (error: any) {
    return sendResponse(res, 400, false, error.message);
  }
};
