import { Request, Response, NextFunction } from 'express';
import { StockReservationService } from '../services/stock-reservation.service';
import { sendResponse } from '../utils/response';
import { serializeBigInt } from '../utils/serializeBigInt';
import { CreateStockReservationInput } from '../schemas/stock-reservation.schema';

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

export const commitReservation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reservation = await reservationService.commit(req.params.reservationId);
    return sendResponse(res, 200, true, 'Commit tồn kho thành công', serializeBigInt(reservation));
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
