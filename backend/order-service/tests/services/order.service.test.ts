import { OrderService } from '../../src/services/order.service';
import { prismaMock } from '../setup/prismaMock';
import axios from 'axios';
import { NotFoundError, BadRequestError } from '../../src/exceptions/AppError';
import { rabbitMQPublisher } from '../../src/rabbitmq/publisher';
import { OrderStatus } from '@prisma/client';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

jest.mock('../../src/rabbitmq/publisher', () => ({
  rabbitMQPublisher: {
    publishOrderCompletedEvent: jest.fn(),
    publishOrderShippingEvent: jest.fn(),
    publishOrderDeliveredEvent: jest.fn(),
    publishOrderCancelledEvent: jest.fn(),
  },
}));

describe('OrderService - Saga Orchestrator', () => {
  let orderService: OrderService;
  const mockCustomerId = 'customer-123';
  const mockOrderId = 'order-999';

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();

    // Default Identity Service mock for publishOrderNotification
    mockedAxios.get.mockImplementation((url: string) => {
      if (url.includes('/api/users/profile')) {
        return Promise.resolve({
          data: { success: true, data: { full_name: 'Test User', email: 'test@example.com' } }
        });
      }
      return Promise.resolve({ data: {} });
    });
  });

  describe('createOrder', () => {
    const input = {
      items: [{ product_id: 'prod-1', variant_id: 'var-1', quantity: 2 }],
      shipping_address: '123 Test St',
      payment_method: 'CASH'
    };

    it('should throw error if catalog fails to reserve stock (Compensating action 1)', async () => {
      // Mock catalog returning variant info successfully
      mockedAxios.post.mockImplementation((url: string) => {
        if (url.includes('/api/catalog/variants/bulk')) {
          return Promise.resolve({
            data: {
              success: true,
              data: [{ id: 'var-1', product_id: 'prod-1', is_active: true, stock_quantity: 10, stock_reserved: 0, price: 50000, product: { is_active: true, name: 'Product 1' } }]
            }
          });
        }
        if (url.includes('/api/catalog/stock-reservations/batch')) {
          // FAIL AT RESERVE STOCK
          return Promise.reject(new Error('Out of stock'));
        }
        return Promise.resolve({ data: {} });
      });

      // Mock DB create order
      prismaMock.$transaction.mockResolvedValue({ id: mockOrderId, status: OrderStatus.CONFIRMED } as any);
      prismaMock.order.update.mockResolvedValue({} as any);

      await expect(orderService.createOrder(mockCustomerId, input as any)).rejects.toThrow(BadRequestError);

      // Verify Compensating Action: Order must be cancelled
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    it('should throw error and release stock if payment init fails (Compensating action 2)', async () => {
      mockedAxios.post.mockImplementation((url: string) => {
        if (url.includes('/api/catalog/variants/bulk')) {
          return Promise.resolve({
            data: { success: true, data: [{ id: 'var-1', product_id: 'prod-1', is_active: true, stock_quantity: 10, stock_reserved: 0, price: 50000, product: { is_active: true, name: 'Product 1' } }] }
          });
        }
        if (url.includes('/api/catalog/stock-reservations/batch')) {
          return Promise.resolve({ data: { success: true } }); // Reserve SUCCESS
        }
        if (url.includes('/api/payments/create')) {
          return Promise.reject(new Error('Payment gateway down')); // PAYMENT INIT FAILS
        }
        return Promise.resolve({ data: {} });
      });

      prismaMock.$transaction.mockResolvedValue({ id: mockOrderId, status: OrderStatus.PENDING_PAYMENT } as any);
      prismaMock.order.update.mockResolvedValue({} as any);
      mockedAxios.put.mockResolvedValue({} as any);

      await expect(orderService.createOrder(mockCustomerId, { ...input, payment_method: 'VNPAY' } as any)).rejects.toThrow(BadRequestError);

      // Verify Compensating Actions
      // 1. Release Stock
      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/api/catalog/stock-reservations/by-order/${mockOrderId}/release`));
      // 2. Cancel Order
      expect(prismaMock.order.update).toHaveBeenCalledWith({
        where: { id: mockOrderId },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    it('should successfully create order with CASH payment', async () => {
      mockedAxios.post.mockImplementation((url: string) => {
        if (url.includes('/api/catalog/variants/bulk')) {
          return Promise.resolve({
            data: { success: true, data: [{ id: 'var-1', product_id: 'prod-1', is_active: true, stock_quantity: 10, stock_reserved: 0, price: 50000, product: { is_active: true, name: 'Product 1' } }] }
          });
        }
        if (url.includes('/api/catalog/stock-reservations/batch')) return Promise.resolve({ data: {} });
        if (url.includes('/api/payments/create')) return Promise.resolve({ data: { success: true, data: {} } });
        return Promise.resolve({ data: {} });
      });

      mockedAxios.put.mockResolvedValue({} as any); // Commit stock
      prismaMock.$transaction.mockResolvedValue({ id: mockOrderId, customer_id: mockCustomerId, status: OrderStatus.CONFIRMED, total_amount: 100000 } as any);

      const result = await orderService.createOrder(mockCustomerId, input as any);

      expect(result.id).toBe(mockOrderId);
      // Verify Commit Stock called since it's CASH
      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/api/catalog/stock-reservations/by-order/${mockOrderId}/commit`));
      
      // Wait a tick for async publish to finish
      await new Promise(process.nextTick);
      expect(rabbitMQPublisher.publishOrderCompletedEvent).toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('should release stock when cancelled', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: mockOrderId, status: OrderStatus.PENDING_PAYMENT, customer_id: mockCustomerId, total_amount: 100000 } as any);
      prismaMock.order.update.mockResolvedValue({ id: mockOrderId, status: OrderStatus.CANCELLED, customer_id: mockCustomerId, total_amount: 100000 } as any);
      mockedAxios.put.mockResolvedValue({} as any); // Release stock

      await orderService.updateOrderStatus(mockOrderId, OrderStatus.CANCELLED);

      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/release`));
      await new Promise(process.nextTick);
      expect(rabbitMQPublisher.publishOrderCancelledEvent).toHaveBeenCalled();
    });

    it('should commit stock when confirmed', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: mockOrderId, status: OrderStatus.PENDING_PAYMENT, customer_id: mockCustomerId, total_amount: 100000 } as any);
      prismaMock.order.update.mockResolvedValue({ id: mockOrderId, status: OrderStatus.CONFIRMED, customer_id: mockCustomerId, total_amount: 100000 } as any);
      mockedAxios.put.mockResolvedValue({} as any); // Commit stock

      await orderService.updateOrderStatus(mockOrderId, OrderStatus.CONFIRMED);

      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/commit`));
      await new Promise(process.nextTick);
      expect(rabbitMQPublisher.publishOrderCompletedEvent).toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('should throw BadRequestError if order is already shipping', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: mockOrderId, customer_id: mockCustomerId, status: OrderStatus.SHIPPING } as any);

      await expect(orderService.cancelOrder(mockCustomerId, 'USER', mockOrderId)).rejects.toThrow(BadRequestError);
    });

    it('should successfully cancel a PENDING order', async () => {
      prismaMock.order.findUnique.mockResolvedValue({ id: mockOrderId, customer_id: mockCustomerId, status: OrderStatus.PENDING_PAYMENT, total_amount: 100000 } as any);
      mockedAxios.put.mockResolvedValue({} as any); // Release stock
      mockedAxios.get.mockImplementation((url: string) => {
        if (url.includes('/api/payments/order/')) return Promise.resolve({ data: { success: true, data: { id: 'pay-1', status: 'PENDING' } } });
        if (url.includes('/api/users/profile')) return Promise.resolve({ data: { success: true, data: { email: 'a@a.com' } } });
        return Promise.resolve({ data: {} });
      });

      prismaMock.order.update.mockResolvedValue({ id: mockOrderId, customer_id: mockCustomerId, status: OrderStatus.CANCELLED, total_amount: 100000 } as any);

      await orderService.cancelOrder(mockCustomerId, 'USER', mockOrderId);

      // Verify Release Stock
      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/release`));
      // Verify Payment update to FAILED
      expect(mockedAxios.put).toHaveBeenCalledWith(expect.stringContaining(`/api/payments/pay-1/status`), { status: 'FAILED' });
      
      await new Promise(process.nextTick);
      expect(rabbitMQPublisher.publishOrderCancelledEvent).toHaveBeenCalled();
    });
  });
});
