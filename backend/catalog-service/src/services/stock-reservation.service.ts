import { PrismaClient, StockReservation } from '@prisma/client';
import { CreateStockReservationInput } from '../schemas/stock-reservation.schema';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

export class StockReservationService {
  async reserve(data: CreateStockReservationInput): Promise<StockReservation> {
    return prisma.$transaction(async (tx) => {
      // Lock variant to prevent concurrent modifications
      const variant = await tx.$queryRaw<any[]>`
        SELECT * FROM product_variants WHERE id = ${data.variant_id}::uuid FOR UPDATE
      `;

      if (!variant || variant.length === 0) {
        throw new NotFoundError();
      }

      const availableStock = variant[0].stock_quantity - variant[0].stock_reserved;
      if (availableStock < data.quantity) {
        throw new BadRequestError();
      }

      // Update reserved stock
      await tx.productVariant.update({
        where: { id: data.variant_id },
        data: {
          stock_reserved: { increment: data.quantity }
        }
      });

      // Create reservation record
      return tx.stockReservation.create({
        data: {
          reservation_id: uuidv4(),
          order_id: data.order_id,
          variant_id: data.variant_id,
          quantity: data.quantity,
          status: 'RESERVED'
        }
      });
    });
  }

  async commit(reservation_id: string): Promise<StockReservation> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { reservation_id }
      });

      if (!reservation) {
        throw new NotFoundError();
      }

      if (reservation.status !== 'RESERVED') {
        throw new BadRequestError();
      }

      // Deduct from actual stock, and reduce reserved stock
      await tx.productVariant.update({
        where: { id: reservation.variant_id },
        data: {
          stock_quantity: { decrement: reservation.quantity },
          stock_reserved: { decrement: reservation.quantity }
        }
      });

      return tx.stockReservation.update({
        where: { reservation_id },
        data: { status: 'COMMITTED' }
      });
    });
  }

  async release(reservation_id: string): Promise<StockReservation> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { reservation_id }
      });

      if (!reservation) {
        throw new NotFoundError();
      }

      if (reservation.status !== 'RESERVED') {
        throw new BadRequestError();
      }

      // Reduce reserved stock back
      await tx.productVariant.update({
        where: { id: reservation.variant_id },
        data: {
          stock_reserved: { decrement: reservation.quantity }
        }
      });

      return tx.stockReservation.update({
        where: { reservation_id },
        data: { status: 'RELEASED' }
      });
    });
  }
}
