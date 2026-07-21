import { Router } from 'express';
import {
  getCategories,
  getCategoryTree,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../controllers/category.controller';
import { validateBody } from '../middlewares/validate';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';

// TODO (tuần 2+): gắn middleware verifyToken + requireRole('ADMIN') của Identity Service
// cho 3 route create/update/delete bên dưới, hiện tại A đang dựng middleware JWT dùng chung.

const router = Router();

router.get('/tree', getCategoryTree);
router.get('/', getCategories);
router.get('/:id', getCategoryById);
router.post('/', validateBody(createCategorySchema), createCategory);
router.put('/:id', validateBody(updateCategorySchema), updateCategory);
router.delete('/:id', deleteCategory);

export default router;
