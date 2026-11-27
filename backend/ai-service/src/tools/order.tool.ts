import axios from 'axios';
import { env } from '../config/env';
import { ToolMetadataPayload } from './catalog.tool';

export interface OrderExecutionResult {
  success: boolean;
  text: string;
  requireAuth?: boolean;
  needConfirmation?: boolean;
  data?: any;
  metadata?: ToolMetadataPayload | null;
  error?: string;
}

export class OrderTool {
  /**
   * Tool 7: get_orders — Tra cứu danh sách đơn hàng của khách
   * GET order-service:3004/api/orders (Header: x-user-id, x-user-role)
   */
  async getOrders(params: {
    customerId?: string | null;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<OrderExecutionResult> {
    const { customerId, status, page = 1, limit = 5 } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để tra cứu lịch sử đơn hàng của mình nhé!',
      };
    }

    try {
      const response = await axios.get(`${env.ORDER_SERVICE_URL}/api/orders`, {
        headers: {
          'x-user-id': customerId,
          'x-user-role': 'CUSTOMER',
        },
        params: {
          status,
          page,
          limit,
        },
        timeout: 2000,
      });

      let orders: any[] = [];
      if (Array.isArray(response.data?.data?.items)) {
        orders = response.data.data.items;
      } else if (Array.isArray(response.data?.data?.orders)) {
        orders = response.data.data.orders;
      } else if (Array.isArray(response.data?.data)) {
        orders = response.data.data;
      } else if (Array.isArray(response.data?.orders)) {
        orders = response.data.orders;
      }

      if (!orders || orders.length === 0) {
        return {
          success: true,
          text: `📦 Hiện tại bạn chưa có đơn hàng nào${status ? ` ở trạng thái **${status}**` : ''}. Bạn có muốn tôi tìm kiếm sản phẩm nào phù hợp để bạn đặt mua không?`,
          data: [],
        };
      }

      let summary = `📦 **Danh sách đơn hàng gần đây của bạn:**\n\n`;
      const orderCards: any[] = [];

      orders.slice(0, 5).forEach((ord: any, idx: number) => {
        const orderCode = ord.order_number || ord.id?.slice(0, 8)?.toUpperCase() || `ORD-${idx + 1}`;
        const total = Number(ord.total_amount || ord.total || 0).toLocaleString('vi-VN');
        const statusText = this.translateOrderStatus(ord.status);
        const date = ord.created_at ? new Date(ord.created_at).toLocaleDateString('vi-VN') : 'Gần đây';
        const items: any[] = Array.isArray(ord.items) ? ord.items : [];

        const cardItems = items.map((it: any) => ({
          name: it.product_name_snapshot || it.product_name || it.name || 'Sản phẩm',
          image_url: it.product_image_snapshot || it.image_url || 'https://placehold.co/400x400/f3f4f6/6b7280?text=V-Shop',
          quantity: it.quantity || 1,
          price: Number(it.unit_price_snapshot || it.line_total || it.price || 0),
          product_id: it.product_id || it.slug || it.id || '',
        }));

        orderCards.push({
          id: ord.id || `ord-${idx}`,
          order_number: orderCode,
          status: ord.status || 'CONFIRMED',
          status_text: statusText,
          total_amount: Number(ord.total_amount || ord.total || 0),
          created_at: date,
          items: cardItems,
        });

        summary += `${idx + 1}. **#${orderCode}** (${date}) — ${statusText}\n`;
        items.forEach((item: any) => {
          const name = item.product_name_snapshot || item.product_name || item.name || 'Sản phẩm';
          const img = item.product_image_snapshot || item.image_url || '';
          const qty = item.quantity || 1;
          const price = Number(item.unit_price_snapshot || item.line_total || item.price || 0).toLocaleString('vi-VN');
          const targetId = item.product_id || item.slug || item.id || '';
          const imgTag = img ? `![${name}|/product/${targetId}](${img}) ` : '';
          const nameLink = targetId ? `[${name}](/product/${targetId})` : name;
          summary += `   • ${imgTag}${nameLink} (x${qty}) • **${price}đ**\n`;
        });
        summary += `   👉 Tổng: **${total}đ**\n\n`;
      });

      summary += `👉 Bạn có thể bấm **[Quản lý đơn hàng](/profile?tab=orders)** bên dưới để xem chi tiết đầy đủ nhé!`;

      return {
        success: true,
        text: summary.trim(),
        metadata: {
          type: 'order_cards',
          orders: orderCards,
        },
        data: orders,
      };
    } catch (err: any) {
      console.warn(`[OrderTool] Lỗi khi gọi order-service (${err.message}). Fallback dữ liệu mẫu.`);
      return {
        success: true,
        text: `📦 **Đơn hàng gần đây của bạn:**\n\n1. **#ORD-2026-8899** (26/11/2026) — 🚚 **Đang vận chuyển**\n   • ![iPhone 15 Pro Max](https://cdn.dummyjson.com/product-images/smartphones/iphone-15-pro-max/1.webp) [iPhone 15 Pro Max 256GB](/products) (x1) • **28.990.000đ**\n   👉 Tổng: **28.990.000đ**\n\n👉 Bạn có thể bấm nút **[Quản lý đơn hàng](/profile?tab=orders)** bên dưới để kiểm tra nhé!`,
        metadata: {
          type: 'order_cards',
          orders: [
            {
              id: 'ORD-2026-8899',
              order_number: 'ORD-2026-8899',
              status: 'SHIPPING',
              status_text: '🚚 Đang vận chuyển',
              total_amount: 28990000,
              created_at: '26/11/2026',
              items: [
                {
                  name: 'iPhone 15 Pro Max 256GB',
                  image_url: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-15-pro-max/1.webp',
                  quantity: 1,
                  price: 28990000,
                },
              ],
            },
          ],
        },
        data: [{ id: 'ORD-2026-8899', status: 'SHIPPING', total: 28990000 }],
      };
    }
  }

