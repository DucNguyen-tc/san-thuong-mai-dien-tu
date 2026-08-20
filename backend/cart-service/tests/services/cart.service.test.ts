import { CartService } from '../../src/services/cart.service';
import { prismaMock } from '../setup/prismaMock';
import axios from 'axios';
import { NotFoundError, BadRequestError } from '../../src/exceptions/AppError';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('CartService', () => {
  let cartService: CartService;
  const mockCustomerId = 'customer-123';
  const mockCartId = 'cart-456';

  beforeEach(() => {
    cartService = new CartService();
    jest.clearAllMocks();
  });

  describe('getCart', () => {
    it('should return empty cart without fetching prices if cart is empty', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({
        id: mockCartId,
        customer_id: mockCustomerId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        items: [],
      } as any);

      const result = await cartService.getCart(mockCustomerId);

      expect(result.items).toHaveLength(0);
      expect(result.isPriceUpdated).toBe(false);
      expect(mockedAxios.post).not.toHaveBeenCalled();
    });

    it('should sync prices when catalog returns new prices', async () => {
      const mockItems = [
        { id: BigInt(1), variant_id: 'var-1', unit_price_snapshot: 1000 },
        { id: BigInt(2), variant_id: 'var-2', unit_price_snapshot: 2000 },
      ];

      prismaMock.cart.findFirst.mockResolvedValue({
        id: mockCartId,
        customer_id: mockCustomerId,
        status: 'ACTIVE',
        created_at: new Date(),
        updated_at: new Date(),
        items: mockItems,
      } as any);

      // Mock catalog returning new price for var-1
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: [
            { id: 'var-1', price: 1500 },
            { id: 'var-2', price: 2000 },
          ],
        },
      });

      prismaMock.cartItem.update.mockResolvedValue({} as any);

      const result = await cartService.getCart(mockCustomerId);

      expect(result.isPriceUpdated).toBe(true);
      expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { unit_price_snapshot: 1500 },
      });
      expect(result.items[0].unit_price_snapshot).toBe(1500);
    });
  });

  describe('addItem', () => {
    const input = { product_id: 'prod-1', variant_id: 'var-1', quantity: 2 };

    it('should throw BadRequestError if catalog fails to fetch', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(cartService.addItem(mockCustomerId, input)).rejects.toThrow(BadRequestError);
    });

    it('should throw NotFoundError if variant does not exist', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      mockedAxios.post.mockResolvedValue({ data: { success: true, data: [] } });

      await expect(cartService.addItem(mockCustomerId, input)).rejects.toThrow(NotFoundError);
    });

    it('should throw BadRequestError if variant is inactive', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: [{ product_id: 'prod-1', is_active: false }],
        },
      });

      await expect(cartService.addItem(mockCustomerId, input)).rejects.toThrow(BadRequestError);
    });

    it('should add new item to cart', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: [{
            product_id: 'prod-1',
            is_active: true,
            price: 500,
            product: { name: 'Product 1', is_active: true },
            attributes: {},
          }],
        },
      });

      prismaMock.cartItem.findFirst.mockResolvedValue(null);
      prismaMock.cartItem.create.mockResolvedValue({ id: BigInt(1), quantity: 2 } as any);

      await cartService.addItem(mockCustomerId, input);

      expect(prismaMock.cartItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          cart_id: mockCartId,
          product_id: 'prod-1',
          variant_id: 'var-1',
          quantity: 2,
          unit_price_snapshot: 500,
        }),
      });
    });

    it('should update existing item quantity if it already exists', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      mockedAxios.post.mockResolvedValue({
        data: {
          success: true,
          data: [{
            product_id: 'prod-1',
            is_active: true,
            price: 500,
            product: { name: 'Product 1', is_active: true },
          }],
        },
      });

      prismaMock.cartItem.findFirst.mockResolvedValue({ id: BigInt(1), quantity: 3 } as any);
      prismaMock.cartItem.update.mockResolvedValue({} as any);

      await cartService.addItem(mockCustomerId, input);

      expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: {
          quantity: 5, // 3 + 2
          unit_price_snapshot: 500,
        },
      });
    });
  });

  describe('updateItemQuantity', () => {
    it('should throw NotFoundError if item not in cart', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      prismaMock.cartItem.findFirst.mockResolvedValue(null);

      await expect(cartService.updateItemQuantity(mockCustomerId, BigInt(1), 5)).rejects.toThrow(NotFoundError);
    });

    it('should update item quantity', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      prismaMock.cartItem.findFirst.mockResolvedValue({ id: BigInt(1) } as any);
      prismaMock.cartItem.update.mockResolvedValue({ id: BigInt(1), quantity: 5 } as any);

      await cartService.updateItemQuantity(mockCustomerId, BigInt(1), 5);

      expect(prismaMock.cartItem.update).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
        data: { quantity: 5 },
      });
    });
  });

  describe('removeItem', () => {
    it('should throw NotFoundError if item not in cart', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      prismaMock.cartItem.findFirst.mockResolvedValue(null);

      await expect(cartService.removeItem(mockCustomerId, BigInt(1))).rejects.toThrow(NotFoundError);
    });

    it('should remove item', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      prismaMock.cartItem.findFirst.mockResolvedValue({ id: BigInt(1) } as any);
      prismaMock.cartItem.delete.mockResolvedValue({ id: BigInt(1) } as any);

      await cartService.removeItem(mockCustomerId, BigInt(1));

      expect(prismaMock.cartItem.delete).toHaveBeenCalledWith({
        where: { id: BigInt(1) },
      });
    });
  });

  describe('clearCart', () => {
    it('should delete all items for cart', async () => {
      prismaMock.cart.findFirst.mockResolvedValue({ id: mockCartId, items: [] } as any);
      prismaMock.cartItem.deleteMany.mockResolvedValue({ count: 2 } as any);

      await cartService.clearCart(mockCustomerId);

      expect(prismaMock.cartItem.deleteMany).toHaveBeenCalledWith({
        where: { cart_id: mockCartId },
      });
    });
  });
});
