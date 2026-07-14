import { Request, Response } from 'express';

/**
 * CartController — Xử lý các HTTP Request rỗng cho Giỏ hàng
 */
export class CartController {
  
  // GET /api/cart
  public async getCart(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.headers['x-customer-id'] || 'mock-customer-id';
      res.status(200).json({
        success: true,
        message: 'Lấy thông tin giỏ hàng thành công (Mock)',
        data: {
          id: 'mock-cart-uuid',
          customer_id: customerId,
          status: 'ACTIVE',
          items: [
            {
              id: 1,
              product_id: 'mock-product-uuid-1',
              variant_id: 'mock-variant-uuid-1',
              product_name_snapshot: 'Sản phẩm mẫu 1',
              variant_attributes_snapshot: { color: 'Black', size: 'L' },
              unit_price_snapshot: 150000,
              quantity: 2,
              added_at: new Date().toISOString()
            }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // POST /api/cart/items
  public async addItem(req: Request, res: Response): Promise<void> {
    try {
      const { product_id, variant_id, quantity, product_name_snapshot, variant_attributes_snapshot, unit_price_snapshot } = req.body;
      res.status(201).json({
        success: true,
        message: 'Thêm sản phẩm vào giỏ hàng thành công (Mock)',
        data: {
          id: 2,
          cart_id: 'mock-cart-uuid',
          product_id,
          variant_id,
          product_name_snapshot,
          variant_attributes_snapshot,
          unit_price_snapshot,
          quantity: quantity || 1,
          added_at: new Date().toISOString()
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // PUT /api/cart/items/:id
  public async updateItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      res.status(200).json({
        success: true,
        message: `Cập nhật số lượng item ${id} thành công (Mock)`,
        data: {
          id: parseInt(id, 10) || 1,
          quantity
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // DELETE /api/cart/items/:id
  public async removeItem(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Xóa item ${id} khỏi giỏ hàng thành công (Mock)`
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // DELETE /api/cart
  public async clearCart(req: Request, res: Response): Promise<void> {
    try {
      res.status(200).json({
        success: true,
        message: 'Làm trống giỏ hàng thành công (Mock)'
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }
}