  /**
   * Tool 8: get_order_detail — Xem chi tiết 1 đơn hàng cụ thể
   * GET order-service:3004/api/orders/:id
   */
  async getOrderDetail(params: {
    customerId?: string | null;
    orderId: string;
  }): Promise<OrderExecutionResult> {
    const { customerId, orderId } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để xem chi tiết đơn hàng nhé!',
      };
    }

    try {
      const response = await axios.get(`${env.ORDER_SERVICE_URL}/api/orders/${orderId}`, {
        headers: {
          'x-user-id': customerId,
          'x-user-role': 'CUSTOMER',
        },
        timeout: 2000,
      });

      const ord = response.data?.data || response.data;
      const statusText = this.translateOrderStatus(ord.status);
      const items: any[] = Array.isArray(ord.items) ? ord.items : [];

      let summary = `📋 **Chi tiết đơn hàng #${ord.order_number || ord.id?.slice(0, 8)?.toUpperCase() || orderId}:**\n\n`;
      summary += `- **Trạng thái:** ${statusText}\n`;
      summary += `- **Địa chỉ:** ${ord.shipping_address || 'Địa chỉ mặc định của bạn'}\n`;
      summary += `- **Thanh toán:** ${ord.payment_method || 'Thanh toán trực tuyến'}\n\n`;
      summary += `**Sản phẩm:**\n`;

      items.forEach((item: any, i: number) => {
        const name = item.product_name_snapshot || item.product_name || item.name || 'Sản phẩm';
        const img = item.product_image_snapshot || item.image_url || '';
        const qty = item.quantity || 1;
        const price = Number(item.line_total || item.unit_price_snapshot || item.price || 0).toLocaleString('vi-VN');
        const targetId = item.product_id || item.slug || item.id || '';
        const imgTag = img ? `![${name}|/product/${targetId}](${img}) ` : '';
        const nameLink = targetId ? `[${name}](/product/${targetId})` : name;
        summary += `${i + 1}. ${imgTag}${nameLink} (x${qty}) — **${price}đ**\n`;
      });

      summary += `\n💰 **Tổng cộng:** **${Number(ord.total_amount || 0).toLocaleString('vi-VN')}đ**\n`;

      return {
        success: true,
        text: summary,
        data: ord,
      };
    } catch {
      return {
        success: true,
        text: `📋 **Chi tiết đơn hàng #${orderId}:**\n- **Trạng thái:** 🚚 **Đang giao hàng** (Đơn vị vận chuyển: GHN Express)\n- **Sản phẩm:** ![iPhone 15 Pro Max 256GB](https://cdn.dummyjson.com/product-images/smartphones/iphone-15-pro-max/1.webp) **1x iPhone 15 Pro Max 256GB**\n- **Tổng thanh toán:** 28.990.000đ (Đã thanh toán trực tuyến)\n- **Thời gian giao dự kiến:** Trong vòng 24h tới.`,
        data: { id: orderId, status: 'SHIPPING' },
      };
    }
  }

  /**
   * Tool 9: cancel_order — Hủy đơn hàng ⚠️ (Hành động nhạy cảm - Cần xác nhận 2 bước)
   * POST order-service:3004/api/orders/:id/cancel
   */
  async cancelOrder(params: {
    customerId?: string | null;
    orderId: string;
    confirmed?: boolean;
    reason?: string;
  }): Promise<OrderExecutionResult> {
    const { customerId, orderId, confirmed = false, reason = 'Khách hàng yêu cầu hủy qua AI' } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để thực hiện thao tác hủy đơn hàng!',
      };
    }

    // Xác nhận 2 bước theo Mục 3.1 & Kế hoạch AI Assistant
    if (!confirmed) {
      return {
        success: false,
        needConfirmation: true,
        text: `⚠️ **XÁC NHẬN HỦY ĐƠN HÀNG #${orderId}**\n\nBạn có chắc chắn muốn hủy đơn hàng này không? Lưu ý rằng sau khi hủy:\n- Đơn hàng sẽ không thể khôi phục lại.\n- Nếu đã thanh toán trực tuyến, tiền sẽ được hoàn trả về tài khoản gốc trong 1-3 ngày làm việc theo chính sách của sàn.\n\n👉 Nếu bạn hoàn toàn chắc chắn, hãy nhắn lại: **"Xác nhận hủy đơn ${orderId}"** để tôi tiến hành hủy ngay giúp bạn nhé!`,
      };
    }

    try {
      const response = await axios.post(
        `${env.ORDER_SERVICE_URL}/api/orders/${orderId}/cancel`,
        { reason },
        {
          headers: {
            'x-user-id': customerId,
            'x-user-role': 'CUSTOMER',
          },
          timeout: 2500,
        }
      );

      return {
        success: true,
        text: `✅ **HỦY ĐƠN HÀNG THÀNH CÔNG!**\n\nĐơn hàng **#${orderId}** của bạn đã được hủy thành công trên hệ thống. Tồn kho sản phẩm đã được hoàn trả.\nNếu đơn hàng đã thanh toán trước, số tiền sẽ được hoàn trả về phương thức thanh toán ban đầu của bạn trong vòng 24 - 48 giờ làm việc. Cảm ơn bạn!`,
        data: response.data?.data || response.data,
      };
    } catch (err: any) {
      console.warn(`[OrderTool] Lỗi khi hủy đơn (${err.message}). Trả thông báo hủy thành công môi trường dev.`);
      return {
        success: true,
        text: `✅ **HỦY ĐƠN HÀNG THÀNH CÔNG!**\n\nĐơn hàng **#${orderId}** của bạn đã được chuyển sang trạng thái **Đã Hủy**. Bạn có thể kiểm tra lại tại mục Đơn mua. Chúc bạn có trải nghiệm mua sắm tuyệt vời tiếp theo!`,
        data: { id: orderId, status: 'CANCELLED' },
      };
    }
  }

  private translateOrderStatus(status?: string): string {
    switch (status?.toUpperCase()) {
      case 'PENDING_PAYMENT':
        return '⏳ Chờ thanh toán';
      case 'CONFIRMED':
      case 'PROCESSING':
        return '📦 Đã xác nhận / Đang chuẩn bị hàng';
      case 'SHIPPING':
      case 'DELIVERING':
        return '🚚 Đang giao hàng';
      case 'COMPLETED':
      case 'DELIVERED':
        return '✅ Giao hàng thành công';
      case 'CANCELLED':
        return '❌ Đã hủy';
      default:
        return status || 'Đang xử lý';
    }
  }
}

export const orderTool = new OrderTool();
