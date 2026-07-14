import { Request, Response } from 'express';

/**
 * OrderController — Xử lý các HTTP Request rỗng cho Đơn hàng
 */
export class OrderController {

  // POST /api/orders
  public async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { customer_id, shipping_address, payment_method, items } = req.body;
      res.status(201).json({
        success: true,
        message: 'Tạo đơn hàng thành công (Mock)',
        data: {
          id: 'mock-order-uuid',
          customer_id: customer_id || 'mock-customer-id',
          status: 'PENDING_PAYMENT',
          shipping_address: shipping_address || 'Địa chỉ mặc định',
          payment_method: payment_method || 'CASH',
          subtotal: 300000,
          discount_amount: 0,
          shipping_fee: 30000,
          total_amount: 330000,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          items: items || []
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // GET /api/orders
  public async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const customerId = req.query.customer_id || 'mock-customer-id';
      res.status(200).json({
        success: true,
        message: 'Lấy danh sách đơn hàng thành công (Mock)',
        data: [
          {
            id: 'mock-order-uuid',
            customer_id: customerId,
            status: 'PENDING_PAYMENT',
            shipping_address: '123 Đường ABC, Quận 1, TP. HCM',
            payment_method: 'VNPAY',
            subtotal: 500000,
            discount_amount: 50000,
            shipping_fee: 20000,
            total_amount: 470000,
            created_at: new Date().toISOString()
          }
        ]
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // GET /api/orders/:id
  public async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Lấy thông tin chi tiết đơn hàng ${id} thành công (Mock)`,
        data: {
          id,
          customer_id: 'mock-customer-id',
          status: 'CONFIRMED',
          shipping_address: '123 Đường ABC, Quận 1, TP. HCM',
          payment_method: 'MOMO',
          subtotal: 200000,
          discount_amount: 0,
          shipping_fee: 15000,
          total_amount: 215000,
          created_at: new Date().toISOString(),
          items: [
            {
              id: 1,
              order_id: id,
              product_id: 'mock-product-uuid-2',
              variant_id: 'mock-variant-uuid-2',
              product_name_snapshot: 'Sản phẩm mẫu 2',
              variant_attributes_snapshot: { color: 'Blue' },
              original_unit_price: 200000,
              unit_price_snapshot: 200000,
              quantity: 1,
              line_total: 200000
            }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // PUT /api/orders/:id/status
  public async updateOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;
      res.status(200).json({
        success: true,
        message: `Cập nhật trạng thái đơn hàng ${id} thành công (Mock)`,
        data: {
          id,
          status
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }

  // POST /api/orders/:id/cancel
  public async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      res.status(200).json({
        success: true,
        message: `Hủy đơn hàng ${id} thành công (Mock)`,
        data: {
          id,
          status: 'CANCELLED'
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Lỗi máy chủ', error });
    }
  }
}
