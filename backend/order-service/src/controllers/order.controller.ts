import { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/order.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreateOrderInput } from '../schemas/order.schema';
import { OrderStatus } from '@prisma/client';

const orderService = new OrderService();

const getAuthUser = (req: Request) => {
  const customerId = req.headers['x-user-id'];
  const role = req.headers['x-user-role'];

  if (!customerId || typeof customerId !== 'string') {
    throw new Error('Unauthorized'); // Gateway lo phần này nhưng phòng hờ
  }

  return {
    customerId,
    role: typeof role === 'string' ? role : 'USER',
  };
};

export class OrderController {
  
  public async createOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId } = getAuthUser(req);
      const input = req.body as CreateOrderInput;
      
      const order = await orderService.createOrder(customerId, input);
      sendResponse(res, 201, true, 'Tạo đơn hàng thành công', serializeBigInt(order));
    } catch (error) {
      next(error);
    }
  }

  public async getOrders(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, role } = getAuthUser(req);
      const status = req.query.status as OrderStatus | undefined;
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

      const result = await orderService.getOrders(customerId, role, { status, page, limit });
      sendResponse(res, 200, true, 'Lấy danh sách đơn hàng thành công', serializeBigInt(result));
    } catch (error) {
      next(error);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, role } = getAuthUser(req);
      const { id } = req.params;

      const order = await orderService.getOrderById(customerId, role, id);
      sendResponse(res, 200, true, 'Lấy chi tiết đơn hàng thành công', serializeBigInt(order));
    } catch (error) {
      next(error);
    }
  }

  public async updateOrderStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { role } = getAuthUser(req);
      
      // Chỉ ADMIN mới được cập nhật trạng thái đơn hàng (Admin/System)
      if (role !== 'ADMIN') {
        res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này' });
        return;
      }

      const { id } = req.params;
      const { status } = req.body as { status: OrderStatus };

      const order = await orderService.updateOrderStatus(id, status);
      sendResponse(res, 200, true, 'Cập nhật trạng thái đơn hàng thành công', serializeBigInt(order));
    } catch (error) {
      next(error);
    }
  }

  public async cancelOrder(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { customerId, role } = getAuthUser(req);
      const { id } = req.params;

      const order = await orderService.cancelOrder(customerId, role, id);
      sendResponse(res, 200, true, 'Hủy đơn hàng thành công', serializeBigInt(order));
    } catch (error) {
      next(error);
    }
  }
}
