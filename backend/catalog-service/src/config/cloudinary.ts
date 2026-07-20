import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
});

// Nếu không có API KEY thật, chúng ta dùng diskStorage hoặc một dummy URL
const isDemo = !process.env.CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY === 'demo';

const storage = isDemo 
  ? multer.diskStorage({
      destination: (req, file, cb) => cb(null, './'), // Không quan trọng, ta sẽ chèn dummy URL
      filename: (req, file, cb) => cb(null, file.originalname)
    })
  : new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'san-thuong-mai-dien-tu/catalog',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
      } as any,
    });

export const upload = multer({ storage });
