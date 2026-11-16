import { Request, Response, NextFunction } from 'express';
import { StockReservationService } from '../services/stock-reservation.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreateStockReservationInput, BatchStockReservationInput } from '../schemas/stock-reservation.schema';

const reservationService = new StockReservationService();

export const reserveStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as CreateStockReservationInput;
    const reservation = await reservationService.reserve(input);
    return sendResponse(res, 201, true, 'Đặt trước tồn kho thành công', serializeBigInt(reservation));
  } catch (error) {
    next(error);
  }
};

export const reserveBatchStock = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const input = req.body as BatchStockReservationInput;
    const reservations = await reservationService.reserveBatch(input);
    return sendResponse(res, 201, true, 'Đặt trước tồn kho theo lô thành công', serializeBigInt(reservations));
  } catch (error) {
    next(error);
  }
};

export const commitReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.commit(req.params.reservationId);
    return sendResponse(res, 200, true, 'Commit tồn kho thành công', serializeBigInt(reservation));
  } catch (error) {
    next(error);
  }
};

export const commitReservationByOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await reservationService.commitByOrderId(req.params.orderId);
    return sendResponse(res, 200, true, 'Commit tồn kho cho đơn hàng thành công', serializeBigInt(reservations));
  } catch (error) {
    next(error);
  }
};

export const releaseReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.release(req.params.reservationId);
    return sendResponse(res, 200, true, 'Release tồn kho thành công', serializeBigInt(reservation));
  } catch (error) {
    next(error);
  }
};

export const releaseReservationByOrder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservations = await reservationService.releaseByOrderId(req.params.orderId);
    return sendResponse(res, 200, true, 'Release tồn kho cho đơn hàng thành công', serializeBigInt(reservations));
  } catch (error) {
    next(error);
  }
};
