import crypto from 'crypto';
import axios from 'axios';
import { momoConfig } from '../config/momo.config';

interface CreateMoMoParams {
  orderId: string;
  amount: number;
}

/**
 * Tạo chữ ký HMAC-SHA256 cho Yêu cầu khởi tạo thanh toán MoMo v2
 */
export function createMoMoRequestSignature(params: {
  requestId: string;
  amount: number;
  orderId: string;
  orderInfo: string;
  extraData: string;
  requestType: string;
}): string {
  const { requestId, amount, orderId, orderInfo, extraData, requestType } = params;

  const rawSignature = `accessKey=${momoConfig.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${momoConfig.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${momoConfig.partnerCode}&redirectUrl=${momoConfig.redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

  return crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex');
}

/**
 * Kiểm tra chữ ký HMAC-SHA256 từ thông tin kết quả MoMo trả về (Redirect/Return/IPN)
 */
export function verifyMoMoResponseSignature(query: Record<string, any>): boolean {
  const {
    accessKey,
    amount,
    extraData,
    message,
    orderId,
    orderInfo,
    orderType,
    partnerCode,
    requestId,
    responseTime,
    resultCode,
    transId,
    signature,
  } = query;

  if (!signature) return false;

  const rawSignature = `accessKey=${accessKey || momoConfig.accessKey}&amount=${amount}&extraData=${extraData || ''}&message=${message || ''}&orderId=${orderId}&orderInfo=${orderInfo || ''}&orderType=${orderType || ''}&partnerCode=${partnerCode || momoConfig.partnerCode}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

  const expectedSignature = crypto
    .createHmac('sha256', momoConfig.secretKey)
    .update(rawSignature)
    .digest('hex');

  return signature === expectedSignature;
}

/**
 * Gửi yêu cầu tạo thanh toán MoMo API.
 * Nếu API thật lỗi hoặc không có Key Sandbox hợp lệ, tự động Fallback sang URL Mô phỏng cho sinh viên test đồ án.
 */
export async function requestMoMoPayment(params: CreateMoMoParams): Promise<string> {
  const requestId = `${momoConfig.partnerCode}_${Date.now()}`;
  const orderInfo = `Thanh toan don hang ${params.orderId}`;
  const extraData = '';
  const requestType = 'captureWallet';

  const signature = createMoMoRequestSignature({
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo,
    extraData,
    requestType,
  });

  const requestPayload = {
    partnerCode: momoConfig.partnerCode,
    partnerName: 'V-Shop',
    storeId: 'V-Shop',
    requestId,
    amount: params.amount,
    orderId: params.orderId,
    orderInfo,
    redirectUrl: momoConfig.redirectUrl,
    ipnUrl: momoConfig.ipnUrl,
    requestType,
    extraData,
    lang: 'vi',
    signature,
  };

  try {
    // Thử gọi API MoMo Sandbox thật
    const response = await axios.post(momoConfig.endpoint, requestPayload, {
      timeout: 4000,
      headers: { 'Content-Type': 'application/json' },
    });

    if (response.data && response.data.resultCode === 0 && response.data.payUrl) {
      return response.data.payUrl;
    }
  } catch (error: any) {
    console.warn('[MoMo Sandbox API Error / Fallback to Mock Simulator]', error.message);
    if (error.response?.data) {
      console.warn('[MoMo API Response Error Details]:', error.response.data);
    }
  }

  // MOCK FALLBACK MODE: Trả về URL trang mô phỏng thanh toán MoMo cho sinh viên làm đồ án
  const mockSimulatorUrl = `http://localhost:3000/api/payments/momo/simulator?orderId=${params.orderId}&amount=${params.amount}&requestId=${requestId}`;
  return mockSimulatorUrl;
}
