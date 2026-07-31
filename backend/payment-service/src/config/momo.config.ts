export const momoConfig = {
  partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
  accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF81',
  secretKey: process.env.MOMO_SECRET_KEY || 'K951B6FA291224F69E86421899BA6C73',
  endpoint: process.env.MOMO_ENDPOINT || 'https://test-payment.momo.vn/v2/gateway/api/create',
  redirectUrl: process.env.MOMO_REDIRECT_URL || 'http://localhost:3000/api/payments/momo/return',
  ipnUrl: process.env.MOMO_IPN_URL || 'http://localhost:3000/api/payments/momo/ipn',
};
