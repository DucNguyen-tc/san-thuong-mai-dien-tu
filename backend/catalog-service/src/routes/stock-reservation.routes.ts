import { Router } from 'express';
import {
  reserveStock,
  reserveBatchStock,
  commitReservation,
  commitReservationByOrder,
  releaseReservation,
  releaseReservationByOrder,
} from '../controllers/stock-reservation.controller';
import { validateBody } from '../middlewares/validate';
import { createStockReservationSchema, batchStockReservationSchema } from '../schemas/stock-reservation.schema';

const router = Router();

router.post('/', validateBody(createStockReservationSchema), reserveStock);
router.post('/batch', validateBody(batchStockReservationSchema), reserveBatchStock);

router.put('/:reservationId/commit', commitReservation);
router.put('/by-order/:orderId/commit', commitReservationByOrder);

router.put('/:reservationId/release', releaseReservation);
router.put('/by-order/:orderId/release', releaseReservationByOrder);

export default router;
