import axios from 'axios';
import { prisma } from '../config/prisma';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';
import { AddItemInput } from '../schemas/cart.schema';

const CATALOG_URL = process.env.CATALOG_SERVICE_URL || 'http://localhost:3002';

export class CartService {
  
  // Helpers
  private async getActiveCart(customerId: string) {
    let cart = await prisma.cart.findFirst({
      where: { customer_id: customerId, status: 'ACTIVE' },
      include: { items: { orderBy: { added_at: 'asc' } } }
    });
    
    if (!cart) {
      cart = await prisma.cart.create({
        data: { customer_id: customerId, status: 'ACTIVE' },
        include: { items: true }
      });
    }
    return cart;
  }

  // Get Cart + Sync prices
  public async getCart(customerId: string) {
    const cart = await this.getActiveCart(customerId);
    
    if (cart.items.length === 0) {
      return { ...cart, isPriceUpdated: false };
    }

    // Sync prices with catalog
    const variantIds = cart.items.map(item => item.variant_id);
    let isPriceUpdated = false;
    
    try {
      const response = await axios.post(`${CATALOG_URL}/api/catalog/variants/bulk`, { variantIds });
      if (response.data?.success && Array.isArray(response.data.data)) {
        const liveVariants = response.data.data;
        const liveMap = new Map(liveVariants.map((v: any) => [v.id, v]));

        // Check each item
        for (const item of cart.items) {
          const liveVariant = liveMap.get(item.variant_id) as any;
          if (liveVariant) {
            const livePrice = Number(liveVariant.price);
            const currentPrice = Number(item.unit_price_snapshot);
            
            if (livePrice !== currentPrice) {
              await prisma.cartItem.update({
                where: { id: item.id },
                data: { unit_price_snapshot: livePrice }
              });
              item.unit_price_snapshot = livePrice as any;
              isPriceUpdated = true;
            }

            // Attach dynamic image
            const primaryImage = liveVariant.images?.[0]?.url 
              || liveVariant.product?.images?.find((img: any) => img.is_primary)?.url 
              || liveVariant.product?.images?.[0]?.url;
            (item as any).image_url = primaryImage;
          }
        }
      }
    } catch (error) {
      console.error('Failed to sync prices with catalog-service:', error);
      // Fallback: Continue returning cart with old prices if catalog is down.
    }

    return { ...cart, isPriceUpdated };
  }

  public async addItem(customerId: string, input: AddItemInput) {
    const cart = await this.getActiveCart(customerId);
    
    // Fetch product details from Catalog Service
    let liveVariant: any;
    try {
      const response = await axios.post(`${CATALOG_URL}/api/catalog/variants/bulk`, { variantIds: [input.variant_id] });
      if (response.data?.success && response.data.data.length > 0) {
        liveVariant = response.data.data[0];
      }
    } catch (error) {
      console.error('Failed to fetch variant details', error);
      throw new BadRequestError('Không thể lấy thông tin sản phẩm lúc này. Vui lòng thử lại sau.');
    }

    if (!liveVariant || liveVariant.product_id !== input.product_id) {
      throw new NotFoundError('Sản phẩm hoặc biến thể không tồn tại');
    }

    if (!liveVariant.is_active || !liveVariant.product?.is_active) {
      throw new BadRequestError('Sản phẩm này đã ngừng kinh doanh');
    }

    // Upsert CartItem
    const existingItem = await prisma.cartItem.findFirst({
      where: { cart_id: cart.id, variant_id: input.variant_id }
    });

    if (existingItem) {
      return prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + input.quantity,
          unit_price_snapshot: liveVariant.price, // Sync latest price just in case
        }
      });
    }

    return prisma.cartItem.create({
      data: {
        cart_id: cart.id,
        product_id: input.product_id,
        variant_id: input.variant_id,
        product_name_snapshot: liveVariant.product.name,
        variant_attributes_snapshot: liveVariant.attributes,
        unit_price_snapshot: liveVariant.price,
        quantity: input.quantity,
      }
    });
  }

  public async updateItemQuantity(customerId: string, itemId: bigint, quantity: number) {
    const cart = await this.getActiveCart(customerId);
    
    const existingItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart_id: cart.id }
    });

    if (!existingItem) {
      throw new NotFoundError('Sản phẩm không có trong giỏ hàng');
    }

    return prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity }
    });
  }

  public async removeItem(customerId: string, itemId: bigint) {
    const cart = await this.getActiveCart(customerId);
    
    const existingItem = await prisma.cartItem.findFirst({
      where: { id: itemId, cart_id: cart.id }
    });

    if (!existingItem) {
      throw new NotFoundError('Sản phẩm không có trong giỏ hàng');
    }

    return prisma.cartItem.delete({
      where: { id: itemId }
    });
  }

  public async clearCart(customerId: string) {
    const cart = await this.getActiveCart(customerId);
    return prisma.cartItem.deleteMany({
      where: { cart_id: cart.id }
    });
  }

}
