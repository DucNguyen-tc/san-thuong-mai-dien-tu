import { Router, Request, Response } from 'express';
import { upload } from '../config/cloudinary';
import { sendResponse } from '../utils/response';

const router = Router();

// Endpoint upload 1 ảnh (dùng cho cả danh mục và sản phẩm)
router.post('/', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'Không có file nào được tải lên');
    }
    
    // multer-storage-cloudinary sẽ tự thêm path là URL của ảnh trên Cloudinary
    return sendResponse(res, 200, true, 'Upload ảnh thành công', {
      url: req.file.path,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Lỗi khi upload ảnh');
  }
});

// Endpoint upload nhiều ảnh cùng lúc
router.post('/multiple', upload.array('images', 5), (req: Request, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return sendResponse(res, 400, false, 'Không có file nào được tải lên');
    }
    
    const urls = (req.files as Express.Multer.File[]).map(file => file.path);
    
    return sendResponse(res, 200, true, 'Upload danh sách ảnh thành công', {
      urls,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Lỗi khi upload ảnh');
  }
});

export default router;
