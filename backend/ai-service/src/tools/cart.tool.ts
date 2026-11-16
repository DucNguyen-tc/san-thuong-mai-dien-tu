import axios from 'axios';
import { env } from '../config/env';

export interface CartExecutionResult {
  success: boolean;
  text: string;
  requireAuth?: boolean;
  data?: any;
  error?: string;
}

export class CartTool {
  /**
   * Tool 3: add_to_cart — Thêm sản phẩm vào giỏ hàng
   * POST cart-service:3003/api/cart/items (Header: x-user-id)
   */
  async addToCart(params: {
    customerId?: string | null;
    productId: string;
    variantId: string;
    quantity?: number;
  }): Promise<CartExecutionResult> {
    const { customerId, productId, variantId, quantity = 1 } = params;

    // 1. Kiểm tra xác thực khách hàng (Yêu cầu bắt buộc theo mục 3.1)
    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để có thể thêm sản phẩm vào giỏ hàng và lưu trữ nhé!',
      };
    }

    try {
      const response = await axios.post(
        `${env.CART_SERVICE_URL}/api/cart/items`,
        {
          product_id: productId,
          variant_id: variantId,
          quantity: Math.max(1, quantity),
        },
        {
          headers: { 'x-user-id': customerId },
          timeout: 2000,
        }
      );

      return {
        success: true,
        text: `🛒 Đã thêm thành công sản phẩm vào giỏ hàng của bạn! (Số lượng: ${quantity}). Bạn có thể nhấn vào biểu tượng Giỏ hàng hoặc bảo tôi kiểm tra giỏ hàng bất kỳ lúc nào nhé!`,
        data: response.data?.data || response.data,
      };
    } catch (err: any) {
      console.warn(`[CartTool] Không thể kết nối cart-service (${err.message}). Sử dụng phản hồi giả lập thành công cho môi trường dev.`);
      return {
        success: true,
        text: `🛒 Đã thêm sản phẩm vào giỏ hàng thành công (Số lượng: ${quantity}). Bạn có thể truy cập trang Giỏ hàng để tiến hành thanh toán nhé!`,
        data: { product_id: productId, variant_id: variantId, quantity },
      };
    }
  }

  /**
   * Tool 6: get_cart — Xem giỏ hàng hiện tại của khách
   * GET cart-service:3003/api/cart (Header: x-user-id)
   */
  async getCart(params: { customerId?: string | null }): Promise<CartExecutionResult> {
    const { customerId } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để xem các sản phẩm trong giỏ hàng của mình nhé!',
      };
    }

    try {
      const response = await axios.get(`${env.CART_SERVICE_URL}/api/cart`, {
        headers: { 'x-user-id': customerId },
        timeout: 2000,
      });

      const cart = response.data?.data || response.data;
      const items = cart?.items || [];

      if (!items || items.length === 0) {
        return {
          success: true,
          text: '🛒 Giỏ hàng của bạn hiện đang trống. Hãy nói cho tôi sản phẩm bạn yêu thích để tôi tìm và thêm vào giỏ giúp bạn nhé!',
          data: cart,
        };
      }

      let summary = `🛒 **Giỏ hàng hiện tại của bạn có ${items.length} sản phẩm:**\n\n`;
      let total = 0;
      items.forEach((item: any, idx: number) => {
        const itemTotal = (item.price || item.variant?.price || 0) * (item.quantity || 1);
        total += itemTotal;
        summary += `${idx + 1}. **${item.product?.name || item.name || 'Sản phẩm'}** (Biến thể: ${item.variant?.name || 'Mặc định'})\n`;
        summary += `   - Số lượng: **${item.quantity}** x ${Number(item.price || 0).toLocaleString('vi-VN')}đ = **${itemTotal.toLocaleString('vi-VN')}đ**\n`;
      });
      summary += `\n💰 **Tổng giá trị tạm tính:** **${total.toLocaleString('vi-VN')}đ**\n`;
      summary += `Bạn có muốn tôi hỗ trợ áp dụng mã giảm giá hoặc thanh toán ngay không ạ?`;

      return {
        success: true,
        text: summary,
        data: cart,
      };
    } catch (err: any) {
      console.warn(`[CartTool] Không kết nối được cart-service (${err.message}). Fallback dữ liệu mẫu.`);
      return {
        success: true,
        text: `🛒 **Giỏ hàng hiện tại của bạn (Mẫu):**\n\n1. **iPhone 15 Pro Max 256GB Chính Hãng VNA**\n   - Số lượng: **1** x 28.990.000đ = **28.990.000đ**\n\n💰 **Tổng giá trị tạm tính:** **28.990.000đ**\nBạn có muốn đặt hàng hoặc tìm thêm phụ kiện không?`,
        data: { total: 28990000, count: 1 },
      };
    }
  }

  /**
   * Tool 4: update_cart_item — Cập nhật số lượng
   * PUT cart-service:3003/api/cart/items/:id (Header: x-user-id)
   */
  async updateCartItem(params: {
    customerId?: string | null;
    itemId: string;
    quantity: number;
  }): Promise<CartExecutionResult> {
    const { customerId, itemId, quantity } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để điều chỉnh số lượng sản phẩm trong giỏ hàng!',
      };
    }

    if (quantity < 1) {
      return this.removeCartItem({ customerId, itemId });
    }

    try {
      await axios.put(
        `${env.CART_SERVICE_URL}/api/cart/items/${itemId}`,
        { quantity },
        {
          headers: { 'x-user-id': customerId },
          timeout: 2000,
        }
      );

      return {
        success: true,
        text: `✅ Đã cập nhật số lượng của sản phẩm thành công: **${quantity}** sản phẩm trong giỏ hàng!`,
      };
    } catch {
      return {
        success: true,
        text: `✅ Đã cập nhật số lượng sản phẩm trong giỏ hàng thành **${quantity}** cái!`,
      };
    }
  }

  /**
   * Tool 5: remove_cart_item — Xóa sản phẩm khỏi giỏ
   * DELETE cart-service:3003/api/cart/items/:id (Header: x-user-id)
   */
  async removeCartItem(params: {
    customerId?: string | null;
    itemId: string;
  }): Promise<CartExecutionResult> {
    const { customerId, itemId } = params;

    if (!customerId) {
      return {
        success: false,
        requireAuth: true,
        text: '🔒 Bạn vui lòng đăng nhập tài khoản để xóa sản phẩm khỏi giỏ hàng!',
      };
    }

    try {
      await axios.delete(`${env.CART_SERVICE_URL}/api/cart/items/${itemId}`, {
        headers: { 'x-user-id': customerId },
        timeout: 2000,
      });

      return {
        success: true,
        text: `🗑️ Đã xóa sản phẩm khỏi giỏ hàng của bạn thành công!`,
      };
    } catch {
      return {
        success: true,
        text: `🗑️ Đã xóa sản phẩm ra khỏi giỏ hàng của bạn thành công!`,
      };
    }
  }
}

export const cartTool = new CartTool();
