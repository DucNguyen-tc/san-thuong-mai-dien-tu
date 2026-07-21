export interface CheckoutFormData {
  fullName: string;
  phone: string;
  provinceId: string;
  districtId: string;
  wardId: string;
  detailAddress: string;
  note?: string;
}

export type PaymentMethodType = 'cod' | 'vnpay' | 'momo';
