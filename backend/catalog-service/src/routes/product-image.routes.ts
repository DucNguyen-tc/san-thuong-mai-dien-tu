import { Router } from 'express';
import { getImagesByProduct, addImage, updateImage, deleteImage } from '../controllers/product-image.controller';
import { validateBody } from '../middlewares/validate';
import { createProductImageSchema, updateProductImageSchema } from '../schemas/product-image.schema';

const router = Router();

router.get('/product/:productId', getImagesByProduct);
router.post('/', validateBody(createProductImageSchema), addImage);
router.put('/:id', validateBody(updateProductImageSchema), updateImage);
router.delete('/:id', deleteImage);

export default router;
