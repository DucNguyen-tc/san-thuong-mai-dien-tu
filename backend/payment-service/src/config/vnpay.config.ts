import { VNPay, ignoreLogger } from 'vnpay';

export const vnpay = new VNPay({
  tmnCode: process.env.VNP_TMNCODE || '2QX74MS1',
  secureSecret: process.env.VNP_HASHSECRET || 'RA4556EG52697NG0X4492X65UWTGCTW9',
  vnpayHost: process.env.VNP_URL || 'https://sandbox.vnpayment.vn',
  testMode: process.env.NODE_ENV !== 'production',
  loggerFn: ignoreLogger,
});

export const VNP_RETURNURL = process.env.VNP_RETURNURL || 'http://localhost:3000/api/payments/vnpay/return';
export const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
