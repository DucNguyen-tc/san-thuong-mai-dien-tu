import { Router, RequestHandler } from 'express';
import { getMyAddresses, createAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/address.controller';
import { verifyToken } from '../middlewares/verifyToken';

const router = Router();

// Tất cả các route địa chỉ đều yêu cầu đăng nhập
router.use(verifyToken as RequestHandler);

router.get('/', getMyAddresses as RequestHandler);
router.post('/', createAddress as RequestHandler);
router.put('/:id', updateAddress as RequestHandler);
router.delete('/:id', deleteAddress as RequestHandler);
router.patch('/:id/default', setDefaultAddress as RequestHandler);

export default router;
