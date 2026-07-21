import { Router } from 'express';
import { reserveStock, commitReservation, releaseReservation } from '../controllers/stock-reservation.controller';
import { validateBody } from '../middlewares/validate';
import { createStockReservationSchema } from '../schemas/stock-reservation.schema';

const router = Router();

router.post('/', validateBody(createStockReservationSchema), reserveStock);
router.put('/:reservationId/commit', commitReservation);
router.put('/:reservationId/release', releaseReservation);

export default router;
