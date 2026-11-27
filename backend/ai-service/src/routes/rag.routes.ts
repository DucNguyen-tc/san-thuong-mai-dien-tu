import { Router, Request, Response, NextFunction } from 'express';
import {
  queryRag,
  listDocuments,
  createDocument,
  updateDocument,
  toggleDocument,
  deleteDocument,
} from '../controllers/rag.controller';

const router = Router();

const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  const role = req.headers['x-user-role']?.toString().toUpperCase();
  if (role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Chỉ quản trị viên (ADMIN) mới có quyền quản lý kho tri thức AI',
    });
  }
  next();
};

router.post('/query', queryRag);

router.get('/documents', requireAdmin, listDocuments);
router.post('/documents', requireAdmin, createDocument);
router.put('/documents/:id', requireAdmin, updateDocument);
router.patch('/documents/:id/toggle', requireAdmin, toggleDocument);
router.delete('/documents/:id', requireAdmin, deleteDocument);

export default router;
