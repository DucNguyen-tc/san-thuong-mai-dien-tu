import { Router, Request, Response } from 'express';
import { upload } from '../config/cloudinary';
import { sendResponse } from '../utils/response';

const router = Router();

const isDemo = !process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'demo';

import fs from 'fs';

// Endpoint upload 1 ảnh (dùng cho cả danh mục và sản phẩm)
router.post('/', upload.single('image'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return sendResponse(res, 400, false, 'Không có file nào được tải lên');
    }
    
    let url = req.file.path;
    if (isDemo) {
      const fileData = fs.readFileSync(req.file.path);
      const base64 = fileData.toString('base64');
      url = `data:${req.file.mimetype};base64,${base64}`;
      // Xóa file tạm
      fs.unlinkSync(req.file.path);
    }

    return sendResponse(res, 200, true, 'Upload ảnh thành công', { url });
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
    
    let urls = (req.files as Express.Multer.File[]).map(file => file.path);
    
    if (isDemo) {
      urls = (req.files as Express.Multer.File[]).map(file => {
        const fileData = fs.readFileSync(file.path);
        const base64 = fileData.toString('base64');
        const url = `data:${file.mimetype};base64,${base64}`;
        fs.unlinkSync(file.path);
        return url;
      });
    }
    
    return sendResponse(res, 200, true, 'Upload danh sách ảnh thành công', {
      urls,
    });
  } catch (error) {
    return sendResponse(res, 500, false, 'Lỗi khi upload ảnh');
  }
});

export default router;
