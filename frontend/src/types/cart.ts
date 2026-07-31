export interface CheckoutFormData {
  fullName: string;
  phone: string;
  detailAddress: string;
  addressId?: string;
}

export type PaymentMethodType = 'cod' | 'vnpay' | 'momo';
