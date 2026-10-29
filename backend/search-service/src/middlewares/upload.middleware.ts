import multer from "multer";
import { Request, Response, NextFunction } from "express";

// Giữ file trong RAM (Buffer) để đưa thẳng vào CLIP model, không ghi ra đĩa cứng
const storage = multer.memoryStorage();

const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Định dạng file không hợp lệ: ${file.mimetype}. Chỉ hỗ trợ JPG, PNG, WebP.`,
      ),
    );
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB tối đa
  },
  fileFilter,
});

/**
 * Middleware nhận 1 file ảnh từ field "image".
 * Bắt lỗi kích thước hoặc định dạng và trả về HTTP 400 thân thiện.
 */
export const uploadImageMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const singleUpload = upload.single("image");

  singleUpload(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "Kích thước file ảnh vượt quá giới hạn 5MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: `Lỗi tải file: ${err.message}`,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || "File tải lên không hợp lệ.",
      });
    }

    next();
  });
};
