import axios from 'axios';
import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';
import { CreateOrderInput } from '../schemas/order.schema';
import { OrderStatus, PaymentMethod } from '@prisma/client';
import { rabbitMQPublisher } from '../rabbitmq/publisher';

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';
const CART_URL = process.env.CART_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3005';

export class OrderService {
  
  public async createOrder(customerId: string, input: CreateOrderInput) {
    let orderItemsInput: { cart_item_id?: string; product_id: string; variant_id: string; quantity: number }[] = [];
    let isFromCart = false;

    // 1. Xác định danh sách items cần mua
    if (input.items && input.items.length > 0) {
      orderItemsInput = input.items;
    } else {
      // Gọi sang cart-service lấy giỏ hàng active
      try {
        const response = await axios.get(`${CART_URL}/api/cart`, {
          headers: { 'x-user-id': customerId },
        });
        
        if (response.data?.success && response.data.data) {
          const cart = response.data.data;
          if (!cart.items || cart.items.length === 0) {
            throw new BadRequestError('Giỏ hàng trống. Không thể đặt hàng.');
          }
          orderItemsInput = cart.items.map((item: any) => ({
            cart_item_id: item.id.toString(),
            product_id: item.product_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
          }));
          isFromCart = true;
        } else {
          throw new BadRequestError('Không thể lấy thông tin giỏ hàng.');
        }
      } catch (error: any) {
        if (error instanceof BadRequestError) throw error;
        console.error('Failed to fetch cart:', error.message);
        throw new BadRequestError('Lỗi khi lấy thông tin giỏ hàng.');
      }
    }

    // 2. Gọi sang catalog-service để lấy giá thực tế và kiểm tra tồn kho
    const variantIds = orderItemsInput.map(item => item.variant_id);
    let liveVariants: any[] = [];
    try {
      const response = await axios.post(`${CATALOG_URL}/api/catalog/variants/bulk`, { variantIds });
      if (response.data?.success && Array.isArray(response.data.data)) {
        liveVariants = response.data.data;
      } else {
        throw new BadRequestError('Không thể lấy thông tin sản phẩm từ Catalog.');
      }
    } catch (error: any) {
      console.error('Failed to fetch catalog variants:', error.message);
      throw new BadRequestError('Lỗi khi kiểm tra thông tin sản phẩm.');
    }

    const liveMap = new Map(liveVariants.map(v => [v.id, v]));

    // Kiểm tra tính hợp lệ và tồn kho
    const orderItemsToCreate: any[] = [];
    let subtotal = 0;

    for (const item of orderItemsInput) {
      const liveVariant = liveMap.get(item.variant_id);
      if (!liveVariant || liveVariant.product_id !== item.product_id) {
        throw new NotFoundError(`Sản phẩm hoặc biến thể không tồn tại`);
      }
      if (!liveVariant.is_active || !liveVariant.product?.is_active) {
        throw new BadRequestError(`Sản phẩm ${liveVariant.product?.name || ''} đã ngừng kinh doanh`);
      }
      // Tạm thời check tồn kho khả dụng nhanh bằng phép toán, 
      // bước giữ kho (reserve) sẽ check lại chính xác với Lock trong DB
      const availableStock = liveVariant.stock_quantity - liveVariant.stock_reserved;
      if (availableStock < item.quantity) {
        throw new BadRequestError(`Sản phẩm ${liveVariant.product?.name || ''} không đủ hàng tồn kho`);
      }

      const price = Number(liveVariant.price);
      const lineTotal = price * item.quantity;
      subtotal += lineTotal;

      let imageUrl = null;
      if (liveVariant.images && liveVariant.images.length > 0) {
         imageUrl = liveVariant.images[0].url;
      } else if (liveVariant.product && liveVariant.product.images && liveVariant.product.images.length > 0) {
         imageUrl = liveVariant.product.images[0].url;
      }

      orderItemsToCreate.push({
        product_id: item.product_id,
        variant_id: item.variant_id,
        product_name_snapshot: liveVariant.product.name,
        product_image_snapshot: imageUrl,
        variant_attributes_snapshot: liveVariant.attributes,
        original_unit_price: price,
        unit_price_snapshot: price,
        quantity: item.quantity,
        line_total: lineTotal,
      });
    }

    // Tính toán phí ship và giảm giá
    const shippingFee = subtotal > 500000 ? 0 : 30000; // Freeship cho đơn từ 500k
    const discountAmount = 0;
    const totalAmount = subtotal + shippingFee - discountAmount;

    // 3. Thực hiện tạo Order
    const orderStatus = input.payment_method === 'CASH' ? OrderStatus.CONFIRMED : OrderStatus.PENDING_PAYMENT;

    const createdOrder = await prisma.$transaction(async (tx) => {
      return await tx.order.create({
        data: {
          customer_id: customerId,
          status: orderStatus,
          shipping_address: input.shipping_address,
          payment_method: input.payment_method as PaymentMethod,
          subtotal,
          discount_amount: discountAmount,
          shipping_fee: shippingFee,
          total_amount: totalAmount,
          items: {
            create: orderItemsToCreate,
          },
        },
        include: { items: true },
      });
    });

    // 4. SAGA: Reserve Stock (Giữ kho)
    try {
      const reserveItems = orderItemsInput.map(item => ({
        variant_id: item.variant_id,
        quantity: item.quantity,
      }));
      
      await axios.post(`${CATALOG_URL}/api/catalog/stock-reservations/batch`, {
        order_id: createdOrder.id,
        items: reserveItems
      });
    } catch (error: any) {
      console.error('Failed to reserve stock in catalog:', error.response?.data || error.message);
      // Bù trừ: Hủy đơn hàng vì không đủ kho
      await prisma.order.update({
        where: { id: createdOrder.id },
        data: { status: OrderStatus.CANCELLED }
      });
      throw new BadRequestError(error.response?.data?.message || 'Sản phẩm không đủ tồn kho để đặt hàng.');
    }

    // 5. Xóa các sản phẩm đã mua khỏi Giỏ hàng (nếu mua từ Cart)
    if (isFromCart) {
      // Chạy xóa từng item, không quan trọng nếu có item bị lỗi xóa
      for (const item of orderItemsInput) {
        if (item.cart_item_id) {
          try {
            await axios.delete(`${CART_URL}/api/cart/items/${item.cart_item_id}`, {
              headers: { 'x-user-id': customerId },
            });
          } catch (error: any) {
            console.error(`Failed to remove item ${item.cart_item_id} from cart:`, error.message);
          }
        }
      }
    }

    let paymentUrl: string | undefined;

    // 6. SAGA: Khởi tạo thanh toán
    try {
      const paymentResponse = await axios.post(`${PAYMENT_URL}/api/payments/create`, {
        order_id: createdOrder.id,
        amount: totalAmount,
        method: input.payment_method
      });

      if (paymentResponse.data?.success && paymentResponse.data?.data) {
         paymentUrl = paymentResponse.data.data.payment_url;
      }

      // Đối với CASH: Order là CONFIRMED -> Tiến hành Commit Stock ngay lập tức
      if (input.payment_method === 'CASH') {
        await axios.put(`${CATALOG_URL}/api/catalog/stock-reservations/by-order/${createdOrder.id}/commit`);
        // Publish notification event
        this.publishOrderNotification(createdOrder, 'COMPLETED').catch(e => console.error(e));
      }
      
    } catch (error: any) {
      console.error('Failed to initialize payment:', error.response?.data || error.message);
      // Bù trừ (Compensation): Nhả kho và Hủy đơn hàng
      await axios.put(`${CATALOG_URL}/api/catalog/stock-reservations/by-order/${createdOrder.id}/release`);
      await prisma.order.update({
        where: { id: createdOrder.id },
        data: { status: OrderStatus.CANCELLED }
      });
      throw new BadRequestError('Không thể khởi tạo giao dịch thanh toán.');
    }

    return {
      ...createdOrder,
      payment_url: paymentUrl
    };
  }

