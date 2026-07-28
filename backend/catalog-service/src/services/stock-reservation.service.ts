import { StockReservation } from '@prisma/client';
import { prisma } from '../config/prisma';
import { CreateStockReservationInput, BatchStockReservationInput } from '../schemas/stock-reservation.schema';
import { NotFoundError, BadRequestError } from '../exceptions/AppError';
import { v4 as uuidv4 } from 'uuid';

export class StockReservationService {
  /**
   * Giữ hàng cho 1 sản phẩm đơn lẻ (Idempotent)
   */
  async reserve(data: CreateStockReservationInput): Promise<StockReservation> {
    const existing = await prisma.stockReservation.findFirst({
      where: { order_id: data.order_id, variant_id: data.variant_id },
    });

    if (existing) {
      if (existing.status === 'RESERVED') return existing;
      throw new BadRequestError(`Yêu cầu giữ hàng cho đơn ${data.order_id} đã ở trạng thái ${existing.status}`);
    }

    return prisma.$transaction(async (tx) => {
      const variant = await tx.$queryRaw<any[]>`
        SELECT * FROM product_variants WHERE id = ${data.variant_id}::uuid FOR UPDATE
      `;

      if (!variant || variant.length === 0) {
        throw new NotFoundError('Biến thể sản phẩm không tồn tại');
      }

      const availableStock = variant[0].stock_quantity - variant[0].stock_reserved;
      if (availableStock < data.quantity) {
        throw new BadRequestError(`Sản phẩm không đủ số lượng tồn kho (Còn lại: ${availableStock})`);
      }

      await tx.productVariant.update({
        where: { id: data.variant_id },
        data: {
          stock_reserved: { increment: data.quantity }
        }
      });

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

  /**
   * Giữ hàng theo lô cho toàn bộ đơn hàng (Batch Reservation - Idempotent)
   */
  async reserveBatch(data: BatchStockReservationInput): Promise<StockReservation[]> {
    const existingList = await prisma.stockReservation.findMany({
      where: { order_id: data.order_id },
    });

    if (existingList.length > 0) {
      const allReserved = existingList.every((r) => r.status === 'RESERVED');
      if (allReserved) return existingList;
      throw new BadRequestError(`Đơn hàng ${data.order_id} đã có giao dịch giữ hàng ở trạng thái khác`);
    }

    return prisma.$transaction(async (tx) => {
      const reservations: StockReservation[] = [];

      for (const item of data.items) {
        const variant = await tx.$queryRaw<any[]>`
          SELECT * FROM product_variants WHERE id = ${item.variant_id}::uuid FOR UPDATE
        `;

        if (!variant || variant.length === 0) {
          throw new NotFoundError(`Biến thể sản phẩm ${item.variant_id} không tồn tại`);
        }

        const availableStock = variant[0].stock_quantity - variant[0].stock_reserved;
        if (availableStock < item.quantity) {
          throw new BadRequestError(`Biến thể ${item.variant_id} không đủ tồn kho (Còn lại: ${availableStock})`);
        }

        await tx.productVariant.update({
          where: { id: item.variant_id },
          data: {
            stock_reserved: { increment: item.quantity }
          }
        });

        const res = await tx.stockReservation.create({
          data: {
            reservation_id: uuidv4(),
            order_id: data.order_id,
            variant_id: item.variant_id,
            quantity: item.quantity,
            status: 'RESERVED'
          }
        });
        reservations.push(res);
      }

      return reservations;
    });
  }

  /**
   * Chốt kho theo reservation_id (Commit Stock - Idempotent)
   */
  async commit(reservation_id: string): Promise<StockReservation> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { reservation_id }
      });

      if (!reservation) {
        throw new NotFoundError('Không tìm thấy bản ghi giữ hàng');
      }

      // Idempotency: nếu đã COMMITTED trước đó, trả về bản ghi hiện tại
      if (reservation.status === 'COMMITTED') {
        return reservation;
      }

      if (reservation.status !== 'RESERVED') {
        throw new BadRequestError(`Không thể chốt kho khi bản ghi đang ở trạng thái ${reservation.status}`);
      }

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

  /**
   * Chốt kho cho toàn bộ đơn hàng theo order_id (Idempotent)
   */
  async commitByOrderId(order_id: string): Promise<StockReservation[]> {
    const reservations = await prisma.stockReservation.findMany({
      where: { order_id }
    });

    if (reservations.length === 0) {
      throw new NotFoundError(`Không tìm thấy bản ghi giữ hàng cho đơn hàng ${order_id}`);
    }

    const results: StockReservation[] = [];
    for (const res of reservations) {
      if (res.status === 'COMMITTED') {
        results.push(res);
        continue;
      }
      if (res.status === 'RESERVED') {
        const committed = await this.commit(res.reservation_id);
        results.push(committed);
      }
    }
    return results;
  }

  /**
   * Giao dịch Bù Trừ: Nhả kho theo reservation_id (Release Stock - Idempotent)
   */
  async release(reservation_id: string): Promise<StockReservation> {
    return prisma.$transaction(async (tx) => {
      const reservation = await tx.stockReservation.findUnique({
        where: { reservation_id }
      });

      if (!reservation) {
        throw new NotFoundError('Không tìm thấy bản ghi giữ hàng');
      }

      // Idempotency: nếu đã RELEASED trước đó, trả về bản ghi hiện tại
      if (reservation.status === 'RELEASED') {
        return reservation;
      }

      if (reservation.status !== 'RESERVED') {
        throw new BadRequestError(`Không thể nhả kho khi bản ghi đang ở trạng thái ${reservation.status}`);
      }

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

  /**
   * Giao dịch Bù Trừ: Nhả kho cho toàn bộ đơn hàng theo order_id (Idempotent)
   */
  async releaseByOrderId(order_id: string): Promise<StockReservation[]> {
    const reservations = await prisma.stockReservation.findMany({
      where: { order_id }
    });

    if (reservations.length === 0) {
      return []; // Idempotent fallback
    }

    const results: StockReservation[] = [];
    for (const res of reservations) {
      if (res.status === 'RELEASED') {
        results.push(res);
        continue;
      }
      if (res.status === 'RESERVED') {
        const released = await this.release(res.reservation_id);
        results.push(released);
      }
    }
    return results;
  }
}
