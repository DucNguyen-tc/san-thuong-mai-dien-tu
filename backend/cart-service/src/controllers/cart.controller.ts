import { Request, Response, NextFunction } from 'express';
import { CartService } from '../services/cart.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { AddItemInput, UpdateItemInput } from '../schemas/cart.schema';

const cartService = new CartService();

/**
 * Lấy customerId từ Header được Gateway truyền sang.
 * (Gateway đã verify token và gán ID vào x-user-id).
 */
const getCustomerId = (req: Request) => {
  const customerId = req.headers['x-user-id'];
  if (!customerId || typeof customerId !== 'string') {
    throw new Error('Unauthorized'); // Nên throw error auth nhưng gateway lo việc này rồi
  }
  return customerId;
};

export class CartController {
  
  public async getCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = getCustomerId(req);
      const cart = await cartService.getCart(customerId);
      
      const message = cart.isPriceUpdated 
        ? 'Giỏ hàng có sự cập nhật giá từ cửa hàng'
        : 'Lấy thông tin giỏ hàng thành công';
        
      sendResponse(res, 200, true, message, serializeBigInt(cart));
    } catch (error) {
      next(error);
    }
  }

  public async addItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = getCustomerId(req);
      const input = req.body as AddItemInput;
      const item = await cartService.addItem(customerId, input);
      
      sendResponse(res, 201, true, 'Thêm sản phẩm vào giỏ hàng thành công', serializeBigInt(item));
    } catch (error) {
      next(error);
    }
  }

  public async updateItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = getCustomerId(req);
      const itemId = BigInt(req.params.id);
      const input = req.body as UpdateItemInput;
      
      const updatedItem = await cartService.updateItemQuantity(customerId, itemId, input.quantity);
      sendResponse(res, 200, true, 'Cập nhật số lượng thành công', serializeBigInt(updatedItem));
    } catch (error) {
      next(error);
    }
  }

  public async removeItem(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = getCustomerId(req);
      const itemId = BigInt(req.params.id);
      
      await cartService.removeItem(customerId, itemId);
      sendResponse(res, 200, true, 'Xóa sản phẩm khỏi giỏ thành công');
    } catch (error) {
      next(error);
    }
  }

  public async clearCart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const customerId = getCustomerId(req);
      await cartService.clearCart(customerId);
      sendResponse(res, 200, true, 'Làm trống giỏ hàng thành công');
    } catch (error) {
      next(error);
    }
  }
}