  public async getOrders(
    customerId: string,
    role: string,
    query: { status?: OrderStatus; page?: number; limit?: number }
  ) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));

    const where: any = {};
    if (role !== 'ADMIN') {
      where.customer_id = customerId;
    }
    if (query.status) {
      where.status = query.status;
    }

    const [items, total] = await prisma.$transaction([
      prisma.order.findMany({
        where,
        include: { items: true },
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  public async getOrderById(customerId: string, role: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // Bảo vệ chống IDOR
    if (role !== 'ADMIN' && order.customer_id !== customerId) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    return order;
  }

  public async updateOrderStatus(orderId: string, status: OrderStatus) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    const oldStatus = order.status;
    
    // Nếu trạng thái mới là CANCELLED và trạng thái cũ chưa phải CANCELLED -> Hoàn trả lại kho (Release)
    if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
      try {
        await axios.put(`${CATALOG_URL}/api/catalog/stock-reservations/by-order/${orderId}/release`);
      } catch (error: any) {
        console.error('Failed to release stock in catalog:', error.message);
        throw new BadRequestError('Không thể hoàn kho. Không thể cập nhật trạng thái hủy đơn.');
      }
    }

    // Nếu trạng thái mới là CONFIRMED và trạng thái cũ chưa phải CONFIRMED -> Chốt trừ kho (Commit)
    if (status === OrderStatus.CONFIRMED && oldStatus !== OrderStatus.CONFIRMED) {
      try {
        await axios.put(`${CATALOG_URL}/api/catalog/stock-reservations/by-order/${orderId}/commit`);
        // Publish notification event
        this.publishOrderNotification(order, 'COMPLETED').catch(e => console.error(e));
      } catch (error: any) {
        console.error('Failed to commit stock in catalog:', error.message);
        throw new BadRequestError('Không thể chốt kho. Không thể cập nhật trạng thái đơn hàng.');
      }
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });

    if (status === OrderStatus.SHIPPING && oldStatus !== OrderStatus.SHIPPING) {
      this.publishOrderNotification(updatedOrder, 'SHIPPING').catch(e => console.error(e));
    } else if (status === OrderStatus.COMPLETED && oldStatus !== OrderStatus.COMPLETED) {
      this.publishOrderNotification(updatedOrder, 'DELIVERED').catch(e => console.error(e));
    } else if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
      this.publishOrderNotification(updatedOrder, 'CANCELLED').catch(e => console.error(e));
    }

    return updatedOrder;
  }

  public async cancelOrder(customerId: string, role: string, orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });

    if (!order) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // Bảo vệ chống IDOR
    if (role !== 'ADMIN' && order.customer_id !== customerId) {
      throw new NotFoundError('Không tìm thấy đơn hàng');
    }

    // Chỉ cho phép hủy đơn nếu ở trạng thái PENDING_PAYMENT hoặc CONFIRMED
    if (order.status !== OrderStatus.PENDING_PAYMENT && order.status !== OrderStatus.CONFIRMED) {
      throw new BadRequestError('Không thể hủy đơn hàng ở trạng thái hiện tại');
    }

    // Hoàn lại kho bằng API Release bù trừ Saga
    try {
      await axios.put(`${CATALOG_URL}/api/catalog/stock-reservations/by-order/${orderId}/release`);
    } catch (error: any) {
      console.error('Failed to release stock during cancellation:', error.message);
      throw new BadRequestError('Lỗi hệ thống khi hoàn kho. Vui lòng thử lại sau.');
    }

    // Bù trừ: Cập nhật trạng thái thanh toán thành FAILED nếu đang PENDING
    try {
      const paymentRes = await axios.get(`${PAYMENT_URL}/api/payments/order/${orderId}`);
      if (paymentRes.data?.success && paymentRes.data?.data?.id) {
        const paymentId = paymentRes.data.data.id;
        const currentPaymentStatus = paymentRes.data.data.status;
        if (currentPaymentStatus === 'PENDING') {
          await axios.put(`${PAYMENT_URL}/api/payments/${paymentId}/status`, {
            status: 'FAILED',
          });
        }
      }
    } catch (error: any) {
      console.error('Failed to update payment status during cancellation:', error.message);
      // Không ném lỗi ra ngoài để tránh block việc hủy đơn, chỉ log lại
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: { items: true },
    });

    this.publishOrderNotification(updatedOrder, 'CANCELLED').catch(e => console.error(e));

    return updatedOrder;
  }

  /**
   * Helper method to publish order events to RabbitMQ
   */
  private async publishOrderNotification(order: any, eventType: 'COMPLETED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED') {
    try {
      const IDENTITY_URL = process.env.IDENTITY_SERVICE_URL || 'http://localhost:3001';
      const userRes = await axios.get(`${IDENTITY_URL}/api/users/profile`, {
        headers: { 'x-user-id': order.customer_id, 'x-user-role': 'USER' }
      });

      let customerName = 'Khách hàng';
      let email = '';

      if (userRes.data?.success && userRes.data?.data) {
        customerName = userRes.data.data.full_name || 'Khách hàng';
        email = userRes.data.data.email || '';
      }

      if (!email) {
        console.warn(`[OrderService] No email found for user ${order.customer_id}. Skip publishing ${eventType} event.`);
        return;
      }

      const payload = {
        orderId: order.id,
        customerName,
        email,
        totalAmount: order.total_amount.toString()
      };

      switch (eventType) {
        case 'COMPLETED':
          await rabbitMQPublisher.publishOrderCompletedEvent(payload);
          break;
        case 'SHIPPING':
          await rabbitMQPublisher.publishOrderShippingEvent(payload);
          break;
        case 'DELIVERED':
          await rabbitMQPublisher.publishOrderDeliveredEvent(payload);
          break;
        case 'CANCELLED':
          await rabbitMQPublisher.publishOrderCancelledEvent(payload);
          break;
      }
    } catch (error: any) {
      console.error(`[OrderService] Failed to publish ${eventType} for order ${order.id}:`, error.message);
    }
  }
}
